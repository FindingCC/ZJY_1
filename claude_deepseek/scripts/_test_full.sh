#!/bin/bash
BASE=http://localhost:3000
echo '{"username":"18507092279","password":"Zjy@2022.."}' > /tmp/login.json
echo "=== 1. 登录 ==="
LOGIN=$(curl -s -c /tmp/ck.txt -H 'Content-Type: application/json' --data @/tmp/login.json $BASE/api/auth/login)
echo "$LOGIN" | head -c 200; echo
echo "=== 2. 会话恢复 /api/auth/me ==="
curl -s -b /tmp/ck.txt -w '\n[HTTP %{http_code}]\n' $BASE/api/auth/me | head -c 300; echo
echo "=== 3. 工程列表 /api/projects ==="
curl -s -b /tmp/ck.txt -w '\n[HTTP %{http_code}]\n' $BASE/api/projects | head -c 300; echo
echo "=== 4. 归档文件 /api/files?projectId=1 ==="
curl -s -b /tmp/ck.txt -w '\n[HTTP %{http_code}]\n' "$BASE/api/files?projectId=1" | head -c 200; echo
echo "=== 5. 主页面 / ==="
curl -s -b /tmp/ck.txt -o /dev/null -w '[HTTP %{http_code}] len=%{size_download}\n' $BASE/
echo "=== 6. 静态CSS资产 ==="
CSS=$(curl -s $BASE/login | grep -o '/_next/static/css/[^"]*' | head -1)
echo "CSS: $CSS"
curl -s -o /dev/null -w "[HTTP %{http_code}] len=%{size_download}\n" "$BASE$CSS"
