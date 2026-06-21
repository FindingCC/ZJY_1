@echo off
chcp 65001 >nul
echo 正在停止施工项目管理系统...
taskkill /f /im node.exe >nul 2>&1
echo 已停止所有服务
pause
