#!/usr/bin/env bash
# Gestiona qué usuarios se ven en la app. Ocultar NO borra nada.
# Uso:
#   ./usuarios.sh list
#   ./usuarios.sh hide "Angelica"
#   ./usuarios.sh show "Angelica"
set -euo pipefail

case "${1:-list}" in
  list)
    docker exec ideas-regalos-db mongosh --quiet --eval '
      const c = db.getSiblingDB("regalos").users;
      c.find({}, {name:1, hidden:1}).sort({name:1}).forEach(u =>
        print((u.hidden ? "OCULTO " : "VISIBLE") + "  " + u.name));
      print("---");
      print("visibles:", c.countDocuments({hidden: {$ne: true}}), "| total:", c.countDocuments({}));'
    ;;
  hide|show)
    NAME="${2:?falta el nombre}"
    FLAG=$([ "$1" = "hide" ] && echo "true" || echo "false")
    docker exec ideas-regalos-db mongosh --quiet --eval "
      const c = db.getSiblingDB('regalos').users;
      const r = c.updateOne({name: '$NAME'}, {\$set: {hidden: $FLAG}});
      print(r.matchedCount === 1 ? 'ok: $NAME -> ${1/hide/oculto}' : 'no encontré ese nombre');"
    ;;
  *)
    echo "uso: $0 list | hide <nombre> | show <nombre>"; exit 1;;
esac
