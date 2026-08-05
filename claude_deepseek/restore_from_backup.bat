@echo off
chcp 65001 >nul
cd /d "%~dp0"

set KEY=-i C:\Users\Administrator\.ssh\id_ed25519
set SERVER=ubuntu@175.178.132.248
set APP=/opt/ZJY_1/claude_deepseek

echo [1/4] Uploading server_backup.tar.gz to server...
scp -o StrictHostKeyChecking=no %KEY% D:\server_backup.tar.gz %SERVER%:/tmp/

echo [2/4] Extracting archives on server (this may take a moment)...
ssh -o StrictHostKeyChecking=no %KEY% %SERVER% "cd %APP% && tar -xzf /tmp/server_backup.tar.gz && rm /tmp/server_backup.tar.gz && echo '  archives/ extracted'"

echo [3/4] Uploading restore script...
scp -o StrictHostKeyChecking=no %KEY% scripts\restore_after_deploy.js %SERVER%:%APP%/scripts/

echo [4/4] Running database restore and restarting service...
ssh -o StrictHostKeyChecking=no %KEY% %SERVER% "cd %APP% && node scripts/restore_after_deploy.js && sudo systemctl restart zjy && echo '  Done'"

echo.
echo All done! Refresh the webpage to see restored files.
pause
