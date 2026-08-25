#!/bin/bash
echo '{"username":"18507092279","password":"Zjy@2022.."}' > /tmp/login.json
echo "--- login API ---"
curl -s -w '\n[HTTP %{http_code}]\n' -H 'Content-Type: application/json' --data @/tmp/login.json http://localhost:3000/api/auth/login | head -c 500
echo
echo "--- 空body对照 ---"
curl -s -w '\n[HTTP %{http_code}]\n' -H 'Content-Type: application/json' -d '' http://localhost:3000/api/auth/login
echo "--- /login 页面 ---"
curl -s -o /dev/null -w '[HTTP %{http_code}] len=%{size_download}\n' http://localhost:3000/login
