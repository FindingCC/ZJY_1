@echo off
chcp 65001 >nul
echo ===== 部署到云服务器 =====
echo.
echo 只更新 .next 和 src，不碰 prisma/dev.db 和 archives/
echo.
set /p PASS=请输入服务器root密码:
echo.
echo --- 正在上传 .next 文件夹... ---
pscp -pw %PASS% -r .next root@175.178.132.248:/opt/zjy/
if %errorlevel% neq 0 (
    echo .next 上传失败，尝试 pscp.exe 完整路径
    "C:\Program Files\PuTTY\pscp.exe" -pw %PASS% -r .next root@175.178.132.248:/opt/zjy/
)
echo.
echo --- 正在上传 src 文件夹... ---
pscp -pw %PASS% -r src root@175.178.132.248:/opt/zjy/
if %errorlevel% neq 0 (
    "C:\Program Files\PuTTY\pscp.exe" -pw %PASS% -r src root@175.178.132.248:/opt/zjy/
)
echo.
echo --- 重启服务... ---
plink -pw %PASS% root@175.178.132.248 "systemctl restart zjy"
if %errorlevel% neq 0 (
    "C:\Program Files\PuTTY\plink.exe" -pw %PASS% root@175.178.132.248 "systemctl restart zjy"
)
echo.
echo ===== 部署完成 =====
pause
