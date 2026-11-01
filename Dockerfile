# syntax=docker/dockerfile:1

# --- Build: compile TypeScript ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Runtime: production dependencies only ---
FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=3001 \
    DATABASE_PATH=/data/zookeepr.db
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY public ./public
COPY data/*.json ./data/
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- "http://localhost:${PORT}/api/health" || exit 1
CMD ["node", "dist/server.js"]
