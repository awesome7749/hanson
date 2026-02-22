# ── Stage 1: Build React frontend ──
FROM node:20-alpine AS frontend
WORKDIR /app/my-app
COPY my-app/package*.json ./
RUN npm ci
COPY my-app/ ./
ARG REACT_APP_SITE_PASSWORD
ARG REACT_APP_GOOGLE_MAPS_API_KEY
ENV REACT_APP_SITE_PASSWORD=$REACT_APP_SITE_PASSWORD
ENV REACT_APP_GOOGLE_MAPS_API_KEY=$REACT_APP_GOOGLE_MAPS_API_KEY
RUN npm run build

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
EXPOSE 8080
ENV PORT=8080 NODE_ENV=production
CMD ["node", "dist/index.js"]
