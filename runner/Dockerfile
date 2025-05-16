FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

FROM node:18-alpine

RUN apk add --no-cache git openssh python3 py3-pip postgresql-dev gcc python3-dev musl-dev

RUN apk add --no-cache chromium chromium-chromedriver xvfb curl unzip

RUN mkdir -p /opt/selenium /opt/selenium/chromedriver

RUN CHROME_MAJOR_VERSION=$(chromium-browser --version | sed 's/Chromium //g' | sed 's/\.[0-9]*\.[0-9]*\.[0-9]* //g') && \
    echo "Chrome version: $CHROME_MAJOR_VERSION" && \
    CHROMEDRIVER_VERSION=$(curl -s "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_$CHROME_MAJOR_VERSION") && \
    echo "ChromeDriver version: $CHROMEDRIVER_VERSION" && \
    wget -q "https://chromedriver.storage.googleapis.com/$CHROMEDRIVER_VERSION/chromedriver_linux64.zip" -O /tmp/chromedriver.zip && \
    unzip /tmp/chromedriver.zip -d /opt/selenium/chromedriver/ && \
    rm /tmp/chromedriver.zip && \
    chmod +x /opt/selenium/chromedriver/chromedriver && \
    ln -fs /opt/selenium/chromedriver/chromedriver /usr/local/bin/chromedriver

ENV CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/lib/chromium/ \
    CHROMEDRIVER_PATH=/usr/local/bin/chromedriver \
    DISPLAY=:99 \
    PATH="/usr/local/bin:${PATH}"

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip3 install selenium==4.10.0

RUN pip3 install --no-cache-dir \
    robotframework==6.1.1 \
    robotframework-requests \
    robotframework-seleniumlibrary==6.1.0 \
    robotframework-databaselibrary \
    psycopg2-binary \
    jsonschema \
    robotframework-faker \
    webdrivermanager

RUN webdrivermanager chrome --linkpath /usr/local/bin

RUN chromium-browser --version && \
    chromedriver --version && \
    ls -la /usr/local/bin/chromedriver && \
    ls -la /opt/selenium/chromedriver/chromedriver

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

RUN ls -la /usr/bin/chromium-browser && \
    chmod 755 /usr/bin/chromium-browser && \
    chmod +x /usr/local/bin/chromedriver

ENV NODE_ENV=production \
    PORT=3000 \
    PYTHONPATH=/app

USER root

EXPOSE 3000

CMD ["/bin/sh", "-c", "/app/start_xvfb.sh && node app.js"]