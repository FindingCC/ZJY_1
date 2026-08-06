@echo off
chcp 65001 >nul
set KEY=-i C:\Users\Administrator\.ssh\id_ed25519
set SERVER=ubuntu@175.178.132.248

echo ===== Run bootstrap on production server =====
ssh -o StrictHostKeyChecking=no %KEY% %SERVER% "cd /opt/ZJY_1/claude_deepseek && node scripts/bootstrap.js"
echo.
echo ===== Verify: latest safety weeks =====
ssh -o StrictHostKeyChecking=no %KEY% %SERVER% "sqlite3 /opt/ZJY_1/claude_deepseek/prisma/dev.db \"SELECT p.name, s.weekLabel FROM SafetyStudy s JOIN Project p ON s.projectId=p.id ORDER BY s.weekEnd DESC LIMIT 6;\""
echo.
echo ===== Done =====
pause
