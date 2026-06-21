import React from "react";
import type { Tone } from "../types";
import { useDoc } from "../editing";
import { getPath, assetUrl } from "../util";
import assets from "../data/assets.json";

function Color({ label, path }: { label: string; path: (string | number)[] }) {
  const { doc, update } = useDoc();
  const v = getPath(doc, path) as string;
  return (
    <label className="rp-color">
      <span>{label}</span>
      <input type="color" value={v} onChange={(e) => update(path, e.target.value)} />
      <code>{v}</code>
    </label>
  );
}

function Range01({ label, path }: { label: string; path: (string | number)[] }) {
  const { doc, update } = useDoc();
  const v = getPath(doc, path) as number;
  return (
    <label className="rp-range">
      <span>{label}</span>
      <input type="range" min={0} max={1} step={0.01} value={v} onChange={(e) => update(path, +e.target.value)} />
      <code>{v.toFixed(2)}</code>
    </label>
  );
}

export function RightPanel({ tone }: { tone: Tone; setTone: (t: Tone) => void }) {
  const { doc, update, selection, setSelection, freeSel, setFreeSel } = useDoc();

  if (freeSel.ids.length >= 2) {
    const { output, ids } = freeSel;
    const list = doc.free?.[output] || [];
    const geo = (id: string) => {
      const el = document.querySelector(`[data-fid="${id}"]`) as HTMLElement | null;
      const it = list.find((x) => x.id === id);
      return { it, w: el ? el.offsetWidth : (it?.w || 0), h: el ? el.offsetHeight : (it?.h || 0) };
    };
    const align = (axis: "x" | "y", mode: "min" | "center" | "max") => {
      const a = geo(ids[0]); if (!a.it) return;
      const arr = list.map((it) => {
        if (it.id === ids[0] || !ids.includes(it.id)) return it;
        const g = geo(it.id);
        if (axis === "x") {
          const x = mode === "min" ? a.it!.x : mode === "center" ? a.it!.x + a.w / 2 - g.w / 2 : a.it!.x + a.w - g.w;
          return { ...it, x: Math.round(x) };
        }
        const y = mode === "min" ? a.it!.y : mode === "center" ? a.it!.y + a.h / 2 - g.h / 2 : a.it!.y + a.h - g.h;
        return { ...it, y: Math.round(y) };
      });
      update(["free", output], arr);
    };
    const distribute = (axis: "x" | "y") => {
      const sel = ids.map((id) => geo(id)).filter((g) => g.it);
      if (sel.length < 3) return;
      const sizeOf = (g: typeof sel[0]) => (axis === "x" ? g.w : g.h);
      const posOf = (g: typeof sel[0]) => (axis === "x" ? g.it!.x : g.it!.y);
      const sorted = [...sel].sort((a, b) => posOf(a) - posOf(b));
      const first = sorted[0], last = sorted[sorted.length - 1];
      const span = posOf(last) + sizeOf(last) - posOf(first);
      const sumSize = sorted.reduce((acc, g) => acc + sizeOf(g), 0);
      const gap = (span - sumSize) / (sorted.length - 1);
      let cursor = posOf(first);
      const np: Record<string, number> = {};
      for (const g of sorted) { np[g.it!.id] = Math.round(cursor); cursor += sizeOf(g) + gap; }
      update(["free", output], list.map((it) => np[it.id] !== undefined ? (axis === "x" ? { ...it, x: np[it.id] } : { ...it, y: np[it.id] }) : it));
    };
    const matchSize = (dim: "w" | "h" | "both") => {
      const a = geo(ids[0]); if (!a.it) return;
      update(["free", output], list.map((it) => {
        if (it.id === ids[0] || !ids.includes(it.id)) return it;
        const patch: any = {};
        if (dim !== "h") patch.w = Math.round(a.w);
        if (dim !== "w" && it.type !== "text") patch.h = Math.round(a.h);
        return { ...it, ...patch };
      }));
    };
    return (
      <aside className="rightpanel">
        <div className="rp-head">
          <b>位置合わせ（{ids.length}個）</b>
          <button onClick={() => setFreeSel({ output, ids: [] })}>解除</button>
        </div>
        <div className="rp-note">最初に選んだ枠が基準。Shift＋クリックで追加選択。</div>
        <div className="rp-section">
          <div className="rp-title">横方向（左右）</div>
          <div className="rp-btnrow">
            <button className="rp-tbtn" onClick={() => align("x", "min")}>左</button>
            <button className="rp-tbtn" onClick={() => align("x", "center")}>左右中央</button>
            <button className="rp-tbtn" onClick={() => align("x", "max")}>右</button>
          </div>
        </div>
        <div className="rp-section">
          <div className="rp-title">縦方向（上下）</div>
          <div className="rp-btnrow">
            <button className="rp-tbtn" onClick={() => align("y", "min")}>上</button>
            <button className="rp-tbtn" onClick={() => align("y", "center")}>上下中央</button>
            <button className="rp-tbtn" onClick={() => align("y", "max")}>下</button>
          </div>
        </div>
        {ids.length >= 3 && (
          <div className="rp-section">
            <div className="rp-title">等間隔に分布</div>
            <div className="rp-btnrow">
              <button className="rp-tbtn" onClick={() => distribute("x")}>横に等間隔</button>
              <button className="rp-tbtn" onClick={() => distribute("y")}>縦に等間隔</button>
            </div>
          </div>
        )}
        <div className="rp-section">
          <div className="rp-title">サイズをそろえる（基準に）</div>
          <div className="rp-btnrow">
            <button className="rp-tbtn" onClick={() => matchSize("w")}>幅</button>
            <button className="rp-tbtn" onClick={() => matchSize("h")}>高さ</button>
            <button className="rp-tbtn" onClick={() => matchSize("both")}>両方</button>
          </div>
        </div>
      </aside>
    );
  }

  if (selection.kind === "freeText" && selection.itemPath) {
    const ip = selection.itemPath;
    const it = getPath(doc, ip) as any;
    const set = (k: string, v: any) => update([...ip, k], v);
    const align = it.align ?? "left";
    return (
      <aside className="rightpanel">
        <div className="rp-head">
          <b>テキストの書式</b>
          <button onClick={() => setSelection({ kind: "none" })}>閉じる</button>
        </div>
        <div className="rp-note">プレビュー上の文字を直接クリックして入力。⠿で移動、角で幅変更。</div>
        <div className="rp-section">
          <div className="rp-title">フォント</div>
          <div className="rp-btnrow">
            <button className={"rp-tbtn" + (it.family !== "serif" ? " on" : "")} onClick={() => set("family", "gothic")}>ゴシック</button>
            <button className={"rp-tbtn" + (it.family === "serif" ? " on" : "")} onClick={() => set("family", "serif")}>明朝</button>
          </div>
        </div>
        <div className="rp-section">
          <div className="rp-title">サイズ・行間</div>
          <label className="rp-range"><span>サイズ</span><input type="range" min={10} max={120} step={1} value={it.fontSize ?? 28} onChange={(e) => set("fontSize", +e.target.value)} /><code>{it.fontSize ?? 28}</code></label>
          <label className="rp-range"><span>行間</span><input type="range" min={1} max={2.4} step={0.05} value={it.lineHeight ?? 1.5} onChange={(e) => set("lineHeight", +e.target.value)} /><code>{(it.lineHeight ?? 1.5).toFixed(2)}</code></label>
        </div>
        <div className="rp-section">
          <div className="rp-title">色・太さ・揃え</div>
          <label className="rp-color"><span>文字色</span><input type="color" value={it.color ?? "#1C1918"} onChange={(e) => set("color", e.target.value)} /><code>{it.color ?? "#1C1918"}</code></label>
          <div className="rp-btnrow" style={{ margin: "6px 0" }}>
            <button className={"rp-tbtn" + ((it.weight ?? 700) < 600 ? " on" : "")} onClick={() => set("weight", 400)}>標準</button>
            <button className={"rp-tbtn" + ((it.weight ?? 700) >= 600 ? " on" : "")} onClick={() => set("weight", 700)}>太字</button>
          </div>
          <div className="rp-btnrow">
            {(["left", "center", "right"] as const).map((a) => (
              <button key={a} className={"rp-tbtn" + (align === a ? " on" : "")} onClick={() => set("align", a)}>{a === "left" ? "左" : a === "center" ? "中央" : "右"}</button>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  if (selection.kind === "photo" && selection.filePath && selection.focalPath) {
    const current = getPath(doc, selection.filePath) as string;
    const focal = getPath(doc, selection.focalPath) as { x: number; y: number };
    return (
      <aside className="rightpanel">
        <div className="rp-head">
          <b>写真の調整</b>
          <button onClick={() => setSelection({ kind: "none" })}>閉じる</button>
        </div>
        <div className="rp-sub">{selection.label}</div>

        <div className="rp-section">
          <div className="rp-title">トリミング（焦点）</div>
          <Range01 label="左右" path={selection.focalPath.concat("x")} />
          <Range01 label="上下" path={selection.focalPath.concat("y")} />
          <div className="rp-note">プレビュー上で写真を直接ドラッグしても調整できます。顔が切れないように。</div>
        </div>

        <div className="rp-section">
          <div className="rp-title">写真を選ぶ（{assets.length}枚）</div>
          <div className="rp-gallery">
            {(assets as string[]).map((f) => (
              <button
                key={f}
                className={"rp-thumb " + (f === current ? "sel" : "")}
                title={f}
                onClick={() => update(selection.filePath!, f)}
              >
                <img src={assetUrl(f)} loading="lazy" alt="" />
              </button>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  // テーマ編集
  return (
    <aside className="rightpanel">
      <div className="rp-head"><b>テーマ・配色（{tone}）</b></div>
      <div className="rp-note">写真をクリックすると、その写真の差し替え・トリミングに切り替わります。文字はプレビュー上で直接クリックして編集できます。</div>

      <div className="rp-section">
        <div className="rp-title">配色</div>
        <Color label="メイン" path={["tokens", tone, "primary"]} />
        <Color label="ラベル" path={["tokens", tone, "label"]} />
        <Color label="罫線" path={["tokens", tone, "divider"]} />
        <Color label="見出し(ヒーロー)" path={["tokens", tone, "h1"]} />
        <Color label="締めボックス背景" path={["tokens", tone, "boxBg"]} />
        <Color label="締めボックス装飾" path={["tokens", tone, "boxAccent"]} />
        <Color label="ゴールド" path={["tokens", tone, "gold"]} />
        <Color label="紙(背景)" path={["tokens", tone, "paper"]} />
        <Color label="本文インク" path={["tokens", tone, "ink"]} />
        <Color label="補足グレー" path={["tokens", tone, "muted"]} />
      </div>

      <div className="rp-section">
        <div className="rp-title">カードのアクセント（3色）</div>
        <Color label="カード1" path={["tokens", tone, "cardAccents", 0]} />
        <Color label="カード2" path={["tokens", tone, "cardAccents", 1]} />
        <Color label="カード3" path={["tokens", tone, "cardAccents", 2]} />
      </div>

      <div className="rp-section">
        <div className="rp-title">写真の暗さ（オーバーレイ）</div>
        <Range01 label="縦長 上部" path={["tokens", tone, "scrollOverlayTop"]} />
        <Range01 label="縦長 全体" path={["tokens", tone, "scrollOverlayFull"]} />
        <Range01 label="A4 全体" path={["tokens", tone, "flyerOverlayFull"]} />
        <Range01 label="A4 左側" path={["tokens", tone, "flyerOverlayLeft"]} />
      </div>
    </aside>
  );
}
