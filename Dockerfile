# Use Node.js 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# --- 1. FRONTEND BUILD ---
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install --legacy-peer-deps

# Fix missing library
RUN cd frontend && npm install ajv@8 --legacy-peer-deps

COPY frontend/ ./frontend/

# Optimization settings
ENV CI=false
ENV GENERATE_SOURCEMAP=false

# Build the React app
RUN cd frontend && npm run build

# --- 2. BACKEND SETUP ---
COPY backend/node-app/package*.json ./backend/node-app/
RUN cd backend/node-app && npm install
COPY backend/ ./backend/

# --- 3. STARTUP ---
ENV PORT=8080
EXPOSE 8080

# FIX: Add the dummy key so the app starts
ENV RESEND_API_KEY=DWx9Yo5R_BR3TwVp5VsTE6Xz58uceZxws

CMD ["node", "backend/node-app/index.js"]
