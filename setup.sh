#!/usr/bin/env bash
# Simple script to set everything up

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "Setting up Python backend"

cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

venv/bin/pip install --upgrade pip

if [ -f "requirements.txt" ]; then
    venv/bin/pip install -r requirements.txt
fi

if [ ! -f ".env" ] && [ -f ".env.copy" ]; then
    cp .env.copy .env
fi

if grep -q '^WORKSPACE_DIR=$' .env 2>/dev/null; then
    read -erp "Enter WORKSPACE_DIR (path to xia2 run data): " workspace_dir
    sed -i "s|^WORKSPACE_DIR=.*|WORKSPACE_DIR=$workspace_dir|" .env
fi

echo "Setting up frontend"

cd "$FRONTEND_DIR"

if [ ! -f ".env" ] && [ -f ".env.copy" ]; then
    cp .env.copy .env
fi

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
