import React from "react";
import type { Tone } from "../types";
import { Field, PicCard, PhotoBox, useDoc } from "../editing";
import { QrCode } from "./QrCode";
import { BottomHandle, GapResizer, sizeStyle } from "./Resizable";
import { getPath, Path } from "../util";

function Bullets({ base, dotColor }: { base: Path; dotColor: string }) {
  const { doc } = useDoc();
  const arr = getPath(doc, base) as any[];
  return (
    <div className="s-bullets">
      {arr.map((_, i) => (
        <div className="s-bullet" key={i}>
          <span className="s-dot" style={{ background: dotColor }} />
          <div>
            <Field path={[...base, i, "head"]} className="s-b-head" as="div" />
            <Field path={[...base, i, "body"]} className="s-b-body" as="div" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="s-label">{children}</div>;
}

export function Scroll({ tone, variant }: { tone: Tone; variant: string }) {
  const { doc, setSelection } = useDoc();
  const t = doc.tokens[tone];
  const c = doc.variants[variant].scroll[tone];
  const heroFocal = doc.heroFocalScroll;
  const rawPill = c.pill.trim();
  const pill = tone === "elegant" || rawPill.includes("公式プロフィール") ? "" : rawPill;

  return (
    <div className="scroll">
      {/* HERO */}
      <header className="s-hero" style={sizeStyle(doc.sizes, "hero.scroll", "height")}>
        <BottomHandle id="hero.scroll" />
        <PhotoBox
          file={doc.heroPhoto}
          focal={heroFocal}
          focalPath={["heroFocalScroll"]}
          onSelect={() => setSelection({ kind: "photo", filePath: ["heroPhoto"], focalPath: ["heroFocalScroll"], label: "ヒーロー写真" })}
          className="s-hero-photo"
        />
        <div className="s-hero-shade" style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,${t.scrollOverlayTop}), rgba(0,0,0,${t.scrollOverlayFull}))`,
        }} />
        <div className="s-hero-in">
          <div className="s-crest-row">
            <PhotoBox file={doc.crest} focal={{ x: 0.5, y: 0.5 }} focalPath={["_noop"]} className="s-crest" radius={18} />
            <Field path={["eyebrow"]} className="s-eyebrow" />
          </div>
          {pill ? (
            <Field path={["variants", variant, "scroll", tone, "pill"]} className="s-pill" style={{ background: t.primary }} />
          ) : (
            <div className="s-pill-spacer" aria-hidden="true" />
          )}
          <Field path={["variants", variant, "scroll", tone, "h1"]} className="s-h1" as="h1" style={{ color: t.h1 }} />
          <Field path={["variants", variant, "scroll", tone, "heroBody"]} className="s-hero-body" as="p" />
          <div className="s-rule" style={{ background: t.divider }} />
          <Field path={["scrollMission"]} className="s-mission" />
        </div>
      </header>

      <div className="s-body">
        {/* FOR */}
        <section className="s-sec">
          <Label>FOR YOU</Label>
          <Field path={["variants", variant, "scroll", tone, "forTitle"]} className="s-title" as="h2" />
          <Field path={["variants", variant, "scroll", tone, "forIntro"]} className="s-intro" as="p" />
          <Bullets base={["variants", variant, "scroll", tone, "forBullets"]} dotColor={t.primary} />
          <PicCard path={["forImage"]} className="s-wide" defH={430} />
        </section>
        <GapResizer id="gap.for" />

        {/* WHY */}
        <section className="s-sec">
          <Label>WHY JACK12</Label>
          <Field path={["variants", variant, "scroll", tone, "whyTitle"]} className="s-title" as="h2" />
          <Field path={["variants", variant, "scroll", tone, "whyIntro"]} className="s-intro" as="p" />
          <Bullets base={["variants", variant, "scroll", tone, "whyBullets"]} dotColor={t.primary} />
        </section>
        <GapResizer id="gap.why" />

        {/* MEDIA */}
        <section className="s-sec">
          <Label>MEDIA &amp; STAGE</Label>
          <Field path={["mediaTitle"]} className="s-title" as="h2" />
          <Field path={["mediaIntro"]} className="s-intro" as="p" />
          <Bullets base={["mediaBullets"]} dotColor={t.primary} />
          {doc.mediaImages.map((_, i) => (
            <PicCard key={i} path={["mediaImages", i]} className="s-wide" defH={440} />
          ))}
        </section>
        <GapResizer id="gap.media" />

        {/* PROGRAM */}
        <section className="s-sec">
          <Label>PROGRAM</Label>
          <Field path={["scrollProgramTitle"]} className="s-title" as="h2" />
          <Field path={["scrollProgramIntro"]} className="s-intro" as="p" />
          <div className="s-cards">
            {doc.programs.map((_, i) => (
              <div className="s-card" key={i} style={sizeStyle(doc.sizes, "progCard." + i, "minHeight")}>
                <div className="s-card-bar" style={{ background: t.cardAccents[i] }} />
                <Field path={["programs", i, "title"]} className="s-card-title" as="div" />
                <Field path={["programs", i, "price"]} className="s-card-price" as="div" style={{ color: t.cardAccents[i] }} />
                <Field path={["programs", i, "desc"]} className="s-card-desc" as="div" />
                <BottomHandle id={"progCard." + i} />
              </div>
            ))}
          </div>
        </section>
        <GapResizer id="gap.program" />

        {/* VALUE */}
        <section className="s-sec">
          <Label>VALUE FOR EXECUTIVES</Label>
          <Field path={["valueTitle"]} className="s-title" as="h2" />
          <Field path={["valueIntro"]} className="s-intro" as="p" />
          <Bullets base={["valueBullets"]} dotColor={t.primary} />
        </section>

        {/* PROFILE */}
        <section className="s-sec">
          <Label>OFFICIAL PROFILE</Label>
          <Field path={["profileTitle"]} className="s-title" as="h2" />
          <Field path={["profileName"]} className="s-pname" as="div" />
          <Field path={["profileRole"]} className="s-prole" as="div" style={{ color: t.primary }} />
          <Field path={["profileBody"]} className="s-intro" as="p" />
        </section>

        {/* TRUST */}
        {doc.trust.map((ts, ti) => (
          <section className="s-sec" key={ti}>
            <Label>{ts.code}</Label>
            <Field path={["trust", ti, "title"]} className="s-title" as="h2" />
            <Field path={["trust", ti, "intro"]} className="s-intro" as="p" />
            <Bullets base={["trust", ti, "bullets"]} dotColor={t.primary} />
            {ts.pairs?.map((_, pi) => (
              <div className="s-pair" key={pi}>
                <PicCard path={["trust", ti, "pairs", pi, "left"]} defH={560} />
                <PicCard path={["trust", ti, "pairs", pi, "right"]} defH={560} />
              </div>
            ))}
            {ts.wide?.map((_, wi) => (
              <PicCard key={wi} path={["trust", ti, "wide", wi]} className="s-wide" defH={470} />
            ))}
          </section>
        ))}

        {/* DECISION */}
        <section className="s-decision" style={{ background: t.boxBg, ...sizeStyle(doc.sizes, "decBox", "minHeight") }}>
          <BottomHandle id="decBox" />
          <Field path={["variants", variant, "scroll", tone, "decisionTitle"]} className="s-d-title" as="h2" />
          <div className="s-d-items">
            {c.decisionItems.map((_, i) => (
              <div className="s-d-item" key={i}>
                <span className="s-dot" style={{ background: t.boxAccent }} />
                <div>
                  <Field path={["variants", variant, "scroll", tone, "decisionItems", i, "head"]} className="s-d-head" as="div" />
                  <Field path={["variants", variant, "scroll", tone, "decisionItems", i, "body"]} className="s-d-body" as="div" style={{ color: t.boxAccent }} />
                </div>
              </div>
            ))}
          </div>
          <div className="s-d-rule" />
          <Field path={["variants", variant, "scroll", tone, "decisionNote"]} className="s-d-note" as="p" />
          <Field path={["disclaimer"]} className="s-d-disc" as="p" />
        </section>

        {/* CTA */}
        <section className="s-cta" style={{ background: t.primary }}>
          <div className="s-cta-text">
            <Field path={["cta", "headline"]} className="s-cta-head" as="div" />
            <Field path={["cta", "sub"]} className="s-cta-sub" as="div" />
            <Field path={["cta", "url"]} className="s-cta-url" as="div" />
          </div>
          <div className="s-cta-qr">
            <QrCode value={doc.cta.url} size={150} fg={COLORSink} />
            <div className="s-cta-cap">スマホで読み取り</div>
          </div>
        </section>
      </div>
    </div>
  );
}

const COLORSink = "#1C1918";
