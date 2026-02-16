# Use Node.js 20.19 (required by mongodb, mongoose, resend)
FROM node:20.19-bookworm-slim

# Set working directory
WORKDIR /app

# --- 1. FRONTEND BUILD ---
COPY frontend/package*.json ./frontend/
# Cloud Build environments may set production installs by default; force dev deps
# so CRACO is available for the frontend build step.
RUN cd frontend && npm ci --include=dev --legacy-peer-deps

COPY frontend/ ./frontend/

# Optimization settings
ENV CI=false
ENV GENERATE_SOURCEMAP=false

# Build the React app
RUN cd frontend && npm run build

# --- 2. BACKEND SETUP ---
COPY backend/node-app/package*.json ./backend/node-app/
RUN cd backend/node-app && npm ci --omit=dev
COPY backend/ ./backend/

# --- 3. STARTUP ---
ENV PORT=8080
EXPOSE 8080

CMD ["node", "backend/node-app/index.js"]
