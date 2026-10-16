FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
# S114 (L0a, #151) -- plus aucun ARG : l'URL du backend n'est plus figee
# au build, elle est lue a l'execution (docker/40-dxp-config.sh ecrit
# config.js au demarrage du conteneur). Image identique pour tous les
# environnements.
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Script lance par l'entrypoint nginx (/docker-entrypoint.d). Fins de ligne
# normalisees et bit d'execution force : le depot peut etre edite sous
# Windows et le provisioning ne conserve pas les droits des fichiers.
COPY docker/40-dxp-config.sh /docker-entrypoint.d/40-dxp-config.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-dxp-config.sh && chmod +x /docker-entrypoint.d/40-dxp-config.sh
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
