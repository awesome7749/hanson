# ── Stage 1: Build React frontend ──
FROM node:20-alpine AS frontend
WORKDIR /app/my-app
COPY my-app/package*.json ./
RUN npm ci
COPY my-app/ ./
ENV REACT_APP_DEPLOYMENT_MODE=live
ENV GENERATE_SOURCEMAP=false
RUN npm run build && node scripts/prepare-live.cjs

# ── Stage 2: Build Express backend (Debian for Prisma compatibility) ──
FROM node:20-slim AS backend
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npx prisma generate
RUN npm run build

# ── Stage 3: Production runtime (Debian for Prisma) ──
FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=backend /app/server/dist ./dist
COPY --from=backend /app/server/node_modules ./node_modules
COPY --from=backend /app/server/package.json ./
COPY --from=backend /app/server/prisma ./prisma
COPY --from=frontend /app/my-app/build ./public
RUN mv ./public/ops-shell.html ./ops-shell.html
EXPOSE 8080
ENV PORT=8080 NODE_ENV=production
CMD ["node", "dist/index.js"]
