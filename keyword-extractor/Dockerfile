FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache git

COPY --from=builder /app/node_modules ./node_modules
COPY src/ ./src/
COPY config/ ./config/
COPY package.json ./

RUN mkdir -p temp output

RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 3022

CMD ["/bin/sh", "-c", ". /vault/secrets/env-config && node src/index.js"]