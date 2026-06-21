import React, { useRef } from "react";
import { useDoc } from "../editing";

// キャンバスの表示倍率（transform: scale）を取得し、ドラッグ量を実寸へ補正
function canvasScale(): number {
  const el = document.getElementById("canvas-root");
  if (!el) return 1;
  const s = el.getBoundingClientRect().width / el.offsetWidth;
  return s > 0 ? s : 1;
}

export function sizeStyle(sizes: Record<string, number> | undefined, id: string, mode: "height" | "minHeight"): React.CSSProperties {
  const v = sizes?.[id];
  if (!v) return {};
  return mode === "minHeight" ? { minHeight: v } : { height: v };
}

// 共通のドラッグ開始（window監視方式）。base から実寸補正した高さを doc.sizes[id] に反映。snapはグリッド吸着。
function startDrag(e: React.PointerEvent, base: number, min: number, apply: (v: number) => void, snap: (v: number) => number) {
  e.preventDefault(); e.stopPropagation();
  const oy = e.clientY;
  const sc = canvasScale();
  const onMove = (ev: PointerEvent) => apply(Math.max(min, Math.round(snap(base + (ev.clientY - oy) / sc))));
  const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); document.body.style.cursor = ""; };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  document.body.style.cursor = "row-resize";
}

// 既存要素（ヒーロー/文字箱）の下辺ハンドル。親要素の高さ/最小高さを doc.sizes[id] で制御。
export function BottomHandle({ id, min = 60 }: { id: string; min?: number }) {
  const { doc, update, editable, grid } = useDoc();
  const ref = useRef<HTMLDivElement>(null);
  if (!editable) return null;
  const snap = (v: number) => (grid.on && grid.snap ? Math.round(v / grid.size) * grid.size : v);
  const down = (e: React.PointerEvent) => {
    const parent = ref.current?.parentElement as HTMLElement | null;
    const base = (doc.sizes || {})[id] ?? (parent ? parent.offsetHeight : 100);
    startDrag(e, base, min, (v) => update(["sizes", id], v), snap);
  };
  const reset = (e: React.MouseEvent) => { e.stopPropagation(); const s = { ...(doc.sizes || {}) }; delete s[id]; update(["sizes"], s); };
  return <div ref={ref} className="rz-handle" title="ドラッグで高さ／ダブルクリックで既定に戻す" onPointerDown={down} onDoubleClick={reset} />;
}

// 写真枠ラッパー。明示的な高さ(def or override)を持ち、中の写真をフィットさせる。
export function Resizable({ id, def, min = 40, className, children }: { id: string; def: number; min?: number; className?: string; children: React.ReactNode }) {
  const { doc } = useDoc();
  const h = (doc.sizes || {})[id] ?? def;
  return (
    <div className={"rz " + (className || "")} style={{ height: h, position: "relative" }}>
      {children}
      <BottomHandle id={id} min={min} />
    </div>
  );
}

// セクション間の可変スペーサー（余白）。初期0、ドラッグで間隔を足せる。
export function GapResizer({ id }: { id: string }) {
  const { doc, update, editable, grid } = useDoc();
  const h = (doc.sizes || {})[id] ?? 0;
  if (!editable) return h ? <div style={{ height: h }} /> : null;
  const snap = (v: number) => (grid.on && grid.snap ? Math.round(v / grid.size) * grid.size : v);
  const down = (e: React.PointerEvent) => startDrag(e, h, 0, (v) => update(["sizes", id], v), snap);
  const reset = (e: React.MouseEvent) => { e.stopPropagation(); const s = { ...(doc.sizes || {}) }; delete s[id]; update(["sizes"], s); };
  return (
    <div className="gap-rz" style={{ height: Math.max(14, h) }} onPointerDown={down} onDoubleClick={reset} title="ドラッグで余白を調整／ダブルクリックで戻す">
      <span className="gap-line" />
    </div>
  );
}
