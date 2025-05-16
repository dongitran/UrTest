FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

FROM node:18-alpine

RUN apk add --no-cache git openssh python3 py3-pip postgresql-dev gcc python3-dev musl-dev

RUN apk add --no-cache chromium chromium-chromedriver xvfb curl unzip

ENV CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/lib/chromium/ \
    CHROMEDRIVER_PATH=/usr/bin/chromedriver \
    DISPLAY=:99 \
    PATH="/usr/bin:/usr/local/bin:${PATH}"

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip3 install --no-cache-dir \
    selenium==4.10.0 \
    robotframework==6.1.1 \
    robotframework-requests \
    robotframework-seleniumlibrary==6.1.0 \
    robotframework-databaselibrary \
    psycopg2-binary \
    jsonschema \
    robotframework-faker

RUN chromium-browser --version && \
    chromedriver --version && \
    ls -la /usr/bin/chromedriver

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/app.js ./

RUN mkdir -p tests/tests && chown -R appuser:appgroup /app

RUN echo '#!/bin/sh\n\
if ! pgrep -x "Xvfb" > /dev/null; then\n\
    Xvfb :99 -screen 0 1280x1024x24 -ac &\n\
    sleep 2\n\
else\n\
    echo "Xvfb is already running"\n\
fi\n\
\n\
export DISPLAY=:99\n\
\n\
chromium-browser --version\n\
chromedriver --version\n\
which chromedriver\n\
which chromium-browser\n\
\n\
chmod +x $(which chromedriver)\n\
chmod +x $(which chromium-browser)' > /app/start_xvfb.sh && \
    chmod +x /app/start_xvfb.sh

RUN chmod 755 /usr/bin/chromium-browser && \
    chmod +x /usr/bin/chromedriver

ENV NODE_ENV=production \
    PORT=3000 \
    PYTHONPATH=/app

USER root

EXPOSE 3000

CMD ["/bin/sh", "-c", "/app/start_xvfb.sh && node app.js"]