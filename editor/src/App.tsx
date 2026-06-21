import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Doc, Tone, Output, Tokens } from "./types";
import { initialDoc } from "./data/doc";
import { DocProvider, Selection } from "./editing";
import { setPath, Path, assetUrl } from "./util";
import { Scroll } from "./components/Scroll";
import { Flyer } from "./components/Flyer";
import { FreeLayer } from "./components/FreeLayer";
import { RightPanel } from "./components/RightPanel";

const LS_KEY = "jack12doc.v1";
const PW_KEY = "jack12panelW";

function tokenVars(t: Tokens): React.CSSProperties {
  return {
    ["--paper" as any]: t.paper, ["--ink" as any]: t.ink, ["--soft" as any]: t.soft,
    ["--muted" as any]: t.muted, ["--gold" as any]: t.gold, ["--cream" as any]: t.cream,
    ["--primary" as any]: t.primary, ["--label" as any]: t.label, ["--divider" as any]: t.divider,
    ["--h1" as any]: t.h1, ["--box-bg" as any]: t.boxBg, ["--box-accent" as any]: t.boxAccent,
  };
}
const clone = (x: any) => JSON.parse(JSON.stringify(x));

function ChoiceIndex() {
  const base = import.meta.env.BASE_URL;
  const choices = [
    {
      title: "上品",
      desc: "落ち着いた信頼感で見せる縦長版",
      href: `${base}?render=1&output=scroll&tone=elegant`,
    },
    {
      title: "熱量",
      desc: "勢いと力強さで見せる縦長版",
      href: `${base}?render=1&output=scroll&tone=passion`,
    },
    {
      title: "両方を比較",
      desc: "上品と熱量を横に並べて確認",
      href: `${base}jack12_scroll_both.html`,
    },
  ];

  return (
    <main className="choice-page">
      <div
        className="choice-bg"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.72), rgba(0,0,0,.40)), url("${assetUrl("IMG_8274 2.JPG")}")` }}
      />
      <section className="choice-panel" aria-label="JACK12 表示選択">
        <p className="choice-eyebrow">JACK12 PEACE PROGRAM</p>
        <h1>表示する資料を選択</h1>
        <div className="choice-grid">
          {choices.map((choice) => (
            <a className="choice-card" href={choice.href} key={choice.title}>
              <span>{choice.title}</span>
              <small>{choice.desc}</small>
            </a>
          ))}
        </div>
        <a className="choice-edit" href={`${base}?edit=1`}>エディターを開く</a>
      </section>
    </main>
  );
}

export function App() {
  const params = new URLSearchParams(location.search);
  const renderMode = params.get("render") === "1";
  const editMode = params.get("edit") === "1";

  const [doc, setDoc] = useState<Doc>(() => {
    if (renderMode) return initialDoc;
    try {
      const s = localStorage.getItem(LS_KEY);
      if (s) { const d = JSON.parse(s); if (d && d.variants) { if (!d.free) d.free = { scroll: [], flyer: [] }; if (!d.sizes) d.sizes = {}; return d as Doc; } }
    } catch {}
    return initialDoc;
  });
  const [tone, setTone] = useState<Tone>((params.get("tone") as Tone) || "elegant");
  const [output, setOutput] = useState<Output>((params.get("output") as Output) || "scroll");
  const [variant, setVariant] = useState<string>(() => params.get("variant") || (doc?.variant ?? "rewrite"));
  const [zoom, setZoom] = useState(renderMode ? 1 : 0.62);
  const [selection, setSelection] = useState<Selection>({ kind: "none" });
  const [panelW, setPanelW] = useState<number>(() => { const s = localStorage.getItem(PW_KEY); return s ? +s : 320; });
  const [panelOpen, setPanelOpen] = useState(true);
  const [gridOn, setGridOn] = useState<boolean>(() => localStorage.getItem("jack12gridOn") === "1");
  const [gridSize, setGridSize] = useState<number>(() => { const s = localStorage.getItem("jack12gridSize"); return s ? +s : 24; });
  const [gridSnap, setGridSnap] = useState<boolean>(() => localStorage.getItem("jack12gridSnap") !== "0");
  const [freeSel, setFreeSel] = useState<{ output: Output; ids: string[] }>({ output: "scroll", ids: [] });

  // ----- 履歴（Undo/Redo）-----
  const past = useRef<Doc[]>([]);
  const future = useRef<Doc[]>([]);
  const lastKey = useRef<string>("");
  const lastTime = useRef<number>(0);
  const [, bump] = useState(0);
  const rerender = () => bump((n) => n + 1);

  function commit(next: Doc, key: string) {
    const now = Date.now();
    const coalesce = !!key && key === lastKey.current && now - lastTime.current < 800;
    if (!coalesce) { past.current.push(doc); if (past.current.length > 120) past.current.shift(); }
    future.current = [];
    lastKey.current = key; lastTime.current = now;
    setDoc(next); rerender();
  }
  function undo() { if (!past.current.length) return; future.current.unshift(doc); setDoc(past.current.pop()!); lastKey.current = ""; rerender(); }
  function redo() { if (!future.current.length) return; past.current.push(doc); setDoc(future.current.shift()!); lastKey.current = ""; rerender(); }
  function loadFresh(d: Doc) { past.current = []; future.current = []; lastKey.current = ""; setDoc(d); rerender(); }

  const update = (path: Path, value: any) => commit(setPath(doc, path, value), path.join("."));

  // export時もlocalStorageの最新docを使う
  useEffect(() => {
    if (renderMode) {
      try { const s = localStorage.getItem(LS_KEY); if (s) { const d = JSON.parse(s); if (d && d.variants) { if (!d.free) d.free = { scroll: [], flyer: [] }; if (!d.sizes) d.sizes = {}; setDoc(d); } } } catch {}
    }
  }, [renderMode]);
  useEffect(() => { if (!renderMode) localStorage.setItem(LS_KEY, JSON.stringify(doc)); }, [doc, renderMode]);
  useEffect(() => { localStorage.setItem(PW_KEY, String(panelW)); }, [panelW]);
  useEffect(() => { localStorage.setItem("jack12gridOn", gridOn ? "1" : "0"); localStorage.setItem("jack12gridSize", String(gridSize)); localStorage.setItem("jack12gridSnap", gridSnap ? "1" : "0"); }, [gridOn, gridSize, gridSnap]);

  // パネル幅ドラッグ
  const dragging = useRef(false);
  useEffect(() => {
    const move = (e: PointerEvent) => { if (!dragging.current) return; setPanelW(Math.min(680, Math.max(240, window.innerWidth - e.clientX))); };
    const up = () => { if (dragging.current) { dragging.current = false; document.body.style.cursor = ""; document.body.style.userSelect = ""; } };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  // ショートカット（Cmd/Ctrl+Z, +Shift+Z）。テキスト編集中はブラウザ標準に任せる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ae = document.activeElement as HTMLElement | null;
      const editing = !!ae && (ae.isContentEditable || ae.tagName === "INPUT" || ae.tagName === "TEXTAREA");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        if (editing) return;
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const stageRef = useRef<HTMLElement>(null);
  function fitWidth() {
    const el = stageRef.current; if (!el) return;
    const avail = el.clientWidth - 48;
    const cw = output === "scroll" ? 1080 : 794;
    setZoom(Math.min(1, Math.max(0.12, avail / cw)));
  }

  function dupVariant() {
    const src = doc.variants[variant];
    let id = "copy", i = 1;
    while (doc.variants[id]) id = "copy" + ++i;
    const label = (prompt("新しい案の名前", src.label + " のコピー") || src.label + " コピー").trim();
    commit(setPath(doc, ["variants", id], { label, scroll: clone(src.scroll), flyer: clone(src.flyer) }), "dup");
    setVariant(id);
  }
  function addFreePhoto() {
    const list = (doc.free?.[output]) || [];
    const item = { id: "f" + Date.now(), file: doc.heroPhoto, focal: { x: 0.5, y: 0.5 }, x: 120, y: 140, w: 300, h: 220 };
    commit(setPath(doc, ["free", output], [...list, item]), "addfree");
    setSelection({ kind: "photo", filePath: ["free", output, list.length, "file"], focalPath: ["free", output, list.length, "focal"], label: "配置した写真" });
  }
  function addFreeText() {
    const list = (doc.free?.[output]) || [];
    const item = { id: "t" + Date.now(), type: "text" as const, text: "テキストを入力", x: 140, y: 170, w: output === "flyer" ? 260 : 360, h: 60, fontSize: output === "flyer" ? 16 : 34, color: "#1C1918", align: "left" as const, weight: 700, family: "gothic" as const, lineHeight: 1.5 };
    commit(setPath(doc, ["free", output], [...list, item]), "addtext");
    setSelection({ kind: "freeText", itemPath: ["free", output, list.length] });
  }
  function delVariant() {
    const ids = Object.keys(doc.variants);
    if (ids.length <= 1) { alert("案は最低1つ必要です。"); return; }
    if (!confirm(`案「${doc.variants[variant].label}」を削除しますか？`)) return;
    const nv: any = { ...doc.variants }; delete nv[variant];
    commit({ ...doc, variants: nv } as Doc, "del");
    setVariant(Object.keys(nv)[0]);
  }

  const ctx = useMemo(
    () => ({ doc, update, selection, setSelection, editable: !renderMode, grid: { on: gridOn, size: gridSize, snap: gridSnap }, freeSel, setFreeSel }),
    [doc, selection, renderMode, gridOn, gridSize, gridSnap, freeSel]
  );

  // 選択中の案が消えている場合（Undo/削除直後など）に安全なキーへフォールバック
  const vKey = doc.variants[variant] ? variant : (doc.variants[doc.variant] ? doc.variant : Object.keys(doc.variants)[0]);

  const canvas = (
    <div id="canvas-root" className={"canvas " + output} style={tokenVars(doc.tokens[tone])}>
      {output === "scroll" ? <Scroll tone={tone} variant={vKey} /> : <Flyer tone={tone} variant={vKey} />}
      <FreeLayer output={output} />
      {!renderMode && gridOn && <div className="grid-ov" style={{ backgroundSize: `${gridSize}px ${gridSize}px` }} />}
    </div>
  );

  if (renderMode) {
    return <DocProvider value={ctx}><div className="render-only">{canvas}</div></DocProvider>;
  }

  if (!editMode) {
    return <ChoiceIndex />;
  }

  const exportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    f.text().then((txt) => { try { const d = JSON.parse(txt); if (d.variants) { if (!d.free) d.free = { scroll: [], flyer: [] }; if (!d.sizes) d.sizes = {}; loadFresh(d); if (!d.variants[variant]) setVariant(Object.keys(d.variants)[0]); } else alert("対応していないJSONです"); } catch { alert("JSON読込に失敗"); } });
  };
  const download = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "jack12-doc.json"; a.click();
  };

  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;

  return (
    <DocProvider value={ctx}>
      <div className="app">
        <header className="toolbar">
          <div className="tb-title">JACK12 フライヤーエディタ</div>
          <div className="tb-group">
            <span className="tb-label">編集</span>
            <button onClick={undo} disabled={!canUndo} title="元に戻す (⌘Z)">↶ 戻す</button>
            <button onClick={redo} disabled={!canRedo} title="やり直す (⇧⌘Z)">やり直す ↷</button>
          </div>
          <div className="tb-group">
            <span className="tb-label">トーン</span>
            <button className={tone === "elegant" ? "on" : ""} onClick={() => setTone("elegant")}>上品</button>
            <button className={tone === "passion" ? "on" : ""} onClick={() => setTone("passion")}>熱量</button>
          </div>
          <div className="tb-group">
            <span className="tb-label">出力</span>
            <button className={output === "scroll" ? "on" : ""} onClick={() => setOutput("scroll")}>縦長</button>
            <button className={output === "flyer" ? "on" : ""} onClick={() => setOutput("flyer")}>A4</button>
          </div>
          <div className="tb-group">
            <span className="tb-label">案</span>
            {Object.entries(doc.variants).map(([id, v]) => (
              <button key={id} className={vKey === id ? "on" : ""} onClick={() => setVariant(id)}>{v.label}</button>
            ))}
            <button onClick={dupVariant} title="今の案を複製">＋複製</button>
            <button onClick={delVariant} title="今の案を削除">削除</button>
          </div>
          <div className="tb-group">
            <span className="tb-label">ズーム</span>
            <input type="range" min={0.25} max={1} step={0.01} value={zoom} onChange={(e) => setZoom(+e.target.value)} />
            <span className="tb-zoom">{Math.round(zoom * 100)}%</span>
            <button onClick={fitWidth} title="幅に合わせる">幅に合わせる</button>
          </div>
          <div className="tb-group">
            <span className="tb-label">グリッド</span>
            <button className={gridOn ? "on" : ""} onClick={() => setGridOn((v) => !v)} title="グリッド表示">{gridOn ? "表示中" : "表示"}</button>
            <input type="range" min={8} max={80} step={2} value={gridSize} onChange={(e) => setGridSize(+e.target.value)} style={{ width: 80 }} title="グリッド幅" />
            <span className="tb-zoom">{gridSize}px</span>
            <button className={gridSnap ? "on" : ""} onClick={() => setGridSnap((v) => !v)} title="グリッドに吸着">吸着</button>
          </div>
          <div className="tb-group">
            <span className="tb-label">配置</span>
            <button onClick={addFreePhoto} title="写真を自由配置で追加（既存レイアウトの上に重ねる）">＋写真</button>
            <button onClick={addFreeText} title="テキストを自由配置で追加">＋テキスト</button>
          </div>
          <div className="tb-group right">
            <button onClick={() => setPanelOpen((v) => !v)} title="パネルの表示/非表示">{panelOpen ? "パネル ▷" : "◁ パネル"}</button>
            <button onClick={download}>保存(JSON)</button>
            <label className="filebtn">読込<input type="file" accept="application/json" onChange={exportFile} hidden /></label>
            <button onClick={() => { if (confirm("初期内容に戻します。よろしいですか？")) { loadFresh(initialDoc); setVariant(initialDoc.variant); } }}>リセット</button>
          </div>
        </header>

        <div className="workspace">
          <main className="stage" ref={stageRef}>
            <div className="stage-scale" style={{ transform: `scale(${zoom})` }}>
              {canvas}
            </div>
          </main>
          {panelOpen && (
            <div className="splitter" title="ドラッグで幅を調整／ダブルクリックで初期幅"
              onDoubleClick={() => setPanelW(320)}
              onPointerDown={(e) => { dragging.current = true; e.preventDefault(); document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }} />
          )}
          {panelOpen ? (
            <div className="panel-wrap" style={{ width: panelW }}>
              <RightPanel tone={tone} setTone={setTone} />
            </div>
          ) : (
            <button className="panel-reopen" onClick={() => setPanelOpen(true)} title="パネルを開く">◁</button>
          )}
        </div>
      </div>
    </DocProvider>
  );
}
