import express from 'express';
import Event from '../models/Event';

const router = express.Router();

// Tipos permitidos: evita que el endpoint se convierta en una tabla libre
const TIPOS = new Set([
    'app_open',
    'user_selected',
    'gift_created',
    'gift_viewed',
    'comment_added',
    'like',
    'dislike',
    'link_clicked',
    'upload_selected',
    'upload_started',
    'upload_succeeded',
    'upload_failed',
    'share_clicked',
    'page_time',
    'heartbeat',
]);

const recortar = (v: any, max = 300): string | undefined => {
    if (typeof v !== 'string' || !v) return undefined;
    return v.slice(0, max);
};

const sanearMeta = (meta: any): Record<string, any> | undefined => {
    if (!meta || typeof meta !== 'object') return undefined;
    const out: Record<string, any> = {};
    let n = 0;
    for (const [k, v] of Object.entries(meta)) {
        if (n++ >= 12) break;
        if (typeof v === 'number' && Number.isFinite(v)) out[k.slice(0, 40)] = v;
        else if (typeof v === 'boolean') out[k.slice(0, 40)] = v;
        else if (typeof v === 'string') out[k.slice(0, 40)] = v.slice(0, 200);
    }
    return out;
};

// POST /api/events — acepta uno o varios eventos
router.post('/events', async (req, res) => {
    try {
        const body = req.body;
        const lista = Array.isArray(body) ? body : [body];
        if (lista.length === 0 || lista.length > 40) {
            return res.status(400).json({ message: 'Cantidad de eventos inválida' });
        }

        const device = /mobile|android|iphone|ipad/i.test(req.get('user-agent') || '') ? 'mobile' : 'desktop';
        // Cloudflare pone el país en este header; no guardamos IPs
        const country = recortar(req.get('cf-ipcountry'), 4);

        const docs = lista
            .filter((e: any) => e && TIPOS.has(e.type) && typeof e.sessionId === 'string')
            .map((e: any) => ({
                type: e.type,
                ts: new Date(),
                sessionId: recortar(e.sessionId, 64)!,
                visitorId: recortar(e.visitorId, 64),
                userId: recortar(e.userId, 64),
                path: recortar(e.path, 120),
                meta: sanearMeta(e.meta),
                device,
                country,
            }));

        if (docs.length === 0) return res.status(202).json({ accepted: 0 });

        // Escritura sin esperar confirmación: la analítica nunca debe frenar la app
        Event.insertMany(docs, { ordered: false }).catch((err) => console.error('No se pudo guardar analítica:', err?.message));
        res.status(202).json({ accepted: docs.length });
    } catch (error) {
        res.status(400).json({ message: 'Evento inválido' });
    }
});

