import type { CSSProperties, ReactNode } from 'react';

// Brand identity system: inline SVG marks, brand colors, and Higgsfield-generated
// hero banners for the companies used across the job-simulation surfaces
// (LinkedIn, Outlook, Banking). Marks are drawn in code so they render crisply
// at any size; unknown companies fall back to a deterministic letter tile.

const BASE_URL = import.meta.env.BASE_URL;

export type BrandKey =
  | 'google' | 'apple' | 'meta' | 'amazon' | 'aws' | 'microsoft' | 'netflix'
  | 'nvidia' | 'adobe' | 'ibm' | 'anthropic' | 'openai' | 'samsung' | 'intuit'
  | 'mckinsey' | 'bain' | 'bcg' | 'deloitte' | 'boozallen' | 'cognizant'
  | 'jpmorgan' | 'morganstanley' | 'blackrock' | 'citi' | 'bofa' | 'schwab'
  | 'chase' | 'pnc' | 'huntington' | 'keybank' | 'mtb' | 'fifththird'
  | 'disney' | 'fedex' | 'ebay' | 'tesla' | 'bmw' | 'caterpillar';

type BrandDef = {
  match: RegExp;
  name: string;
  color: string;         // primary brand color
  tile: (size: number) => ReactNode;  // square logo tile
  banner?: string;       // hero banner asset (Higgsfield-generated)
};

// ── Shared tile helpers ───────────────────────────────────────────────────────

function tileStyle(size: number, bg: string, extra?: CSSProperties): CSSProperties {
  return {
    width: size, height: size, borderRadius: Math.max(2, size * 0.08),
    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0, boxSizing: 'border-box', ...extra,
  };
}

function wordTile(size: number, bg: string, fg: string, text: string, opts?: { font?: string; weight?: number; italic?: boolean; tracking?: string; sizeRatio?: number }): ReactNode {
  return (
    <div style={tileStyle(size, bg)}>
      <span style={{
        color: fg,
        fontFamily: opts?.font ?? "'Helvetica Neue', Arial, sans-serif",
        fontWeight: opts?.weight ?? 800,
        fontStyle: opts?.italic ? 'italic' : 'normal',
        letterSpacing: opts?.tracking ?? '-0.02em',
        fontSize: size * (opts?.sizeRatio ?? 0.34),
        lineHeight: 1,
        userSelect: 'none',
      }}>{text}</span>
    </div>
  );
}

// ── SVG marks ─────────────────────────────────────────────────────────────────

function GoogleG(size: number) {
  const s = size * 0.62;
  return (
    <div style={tileStyle(size, '#fff', { border: '1px solid #e8e8e8' })}>
      <svg width={s} height={s} viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
      </svg>
    </div>
  );
}

function AppleMark(size: number) {
  const s = size * 0.52;
  return (
    <div style={tileStyle(size, '#000')}>
      <svg width={s} height={s} viewBox="0 0 384 512">
        <path fill="#fff" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
      </svg>
    </div>
  );
}

function MetaMark(size: number) {
  const s = size * 0.68;
  return (
    <div style={tileStyle(size, '#fff', { border: '1px solid #e8e8e8' })}>
      <svg width={s} height={s * 0.66} viewBox="0 0 36 24">
        <path fill="none" stroke="#0081FB" strokeWidth="4.6" strokeLinecap="round"
          d="M3 20 C3 8 7 4 10 4 C15 4 19 20 24 20 C29 20 33 14 33 10 C33 6 31 4 28.5 4 C24 4 20 20 14 20 C10 20 8 16 8 12"/>
      </svg>
    </div>
  );
}

function MicrosoftMark(size: number) {
  const s = size * 0.52;
  return (
    <div style={tileStyle(size, '#fff', { border: '1px solid #e8e8e8' })}>
      <svg width={s} height={s} viewBox="0 0 21 21">
        <rect x="0" y="0" width="10" height="10" fill="#f25022" />
        <rect x="11" y="0" width="10" height="10" fill="#7fba00" />
        <rect x="0" y="11" width="10" height="10" fill="#00a4ef" />
        <rect x="11" y="11" width="10" height="10" fill="#ffb900" />
      </svg>
    </div>
  );
}

