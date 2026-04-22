# ── Base image: Node 18 on Alpine (tiny Linux = small image) ──
FROM node:18-alpine

# ── Build tools needed by better-sqlite3 ──────────────────────
RUN apk add --no-cache python3 make g++

# ── Working directory inside container ────────────────────────
WORKDIR /app

# ── OPTIMIZATION 1: Copy package files first ──────────────────
# Docker caches this layer. If code changes but package.json
# doesn't, npm install is SKIPPED on rebuild (saves minutes)
COPY backend/package*.json ./backend/

# ── Install only production dependencies ──────────────────────
# OPTIMIZATION 2: --omit=dev skips devDependencies = smaller image
RUN cd backend && npm install --omit=dev

# ── Copy rest of source code ───────────────────────────────────
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# ── Create data directory for SQLite file ─────────────────────
RUN mkdir -p /app/backend/data

# ── Environment variables ──────────────────────────────────────
ENV PORT=5000
ENV DB_PATH=/app/backend/data/recipes.db

# ── Tell Docker this container uses port 5000 ─────────────────
EXPOSE 5000

# ── Start the app ─────────────────────────────────────────────
CMD ["node", "backend/server.js"]