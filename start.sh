#!/bin/bash
set -e

# Kill any lingering processes from previous runs
pkill -f "vite" 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true
fuser -k 5000/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
sleep 1

mkdir -p /home/runner/workspace/data/db

if ! pgrep -x mongod > /dev/null; then
  mongod --dbpath /home/runner/workspace/data/db \
    --bind_ip 127.0.0.1 \
    --port 27017 \
    --logpath /tmp/mongod.log \
    --fork
  echo "MongoDB starting..."
  sleep 3
else
  echo "MongoDB already running"
fi

node seed.js

echo "Starting backend on port 3000..."
node server.js &

echo "Starting frontend on port 5000..."
cd frontend && npm run dev
