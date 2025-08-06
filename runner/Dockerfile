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
    selenium==4.8.3 \
    robotframework==6.1.1 \
    robotframework-requests \
    robotframework-seleniumlibrary==6.1.0 \
    robotframework-databaselibrary \
    psycopg2-binary \
    pymysql \
    jsonschema \
    robotframework-faker \
    robotframework-appiumlibrary \
    appium-python-client \
    robotframework-jsonlibrary

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
RUN chmod 755 /usr/bin/chromium-browser && \
    chmod +x /usr/bin/chromedriver

ENV NODE_ENV=production \
    PORT=3000 \
    PYTHONPATH=/app

USER root

EXPOSE 3000

CMD Xvfb :99 -screen 0 1280x1024x24 -ac & \
    export DISPLAY=:99 && \
    sleep 2 && \
    echo "Chrome version: $(chromium-browser --version)" && \
    echo "ChromeDriver version: $(chromedriver --version)" && \
    chmod +x $(which chromedriver) && \
    chmod +x $(which chromium-browser) && \
    node app.js