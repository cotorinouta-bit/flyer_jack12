// 共有ロジック: パス操作・テキスト抽出・Markdown 入出力（差し替え）。
export type Seg = string | number;
export type AnyObj = Record<string, any>;

export function parsePath(p: string): Seg[] {
  return p
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter((s) => s.length > 0)
    .map((s) => (/^\d+$/.test(s) ? Number(s) : s));
}
export function getAt(obj: any, segs: Seg[]): any {
  return segs.reduce((o, k) => (o == null ? o : o[k]), obj);
}
export function setAt(obj: any, segs: Seg[], value: any): void {
  let o = obj;
  for (let i = 0; i < segs.length - 1; i++) {
    o = o[segs[i]];
    if (o == null) throw new Error(`パスが存在しません: ${segs.slice(0, i + 1).join(".")}`);
  }
  o[segs[segs.length - 1]] = value;
}

// 配色・写真ファイル名は対象外（テキストのみ）
const SKIP_KEYS = new Set(["tokens", "file", "crest", "heroPhoto", "id", "free", "sizes"]);
export function flattenText(doc: AnyObj): { path: string; value: string }[] {
  const out: { path: string; value: string }[] = [];
  const walk = (node: any, trail: Seg[]) => {
    if (typeof node === "string") { out.push({ path: trail.join("."), value: node }); return; }
    if (Array.isArray(node)) { node.forEach((v, i) => walk(v, [...trail, i])); return; }
    if (node && typeof node === "object") {
      for (const k of Object.keys(node)) {
        if (SKIP_KEYS.has(k)) continue;
        walk(node[k], [...trail, k]);
      }
    }
  };
  walk(doc, []);
  return out;
}

// ===== Markdown 入出力 =====
const GROUP_LABELS: Record<string, string> = {
  "scroll.elegant": "縦長スクロール ─ 上品(elegant)",
  "scroll.passion": "縦長スクロール ─ 熱量(passion)",
  "flyer.elegant": "A4チラシ ─ 上品(elegant)",
  "flyer.passion": "A4チラシ ─ 熱量(passion)",
  eyebrow: "共通ラベル", scrollMission: "共通ラベル", flyerMissionLabel: "共通ラベル", flyerMissionText: "共通ラベル",
  forImage: "画像キャプション", mediaImages: "画像キャプション",
  scrollProgramTitle: "プログラム見出し(縦長)", scrollProgramIntro: "プログラム見出し(縦長)", flyerCardsTitle: "プログラム見出し(A4)",
  programs: "プログラム(縦長カード)", flyerCards: "プログラム(A4カード)",
  mediaTitle: "実績(MEDIA & STAGE)", mediaIntro: "実績(MEDIA & STAGE)", mediaBullets: "実績(MEDIA & STAGE)",
  valueTitle: "経営に活きる価値", valueIntro: "経営に活きる価値", valueBullets: "経営に活きる価値",
  profileTitle: "プロフィール(縦長)", profileName: "プロフィール(縦長)", profileRole: "プロフィール(縦長)", profileBody: "プロフィール(縦長)",
  trust: "信頼の根拠(TRUST)",
  flyerProfile: "プロフィール(A4)", band: "実績バンド(A4)",
  footerLabel: "フッター", footerNote: "フッター", disclaimer: "注意書き",
};
function groupKeyFor(p: string): string {
  const segs = p.split(".");
  const two = segs.slice(0, 2).join(".");
  if (GROUP_LABELS[two]) return two;
  if (GROUP_LABELS[segs[0]]) return segs[0];
  return segs[0];
}

export function toMarkdown(doc: AnyObj, area?: string): string {
  let fields = flattenText(doc);
  if (area) fields = fields.filter((f) => f.path.startsWith(area));
  const out: string[] = [
    "# JACK12 フライヤー 原稿（Markdown）",
    "",
    "<!-- 使い方: 各 `### パス` の下の本文だけを編集してください。パス行は変更しないこと。",
    "     編集後に flyer_apply_markdown（MCP）または `npm run md:import` で差し替わります。 -->",
  ];
  let cur = "";
  for (const f of fields) {
    const g = groupKeyFor(f.path);
    const label = GROUP_LABELS[g] || g;
    if (label !== cur) { cur = label; out.push("", "## " + label); }
    out.push("", "### " + f.path, "", f.value);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export interface ApplyResult {
  changed: number;
  unknown: string[];   // doc に無いパス
  nonText: string[];   // テキストでないパス
  diffs: { path: string; before: string; after: string }[];
}
export function fromMarkdown(md: string, doc: AnyObj): ApplyResult {
  const res: ApplyResult = { changed: 0, unknown: [], nonText: [], diffs: [] };
  let cur: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (cur !== null) {
      const val = buf.join("\n").trim();
      const segs = parsePath(cur);
      const before = getAt(doc, segs);
      if (typeof before !== "string") res.nonText.push(cur);
      else if (before !== val) { setAt(doc, segs, val); res.changed++; res.diffs.push({ path: cur, before, after: val }); }
    }
    buf = [];
  };
  for (const line of md.split(/\r?\n/)) {
    const m = line.match(/^###\s+(.+?)\s*$/);
    if (m) {
      flush();
      const p = m[1].trim();
      const v = getAt(doc, parsePath(p));
      if (typeof v === "string") cur = p;
      else { cur = null; res.unknown.push(p); }
      continue;
    }
    if (/^#{1,2}\s+/.test(line) || /^\s*<!--/.test(line)) { flush(); cur = null; continue; }
    if (cur !== null) buf.push(line);
  }
  flush();
  return res;
}
