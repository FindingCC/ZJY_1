@echo off
chcp 65001 >nul
title 施工项目管理系统

echo.
echo ╔══════════════════════════════════════════╗
echo ║     施工项目管理系统 v2                 ║
echo ╚══════════════════════════════════════════╝

cd /d "%~dp0"

:: ── 构建 ──────────────────────────────
if not exist ".next\BUILD_ID" (
    echo [信息] 正在构建...
    call npm run build
    if errorlevel 1 (
        echo [错误] 构建失败
        pause
        exit /b 1
    )
) else (
    echo [信息] 构建已就绪
)

:: ── 停止旧进程 ────────────────────────
taskkill /f /im node.exe >nul 2>&1

:: ── 启动服务器 ────────────────────────
echo [信息] 启动服务器...
start "服务器" /MIN cmd /c "cd /d %~dp0 && npm start 2>&1 || (timeout /t 3 >nul && npm start)"

:wait_server
timeout /t 2 /nobreak >nul
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 goto wait_server
echo [信息] 服务器已就绪

:: ── 显示地址 ─────────────────────────
echo.
echo ═══════════════════════════════════════════════════════
echo.
echo   本机:  http://localhost:3000
echo.

for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    set ip=%%i
    set ip=!ip: =!
    if not "!ip!" == "127.0.0.1" (
        echo   同WiFi: http://!ip!:3000
    )
)

echo.
echo ───────────────────────────────────────────────────────
echo   外网地址（公网IP开通后生效）:
echo.
echo   http://3ve11805ew84.vicp.fun:3000
echo.
echo   开通条件:
echo     1. 10086 开通公网IP (已申请，等回电)
echo     2. 路由器设置 3000 端口转发到本机
echo     3. 电脑安装花生壳客户端保持在线
echo.
echo   开通前手机外网仍用 localtunnel 临时地址
echo ───────────────────────────────────────────────────────

:: ── localtunnel 临时方案 ─────────────
set PUBLIC_URL=
start "外网" /MIN cmd /c "cd /d %~dp0 && npx localtunnel --port 3000 > .tunnel-url.txt 2>&1"

for /L %%i in (1,1,15) do (
    timeout /t 1 /nobreak >nul
    for /f "tokens=*" %%a in ('type .tunnel-url.txt 2^>nul ^| findstr "your url is"') do (
        for /f "tokens=4" %%b in ("%%a") do set PUBLIC_URL=%%b
    )
    if not "!PUBLIC_URL!"=="" goto tunnel_ready
)

:tunnel_ready
if not "%PUBLIC_URL%"=="" (
    echo.
    echo   当前临时外网: %PUBLIC_URL%
)
echo.
echo ═══════════════════════════════════════════════════════
echo   停止: 双击 stop.bat
echo ═══════════════════════════════════════════════════════

start http://localhost:3000
echo 服务运行中...
pause >nul
