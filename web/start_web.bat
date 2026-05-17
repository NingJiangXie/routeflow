@echo off
chcp 65001 >nul 2>&1

echo ========================================
echo    Path Planning System - Web Edition
echo ========================================
echo.
echo Starting local server...
echo.
echo Server: http://localhost:8080
echo.
echo Press Ctrl+C to stop, or close this window
echo.

cd /d "%~dp0"

REM Try python3 first, then python
where python3 >nul 2>&1
if %errorlevel% equ 0 (
    python3 -m http.server 8080
) else (
    python -m http.server 8080
)

pause
