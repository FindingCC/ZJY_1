#!/bin/bash
cd /tmp
echo "=== login ==="
curl -s -c /tmp/ck.txt -H 'Content-Type: application/json' \
  -d '{"username":"18507092279","password":"Zjy@2022.."}' \
  'http://localhost:3000/api/auth/login' | head -c 300
echo
echo "=== 下载测试 ==="
for id in 1 12 43 44 50; do
  curl -s -b /tmp/ck.txt -o /tmp/dl_${id}.pdf -w "id=$id -> HTTP %{http_code}, %{size_download} bytes, type=%{content_type}\n" \
    "http://localhost:3000/api/files/serve?id=$id"
done
echo "=== 下载内容头字节校验 (PDF magic: %PDF-) ==="
for id in 1 12 43 44 50; do
  printf 'id=%s: ' $id
  head -c 5 /tmp/dl_${id}.pdf | xxd | head -1
done
echo "=== 安全文件下载测试 ==="
curl -s -b /tmp/ck.txt -o /tmp/dl_s5.pdf -w "safety5 -> HTTP %{http_code}, %{size_download} bytes\n" \
  'http://localhost:3000/api/serve-files?id=5&type=safety'
head -c 5 /tmp/dl_s5.pdf | xxd | head -1
