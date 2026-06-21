import React from "react";
import type { Tone } from "../types";
import { Field, PicCard, PhotoBox, useDoc } from "../editing";
import { QrCode } from "./QrCode";
import { BottomHandle, sizeStyle } from "./Resizable";

export function Flyer({ tone, variant }: { tone: Tone; variant: string }) {
  const { doc, setSelection } = useDoc();
  const t = doc.tokens[tone];

  return (
    <div className="flyer">
      {/* HERO */}
      <header className="f-hero" style={sizeStyle(doc.sizes, "hero.flyer", "height")}>
        <BottomHandle id="hero.flyer" />
        <PhotoBox
          file={doc.heroPhoto}
          focal={doc.heroFocalFlyer}
          focalPath={["heroFocalFlyer"]}
          onSelect={() => setSelection({ kind: "photo", filePath: ["heroPhoto"], focalPath: ["heroFocalFlyer"], label: "ヒーロー写真" })}
          className="f-hero-photo"
        />
        <div className="f-hero-shade" style={{
          background:
            `linear-gradient(90deg, rgba(0,0,0,${t.flyerOverlayLeft}) 0%, rgba(0,0,0,${t.flyerOverlayLeft}) 40%, rgba(0,0,0,${t.flyerOverlayFull}) 100%)`,
        }} />
        <div className="f-hero-in">
          <div className="f-crest-row">
            <PhotoBox file={doc.crest} focal={{ x: 0.5, y: 0.5 }} focalPath={["_noop"]} className="f-crest" radius={10} />
            <span className="f-rulev" style={{ background: t.divider }} />
            <Field path={["eyebrow"]} className="f-eyebrow" />
          </div>
          <h1 className="f-title">
            <Field path={["variants", variant, "flyer", tone, "title", 0]} as="div" />
            <Field path={["variants", variant, "flyer", tone, "title", 1]} as="div" />
          </h1>
          <Field path={["variants", variant, "flyer", tone, "subtitle"]} className="f-subtitle" as="p" />
          <div className="f-rule" style={{ background: t.divider }} />
          <div className="f-mission">
            <Field path={["flyerMissionLabel"]} className="f-mission-label" />
            <Field path={["flyerMissionText"]} className="f-mission-text" />
          </div>
          <Field path={["variants", variant, "flyer", tone, "target"]} className="f-target" />
        </div>
      </header>

      {/* CARDS */}
      <section className="f-cards-sec">
        <Field path={["flyerCardsTitle"]} className="f-sec-title" as="h2" />
        <Field path={["variants", variant, "flyer", tone, "cardsSub"]} className="f-sec-sub" as="div" />
        <div className="f-cards">
          {doc.flyerCards.map((_, i) => (
            <div className="f-card" key={i} style={sizeStyle(doc.sizes, "fcard." + i, "minHeight")}>
              <div className="f-card-bar" style={{ background: t.cardAccents[i] }} />
              <Field path={["flyerCards", i, "title"]} className="f-card-title" as="div" />
              <Field path={["flyerCards", i, "price"]} className="f-card-price" as="div" style={{ color: t.cardAccents[i] }} />
              <Field path={["flyerCards", i, "tag"]} className="f-card-tag" as="div" style={{ color: t.gold }} />
              <Field path={["flyerCards", i, "desc"]} className="f-card-desc" as="div" />
              <BottomHandle id={"fcard." + i} min={40} />
            </div>
          ))}
        </div>
      </section>

      {/* PROFILE */}
      <section className="f-profile">
        <div className="f-profile-text">
          <Field path={["flyerProfile", "label"]} className="f-eyebrow2" />
          <Field path={["flyerProfile", "name"]} className="f-pname" as="div" />
          <Field path={["flyerProfile", "role"]} className="f-prole" as="div" style={{ color: t.primary }} />
          <Field path={["flyerProfile", "body"]} className="f-pbody" as="p" />
        </div>
        <div className="f-thumbs">
          {doc.flyerProfile.thumbs.map((_, i) => (
            <PicCard key={i} path={["flyerProfile", "thumbs", i]} radius={14} captionClass="f-cap" defH={100} />
          ))}
        </div>
      </section>

      {/* BAND */}
      <section className="f-band" style={sizeStyle(doc.sizes, "fband", "minHeight")}>
        <BottomHandle id="fband" min={40} />
        <div className="f-band-bar" style={{ background: t.primary }} />
        <div className="f-band-grid">
          <div className="f-band-text">
            <Field path={["band", "heading"]} className="f-band-head" as="div" />
            {doc.band.lines.map((_, i) => (
              <div className="f-band-line" key={i}>
                <span className="f-dot" style={{ background: t.primary }} />
                <Field path={["band", "lines", i]} as="div" />
              </div>
            ))}
          </div>
          <div className="f-band-thumbs">
            {doc.band.thumbs.map((_, i) => (
              <PicCard key={i} path={["band", "thumbs", i]} radius={10} captionClass="f-cap" defH={84} />
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="f-footer">
        <div className="f-foot-rule" style={{ background: t.soft }} />
        <div className="f-foot-cta">
          <div className="f-foot-left">
            <div className="f-foot-row">
              <Field path={["footerLabel"]} className="f-foot-label" />
              <Field path={["variants", variant, "flyer", tone, "footSub"]} className="f-foot-sub" style={{ color: t.primary }} />
            </div>
            <Field path={["footerNote"]} className="f-foot-note" as="p" />
          </div>
          <div className="f-cta" style={{ background: t.primary }}>
            <div className="f-cta-text">
              <Field path={["cta", "headline"]} className="f-cta-head" as="div" />
              <Field path={["cta", "url"]} className="f-cta-url" as="div" />
            </div>
            <div className="f-cta-qr"><QrCode value={doc.cta.url} size={62} fg={t.ink} /></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
