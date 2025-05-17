FROM node:18-alpine as base

WORKDIR /usr/src/app

ENV JIRA_BRIDGE_NODE_ENV=production

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodeuser -u 1001 -G nodejs && \
  chown -R nodeuser:nodejs /usr/src/app

USER nodeuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["/bin/sh", "-c", ". /vault/secrets/env-config && node src/index.js"]
