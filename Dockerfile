FROM node:20-bookworm-slim

WORKDIR /app

# Build frontend assets
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --legacy-peer-deps
COPY frontend/ ./frontend/
ENV CI=false
ENV GENERATE_SOURCEMAP=false
RUN cd frontend && npm run build

# Install backend runtime dependencies
COPY backend/node-app/package*.json ./backend/node-app/
RUN cd backend/node-app && npm ci --omit=dev
COPY backend/ ./backend/

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "backend/node-app/index.js"]
