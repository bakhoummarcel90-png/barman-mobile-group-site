# Image de production de SenLivraison (Railway, Render, VPS…).
# Les données (base SQLite + photos) vont dans /data : montez-y un volume persistant.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Les outils de développement sont conservés pour pouvoir charger la démo (SEED_DEMO=1).
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    DATA_DIR=/data \
    PORT=3001
COPY --from=build /app /app
RUN mkdir -p /data
EXPOSE 3001
CMD ["sh", "start.sh"]