function MastercardMark(size: number, dark = false) {
  const s = size * 0.72;
  return (
    <div style={tileStyle(size, dark ? '#000' : '#fff', dark ? undefined : { border: '1px solid #e8e8e8' })}>
      <svg width={s} height={s * 0.62} viewBox="0 0 48 30">
        <circle cx="18" cy="15" r="14" fill="#EB001B" />
        <circle cx="30" cy="15" r="14" fill="#F79E1B" />
        <path d="M24 4.2a14 14 0 0 1 0 21.6 14 14 0 0 1 0-21.6z" fill="#FF5F00" />
      </svg>
    </div>
  );
}

function ChaseMark(size: number, white = false) {
  const s = size * 0.58;
  const fg = white ? '#fff' : '#117ACA';
  // Four-segment octagon emblem
  return (
    <div style={tileStyle(size, white ? '#117ACA' : '#fff', white ? undefined : { border: '1px solid #e8e8e8' })}>
      <svg width={s} height={s} viewBox="0 0 60 60">
        <path fill={fg} d="M22.6 4h14.9c1 0 1.5.4 1.5 1.5v13.9L22.6 4z" />
        <path fill={fg} d="M56 22.6v14.9c0 1-.4 1.5-1.5 1.5H40.6L56 22.6z" />
        <path fill={fg} d="M37.4 56H22.5c-1 0-1.5-.4-1.5-1.5V40.6L37.4 56z" />
        <path fill={fg} d="M4 37.4V22.5c0-1 .4-1.5 1.5-1.5h13.9L4 37.4z" />
      </svg>
    </div>
  );
}

function AmazonMark(size: number) {
  return (
    <div style={tileStyle(size, '#fff', { border: '1px solid #e8e8e8', flexDirection: 'column', gap: 0 })}>
      <span style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: 800, fontSize: size * 0.28, color: '#000', letterSpacing: '-0.04em', lineHeight: 1 }}>amazon</span>
      <svg width={size * 0.5} height={size * 0.14} viewBox="0 0 60 14" style={{ marginTop: size * 0.02 }}>
        <path d="M2 3 C 18 13, 42 13, 56 5" fill="none" stroke="#FF9900" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M56 5 l-5.5-2.2 M56 5 l-2 5.4" fill="none" stroke="#FF9900" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function AwsMark(size: number) {
  return (
    <div style={tileStyle(size, '#232F3E', { flexDirection: 'column' })}>
      <span style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: 800, fontSize: size * 0.3, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>aws</span>
      <svg width={size * 0.52} height={size * 0.14} viewBox="0 0 60 14" style={{ marginTop: size * 0.03 }}>
        <path d="M2 3 C 18 13, 42 13, 56 5" fill="none" stroke="#FF9900" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M56 5 l-5.5-2.2 M56 5 l-2 5.4" fill="none" stroke="#FF9900" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function BcgMark(size: number) {
  return (
    <div style={tileStyle(size, '#177B57')}>
      <span style={{ color: '#fff', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: size * 0.34, letterSpacing: '0.01em' }}>BCG</span>
    </div>
  );
}

function McKinseyMark(size: number) {
  return (
    <div style={tileStyle(size, '#fff', { border: '1px solid #e8e8e8', flexDirection: 'column', padding: size * 0.08 })}>
      <span style={{ color: '#051C2C', fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: size * 0.21, lineHeight: 1.05, textAlign: 'center' }}>McKinsey<br />&amp; Company</span>
    </div>
  );
}

function BainMark(size: number) {
  return (
    <div style={tileStyle(size, '#fff', { border: '1px solid #e8e8e8', flexDirection: 'column' })}>
      <span style={{ color: '#CB2026', fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: 800, fontSize: size * 0.26, letterSpacing: '0.02em' }}>BAIN</span>
      <span style={{ color: '#53565A', fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: 500, fontSize: size * 0.1, letterSpacing: '0.14em', marginTop: size * 0.02 }}>&amp; COMPANY</span>
    </div>
  );
}

function PncMark(size: number) {
  return (
    <div style={tileStyle(size, '#fff', { border: '1px solid #e8e8e8', gap: size * 0.06 })}>
      <svg width={size * 0.3} height={size * 0.3} viewBox="0 0 30 30">
        <path d="M15 2 L28 26 H2 Z" fill="#F58025" />
        <path d="M15 9 L23 26 H7 Z" fill="#255398" />
      </svg>
      <span style={{ color: '#255398', fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: 800, fontSize: size * 0.3, letterSpacing: '-0.01em' }}>PNC</span>
    </div>
  );
}

