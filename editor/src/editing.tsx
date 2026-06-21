import React, { createContext, useContext, useEffect, useRef } from "react";
import type { Doc, Focal, Output } from "./types";
import { getPath, setPath, assetUrl, Path } from "./util";
import { Resizable } from "./components/Resizable";

export interface Selection { kind: "photo" | "freeText" | "none"; filePath?: Path; focalPath?: Path; itemPath?: Path; label?: string }

export interface GridState { on: boolean; size: number; snap: boolean }
interface Ctx {
  doc: Doc;
  update: (path: Path, value: any) => void;
  selection: Selection;
  setSelection: (s: Selection) => void;
  editable: boolean;
  grid: GridState;
  freeSel: { output: Output; ids: string[] };
  setFreeSel: (f: { output: Output; ids: string[] }) => void;
}
const DocCtx = createContext<Ctx | null>(null);
export const useDoc = () => {
  const c = useContext(DocCtx);
  if (!c) throw new Error("DocCtx missing");
  return c;
};
export const DocProvider = DocCtx.Provider;

/** キャレットを飛ばさずに編集できる contentEditable テキスト */
export function EditableText({
  value, onChange, className, style, as = "span", editable = true,
}: {
  value: string; onChange: (v: string) => void; className?: string;
  style?: React.CSSProperties; as?: any; editable?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const focused = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (el && !focused.current && el.innerText !== value) el.innerText = value;
  });
  const Tag: any = as;
  return (
    <Tag
      ref={ref}
      className={className}
      style={style}
      contentEditable={editable}
      suppressContentEditableWarning
      spellCheck={false}
      onFocus={() => (focused.current = true)}
      onBlur={(e: any) => { focused.current = false; onChange(e.currentTarget.innerText); }}
      onInput={(e: any) => onChange(e.currentTarget.innerText)}
    />
  );
}

/** doc の path にバインドした編集テキスト */
export function Field({ path, className, style, as }: { path: Path; className?: string; style?: React.CSSProperties; as?: any }) {
  const { doc, update, editable } = useDoc();
  const value = (getPath(doc, path) ?? "") as string;
  return <EditableText value={value} onChange={(v) => update(path, v)} className={className} style={style} as={as} editable={editable} />;
}

/** 写真。ドラッグで焦点(object-position)を調整、ホバーで「写真を変更」 */
export function PhotoBox({
  file, focal, focalPath, onSelect, className, style, radius = 0, fill = false,
}: {
  file: string; focal: Focal; focalPath: Path; onSelect?: () => void;
  className?: string; style?: React.CSSProperties; radius?: number; fill?: boolean;
}) {
  const { update, editable, grid } = useDoc();
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ ox: number; oy: number; fx: number; fy: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!editable) return;
    const rect = boxRef.current!.getBoundingClientRect();
    drag.current = { ox: e.clientX, oy: e.clientY, fx: focal.x, fy: focal.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
    (boxRef.current as any)._rect = rect;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const rect = (boxRef.current as any)._rect as DOMRect;
    const dx = (e.clientX - drag.current.ox) / rect.width;
    const dy = (e.clientY - drag.current.oy) / rect.height;
    let nx = Math.min(1, Math.max(0, drag.current.fx - dx));
    let ny = Math.min(1, Math.max(0, drag.current.fy - dy));
    if (grid.on && grid.snap && boxRef.current) {
      const w = boxRef.current.offsetWidth, h = boxRef.current.offsetHeight;
      if (w && h) {
        nx = Math.min(1, Math.max(0, Math.round((nx * w) / grid.size) * grid.size / w));
        ny = Math.min(1, Math.max(0, Math.round((ny * h) / grid.size) * grid.size / h));
      }
    }
    update(focalPath, { x: nx, y: ny });
  };
  const onPointerUp = () => { drag.current = null; };

  return (
    <div
      ref={boxRef}
      className={"photo " + (className || "")}
      style={{ ...style, ...(fill ? { height: "100%", width: "100%" } : {}), borderRadius: radius, cursor: editable ? "grab" : "default" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <img
        src={assetUrl(file)}
        draggable={false}
        style={{ objectPosition: `${focal.x * 100}% ${focal.y * 100}%` }}
        alt=""
      />
      {editable && onSelect && (
        <button className="photo-pick" onPointerDown={(e) => e.stopPropagation()} onClick={onSelect}>
          写真を変更
        </button>
      )}
    </div>
  );
}

/** ImageCard（写真＋キャプション）をまとめて編集 */
export function PicCard({ path, className, radius = 24, captionClass = "cap", defH = 440 }: { path: Path; className?: string; radius?: number; captionClass?: string; defH?: number }) {
  const { doc, setSelection } = useDoc();
  const card = getPath(doc, path);
  return (
    <figure className={"piccard " + (className || "")}>
      <Resizable id={path.join(".") + ".h"} def={defH}>
        <PhotoBox
          file={card.file}
          focal={card.focal}
          focalPath={[...path, "focal"]}
          onSelect={() => setSelection({ kind: "photo", filePath: [...path, "file"], focalPath: [...path, "focal"], label: card.caption })}
          radius={radius}
          fill
        />
      </Resizable>
      <Field path={[...path, "caption"]} className={captionClass} />
    </figure>
  );
}
