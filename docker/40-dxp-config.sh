#!/bin/sh
# S114 (L0a, #151) -- configuration lue a l'execution.
#
# Execute par l'entrypoint de nginx:alpine (/docker-entrypoint.d) avant le
# demarrage de nginx. Ecrit /usr/share/nginx/html/config.js depuis les
# variables d'environnement du conteneur, posees dans dxp/k8s/deployment.yaml
# par la plateforme (service-ref de nature browser). L'image ne contient
# donc aucune adresse propre a un environnement : la meme image tourne en
# Dev, en Qualif et chez le client.
set -e
OUT=/usr/share/nginx/html/config.js
# Echappement pour une chaine JavaScript entre guillemets.
esc() { printf '%s' "$1" | tr -d '\r\n' | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/</\\u003c/g'; }
printf 'window.__DXP_CONFIG__ = { VITE_API_URL: "%s" };\n' "$(esc "${VITE_API_URL:-}")" > "$OUT"
if [ -n "${VITE_API_URL:-}" ]; then
  printf 'dxp-config: config.js written, VITE_API_URL=%s\n' "${VITE_API_URL}"
else
  echo "dxp-config: config.js written, VITE_API_URL empty"
fi
