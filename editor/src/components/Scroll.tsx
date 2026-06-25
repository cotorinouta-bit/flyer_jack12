import React from "react";
import type { Tone } from "../types";
import { Field, PicCard, PhotoBox, useDoc } from "../editing";
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
  const pill = "";
  const disclaimer = doc.disclaimer.trim();
  const profileRole = doc.profileRole.trim();

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
        {/* PROFILE */}
        <section className="s-sec">
          <Label>PROFILE</Label>
          {doc.profileTitle.trim() ? <Field path={["profileTitle"]} className="s-title" as="h2" /> : null}
          <Field path={["profileName"]} className="s-pname" as="div" />
          {profileRole ? <Field path={["profileRole"]} className="s-prole" as="div" style={{ color: t.primary }} /> : null}
          <Field path={["profileBody"]} className="s-intro" as="p" />
          <div className="s-profile-faces">
            <Bullets base={["profileFaces"]} dotColor={t.primary} />
          </div>
        </section>
        <GapResizer id="gap.profile" />

        <PicCard path={["beforeForImage"]} className="s-wide s-before-for" defH={560} />
        <GapResizer id="gap.beforeForImage" />

        {/* FOR */}
        <section className="s-sec">
          <Label>FOR YOU</Label>
          <Field path={["variants", variant, "scroll", tone, "forTitle"]} className="s-title" as="h2" />
          <Field path={["variants", variant, "scroll", tone, "forIntro"]} className="s-intro" as="p" />
          <Bullets base={["variants", variant, "scroll", tone, "forBullets"]} dotColor={t.primary} />
          <PicCard path={["forImage"]} className="s-wide" defH={430} />
        </section>
        <GapResizer id="gap.for" />

        {/* ACHIEVEMENTS / INTERNATIONAL STAGE */}
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
            {ti === 0 ? doc.mediaImages.map((_, i) => (
              <PicCard key={i} path={["mediaImages", i]} className="s-wide" defH={440} />
            )) : null}
          </section>
        ))}

        {/* VALUE */}
        <section className="s-sec">
          <Label>BENEFITS</Label>
          <Field path={["valueTitle"]} className="s-title" as="h2" />
          <Field path={["valueIntro"]} className="s-intro" as="p" />
          <Bullets base={["valueBullets"]} dotColor={t.primary} />
        </section>

        {/* PROGRAM */}
        <section className="s-sec">
          <Label>PROGRAM</Label>
          <Field path={["scrollProgramTitle"]} className="s-title" as="h2" />
          <Field path={["scrollProgramIntro"]} className="s-intro" as="p" />
          <div className="s-cards">
            {doc.programs.map((_, i) => {
              const accent = t.primary;
              return (
              <div className="s-card" key={i} style={sizeStyle(doc.sizes, "progCard." + i, "minHeight")}>
                <div className="s-card-bar" style={{ background: accent }} />
                <Field path={["programs", i, "title"]} className="s-card-title" as="div" />
                <Field path={["programs", i, "price"]} className="s-card-price" as="div" style={{ color: accent }} />
                <Field path={["programs", i, "desc"]} className="s-card-desc" as="div" />
                <BottomHandle id={"progCard." + i} />
              </div>
              );
            })}
          </div>
        </section>
        <GapResizer id="gap.program" />

        {/* SERVICE DETAILS */}
        {doc.offerDetails.map((detail, di) => (
          <section className="s-sec" key={di}>
            <Label>{detail.code}</Label>
            <Field path={["offerDetails", di, "title"]} className="s-title" as="h2" />
            <Field path={["offerDetails", di, "intro"]} className="s-intro" as="p" />
            <Bullets base={["offerDetails", di, "bullets"]} dotColor={t.primary} />
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
          {disclaimer ? <Field path={["disclaimer"]} className="s-d-disc" as="p" /> : null}
        </section>
      </div>
    </div>
  );
}
