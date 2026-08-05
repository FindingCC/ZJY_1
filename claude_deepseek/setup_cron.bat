@echo off
chcp 65001 >nul
cd /d "%~dp0"

set KEY=-i C:\Users\Administrator\.ssh\id_ed25519
set SERVER=ubuntu@175.178.132.248

echo ===== Install weekly safety-study cron on server =====
echo Every Monday 2:00am: auto-create current safety study week.
echo.

echo [1/2] Uploading setup script...
scp -o StrictHostKeyChecking=no %KEY% setup_cron.sh %SERVER%:/tmp/
if %errorlevel% neq 0 (
    "C:\Program Files\PuTTY\pscp.exe" -o StrictHostKeyChecking=no %KEY% setup_cron.sh %SERVER%:/tmp/
)

echo [2/2] Running setup script...
ssh -o StrictHostKeyChecking=no %KEY% %SERVER% "bash /tmp/setup_cron.sh"
if %errorlevel% neq 0 (
    "C:\Program Files\PuTTY\plink.exe" -o StrictHostKeyChecking=no %KEY% %SERVER% "bash /tmp/setup_cron.sh"
)

echo.
echo ===== Done =====
pause
