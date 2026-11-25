# Respaldo y restauración

Punto de restauración creado el 24/11/2026 con la app estable en producción.

## Qué hay

| Qué | Dónde |
|---|---|
| Tag de git `v1.0.0-prod` | repo local y GitHub |
| Tarball del deploy (incluye `.env`) | `/mnt/miDisco/backups/ideas-regalos/2026-11-24/ideas-regalos-app.tar.gz` |
| Dump de Mongo | `/mnt/miDisco/backups/ideas-regalos/2026-11-24/regalos-mongo.archive.gz` |

Los archivos están con permisos `600` (contienen secretos).

## Restaurar el código

```bash
cd /mnt/miDisco/apps/ideas-regalos
git fetch --tags
git checkout v1.0.0-prod
docker compose -f docker-compose.prod.yml up -d --build
```

Para volver a la última versión: `git checkout main`.

## Restaurar la base de datos

```bash
docker exec -i ideas-regalos-db mongorestore --archive --gzip --drop < \
  /mnt/miDisco/backups/ideas-regalos/2026-11-24/regalos-mongo.archive.gz
```

`--drop` reemplaza la base actual (`regalos`).

## Restaurar desde cero (sin git)

```bash
mkdir -p /mnt/miDisco/apps && cd /mnt/miDisco/apps
tar xzf /mnt/miDisco/backups/ideas-regalos/2026-11-24/ideas-regalos-app.tar.gz
cd ideas-regalos && docker compose -f docker-compose.prod.yml up -d --build
```

## Copias automáticas

`/mnt/miDisco/apps/ideas-regalos/backup.sh` hace un `mongodump` de la base `regalos` a
`/mnt/miDisco/backups/ideas-regalos/daily/` y rota a 30 días. Corre por cron todos los días a las 04:00
(log en `/mnt/miDisco/backups/ideas-regalos/backup.log`).

```bash
/mnt/miDisco/apps/ideas-regalos/backup.sh   # copia manual
```

## Comprobar

```bash
curl -s https://regalos.elchuloflaco.org/api/gifts
docker compose -f docker-compose.prod.yml ps
```
