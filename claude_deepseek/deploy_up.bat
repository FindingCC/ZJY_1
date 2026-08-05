@echo off
chcp 65001 >nul
cd /d "%~dp0"

set KEY=-i C:\Users\Administrator\.ssh\id_ed25519
set SERVER=ubuntu@175.178.132.248
set APP=/opt/ZJY_1/claude_deepseek

echo [1/5] Uploading .next...
scp -o StrictHostKeyChecking=no %KEY% -r .next %SERVER%:%APP%/

echo [2/5] Uploading src...
scp -o StrictHostKeyChecking=no %KEY% -r src %SERVER%:%APP%/

echo [3/5] Uploading prisma schema (excluding dev.db)...
scp -o StrictHostKeyChecking=no %KEY% prisma/schema.prisma %SERVER%:%APP%/prisma/
if exist prisma\migrations (
  scp -o StrictHostKeyChecking=no %KEY% -r prisma/migrations %SERVER%:%APP%/prisma/
)

echo [4/5] Uploading package.json...
scp -o StrictHostKeyChecking=no %KEY% package.json %SERVER%:%APP%/

echo [5/6] Uploading scripts...
scp -o StrictHostKeyChecking=no %KEY% -r scripts %SERVER%:%APP%/

echo [6/8] Running fix: storage paths...
ssh -o StrictHostKeyChecking=no %KEY% %SERVER% "cd %APP% && node scripts/fix_storage_paths.js"

echo [7/8] Running fix: delete archive labels...
ssh -o StrictHostKeyChecking=no %KEY% %SERVER% "cd %APP% && node scripts/delete_archive_labels.js"

echo [8/8] Restarting service...
ssh -o StrictHostKeyChecking=no %KEY% %SERVER% "sudo systemctl restart zjy"

echo Done!
pause
