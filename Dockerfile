FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
# S79 (ADR S0-083, service-ref Phase B) -- ARG optionnel, defaut vide.
# Injecte par Kaniko via --build-arg (task-dxp-app-build.yaml) quand ce
# service declare une dependance service-ref de nature browser vers un
# autre service du projet. Vide par defaut -- comportement inchange pour
# tout service sans dependance declaree (D5, non-bloquant).
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
