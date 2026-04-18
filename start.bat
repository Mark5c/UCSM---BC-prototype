@echo off
SET PATH=C:\Program Files\nodejs;%PATH%
SET NODE_PATH=C:\Program Files\nodejs\node_modules

echo Starting UCMS...
echo.

:: Start backend
echo [1/2] Starting backend (FastAPI)...
start "UCMS Backend" cmd /k "cd /d C:\Users\marek\Desktop\BCprototype\backend && .venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

:: Install frontend deps if needed
echo [2/2] Installing frontend dependencies...
cd /d C:\Users\marek\Desktop\BCprototype\frontend
npm install

:: Start frontend
echo Starting frontend (Vite)...
start "UCMS Frontend" cmd /k "cd /d C:\Users\marek\Desktop\BCprototype\frontend && npm run dev"

:: Wait for Vite to start
timeout /t 4 /nobreak >nul

:: Open browser
echo Opening browser...
start http://localhost:5173

echo.
echo UCMS is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   API docs: http://localhost:8000/docs
