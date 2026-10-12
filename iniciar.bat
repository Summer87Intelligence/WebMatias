@echo off
cd /d "%~dp0"
echo Iniciando la web en http://localhost:5500  (cerra esta ventana para detenerla)
start "" http://localhost:5500
powershell -NoProfile -ExecutionPolicy Bypass -File ".claude\serve.ps1"
