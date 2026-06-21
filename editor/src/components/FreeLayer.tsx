import React from "react";
import type { Output } from "../types";
import { useDoc, Field } from "../editing";
import { assetUrl, getPath } from "../util";

function scaleOf(): number {
  const el = document.getElementById("canvas-root");
  if (!el) return 1;
  const s = el.getBoundingClientRect().width / el.offsetWidth;
  return s > 0 ? s : 1;
}

export function FreeLayer({ output }: { output: Output }) {
  const { doc } = useDoc();
  const items = (doc.free && doc.free[output]) || [];
  return <>{items.map((it, i) => <FreeItemView key={it.id} output={output} index={i} />)}</>;
}

function FreeItemView({ output, index }: { output: Output; index: number }) {
  const { doc, update, editable, grid, selection, setSelection, freeSel, setFreeSel } = useDoc();
  const arr = doc.free[output];
  const it = arr[index];
  const isText = it.type === "text";
  const base = ["free", output, index] as (string | number)[];
  const snap = (v: number) => (grid.on && grid.snap ? Math.round(v / grid.size) * grid.size : Math.round(v));
  const setItem = (patch: Partial<typeof it>) => update(base, { ...it, ...patch });
  const selPhoto = selection.kind === "photo" && selection.filePath?.join(".") === [...base, "file"].join(".");
  const selText = selection.kind === "freeText" && selection.itemPath?.join(".") === base.join(".");
  const inSel = freeSel.output === output && freeSel.ids.includes(it.id);
  const isAnchor = freeSel.output === output && freeSel.ids.length > 1 && freeSel.ids[0] === it.id;

  const toggleMulti = () => {
    const cur = freeSel.output === output ? freeSel.ids : [];
    const ids = cur.includes(it.id) ? cur.filter((x) => x !== it.id) : [...cur, it.id];
    setFreeSel({ output, ids });
  };
  const isMulti = (e: React.PointerEvent) => e.shiftKey || e.metaKey || e.ctrlKey;

  const startMove = (e: React.PointerEvent) => {
    if (!editable) return;
    e.preventDefault(); e.stopPropagation();
    if (isMulti(e)) { toggleMulti(); return; }
    const group = freeSel.output === output && freeSel.ids.length > 1 && freeSel.ids.includes(it.id);
    if (!group) { setFreeSel({ output, ids: [it.id] }); select(); }
    const moveIds = group ? freeSel.ids : [it.id];
    const bases = moveIds.map((id) => { const o = arr.find((x) => x.id === id)!; return { id, x: o.x, y: o.y }; });
    const sc = scaleOf(), ox = e.clientX, oy = e.clientY;
    const mv = (ev: PointerEvent) => {
      const dx = (ev.clientX - ox) / sc, dy = (ev.clientY - oy) / sc;
      update(["free", output], arr.map((o) => {
        const b = bases.find((x) => x.id === o.id);
        return b ? { ...o, x: snap(b.x + dx), y: snap(b.y + dy) } : o;
      }));
    };
    const up = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); document.body.style.cursor = ""; };
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); document.body.style.cursor = "move";
  };
  const startResize = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const sc = scaleOf(), ox = e.clientX, oy = e.clientY, bw = it.w, bh = it.h;
    const mv = (ev: PointerEvent) => {
      const w = Math.max(40, snap(bw + (ev.clientX - ox) / sc));
      if (isText) setItem({ w });
      else setItem({ w, h: Math.max(40, snap(bh + (ev.clientY - oy) / sc)) });
    };
    const up = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); document.body.style.cursor = ""; };
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); document.body.style.cursor = "nwse-resize";
  };
  const select = () => isText
    ? setSelection({ kind: "freeText", itemPath: base, label: "配置したテキスト" })
    : setSelection({ kind: "photo", filePath: [...base, "file"], focalPath: [...base, "focal"], label: "配置した写真" });
  const reorder = (to: "front" | "back") => {
    const a = [...arr]; const [m] = a.splice(index, 1);
    if (to === "front") a.push(m); else a.unshift(m);
    update(["free", output], a);
    const ni = to === "front" ? a.length - 1 : 0;
    setSelection(isText ? { kind: "freeText", itemPath: ["free", output, ni] } : { kind: "photo", filePath: ["free", output, ni, "file"], focalPath: ["free", output, ni, "focal"] });
  };
  const del = (e: React.MouseEvent) => { e.stopPropagation(); update(["free", output], arr.filter((_, j) => j !== index)); setSelection({ kind: "none" }); };
  const stop = (e: React.PointerEvent) => e.stopPropagation();

  const buttons = editable && (
    <>
      <button className="free-btn free-front" onPointerDown={stop} onClick={(e) => { e.stopPropagation(); reorder("front"); }} title="前面へ">⤒</button>
      <button className="free-btn free-back" onPointerDown={stop} onClick={(e) => { e.stopPropagation(); reorder("back"); }} title="背面へ">⤓</button>
      <button className="free-btn free-del" onPointerDown={stop} onClick={del} title="削除">✕</button>
      <div className="free-resize" onPointerDown={startResize} title="ドラッグでサイズ変更" />
    </>
  );

  if (isText) {
    return (
      <div data-fid={it.id}
        className={"free-item free-text" + (editable ? " editable" : "") + (selText ? " sel" : "") + (freeSel.ids.length > 1 && inSel ? " msel" : "") + (isAnchor ? " anchor" : "")}
        style={{ left: it.x, top: it.y, width: it.w, zIndex: 40 + index }}
        onPointerDown={(e) => { if (!editable) return; if (isMulti(e)) { e.stopPropagation(); toggleMulti(); return; } setFreeSel({ output, ids: [it.id] }); select(); }}>
        <Field path={[...base, "text"]} as="div" className="free-text-body"
          style={{ fontSize: it.fontSize ?? 28, color: it.color ?? "#1C1918", textAlign: (it.align ?? "left") as any, fontWeight: it.weight ?? 700, lineHeight: it.lineHeight ?? 1.5, fontFamily: it.family === "serif" ? "var(--font-s)" : "var(--font-g)" }} />
        {editable && <div className="free-move" onPointerDown={startMove} title="ドラッグで移動">⠿</div>}
        {buttons}
      </div>
    );
  }
  return (
    <div data-fid={it.id}
      className={"free-item" + (editable ? " editable" : "") + (selPhoto ? " sel" : "") + (freeSel.ids.length > 1 && inSel ? " msel" : "") + (isAnchor ? " anchor" : "")}
      style={{ left: it.x, top: it.y, width: it.w, height: it.h, zIndex: 40 + index }} onPointerDown={startMove}>
      <img src={assetUrl(it.file || "")} draggable={false} alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${(it.focal?.x ?? 0.5) * 100}% ${(it.focal?.y ?? 0.5) * 100}%`, display: "block", borderRadius: it.radius ?? 8 }} />
      {editable && <button className="free-btn free-pick" onPointerDown={stop} onClick={(e) => { e.stopPropagation(); select(); }}>写真</button>}
      {buttons}
    </div>
  );
}
