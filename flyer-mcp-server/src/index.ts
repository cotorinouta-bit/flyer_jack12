#!/usr/bin/env node
/**
 * flyer-mcp-server — JACK12 フライヤーを編集・書き出しする MCP サーバ。
 *
 * 単一ソース: editor/doc.json（WYSIWYGエディタと共有）。
 * テキスト/写真/配色を編集し、A4・縦長スクロール（上品/熱量）を PDF/PNG に書き出す。
 * 書き出し・プレビューは editor/scripts の Playwright スクリプトを再利用する。
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parsePath, getAt, setAt, flattenText, toMarkdown, fromMarkdown, type Seg, type AnyObj } from "./lib.js";

// ===== パス =====
const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url)); // src or dist
const SERVER_ROOT = path.resolve(SERVER_DIR, "..");              // flyer-mcp-server
const ROOT = path.resolve(SERVER_ROOT, "..");                   // プロジェクト直下
const EDITOR = path.join(ROOT, "editor");
const OUTPUT_DIR = path.join(ROOT, "output", "editor");
const DOC_PATH = path.join(EDITOR, "doc.json");
const INITIAL_PATH = path.join(SERVER_ROOT, "data", "initialDoc.json");
const ASSETS_PATH = path.join(EDITOR, "src", "data", "assets.json");
const DEV_URL = "http://localhost:5173";
const DEV_PORT = 5173;
const CHARACTER_LIMIT = 25000;

// ===== doc I/O =====
function loadDoc(): AnyObj {
  if (!fs.existsSync(DOC_PATH)) {
    if (!fs.existsSync(INITIAL_PATH)) throw new Error(`初期データがありません。先に flyer-mcp-server で 'npm run seed' を実行してください。`);
    fs.copyFileSync(INITIAL_PATH, DOC_PATH);
  }
  return JSON.parse(fs.readFileSync(DOC_PATH, "utf-8"));
}
function saveDoc(doc: AnyObj): void {
  fs.writeFileSync(DOC_PATH, JSON.stringify(doc, null, 2));
}
function loadAssets(): string[] {
  return JSON.parse(fs.readFileSync(ASSETS_PATH, "utf-8")) as string[];
}

// ===== photo slots =====
interface Slot { id: string; filePath: Seg[]; focalPath: Seg[] | null; }
function photoSlots(doc: AnyObj): Slot[] {
  const s: Slot[] = [
    { id: "hero-scroll", filePath: ["heroPhoto"], focalPath: ["heroFocalScroll"] },
    { id: "hero-flyer", filePath: ["heroPhoto"], focalPath: ["heroFocalFlyer"] },
    { id: "crest", filePath: ["crest"], focalPath: null },
    { id: "for-image", filePath: ["forImage", "file"], focalPath: ["forImage", "focal"] },
  ];
  (doc.mediaImages || []).forEach((_: any, i: number) =>
    s.push({ id: `media-${i}`, filePath: ["mediaImages", i, "file"], focalPath: ["mediaImages", i, "focal"] }));
  (doc.trust || []).forEach((ts: any, ti: number) => {
    (ts.pairs || []).forEach((_: any, pi: number) => {
      for (const side of ["left", "right"]) {
        s.push({ id: `trust-${ti}-pair-${pi}-${side}`, filePath: ["trust", ti, "pairs", pi, side, "file"], focalPath: ["trust", ti, "pairs", pi, side, "focal"] });
      }
    });
    (ts.wide || []).forEach((_: any, wi: number) =>
      s.push({ id: `trust-${ti}-wide-${wi}`, filePath: ["trust", ti, "wide", wi, "file"], focalPath: ["trust", ti, "wide", wi, "focal"] }));
  });
  (doc.flyerProfile?.thumbs || []).forEach((_: any, i: number) =>
    s.push({ id: `flyer-thumb-${i}`, filePath: ["flyerProfile", "thumbs", i, "file"], focalPath: ["flyerProfile", "thumbs", i, "focal"] }));
  (doc.band?.thumbs || []).forEach((_: any, i: number) =>
    s.push({ id: `band-thumb-${i}`, filePath: ["band", "thumbs", i, "file"], focalPath: ["band", "thumbs", i, "focal"] }));
  return s;
}
function slotInfo(doc: AnyObj, slot: Slot) {
  const file = getAt(doc, slot.filePath);
  const focal = slot.focalPath ? getAt(doc, slot.focalPath) : null;
  let caption: string | undefined;
  if (slot.filePath[slot.filePath.length - 1] === "file") {
    const capPath = [...slot.filePath.slice(0, -1), "caption"];
    const c = getAt(doc, capPath);
    if (typeof c === "string") caption = c;
  }
  return { id: slot.id, file, focal, caption };
}

// ===== color keys =====
const COLOR_KEYS = {
  primary: ["primary"], label: ["label"], divider: ["divider"], h1: ["h1"],
  boxBg: ["boxBg"], boxAccent: ["boxAccent"], gold: ["gold"],
  paper: ["paper"], ink: ["ink"], soft: ["soft"], muted: ["muted"], cream: ["cream"],
  cardAccent1: ["cardAccents", 0], cardAccent2: ["cardAccents", 1], cardAccent3: ["cardAccents", 2],
} as const;
type ColorKey = keyof typeof COLOR_KEYS;
const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// ===== dev server + scripts =====
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function isPortOpen(port: number): Promise<boolean> {
  return new Promise((res) => {
    const s = net.connect({ port, host: "127.0.0.1" });
    s.on("connect", () => { s.destroy(); res(true); });
    s.on("error", () => res(false));
    s.setTimeout(700, () => { s.destroy(); res(false); });
  });
}
async function ensureVite(): Promise<{ base: string; stop: () => void }> {
  if (await isPortOpen(DEV_PORT)) return { base: DEV_URL, stop: () => {} };
  const child = spawn("npm", ["run", "dev"], { cwd: EDITOR, stdio: "ignore", detached: true });
  for (let i = 0; i < 60; i++) { if (await isPortOpen(DEV_PORT)) break; await sleep(500); }
  if (!(await isPortOpen(DEV_PORT))) {
    try { if (child.pid) process.kill(-child.pid); } catch {}
    throw new Error("プレビュー用サーバ(vite)の起動に失敗しました。editor で 'npm install' 済みか確認してください。");
  }
  return { base: DEV_URL, stop: () => { try { if (child.pid) process.kill(-child.pid); } catch {} } };
}
function runScript(scriptRel: string, env: Record<string, string>): Promise<{ code: number | null; out: string; err: string }> {
  return new Promise((resolve) => {
    const p = spawn("node", [scriptRel], { cwd: EDITOR, env: { ...process.env, ...env } });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d.toString()));
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) => resolve({ code, out, err }));
  });
}

// ===== responses =====
function jsonResult(obj: any) {
  let text = JSON.stringify(obj, null, 2);
  if (text.length > CHARACTER_LIMIT) text = text.slice(0, CHARACTER_LIMIT) + "\n…(truncated)";
  return { content: [{ type: "text" as const, text }], structuredContent: obj };
}
function errResult(msg: string) {
  return { content: [{ type: "text" as const, text: "Error: " + msg }], isError: true };
}

const TONES = ["elegant", "passion"] as const;
const OUTPUTS = ["scroll", "flyer"] as const;

// ===== server =====
const server = new McpServer({ name: "flyer-mcp-server", version: "1.0.0" });

server.registerTool("flyer_list_text", {
  title: "テキスト一覧",
  description: `チラシの編集可能な全テキストを path と現在値の一覧で返す（読み取り専用）。配色や写真ファイル名は含まない。
Args: area(任意, パス接頭辞での絞り込み 例 "scroll.elegant" / "flyerCards" / "trust.1"), contains(任意, 値の部分一致).
Returns: { count, fields: [{ path, value }] }  path は flyer_set_text で使う。`,
  inputSchema: { area: z.string().optional().describe('パス接頭辞フィルタ 例 "scroll.passion"'), contains: z.string().optional().describe("値の部分一致フィルタ") },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
}, async ({ area, contains }) => {
  try {
    let fields = flattenText(loadDoc());
    if (area) fields = fields.filter((f) => f.path.startsWith(area));
    if (contains) fields = fields.filter((f) => f.value.includes(contains));
    return jsonResult({ count: fields.length, fields });
  } catch (e) { return errResult(String(e)); }
});

server.registerTool("flyer_set_text", {
  title: "テキスト変更",
  description: `指定 path のテキストを書き換える。path は flyer_list_text で得たものを使う（例 "scroll.elegant.h1", "flyerCards.2.desc", "trust.0.bullets.1.body"）。
改行は \\n を含めてよい。値の前後の空白は保持。対象が文字列でない path はエラー。`,
  inputSchema: { path: z.string().min(1).describe('テキストの path 例 "scroll.elegant.h1"'), value: z.string().describe("新しいテキスト") },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
}, async ({ path: p, value }) => {
  try {
    const doc = loadDoc();
    const segs = parsePath(p);
    const cur = getAt(doc, segs);
    if (typeof cur !== "string") return errResult(`path "${p}" はテキストではありません（現在: ${typeof cur}）。flyer_list_text で確認してください。`);
    setAt(doc, segs, value);
    saveDoc(doc);
    return jsonResult({ ok: true, path: p, before: cur, after: value });
  } catch (e) { return errResult(String(e)); }
});

server.registerTool("flyer_list_photos", {
  title: "写真スロット一覧",
  description: `チラシ内の写真スロットを返す（読み取り専用）。各スロットは id / 現在のファイル / 焦点(focal x,y 0..1) / キャプション。
id は flyer_set_photo で使う（例 "hero-scroll", "flyer-thumb-2", "trust-1-pair-0-left"）。`,
  inputSchema: {},
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
}, async () => {
  try {
    const doc = loadDoc();
    const slots = photoSlots(doc).map((s) => slotInfo(doc, s));
    return jsonResult({ count: slots.length, slots });
  } catch (e) { return errResult(String(e)); }
});

server.registerTool("flyer_set_photo", {
  title: "写真の差し替え・トリミング",
  description: `写真スロットのファイルや焦点(トリミング位置)を変更する。id は flyer_list_photos のもの。
file を変えると別の写真に差し替え（flyer_list_assets のファイル名）。focalX/focalY(0..1)で表示位置を調整（顔が切れないように）。focal は 0.5,0.5 が中央。
Args: id(必須), file(任意), focalX(任意 0..1), focalY(任意 0..1)。`,
  inputSchema: {
    id: z.string().min(1).describe('写真スロットID 例 "hero-flyer"'),
    file: z.string().optional().describe("差し替えるファイル名 例 \"IMG_8240 2.JPG\""),
    focalX: z.number().min(0).max(1).optional().describe("焦点 左右 0..1"),
    focalY: z.number().min(0).max(1).optional().describe("焦点 上下 0..1"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
}, async ({ id, file, focalX, focalY }) => {
  try {
    const doc = loadDoc();
    const slot = photoSlots(doc).find((s) => s.id === id);
    if (!slot) return errResult(`写真スロット "${id}" が見つかりません。flyer_list_photos で確認してください。`);
    if (file !== undefined) {
      if (!loadAssets().includes(file)) return errResult(`ファイル "${file}" は素材にありません。flyer_list_assets で確認してください。`);
      setAt(doc, slot.filePath, file);
    }
    if (focalX !== undefined || focalY !== undefined) {
      if (!slot.focalPath) return errResult(`スロット "${id}" は焦点を持ちません。`);
      const cur = getAt(doc, slot.focalPath) || { x: 0.5, y: 0.5 };
      setAt(doc, slot.focalPath, { x: focalX ?? cur.x, y: focalY ?? cur.y });
    }
    saveDoc(doc);
    return jsonResult({ ok: true, slot: slotInfo(doc, slot) });
  } catch (e) { return errResult(String(e)); }
});

server.registerTool("flyer_list_assets", {
  title: "素材写真の一覧",
  description: `使用できる写真ファイル名の一覧（読み取り専用）。Args: filter(任意 部分一致), limit(既定100), offset(既定0)。
Returns: { total, count, offset, files, has_more, next_offset? }`,
  inputSchema: {
    filter: z.string().optional().describe("ファイル名の部分一致"),
    limit: z.number().int().min(1).max(200).default(100).describe("最大件数"),
    offset: z.number().int().min(0).default(0).describe("スキップ件数"),
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
}, async ({ filter, limit, offset }) => {
  try {
    let all = loadAssets();
    if (filter) all = all.filter((f) => f.includes(filter));
    const page = all.slice(offset, offset + limit);
    const hasMore = all.length > offset + page.length;
    return jsonResult({ total: all.length, count: page.length, offset, files: page, has_more: hasMore, ...(hasMore ? { next_offset: offset + page.length } : {}) });
  } catch (e) { return errResult(String(e)); }
});

server.registerTool("flyer_list_theme", {
  title: "テーマ配色の一覧",
  description: `2トーン(elegant/passion)の配色トークンを返す（読み取り専用）。色の変更は flyer_set_color。`,
  inputSchema: {},
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
}, async () => {
  try {
    const doc = loadDoc();
    return jsonResult({ tones: TONES, colorKeys: Object.keys(COLOR_KEYS), tokens: doc.tokens });
  } catch (e) { return errResult(String(e)); }
});

server.registerTool("flyer_set_color", {
  title: "配色の変更",
  description: `トーンごとの色を変更する。Args: tone(elegant|passion), key(色キー), value(#RRGGBB)。
色キー: ${Object.keys(COLOR_KEYS).join(", ")}`,
  inputSchema: {
    tone: z.enum(TONES).describe("トーン"),
    key: z.enum(Object.keys(COLOR_KEYS) as [ColorKey, ...ColorKey[]]).describe("色キー"),
    value: z.string().regex(HEX, "#RRGGBB 形式で指定").describe("色 例 #70161F"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
}, async ({ tone, key, value }) => {
  try {
    const doc = loadDoc();
    setAt(doc, ["tokens", tone, ...COLOR_KEYS[key as ColorKey]], value);
    saveDoc(doc);
    return jsonResult({ ok: true, tone, key, value });
  } catch (e) { return errResult(String(e)); }
});

server.registerTool("flyer_export", {
  title: "PDF/PNG 書き出し",
  description: `現在の doc.json から成果物を書き出す。各対象につき PDF・PNG・JPG の3形式を output/editor/ に出力（既定で4種＝A4×2トーン・縦長×2トーン）。
Args: outputs(任意 ["flyer","scroll"]), tones(任意 ["elegant","passion"]) で対象を絞れる。
時間がかかる場合あり（Chromium起動）。Returns: 生成ファイルの一覧。`,
  inputSchema: {
    outputs: z.array(z.enum(OUTPUTS)).optional().describe("出力種別の絞り込み"),
    tones: z.array(z.enum(TONES)).optional().describe("トーンの絞り込み"),
    formats: z.array(z.enum(["pdf", "png", "jpg"])).optional().describe('出力形式の絞り込み（既定は全形式 例 ["pdf"] / ["jpg","png"]）'),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
}, async ({ outputs, tones, formats }) => {
  let stop = () => {};
  try {
    const outs = outputs && outputs.length ? outputs : OUTPUTS;
    const tns = tones && tones.length ? tones : TONES;
    const fmts = formats && formats.length ? formats : ["pdf", "png", "jpg"];
    const combos: string[] = [];
    for (const o of outs) for (const t of tns) combos.push(`${o}:${t}`);
    const vite = await ensureVite(); stop = vite.stop;
    const r = await runScript("scripts/export.mjs", { BASE: vite.base, ONLY: combos.join(","), FORMATS: fmts.join(",") });
    stop();
    if (r.code !== 0) return errResult(`書き出し失敗 (code ${r.code})\n${r.err || r.out}`);
    const files = combos.map((c) => { const [o, t] = c.split(":"); return `output/editor/jack12_${o}_${t}`; })
      .flatMap((b) => fmts.map((f) => `${b}.${f}`))
      .filter((rel) => fs.existsSync(path.join(ROOT, rel)));
    return jsonResult({ ok: true, combos, formats: fmts, files, log: r.out.trim().split("\n").slice(-8) });
  } catch (e) { stop(); return errResult(String(e)); }
});

server.registerTool("flyer_preview", {
  title: "プレビュー画像",
  description: `指定の output(scroll|flyer) と tone をその場で描画し、画像で返す（編集結果の目視確認用）。
縦長は長いため上部のみのプレビューになる場合がある。Returns: 画像（小さければ inline）＋ 保存先パス。`,
  inputSchema: {
    output: z.enum(OUTPUTS).describe("出力種別"),
    tone: z.enum(TONES).describe("トーン"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
}, async ({ output, tone }) => {
  let stop = () => {};
  try {
    const outPath = path.join(OUTPUT_DIR, `_preview_${output}_${tone}.png`);
    const vite = await ensureVite(); stop = vite.stop;
    const env: Record<string, string> = { BASE: vite.base, OUTPUT: output, TONE: tone, OUT: outPath };
    if (output === "scroll") { env.CLIP = "1700"; env.SCALE = "1"; } else { env.SCALE = "1.5"; }
    const r = await runScript("scripts/render-one.mjs", env);
    stop();
    if (r.code !== 0 || !fs.existsSync(outPath)) return errResult(`プレビュー失敗\n${r.err || r.out}`);
    const buf = fs.readFileSync(outPath);
    const meta = { output, tone, path: path.relative(ROOT, outPath), bytes: buf.length, partial: output === "scroll" };
    const content: any[] = [{ type: "text", text: JSON.stringify(meta) }];
    if (buf.length < 2_600_000) content.push({ type: "image", data: buf.toString("base64"), mimeType: "image/png" });
    else content.push({ type: "text", text: "（画像が大きいため inline 省略。保存先パスを参照）" });
    return { content, structuredContent: meta };
  } catch (e) { stop(); return errResult(String(e)); }
});

server.registerTool("flyer_get_markdown", {
  title: "Markdown原稿の書き出し",
  description: `編集可能な全テキストを、読みやすい Markdown 原稿として返す（読み取り専用）。
各項目は "### パス" の見出し＋本文の形。これを編集して flyer_apply_markdown に渡すと差し替えできる。
Args: area(任意, パス接頭辞で範囲を絞る 例 "scroll.passion" / "flyerCards")。`,
  inputSchema: { area: z.string().optional().describe('範囲を絞るパス接頭辞 例 "flyer.elegant"') },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
}, async ({ area }) => {
  try {
    const md = toMarkdown(loadDoc(), area);
    return { content: [{ type: "text" as const, text: md }], structuredContent: { length: md.length, area: area ?? null } };
  } catch (e) { return errResult(String(e)); }
});

server.registerTool("flyer_apply_markdown", {
  title: "Markdown原稿で差し替え",
  description: `flyer_get_markdown と同じ形式の Markdown を受け取り、各 "### パス" の本文で該当テキストを差し替える。
本文だけ編集し、パス行(### …)は変えないこと。doc に無いパスや非テキストのパスは無視して報告する。
Returns: { changed, unknown, nonText, diffs } （changed=変更数）。`,
  inputSchema: { markdown: z.string().min(1).describe("get_markdown と同形式の Markdown 全文") },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
}, async ({ markdown }) => {
  try {
    const doc = loadDoc();
    const r = fromMarkdown(markdown, doc);
    if (r.changed > 0) saveDoc(doc);
    return jsonResult({
      changed: r.changed,
      unknown: r.unknown,
      nonText: r.nonText,
      diffs: r.diffs.slice(0, 30).map((d) => ({ path: d.path, after: d.after })),
    });
  } catch (e) { return errResult(String(e)); }
});

server.registerTool("flyer_reset", {
  title: "初期内容に戻す",
  description: `doc.json を初期内容（既定デザイン）に戻す。編集はすべて失われる（破壊的）。`,
  inputSchema: { confirm: z.literal(true).describe("true で実行") },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
}, async ({ confirm }) => {
  try {
    if (confirm !== true) return errResult("confirm:true が必要です。");
    if (!fs.existsSync(INITIAL_PATH)) return errResult("初期データがありません（npm run seed を実行）。");
    fs.copyFileSync(INITIAL_PATH, DOC_PATH);
    return jsonResult({ ok: true, message: "初期内容に戻しました。" });
  } catch (e) { return errResult(String(e)); }
});

// ===== run =====
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("flyer-mcp-server running (stdio)");
}
main().catch((e) => { console.error("Server error:", e); process.exit(1); });