function HuntingtonMark(size: number) {
  return (
    <div style={tileStyle(size, '#fff', { border: '1px solid #e8e8e8', gap: size * 0.05 })}>
      <svg width={size * 0.34} height={size * 0.34} viewBox="0 0 32 32">
        <path d="M16 1 L30 9 v14 L16 31 L2 23 V9 Z" fill="#5B8F22" />
        <path d="M10 9 h4 v5 h4 V9 h4 v14 h-4 v-5 h-4 v5 h-4 Z" fill="#fff" />
      </svg>
    </div>
  );
}

function NetflixMark(size: number) {
  return wordTile(size, '#000', '#E50914', 'N', { weight: 900, sizeRatio: 0.62, font: "'Arial Black', 'Helvetica Neue', sans-serif" });
}

function AnthropicMark(size: number) {
  return (
    <div style={tileStyle(size, '#F0EEE6')}>
      <svg width={size * 0.5} height={size * 0.36} viewBox="0 0 46 32">
        <path fill="#181818" d="M32.73 0h-6.945L38.45 32h6.945L32.73 0zM12.665 0 0 32h7.082l2.59-6.72h13.25l2.59 6.72h7.082L19.929 0h-7.264zm-.702 19.337 4.334-11.246 4.334 11.246h-8.668z"/>
      </svg>
    </div>
  );
}

function OpenAiMark(size: number) {
  return wordTile(size, '#000', '#fff', 'OpenAI', { weight: 600, sizeRatio: 0.22, tracking: '-0.03em' });
}

// ── Registry ──────────────────────────────────────────────────────────────────

const BANNERS = `${BASE_URL}assets/banners`;

