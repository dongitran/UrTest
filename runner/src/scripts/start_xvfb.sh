#!/bin/sh

if ! pgrep -x "Xvfb" > /dev/null; then
    echo "Starting Xvfb virtual display server..."
    Xvfb :99 -screen 0 1280x1024x24 -ac &
    sleep 1
    echo "Xvfb started with DISPLAY=:99"
else
    echo "Xvfb is already running"
fi

export DISPLAY=:99
