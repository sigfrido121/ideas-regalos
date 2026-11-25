#!/usr/bin/env bash
# Copia diaria de la base de regalos. No toca datos, solo lee.
set -euo pipefail

DEST=/mnt/miDisco/backups/ideas-regalos/daily
mkdir -p "$DEST"
chmod 700 "$DEST"
STAMP=$(date +%Y%m%d-%H%M)
TMP=/tmp/regalos-$STAMP.archive

docker exec ideas-regalos-db mongodump --db regalos --archive=$TMP --gzip >/dev/null
docker cp ideas-regalos-db:$TMP "$DEST/regalos-$STAMP.archive.gz" >/dev/null
docker exec ideas-regalos-db rm -f $TMP
chmod 600 "$DEST"/regalos-*.archive.gz

# rotación: conservar 30 días de copias
find "$DEST" -name 'regalos-*.archive.gz' -mtime +30 -delete

echo "$(date -Is) backup ok -> $DEST/regalos-$STAMP.archive.gz ($(du -h "$DEST/regalos-$STAMP.archive.gz" | cut -f1))"
