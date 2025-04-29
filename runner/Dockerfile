FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

FROM node:18-alpine

RUN apk add --no-cache git openssh python3 py3-pip postgresql-dev gcc python3-dev musl-dev

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip3 install --no-cache-dir \
    robotframework \
    robotframework-requests \
    robotframework-seleniumlibrary \
    robotframework-databaselibrary \
    psycopg2-binary \
    jsonschema

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/app.js ./

RUN mkdir -p tests/tests && chown -R appuser:appgroup /app

ENV NODE_ENV=production \
    PORT=3000

USER appuser

EXPOSE 3000

CMD ["node", "app.js"]
