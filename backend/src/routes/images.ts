import express from 'express';
import sharp from 'sharp';
// heic-convert usa libheif compilado a WASM: es la única forma fiable de leer HEIC/HEIF
// (sharp con libvips no siempre puede, y los navegadores Android no lo decodifican).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const heicConvert = require('heic-convert');

const router = express.Router();
const MAX_BYTES = 55 * 1024 * 1024;

const looksHeic = (buf: Buffer, mimeType?: string, fileName?: string): boolean => {
    if (/hei[cf]/i.test(mimeType || '')) return true;
    if (/\.(heic|heif)$/i.test(fileName || '')) return true;
    const brand = buf.subarray(4, 12).toString('latin1');
    return brand.includes('ftyp') && /hei[cf]|mif1|msf1/i.test(brand);
};

// Convierte cualquier foto (HEIC incluido, o gigantes de 100+ MP) a un JPEG chico.
// Se usa cuando el navegador del teléfono no puede decodificar el archivo.
router.post('/normalize', async (req, res) => {
    try {
        const { imageData, mimeType, fileName } = req.body || {};
        if (!imageData) {
            return res.status(400).json({ message: 'imageData es obligatorio' });
        }

        const raw = String(imageData).replace(/^data:[^;]+;base64,/, '');
        const buf = Buffer.from(raw, 'base64');
        if (!buf.length) {
            return res.status(400).json({ message: 'La imagen llegó vacía' });
        }
        if (buf.length > MAX_BYTES) {
            return res.status(413).json({ message: 'La imagen es demasiado grande (máximo 40 MB)' });
        }

        let input: Buffer = buf;
        if (looksHeic(buf, mimeType, fileName)) {
            const converted = await heicConvert({ buffer: buf, format: 'JPEG', quality: 0.9 });
            input = Buffer.from(converted as ArrayBuffer);
        }

        const jpeg = await sharp(input)
            .rotate() // respeta la orientación EXIF de la cámara
            .resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 75, mozjpeg: true })
            .toBuffer();

        res.json({ imageData: `data:image/jpeg;base64,${jpeg.toString('base64')}` });
    } catch (error: any) {
        console.error('normalize falló:', error?.message || error);
        res.status(422).json({ message: 'No pudimos procesar esa imagen' });
    }
});

export default router;
