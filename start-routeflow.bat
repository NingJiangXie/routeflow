@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-routeflow.ps1"
pause
