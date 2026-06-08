#!/usr/bin/env bash
# Simple script to set everything up

set -e

ROOT_DIR="$(pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "Setting up Python backend"

cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate

pip install --upgrade pip

if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
fi

echo "Setting up frontend"

cd "$FRONTEND_DIR"

if [ -f "package.json" ]; then
    npm install
fi

echo "Setting up root npm"

cd "$ROOT_DIR"

if [ -f "package.json" ]; then
    npm install
fi

echo "Starting services"

npm run dev

wait