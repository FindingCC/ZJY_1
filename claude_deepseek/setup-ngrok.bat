@echo off
chcp 65001 >nul
title ngrok 固定外网配置

echo.
echo ╔══════════════════════════════════════════╗
echo ║  配置固定外网地址（只需做一次）           ║
echo ╚══════════════════════════════════════════╝
echo.
echo 本工具帮你获取一个永久外网地址，
echo 配置后手机在任何地方都能通过固定链接访问。
echo.
echo 需要先免费注册 ngrok 账号：
echo.
echo   第1步：浏览器打开 https://dashboard.ngrok.com/signup
echo          用 GitHub 或 Google 一键登录（30秒）
echo.
echo   第2步：登录后左侧菜单 → "Your Authtoken"
echo          复制显示的 token
echo.
echo   第3步：左侧菜单 → "Domains"
echo          创建一个免费域名（如 my-project.ngrok-free.app）
echo.
echo ═══════════════════════════════════════════
echo.

set /p TOKEN=请粘贴你的 ngrok authtoken:

if "%TOKEN%"=="" (
    echo [跳过] 未输入 token
    pause
    exit /b
)

cd /d "%~dp0"
echo.
echo 正在配置 ngrok...
ngrok.exe config add-authtoken %TOKEN%

if errorlevel 1 (
    echo [失败] 配置出错
    pause
    exit /b
)

echo [完成] token 已保存

:: 询问固定域名
echo.
set /p DOMAIN=你的固定域名（如 my-project.ngrok-free.app，没有可跳过）:

if not "%DOMAIN%"=="" (
    echo.
    echo 已将域名写入配置
    echo NGROK_DOMAIN=%DOMAIN%> .ngrok-domain.txt
    echo.
    echo ═══════════════════════════════════════════
    echo   配置完成！
    echo   固定外网地址: https://%DOMAIN%
    echo ═══════════════════════════════════════════
) else (
    echo.
    echo ═══════════════════════════════════════════
    echo   token 已配置
    echo   如需要固定域名，在 ngrok 后台创建后
    echo   重新运行此脚本输入域名即可
    echo ═══════════════════════════════════════════
)

echo.
echo 现在运行 start.bat 即可获得外网地址
pause