// GET /api/stats?days=7 — agregados para el panel
router.get('/stats', async (req, res) => {
    try {
        const days = Math.min(Math.max(parseInt(req.query.days as string) || 7, 1), 90);
        const desde = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [totales, sesiones, porDia, embudo, links, vistas, retencion, tiempos] = await Promise.all([
            Event.aggregate([{ $match: { ts: { $gte: desde } } }, { $group: { _id: '$type', n: { $sum: 1 } } }]),
            Event.aggregate([
                { $match: { ts: { $gte: desde } } },
                { $group: { _id: '$sessionId', inicio: { $min: '$ts' }, fin: { $max: '$ts' }, visitor: { $first: '$visitorId' } } },
                { $group: { _id: null, sesiones: { $sum: 1 }, visitantes: { $addToSet: '$visitor' } } },
            ]),
            Event.aggregate([
                { $match: { ts: { $gte: desde } } },
                {
                    $group: {
                        _id: { dia: { $dateToString: { format: '%Y-%m-%d', date: '$ts' } }, type: '$type' },
                        n: { $sum: 1 },
                    },
                },
                { $sort: { '_id.dia': 1 } },
            ]),
            Event.aggregate([
                { $match: { ts: { $gte: desde }, type: { $in: ['user_selected', 'upload_selected', 'upload_started', 'upload_succeeded', 'gift_created'] } } },
                { $group: { _id: '$type', sesiones: { $addToSet: '$sessionId' } } },
                { $project: { _id: 1, n: { $size: '$sesiones' } } },
            ]),
            Event.aggregate([
                { $match: { ts: { $gte: desde }, type: 'link_clicked' } },
                { $group: { _id: '$meta.host', clicks: { $sum: 1 } } },
                { $sort: { clicks: -1 } },
                { $limit: 10 },
            ]),
            Event.aggregate([
                { $match: { ts: { $gte: desde }, type: 'gift_viewed' } },
                { $group: { _id: '$giftId', vistas: { $sum: 1 } } },
                { $sort: { vistas: -1 } },
                { $limit: 10 },
            ]),
            Event.aggregate([
                { $match: { ts: { $gte: desde } } },
                { $group: { _id: '$visitorId', dias: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$ts' } } } } },
                { $project: { dias: { $size: '$dias' } } },
                { $group: { _id: null, nuevos: { $sum: { $cond: [{ $eq: ['$dias', 1] }, 1, 0] } }, recurrentes: { $sum: { $cond: [{ $gt: ['$dias', 1] }, 1, 0] } } } },
            ]),
            // Duración real de cada sesión: del primer al último evento (ignora las de un solo evento)
            Event.aggregate([
                { $match: { ts: { $gte: desde } } },
                { $group: { _id: '$sessionId', inicio: { $min: '$ts' }, fin: { $max: '$ts' }, eventos: { $sum: 1 } } },
                { $match: { eventos: { $gte: 2 } } },
                { $project: { segundos: { $divide: [{ $subtract: ['$fin', '$inicio'] }, 1000] } } },
                { $match: { segundos: { $lte: 7200 } } },
                { $group: { _id: null, media: { $avg: '$segundos' }, sesiones: { $sum: 1 } } },
            ]),
        ]);

        const conteo: Record<string, number> = {};
        totales.forEach((t: any) => { conteo[t._id] = t.n; });

        const s = sesiones[0] || { sesiones: 0, visitantes: [] };
        const e: Record<string, number> = {};
        embudo.forEach((x: any) => { e[x._id] = x.n; });

        const dias: Record<string, any> = {};
        porDia.forEach((d: any) => {
            const dia = d._id.dia;
            dias[dia] = dias[dia] || { dia, eventos: 0, regalos: 0, comentarios: 0, links: 0 };
            dias[dia].eventos += d.n;
            if (d._id.type === 'gift_created') dias[dia].regalos = d.n;
            if (d._id.type === 'comment_added') dias[dia].comentarios = d.n;
            if (d._id.type === 'link_clicked') dias[dia].links = d.n;
        });

        res.json({
            rango: { dias: days, desde },
            visitas: {
                sesiones: s.sesiones,
                visitantes: (s.visitantes || []).filter(Boolean).length,
                eventos: Object.values(conteo).reduce((a, b) => a + b, 0),
            },
            tiempo: { mediaSegundos: Math.round(tiempos[0]?.media || 0) },
            embudo: {
                eligieron_usuario: e['user_selected'] || 0,
                eligieron_foto: e['upload_selected'] || 0,
                empezaron_subida: e['upload_started'] || 0,
                subieron_regalo: e['gift_created'] || 0,
            },
            acciones: {
                regalos: conteo['gift_created'] || 0,
                comentarios: conteo['comment_added'] || 0,
                likes: conteo['like'] || 0,
                clics_enlaces: conteo['link_clicked'] || 0,
                vistas_regalo: conteo['gift_viewed'] || 0,
            },
            retencion: { nuevos: retencion[0]?.nuevos || 0, recurrentes: retencion[0]?.recurrentes || 0 },
            porDia: Object.values(dias).sort((a: any, b: any) => a.dia.localeCompare(b.dia)),
            topEnlaces: links.map((l: any) => ({ host: l._id || 'desconocido', clicks: l.clicks })),
            topRegalos: vistas.map((v: any) => ({ giftId: v._id, vistas: v.vistas })),
        });
    } catch (error) {
        console.error('stats falló:', error);
        res.status(500).json({ message: 'Error calculando estadísticas' });
    }
});

export default router;
