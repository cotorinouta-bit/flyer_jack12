#!/bin/bash
# JACK12 フライヤー 書き出しランチャー（ダブルクリック）
# 形式（PDF / PNG / JPG）を選んで output/editor/ に書き出す。
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR/editor" || { echo "editor フォルダが見つかりません"; read; exit 1; }

clear
echo "============================================"
echo "  JACK12 フライヤー 書き出し"
echo "============================================"

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js / npm が見つかりません。https://nodejs.org からインストールしてください。"
  read -n1 -p "Enterで閉じます"; exit 1
fi

# 形式を選択（複数可）。キャンセルで終了。
SEL=$(osascript -e 'set f to choose from list {"PDF","PNG","JPG"} with title "JACK12 書き出し" with prompt "出力する形式を選んでください（複数選択可）" default items {"PDF","PNG","JPG"} with multiple selections allowed' 2>/dev/null)
if [ "$SEL" = "false" ] || [ -z "$SEL" ]; then echo "キャンセルしました。"; sleep 1; exit 0; fi
export FORMATS=$(printf '%s' "$SEL" | tr 'A-Z' 'a-z' | tr -d ' ')
echo "選択した形式: $FORMATS"

[ -d node_modules ] || { echo "セットアップ中…"; npm install --no-audit --no-fund; }
echo "書き出し用ブラウザ(Chromium)を確認中…"
npx playwright install chromium >/dev/null 2>&1

if [ -f doc.json ]; then echo "doc.json を反映します（編集内容で書き出し）"; else echo "doc.json なし → 初期内容で書き出します"; fi

URL="http://localhost:5173"
STARTED=""
if ! curl -s "$URL" >/dev/null 2>&1; then
  echo "プレビュー用サーバを一時起動…"
  npm run dev >/tmp/jack12_export_dev.log 2>&1 &
  DEVPID=$!
  STARTED=1
  for i in $(seq 1 40); do curl -s "$URL" >/dev/null 2>&1 && break; sleep 0.5; done
fi

echo ""
npm run export
RET=$?

[ -n "$STARTED" ] && kill "$DEVPID" >/dev/null 2>&1

echo ""
if [ "$RET" -eq 0 ]; then
  echo "✓ 完了しました。出力フォルダを開きます。"
  open "$DIR/output/editor"
else
  echo "✗ 書き出しに失敗しました。ログ: /tmp/jack12_export_dev.log"
fi
echo ""
read -n1 -p "Enterで閉じます"
