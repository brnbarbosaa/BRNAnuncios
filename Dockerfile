# ─────────────────────────────────────────────
# Stage 1: Build do Frontend React/Vite
# ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copia manifesto e instala deps
COPY frontend/package*.json ./
RUN npm install --silent

# Copia código e gera build de produção
COPY frontend/ .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Backend + Frontend estático
# ─────────────────────────────────────────────
FROM node:20-alpine

# Timezone São Paulo
RUN apk add --no-cache tzdata
ENV TZ=America/Sao_Paulo

WORKDIR /app

# Instala deps de produção do backend
COPY backend/package*.json ./
RUN npm install --only=production --silent

# Copia código do backend
COPY backend/ .

# Copia o build do frontend para ser servido pelo Express
COPY --from=frontend-builder /app/frontend/dist ./public

# Volume para uploads persistentes
VOLUME ["/app/uploads"]

# Exposição da porta
EXPOSE 3000

# Variáveis de ambiente padrão (podem ser sobrescritas no Easypanel)
ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOADS_PATH=/app/uploads

# Inicia o servidor
CMD ["node", "server.js"]
