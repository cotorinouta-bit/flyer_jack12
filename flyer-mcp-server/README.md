# flyer-mcp-server

JACK12 フライヤーを **MCP（Model Context Protocol）経由で編集・書き出し**できるサーバです。Claude などの MCP クライアントから、ツールでチラシの文言・写真・配色を変更し、A4 / 縦長スクロールを PDF / PNG に書き出せます。

単一ソース＝ `editor/doc.json`（WYSIWYGエディタと共有）。MCPで編集 → エディタで開いても同じ、エディタで「保存(JSON)」→ MCPからも反映、と双方向に使えます。

## 提供ツール

| ツール | 種別 | 説明 |
|---|---|---|
| `flyer_list_text` | 読取 | 編集可能な全テキストを path と値で一覧（area / contains で絞り込み） |
| `flyer_set_text` | 編集 | 指定 path のテキストを変更 |
| `flyer_list_photos` | 読取 | 写真スロット（id / file / focal / caption）一覧 |
| `flyer_set_photo` | 編集 | 写真の差し替え（file）・トリミング（focalX/Y） |
| `flyer_list_assets` | 読取 | 使用できる写真ファイル一覧（filter / ページング） |
| `flyer_list_theme` | 読取 | 2トーンの配色トークン一覧 |
| `flyer_set_color` | 編集 | トーン別の色を変更（#RRGGBB） |
| `flyer_get_markdown` | 読取 | 全テキストを **Markdown原稿** で書き出し（area で範囲指定可） |
| `flyer_apply_markdown` | 編集 | 編集済み **Markdownで一括差し替え**（該当項目のみ更新・差分を報告） |
| `flyer_export` | 実行 | PDF/PNG を `output/editor/` に書き出し（outputs / tones で絞り込み可） |
| `flyer_preview` | 実行 | 指定 output×tone を描画して**画像で返す**（目視確認用） |
| `flyer_reset` | 破壊 | doc.json を初期内容へ戻す |

## セットアップ

```bash
cd flyer-mcp-server
npm install
npm run seed     # 初期 doc を生成（editor/doc.json と data/initialDoc.json）
npm run build    # dist/index.js を生成
```

※ `flyer_export` / `flyer_preview` は内部で editor の Vite と Playwright(Chromium) を使います。先に `cd ../editor && npm install` と Chromium 取得（`npx playwright install chromium`）が必要です（エディタを一度使っていれば済んでいます）。

## クライアントへの登録

### Claude Code
次のコマンドで登録（最も簡単・推奨）:

```bash
claude mcp add flyer -- node "/Users/hikaru/Downloads/jack12フライヤー制作/flyer-mcp-server/dist/index.js"
```

または、このフォルダ直下に `.mcp.json` を自分で作成（Claude Code がこのフォルダで自動認識）:

```json
{
  "mcpServers": {
    "flyer": {
      "command": "node",
      "args": ["/Users/hikaru/Downloads/jack12フライヤー制作/flyer-mcp-server/dist/index.js"]
    }
  }
}
```

### Claude Desktop
`~/Library/Application Support/Claude/claude_desktop_config.json` に追記:

```json
{
  "mcpServers": {
    "flyer": {
      "command": "node",
      "args": ["/Users/hikaru/Downloads/jack12フライヤー制作/flyer-mcp-server/dist/index.js"]
    }
  }
}
```

登録後にクライアントを再起動すると、上記ツールが使えるようになります。

## Markdown 原稿で編集（差し替え）

全テキストを 1 枚の Markdown として書き出し → 本文だけ編集 → 読み込んで差し替え、ができます。各項目は `### パス`（例 `### scroll.elegant.h1`）＋本文の形。**パス行は変更せず、本文だけ**編集してください。

```bash
npm run md:export   # → output/editor/flyer.md を書き出し（183項目）
#  flyer.md を好きなエディタで編集（本文だけ）
npm run md:import   # → 変更点だけ doc.json に差し替え
```

MCP からは `flyer_get_markdown`（取得）→ 編集 → `flyer_apply_markdown`（差し替え）。doc に無いパスや非テキストは無視して報告します。差し替え後に `flyer_export` で PDF/PNG を更新。

## 動作確認

```bash
npm run test:client   # 各ツールを順に呼んで挙動を確認（最後に初期化）
```

## メモ
- 破壊的なのは `flyer_reset` のみ。他は doc.json を更新するだけで安全。
- 厳密な CMYK 入稿は未対応（RGB PDF）。
