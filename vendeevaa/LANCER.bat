@echo off
title Vendee Va'a — Serveur
echo ================================================
echo   Vendee Va'a — Demarrage du serveur
echo ================================================
echo.

:: Installer websockets si absent
pip show websockets >nul 2>&1
if errorlevel 1 (
    echo Installation de websockets...
    pip install websockets
    echo.
)

echo Serveur en cours de demarrage...
echo   Regie    ^> http://localhost:8765
echo   Overlay  ^> http://localhost:8765/overlay
echo.
echo Appuyez sur Ctrl+C pour arreter.
echo.

python server.py
pause
