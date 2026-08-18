#!/usr/bin/env bash
set -e

echo "================================================================="
echo "      ZAP2 — Studio IA de Découpage Vidéo 9:16 & Multi-Posting"
echo "================================================================="
echo ""

# 1. Backend setup
cd backend
if [ ! -d "venv" ]; then
    echo "[1/3] Création de l'environnement virtuel Python..."
    python3 -m venv venv
fi
source venv/bin/activate
echo "[2/3] Installation des dépendances Python..."
pip install -r requirements.txt --quiet

if [ ! -f ".env" ]; then
    cp .env.example .env
fi

echo "[3/3] Démarrage du serveur FastAPI..."
uvicorn app.main:app --port 8000 --reload &
BACKEND_PID=$!

# 2. Frontend setup
cd ../frontend
npm install
npm run dev

kill $BACKEND_PID
