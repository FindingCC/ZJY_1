@echo off
chcp 65001 >nul
echo ===== Install daily auto-push task (23:30 every day) =====
echo Script: D:\biandianproject1\ZJY_1\auto_push.ps1
echo.
schtasks /Create /TN "ZJY_AutoPush" /TR "powershell -NoProfile -ExecutionPolicy Bypass -File D:\biandianproject1\ZJY_1\auto_push.ps1" /SC DAILY /ST 23:30 /F
if %errorlevel% neq 0 (
    echo FAILED - please right-click this file and select "Run as administrator"
    pause
    exit /b 1
)
echo.
echo ===== Installed. Current task: =====
schtasks /Query /TN "ZJY_AutoPush" /FO LIST
echo.
echo ===== Done =====
pause
