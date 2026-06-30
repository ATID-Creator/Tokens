#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [ ! -d "node_modules" ]; then
  echo "依存パッケージをインストールしています..."
  npm install
fi

echo ""
echo "=========================================="
echo " アジア貿易・外交シミュレーター 起動中"
echo "=========================================="
echo ""
echo " ブラウザで次のURLを開いてください:"
echo "   http://localhost:5173"
echo ""
echo " 停止するには Ctrl+C を押してください"
echo ""

npm run dev