export const BRANDS: Record<BrandKey, BrandDef> = {
  google:       { match: /google/i, name: 'Google', color: '#4285F4', tile: GoogleG, banner: `${BANNERS}/google.webp` },
  apple:        { match: /^apple\b|apple inc/i, name: 'Apple', color: '#000', tile: AppleMark, banner: `${BANNERS}/apple.webp` },
  meta:         { match: /^meta\b/i, name: 'Meta', color: '#0081FB', tile: MetaMark, banner: `${BANNERS}/meta.webp` },
  amazon:       { match: /amazon/i, name: 'Amazon', color: '#FF9900', tile: AmazonMark, banner: `${BANNERS}/amazon.webp` },
  aws:          { match: /\baws\b|amazon web services/i, name: 'Amazon Web Services (AWS)', color: '#FF9900', tile: AwsMark, banner: `${BANNERS}/aws.webp` },
  microsoft:    { match: /microsoft/i, name: 'Microsoft', color: '#0078D4', tile: MicrosoftMark },
  netflix:      { match: /netflix/i, name: 'Netflix', color: '#E50914', tile: NetflixMark },
  nvidia:       { match: /nvidia/i, name: 'NVIDIA', color: '#76B900', tile: (s) => wordTile(s, '#fff', '#76B900', 'NVIDIA', { weight: 900, sizeRatio: 0.22, font: "'Arial Black', sans-serif" }) },
  adobe:        { match: /adobe/i, name: 'Adobe', color: '#FA0F00', tile: (s) => wordTile(s, '#FA0F00', '#fff', 'A', { weight: 900, sizeRatio: 0.55 }) },
  ibm:          { match: /\bibm\b|international business machines/i, name: 'IBM', color: '#0F62FE', tile: (s) => wordTile(s, '#fff', '#1F70C1', 'IBM', { weight: 900, sizeRatio: 0.34, font: "'Arial Black', sans-serif" }) },
  anthropic:    { match: /anthropic/i, name: 'Anthropic', color: '#D97757', tile: AnthropicMark },
  openai:       { match: /openai/i, name: 'OpenAI', color: '#000', tile: OpenAiMark },
  samsung:      { match: /samsung/i, name: 'Samsung', color: '#1428A0', tile: (s) => wordTile(s, '#1428A0', '#fff', 'SAMSUNG', { weight: 700, sizeRatio: 0.15, tracking: '0.02em' }) },
  intuit:       { match: /intuit/i, name: 'Intuit', color: '#236CFF', tile: (s) => wordTile(s, '#fff', '#236CFF', 'intuit', { weight: 600, sizeRatio: 0.26 }) },
  mckinsey:     { match: /mckinsey|cmg strategy/i, name: 'McKinsey & Company', color: '#051C2C', tile: McKinseyMark, banner: `${BANNERS}/mckinsey.webp` },
  bain:         { match: /\bbain\b/i, name: 'Bain & Company', color: '#CB2026', tile: BainMark, banner: `${BANNERS}/bain.webp` },
  bcg:          { match: /\bbcg\b|boston consulting/i, name: 'Boston Consulting Group (BCG)', color: '#177B57', tile: BcgMark, banner: `${BANNERS}/bcg.webp` },
  deloitte:     { match: /deloitte/i, name: 'Deloitte', color: '#86BC25', tile: (s) => wordTile(s, '#000', '#fff', 'Deloitte.', { weight: 700, sizeRatio: 0.2 }) },
  boozallen:    { match: /booz allen/i, name: 'Booz Allen Hamilton', color: '#003A70', tile: (s) => wordTile(s, '#003A70', '#fff', 'BAH', { weight: 800, sizeRatio: 0.3 }) },
  cognizant:    { match: /cognizant/i, name: 'Cognizant', color: '#0033A0', tile: (s) => wordTile(s, '#fff', '#0033A0', 'C', { weight: 800, sizeRatio: 0.5 }) },
  jpmorgan:     { match: /jp ?morgan/i, name: 'J.P. Morgan', color: '#6E5F4B', tile: (s) => wordTile(s, '#fff', '#101820', 'J.P.M', { font: 'Georgia, serif', weight: 700, sizeRatio: 0.26 }) },
  morganstanley:{ match: /morgan stanley/i, name: 'Morgan Stanley', color: '#187ABA', tile: (s) => wordTile(s, '#fff', '#00305C', 'MS', { font: 'Georgia, serif', weight: 700, sizeRatio: 0.38 }) },
  blackrock:    { match: /blackrock/i, name: 'BlackRock', color: '#000', tile: (s) => wordTile(s, '#000', '#fff', 'BLK', { weight: 800, sizeRatio: 0.3 }) },
  citi:         { match: /citibank|citigroup|\bciti\b/i, name: 'Citi', color: '#003B70', tile: (s) => wordTile(s, '#fff', '#003B70', 'citi', { weight: 600, sizeRatio: 0.36 }) },
  bofa:         { match: /bank of america/i, name: 'Bank of America', color: '#E31837', tile: (s) => wordTile(s, '#fff', '#012169', 'BofA', { weight: 800, sizeRatio: 0.28 }) },
  schwab:       { match: /schwab/i, name: 'Charles Schwab', color: '#00A0DF', tile: (s) => wordTile(s, '#fff', '#00A0DF', 'CS', { weight: 800, sizeRatio: 0.38 }) },
  chase:        { match: /\bchase\b/i, name: 'Chase', color: '#117ACA', tile: ChaseMark },
  pnc:          { match: /\bpnc\b/i, name: 'PNC Bank', color: '#255398', tile: PncMark },
  huntington:   { match: /huntington/i, name: 'Huntington Bank', color: '#5B8F22', tile: HuntingtonMark },
  keybank:      { match: /keybank/i, name: 'KeyBank', color: '#CC0000', tile: (s) => wordTile(s, '#CC0000', '#fff', 'Key', { weight: 800, sizeRatio: 0.34 }) },
  mtb:          { match: /m&t bank/i, name: 'M&T Bank', color: '#00703C', tile: (s) => wordTile(s, '#00703C', '#fff', 'M&T', { weight: 800, sizeRatio: 0.3 }) },
  fifththird:   { match: /fifth third|5\/3/i, name: 'Fifth Third Bank', color: '#0060A9', tile: (s) => wordTile(s, '#0060A9', '#fff', '5/3', { weight: 800, sizeRatio: 0.34 }) },
  disney:       { match: /disney/i, name: 'The Walt Disney Company', color: '#113CCF', tile: (s) => wordTile(s, '#fff', '#113CCF', 'D', { font: 'Georgia, serif', weight: 700, sizeRatio: 0.55 }) },
  fedex:        { match: /fedex/i, name: 'FedEx', color: '#4D148C', tile: (s) => (
    <div style={tileStyle(s, '#fff', { border: '1px solid #e8e8e8' })}>
      <span style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: 800, fontSize: s * 0.3, letterSpacing: '-0.05em' }}>
        <span style={{ color: '#4D148C' }}>Fed</span><span style={{ color: '#FF6600' }}>Ex</span>
      </span>
    </div>
  ) },
  ebay:         { match: /ebay/i, name: 'eBay', color: '#E53238', tile: (s) => (
    <div style={tileStyle(s, '#fff', { border: '1px solid #e8e8e8' })}>
      <span style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: 700, fontSize: s * 0.32, letterSpacing: '-0.05em' }}>
        <span style={{ color: '#E53238' }}>e</span><span style={{ color: '#0064D2' }}>b</span><span style={{ color: '#F5AF02' }}>a</span><span style={{ color: '#86B817' }}>y</span>
      </span>
    </div>
  ) },
  tesla:        { match: /tesla/i, name: 'Tesla', color: '#CC0000', tile: (s) => wordTile(s, '#000', '#E82127', 'T', { weight: 800, sizeRatio: 0.55 }) },
  bmw:          { match: /\bbmw\b/i, name: 'BMW Group', color: '#0066B1', tile: (s) => (
    <div style={tileStyle(s, '#fff', { border: '1px solid #e8e8e8' })}>
      <svg width={s * 0.6} height={s * 0.6} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="19" fill="#16171A" />
        <circle cx="20" cy="20" r="13" fill="#fff" />
        <path d="M20 7 A13 13 0 0 1 33 20 L20 20 Z" fill="#0066B1" />
        <path d="M7 20 A13 13 0 0 1 20 7 L20 20 Z" fill="#fff" />
        <path d="M20 33 A13 13 0 0 1 7 20 L20 20 Z" fill="#0066B1" />
        <path d="M33 20 A13 13 0 0 1 20 33 L20 20 Z" fill="#fff" />
      </svg>
    </div>
  ) },
  caterpillar:  { match: /caterpillar/i, name: 'Caterpillar Inc.', color: '#FFCD11', tile: (s) => wordTile(s, '#000', '#FFCD11', 'CAT', { weight: 900, sizeRatio: 0.32, font: "'Arial Black', sans-serif" }) },
};

