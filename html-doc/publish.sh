#!/bin/bash
# publish.sh — 推送 HTML 文件到 GitHub Pages
# 用法: ./publish.sh <本地文件路径> [仓库名，默认 writings]
#
# 依赖: curl, python3, base64（macOS/Linux 自带）
# 首次使用前设置 Token: export GITHUB_TOKEN=your_token_here
#   或写入 ~/.github_token 文件

set -e

FILE="$1"
REPO="${2:-writings}"
OWNER="Yexindew"

if [ -z "$FILE" ]; then
  echo "用法: ./publish.sh <文件路径> [仓库名]"
  echo "示例: ./publish.sh my-article.html"
  exit 1
fi

if [ ! -f "$FILE" ]; then
  echo "错误: 文件不存在 $FILE"
  exit 1
fi

# 读取 Token
TOKEN="${GITHUB_TOKEN}"
if [ -z "$TOKEN" ] && [ -f "$HOME/.github_token" ]; then
  TOKEN=$(cat "$HOME/.github_token")
fi
if [ -z "$TOKEN" ]; then
  echo "错误: 未找到 GitHub Token"
  echo "请运行: export GITHUB_TOKEN=your_token"
  echo "或将 token 写入 ~/.github_token 文件"
  exit 1
fi

FILENAME=$(basename "$FILE")
API="https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILENAME}"

echo "正在推送 $FILENAME 到 ${OWNER}/${REPO}..."

# 获取文件 base64 内容
CONTENT=$(base64 -i "$FILE")

# 检查文件是否已存在（获取 sha）
SHA=$(curl -s -H "Authorization: token $TOKEN" "$API" \
  | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d.get('sha',''))" 2>/dev/null)

# 构造请求体
if [ -n "$SHA" ]; then
  BODY=$(python3 -c "
import json, sys
print(json.dumps({
  'message': 'update $FILENAME',
  'content': sys.argv[1],
  'sha': sys.argv[2]
}))
" "$CONTENT" "$SHA")
  echo "（文件已存在，执行更新）"
else
  BODY=$(python3 -c "
import json, sys
print(json.dumps({
  'message': 'add $FILENAME',
  'content': sys.argv[1]
}))
" "$CONTENT")
  echo "（新文件，执行创建）"
fi

# 推送
RESULT=$(curl -s -X PUT "$API" \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$BODY")

STATUS=$(echo "$RESULT" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print('ok' if 'content' in d else d.get('message','error'))")

if [ "$STATUS" = "ok" ]; then
  echo ""
  echo "✅ 推送成功！"
  echo "🔗 等待约 30 秒后访问："
  echo "   https://${OWNER}.github.io/${REPO}/${FILENAME}"
else
  echo "❌ 推送失败: $STATUS"
  exit 1
fi
