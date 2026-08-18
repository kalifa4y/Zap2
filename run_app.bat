@echo off
echo =================================================================
echo       ZAP2 — Studio IA de Decoupage Video 9:16 et Multi-Posting
echo =================================================================
echo.

:: 1. Verification de Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Python n'est pas installe ou n'est pas dans le PATH.
    pause
    exit /b 1
)

:: 2. Verification de FFmpeg
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [AVERTISSEMENT] FFmpeg n'a pas ete detecte dans le PATH.
    echo Assurez-vous d'avoir installe FFmpeg pour le decodage video optimal.
    echo.
)

:: 3. Initialisation du Backend
cd /d "%~dp0backend"
if not exist "venv" (
    echo [1/4] Creation de l'environnement virtuel Python...
    python -m venv venv
)
echo [2/4] Installation des dependances backend...
call venv\Scripts\activate
pip install -r requirements.txt --quiet

if not exist ".env" (
    copy .env.example .env >nul
)

echo [3/4] Lancement du serveur backend FastAPI sur le port 8000...
start "ZAP2 Backend (FastAPI)" cmd /k "venv\Scripts\activate && uvicorn app.main:app --port 8000 --reload"

:: 4. Initialisation du Frontend
cd /d "%~dp0frontend"
echo [4/4] Lancement du frontend Studio...
call npm install
start "ZAP2 Frontend (Vite)" cmd /k "npm run dev"

echo.
echo =================================================================
echo  ZAP2 est en cours d'execution !
echo  - Frontend Studio : http://localhost:5173
echo  - API Backend     : http://localhost:8000/docs
echo =================================================================
