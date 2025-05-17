#!/bin/sh

if ! pgrep -x "Xvfb" > /dev/null; then
    Xvfb :99 -screen 0 1280x1024x24 -ac &
    sleep 2
else
    echo "Xvfb is already running"
fi

export DISPLAY=:99

chromium-browser --version
chromedriver --version
which chromedriver
which chromium-browser

chmod +x $(which chromedriver)
chmod +x $(which chromium-browser)