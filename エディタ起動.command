#!/bin/bash
# JACK12 フライヤーエディタ 起動ランチャー（ダブルクリックで実行）
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR/editor" || { echo "editor フォルダが見つかりません"; read; exit 1; }

clear
echo "============================================"
echo "  JACK12 フライヤーエディタ を起動します"
echo "============================================"

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js / npm が見つかりません。https://nodejs.org からインストールしてください。"
  read -n1 -p "Enterで閉じます"; exit 1
fi

if [ ! -d node_modules ]; then
  echo "初回セットアップ中（npm install）… 少し待ちます"
  npm install --no-audit --no-fund || { echo "セットアップに失敗しました"; read -n1; exit 1; }
fi

URL="http://localhost:5173"
echo ""
echo "ブラウザでエディタを開きます: $URL"
echo "※ このウィンドウを閉じるとエディタは停止します"
echo ""
# 起動を待ってブラウザを開く（Chrome優先、なければ既定ブラウザ）
( for i in $(seq 1 40); do curl -s "$URL" >/dev/null 2>&1 && break; sleep 0.5; done
  open -a "Google Chrome" "$URL" 2>/dev/null || open "$URL" ) &

npm run dev
