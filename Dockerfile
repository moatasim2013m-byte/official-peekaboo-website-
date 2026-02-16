FROM node:20-bookworm-slim AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --include=dev --legacy-peer-deps
COPY frontend/ ./
ENV CI=false
ENV GENERATE_SOURCEMAP=false
RUN npm run build

FROM node:20-bookworm-slim AS backend-deps

WORKDIR /app/backend/node-app
COPY backend/node-app/package*.json ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim

WORKDIR /app
COPY --from=frontend-builder /app/frontend/build ./frontend/build
COPY --from=backend-deps /app/backend/node-app/node_modules ./backend/node-app/node_modules
COPY backend/ ./backend/

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "backend/node-app/index.js"]
