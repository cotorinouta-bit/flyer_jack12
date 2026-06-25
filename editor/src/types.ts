export type Tone = "elegant" | "passion";
export type Output = "scroll" | "flyer";

export interface Focal { x: number; y: number } // 0..1, object-position
export interface Bullet { head: string; body: string }
export interface Program { title: string; price: string; tag?: string; desc: string }
export interface ImageCard { file: string; caption: string; focal: Focal }
export interface Pair { left: ImageCard; right: ImageCard }
export interface TrustSection {
  code: string;
  title: string;
  intro: string;
  bullets: Bullet[];
  pairs?: Pair[];
  wide?: ImageCard[];
}
export interface OfferDetail {
  code: string;
  title: string;
  intro: string;
  bullets: Bullet[];
}

export interface Tokens {
  paper: string; ink: string; soft: string; muted: string; cream: string; gold: string;
  primary: string; label: string; divider: string; h1: string;
  cardAccents: [string, string, string];
  boxBg: string; boxAccent: string;
  scrollOverlayTop: number; scrollOverlayFull: number; // 0..1
  flyerOverlayFull: number; flyerOverlayLeft: number;  // 0..1
}

export interface ToneCopy {
  pill: string; h1: string; heroBody: string;
  forTitle: string; forIntro: string; forBullets: Bullet[];
  whyTitle: string; whyIntro: string; whyBullets: Bullet[];
  decisionTitle: string; decisionItems: Bullet[]; decisionNote: string;
}
export interface FlyerToneCopy {
  title: [string, string]; subtitle: string; target: string; cardsSub: string; footSub: string;
}

// コピーの「案」（現行 / リライト など）。トーンとは別軸で切り替える。
export interface VariantCopy {
  label: string;
  scroll: Record<Tone, ToneCopy>;
  flyer: Record<Tone, FlyerToneCopy>;
}

// 自由配置アイテム（既存レイアウトの上に重ねる）。座標はキャンバスpx。type 既定は "photo"。
export interface FreeItem {
  id: string; type?: "photo" | "text";
  x: number; y: number; w: number; h: number;
  file?: string; focal?: Focal; radius?: number;                 // 写真
  text?: string; fontSize?: number; color?: string;              // テキスト
  align?: "left" | "center" | "right"; weight?: number;
  family?: "gothic" | "serif"; lineHeight?: number;
}

export interface Doc {
  tokens: Record<Tone, Tokens>;
  sizes: Record<string, number>;
  free: { scroll: FreeItem[]; flyer: FreeItem[] };
  eyebrow: string;
  crest: string;
  heroPhoto: string;
  heroFocalScroll: Focal;
  heroFocalFlyer: Focal;
  scrollMission: string;
  flyerMissionLabel: string;
  flyerMissionText: string;
  variant: string;
  variants: Record<string, VariantCopy>;
  forImage: ImageCard;
  beforeForImage: ImageCard;
  scrollProgramTitle: string; scrollProgramIntro: string;
  flyerCardsTitle: string;
  programs: Program[];
  flyerCards: Program[];
  mediaTitle: string; mediaIntro: string; mediaBullets: Bullet[]; mediaImages: ImageCard[];
  valueTitle: string; valueIntro: string; valueBullets: Bullet[];
  profileTitle: string; profileName: string; profileRole: string; profileBody: string; profileFaces: Bullet[];
  trust: TrustSection[];
  offerDetails: OfferDetail[];
  flyerProfile: { label: string; name: string; role: string; body: string; thumbs: ImageCard[] };
  band: { heading: string; lines: string[]; thumbs: ImageCard[] };
  footerLabel: string; footerNote: string;
  cta: { headline: string; sub: string; url: string };
  disclaimer: string;
}
