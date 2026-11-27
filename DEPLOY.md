# Deploy en el VPS

Stack: Mongo 7 + API Node/Express (TypeScript) + front React/Vite servido por nginx.
El tráfico entra por el túnel de Cloudflare (`cloudflared`) a `ideas-regalos-web:80`.

## Requisitos

- Docker + Docker Compose en el host.
- Red externa `ngnx-cloudflare_internal` (la comparte `cloudflared`).
- `.env` en la raíz del repo (no se versiona):

```
GEMINI_API_KEY=...
```

## Arranque

```bash
cp .env.example .env   # y rellenar GEMINI_API_KEY
docker compose -f docker-compose.prod.yml up -d --build
```

Servicios:

| Servicio | Contenedor | Red |
|---|---|---|
| db | ideas-regalos-db | internal |
| backend | ideas-regalos-backend | internal |
| web | ideas-regalos-web | internal + cloudflare |

No publica puertos en el host: solo se llega por el túnel o desde la red interna.

## Actualizar

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Cloudflare

Ingress en `/mnt/miDisco/infra/cloudflared/config.yml`:

```yaml
- hostname: regalos.elchuloflaco.org
  service: http://ideas-regalos-web:80
```

Y un CNAME proxied: `regalos` → `e24163fb-efef-4deb-a8bb-5700f0af6271.cfargotunnel.com`.

## Comprobar

```bash
docker compose -f docker-compose.prod.yml ps
docker exec ideas-regalos-backend wget -qO- http://127.0.0.1:5000/health
docker logs --tail 50 ideas-regalos-backend
```

## Usuarios ocultos

Ocultar un usuario no borra nada: deja de aparecer en la app y sus regalos se conservan.

```bash
./usuarios.sh list                 # quién se ve y quién está oculto
./usuarios.sh hide "Angelica"      # ocultar
./usuarios.sh show "Angelica"      # volver a mostrarlo
```

La API respeta la visibilidad: `GET /api/users` devuelve solo los visibles,
`GET /api/users?includeHidden=1` devuelve todos.