// Network marks used on payment cards
export function VisaWordmark({ height = 18, color = '#fff' }: { height?: number; color?: string }) {
  return (
    <span style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: 800, fontStyle: 'italic', fontSize: height, color, letterSpacing: '-0.03em', lineHeight: 1 }}>VISA</span>
  );
}

export function MastercardCircles({ height = 26 }: { height?: number }) {
  const w = height * 1.6;
  return (
    <svg width={w} height={height} viewBox="0 0 48 30">
      <circle cx="18" cy="15" r="14" fill="#EB001B" />
      <circle cx="30" cy="15" r="14" fill="#F79E1B" opacity="0.95" />
      <path d="M24 4.2a14 14 0 0 1 0 21.6 14 14 0 0 1 0-21.6z" fill="#FF5F00" />
    </svg>
  );
}

export function ChaseOctagon({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      <path fill={color} d="M22.6 4h14.9c1 0 1.5.4 1.5 1.5v13.9L22.6 4z" />
      <path fill={color} d="M56 22.6v14.9c0 1-.4 1.5-1.5 1.5H40.6L56 22.6z" />
      <path fill={color} d="M37.4 56H22.5c-1 0-1.5-.4-1.5-1.5V40.6L37.4 56z" />
      <path fill={color} d="M4 37.4V22.5c0-1 .4-1.5 1.5-1.5h13.9L4 37.4z" />
    </svg>
  );
}

// ── Lookup helpers ────────────────────────────────────────────────────────────

const BRAND_LIST = Object.values(BRANDS);

export function findBrand(company: string): BrandDef | undefined {
  return BRAND_LIST.find((b) => b.match.test(company));
}

const TILE_HUES = [211, 262, 168, 24, 340, 199, 288, 145, 12, 46];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

export function CompanyLogo({ company, size = 48 }: { company: string; size?: number }) {
  const brand = findBrand(company);
  if (brand) return <>{brand.tile(size)}</>;
  const hue = TILE_HUES[hashStr(company) % TILE_HUES.length];
  const initials = company.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
  return (
    <div style={tileStyle(size, `hsl(${hue}deg 48% 34%)`)}>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: size * 0.36, fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif", userSelect: 'none' }}>{initials || '?'}</span>
    </div>
  );
}

export function getCompanyBanner(company: string): string | undefined {
  return findBrand(company)?.banner;
}

export function getBrandColor(company: string): string {
  const brand = findBrand(company);
  if (brand) return brand.color;
  const hue = TILE_HUES[hashStr(company) % TILE_HUES.length];
  return `hsl(${hue}deg 48% 34%)`;
}
