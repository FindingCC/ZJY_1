#!/bin/bash
# 服务器更新脚本 - 零感知部署
cd /opt/ZJY_1

echo "[1/4] 拉取代码..."
git pull

echo "[2/4] 安装依赖..."
cd claude_deepseek && npm install

echo "[3/4] 构建..."
npm run build

echo "[4/4] 平滑重启..."
sudo systemctl reload nginx
sudo systemctl restart zjy

# 等待服务就绪
echo "等待服务就绪..."
for i in $(seq 1 30); do
    if curl -s http://localhost:3000/login > /dev/null 2>&1; then
        echo "Done: https://infienerge.top"
        exit 0
    fi
    sleep 1
done
echo "WARN: 服务启动超时，请手动检查"
