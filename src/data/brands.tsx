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
  | 'jpmorgan' | 'morganstanley' | 'blackrock' | 'citi' | 'bofa' | 'schwab' | 'polymarket'
  | 'chase' | 'pnc' | 'huntington' | 'keybank' | 'mtb' | 'fifththird'
  | 'disney' | 'fedex' | 'ebay' | 'tesla' | 'bmw' | 'caterpillar'
  | 'mmm' | 'att' | 'ge' | 'chevron' | 'exxon' | 'homedepot' | 'humana'
  | 'abbvie' | 'amgen' | 'aecom' | 'activision' | 'comcast' | 'ford' | 'gm'
  | 'mercedes' | 'airbnb' | 'hp' | 'dell' | 'leidos' | 'biogen' | 'bms' | 'iqvia'
  | 'target' | 'walmart' | 'costco' | 'bestbuy' | 'kroger' | 'cvs' | 'walgreens'
  | 'lowes' | 'macys' | 'nordstrom' | 'dollargeneral' | 'starbucks';

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
  polymarket:   { match: /polymarket/i, name: 'Polymarket', color: '#1d2b39', tile: (s) => (
    <div style={tileStyle(s, '#1d2b39')}>
      <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 32 32">
        <path d="M6 24 V8 l10 8 10-8 v16" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  ) },
  mmm:          { match: /^3m\b|3m company/i, name: '3M', color: '#FF0000', tile: (s) => wordTile(s, '#fff', '#FF0000', '3M', { weight: 900, sizeRatio: 0.44, font: "'Arial Black', sans-serif", tracking: '-0.06em' }) },
  att:          { match: /at&t/i, name: 'AT&T', color: '#00A8E0', tile: (s) => (
    <div style={tileStyle(s, '#fff', { border: '1px solid #e8e8e8', gap: s * 0.05 })}>
      <svg width={s * 0.44} height={s * 0.44} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="none" stroke="#00A8E0" strokeWidth="3.4" strokeDasharray="9 4 16 5 7 3" strokeLinecap="round" />
        <circle cx="16" cy="16" r="7" fill="#00A8E0" opacity="0.85" />
      </svg>
    </div>
  ) },
  ge:           { match: /general electric|\bge\b/i, name: 'GE', color: '#3874BA', tile: (s) => (
    <div style={tileStyle(s, '#3874BA')}>
      <span style={{ color: '#fff', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: s * 0.4 }}>GE</span>
    </div>
  ) },
  chevron:      { match: /chevron/i, name: 'Chevron', color: '#0054A4', tile: (s) => (
    <div style={tileStyle(s, '#fff', { border: '1px solid #e8e8e8', flexDirection: 'column', gap: 0 })}>
      <svg width={s * 0.5} height={s * 0.44} viewBox="0 0 40 34">
        <path d="M4 2 L20 12 L36 2 V12 L20 22 L4 12 Z" fill="#0054A4" />
        <path d="M4 14 L20 24 L36 14 V24 L20 34 L4 24 Z" fill="#E21836" />
      </svg>
    </div>
  ) },
  exxon:        { match: /exxon/i, name: 'ExxonMobil', color: '#FE000C', tile: (s) => wordTile(s, '#fff', '#FE000C', 'EM', { weight: 900, sizeRatio: 0.38, tracking: '-0.02em' }) },
  homedepot:    { match: /home depot/i, name: 'The Home Depot', color: '#F96302', tile: (s) => (
    <div style={tileStyle(s, '#F96302', { transform: 'none' })}>
      <span style={{ color: '#fff', fontWeight: 900, fontSize: s * 0.2, transform: 'rotate(-45deg)', letterSpacing: '0.02em', textAlign: 'center', lineHeight: 1.1 }}>THE HOME<br/>DEPOT</span>
    </div>
  ) },
  humana:       { match: /humana/i, name: 'Humana', color: '#78BE20', tile: (s) => wordTile(s, '#fff', '#5C9E31', 'Humana.', { weight: 700, sizeRatio: 0.2 }) },
  abbvie:       { match: /abbvie/i, name: 'AbbVie', color: '#071D49', tile: (s) => wordTile(s, '#fff', '#071D49', 'abbvie', { weight: 700, sizeRatio: 0.24 }) },
  amgen:        { match: /amgen/i, name: 'Amgen', color: '#0063C3', tile: (s) => wordTile(s, '#0063C3', '#fff', 'AMGEN', { weight: 800, sizeRatio: 0.2, tracking: '0.04em' }) },
  aecom:        { match: /aecom/i, name: 'AECOM', color: '#008768', tile: (s) => wordTile(s, '#fff', '#008768', 'AECOM', { weight: 800, sizeRatio: 0.22, tracking: '0.02em' }) },
  activision:   { match: /activision/i, name: 'Activision', color: '#000', tile: (s) => wordTile(s, '#000', '#fff', 'ATVI', { weight: 800, sizeRatio: 0.26, tracking: '0.06em' }) },
  comcast:      { match: /comcast/i, name: 'Comcast', color: '#645FAA', tile: (s) => wordTile(s, '#fff', '#1F2C5C', 'C', { weight: 800, sizeRatio: 0.5 }) },
  ford:         { match: /ford motor/i, name: 'Ford', color: '#003478', tile: (s) => (
    <div style={tileStyle(s, '#fff', { border: '1px solid #e8e8e8' })}>
      <span style={{ background: '#003478', borderRadius: '50%/50%', width: s * 0.7, height: s * 0.42, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: s * 0.22, border: `${Math.max(1, s * 0.02)}px solid #9ab0d0` }}>Ford</span>
    </div>
  ) },
  gm:           { match: /general motors/i, name: 'General Motors', color: '#0A70C7', tile: (s) => wordTile(s, '#0A70C7', '#fff', 'gm', { weight: 800, sizeRatio: 0.4 }) },
  mercedes:     { match: /mercedes/i, name: 'Mercedes-Benz Group', color: '#9A9A9A', tile: (s) => (
    <div style={tileStyle(s, '#16171A')}>
      <svg width={s * 0.62} height={s * 0.62} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="none" stroke="#d7d7d7" strokeWidth="2.4" />
        <path d="M20 3.4 L20 20 M20 20 L6 30 M20 20 L34 30" stroke="#d7d7d7" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    </div>
  ) },
  airbnb:       { match: /airbnb/i, name: 'Airbnb', color: '#FF5A5F', tile: (s) => (
    <div style={tileStyle(s, '#fff', { border: '1px solid #e8e8e8' })}>
      <svg width={s * 0.56} height={s * 0.56} viewBox="0 0 32 32">
        <path d="M16 4 C18 4 19.4 5.2 20.6 7.6 L27 20.6 C28.4 23.6 27 27 23.8 27 C21.6 27 19.6 25.4 16 21.4 C12.4 25.4 10.4 27 8.2 27 C5 27 3.6 23.6 5 20.6 L11.4 7.6 C12.6 5.2 14 4 16 4 Z M16 9 C15.2 9 14.6 9.6 13.8 11.2 L9 21.4 C8.4 22.8 9 24 10.2 24 C11.4 24 13 22.6 16 19 C19 22.6 20.6 24 21.8 24 C23 24 23.6 22.8 23 21.4 L18.2 11.2 C17.4 9.6 16.8 9 16 9 Z" fill="#FF5A5F" />
      </svg>
    </div>
  ) },
  hp:           { match: /\bhp inc|hewlett packard|\bhpe\b/i, name: 'HP', color: '#0096D6', tile: (s) => (
    <div style={tileStyle(s, '#0096D6')}>
      <span style={{ color: '#fff', fontWeight: 800, fontStyle: 'italic', fontSize: s * 0.36, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>hp</span>
    </div>
  ) },
  dell:         { match: /\bdell\b/i, name: 'Dell Technologies', color: '#007DB8', tile: (s) => (
    <div style={tileStyle(s, '#fff', { border: '1px solid #e8e8e8' })}>
      <svg width={s * 0.6} height={s * 0.6} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="17" fill="none" stroke="#007DB8" strokeWidth="3" />
        <text x="20" y="25" textAnchor="middle" fontSize="13" fontWeight="800" fill="#007DB8" fontFamily="Helvetica, Arial">DELL</text>
      </svg>
    </div>
  ) },
  leidos:       { match: /leidos/i, name: 'Leidos', color: '#7A28C7', tile: (s) => wordTile(s, '#fff', '#3A1A6E', 'leidos', { weight: 700, sizeRatio: 0.24 }) },
  biogen:       { match: /biogen/i, name: 'Biogen', color: '#00539B', tile: (s) => wordTile(s, '#fff', '#00539B', 'Biogen', { weight: 700, sizeRatio: 0.24 }) },
  bms:          { match: /bristol/i, name: 'Bristol Myers Squibb', color: '#BE2BBB', tile: (s) => wordTile(s, '#fff', '#BE2BBB', 'BMS', { weight: 800, sizeRatio: 0.3 }) },
  iqvia:        { match: /iqvia/i, name: 'IQVIA', color: '#00AEEF', tile: (s) => wordTile(s, '#fff', '#005587', 'IQVIA', { weight: 800, sizeRatio: 0.26 }) },
  target:       { match: /\btarget\b/i, name: 'Target', color: '#CC0000', tile: (s) => (
    <div style={tileStyle(s, '#fff', { border: '1px solid #e8e8e8' })}>
      <svg width={s * 0.62} height={s * 0.62} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="19" fill="#CC0000" />
        <circle cx="20" cy="20" r="12.5" fill="#fff" />
        <circle cx="20" cy="20" r="6.5" fill="#CC0000" />
      </svg>
    </div>
  ), banner: `${BANNERS}/target.webp` },
  walmart:      { match: /walmart/i, name: 'Walmart', color: '#0071CE', tile: (s) => (
    <div style={tileStyle(s, '#0071CE')}>
      <svg width={s * 0.58} height={s * 0.58} viewBox="0 0 40 40">
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <rect key={deg} x="17.6" y="4" width="4.8" height="11" rx="2.4" fill="#FFC220" transform={`rotate(${deg} 20 20)`} />
        ))}
      </svg>
    </div>
  ), banner: `${BANNERS}/walmart.webp` },
  costco:       { match: /costco/i, name: 'Costco Wholesale', color: '#E31837', tile: (s) => (
    <div style={tileStyle(s, '#fff', { border: '1px solid #e8e8e8', flexDirection: 'column', gap: 0 })}>
      <span style={{ color: '#E31837', fontWeight: 800, fontSize: s * 0.24, letterSpacing: '-0.02em' }}>COSTCO</span>
      <span style={{ color: '#005DAA', fontWeight: 700, fontSize: s * 0.11, letterSpacing: '0.1em' }}>WHOLESALE</span>
    </div>
  ) },
  bestbuy:      { match: /best buy/i, name: 'Best Buy', color: '#0046BE', tile: (s) => (
    <div style={tileStyle(s, '#0046BE')}>
      <svg width={s * 0.6} height={s * 0.5} viewBox="0 0 44 36">
        <path d="M2 12 L34 4 L34 28 L2 34 Z" fill="#FFF200" />
        <text x="17" y="23" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0046BE" fontFamily="Arial" transform="rotate(-6 17 20)">BEST</text>
      </svg>
    </div>
  ) },
  kroger:       { match: /kroger/i, name: 'Kroger', color: '#0F4C92', tile: (s) => wordTile(s, '#fff', '#0F4C92', 'Kroger', { weight: 800, sizeRatio: 0.24, italic: true }) },
  cvs:          { match: /\bcvs\b/i, name: 'CVS Health', color: '#CC0000', tile: (s) => (
    <div style={tileStyle(s, '#fff', { border: '1px solid #e8e8e8', flexDirection: 'column', gap: s * 0.02 })}>
      <span style={{ color: '#CC0000', fontWeight: 900, fontSize: s * 0.3, letterSpacing: '-0.02em' }}>CVS</span>
      <svg width={s * 0.4} height={s * 0.14} viewBox="0 0 40 12"><path d="M4 6 C10 0 14 0 20 6 C26 12 30 12 36 6" fill="none" stroke="#CC0000" strokeWidth="3.4" strokeLinecap="round" /></svg>
    </div>
  ) },
  walgreens:    { match: /walgreens/i, name: 'Walgreens', color: '#E31837', tile: (s) => (
    <div style={tileStyle(s, '#E31837')}>
      <span style={{ color: '#fff', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: s * 0.5 }}>W</span>
    </div>
  ) },
  lowes:        { match: /lowe'?s/i, name: "Lowe's", color: '#004990', tile: (s) => (
    <div style={tileStyle(s, '#004990', { flexDirection: 'column', gap: 0 })}>
      <svg width={s * 0.6} height={s * 0.28} viewBox="0 0 40 16"><path d="M2 14 L20 2 L38 14 Z" fill="none" stroke="#fff" strokeWidth="2.6" /></svg>
      <span style={{ color: '#fff', fontWeight: 800, fontSize: s * 0.17, letterSpacing: '0.06em' }}>LOWE'S</span>
    </div>
  ) },
  macys:        { match: /macy'?s/i, name: "Macy's", color: '#E21A2C', tile: (s) => (
    <div style={tileStyle(s, '#fff', { border: '1px solid #e8e8e8' })}>
      <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 32 32">
        <path d="M16 2 L19.4 11.6 L29.6 11.8 L21.5 18 L24.4 27.8 L16 22 L7.6 27.8 L10.5 18 L2.4 11.8 L12.6 11.6 Z" fill="#E21A2C" />
      </svg>
    </div>
  ) },
  nordstrom:    { match: /nordstrom/i, name: 'Nordstrom', color: '#000', tile: (s) => wordTile(s, '#000', '#fff', 'N', { weight: 400, sizeRatio: 0.55, font: 'Georgia, serif' }) },
  dollargeneral:{ match: /dollar general/i, name: 'Dollar General', color: '#FFC726', tile: (s) => wordTile(s, '#FFC726', '#000', 'DG', { weight: 900, sizeRatio: 0.42 }) },
  starbucks:    { match: /starbucks/i, name: 'Starbucks', color: '#00704A', tile: (s) => (
    <div style={tileStyle(s, '#00704A')}>
      <svg width={s * 0.6} height={s * 0.6} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="none" stroke="#fff" strokeWidth="2" />
        <circle cx="20" cy="14" r="4.4" fill="#fff" />
        <path d="M13 22 C13 18 27 18 27 22 C27 28 24 31 20 31 C16 31 13 28 13 22 Z" fill="#fff" />
      </svg>
    </div>
  ) },
};

// ── Standalone marks (sponsors, AI assistants, HR platforms) ─────────────────

export function PolymarketMark({ height = 20, dark = false }: { height?: number; dark?: boolean }) {
  const fg = dark ? '#fff' : '#1d2b39';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: height * 0.35, lineHeight: 1 }}>
      <svg width={height} height={height} viewBox="0 0 32 32">
        <rect width="32" height="32" rx="7" fill="#1d2b39" />
        <path d="M8 22 V10 l8 6 8-6 v12" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: 700, fontSize: height * 0.78, color: fg, letterSpacing: '-0.02em' }}>Polymarket</span>
    </span>
  );
}

export function ClaudeSpark({ size = 20 }: { size?: number }) {
  // Anthropic's Claude starburst
  const rays = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      {rays.map((deg) => (
        <path key={deg} d="M16 16 L16 3.5" stroke="#D97757" strokeWidth="3.4" strokeLinecap="round" transform={`rotate(${deg} 16 16)`} />
      ))}
      <circle cx="16" cy="16" r="4.4" fill="#D97757" />
    </svg>
  );
}

export function ChatGptKnot({ size = 20, color = '#000' }: { size?: number; color?: string }) {
  // Simplified OpenAI hexagonal knot
  const arms = Array.from({ length: 6 }, (_, i) => i * 60);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      {arms.map((deg) => (
        <path
          key={deg}
          d="M16 5.4 a10.6 10.6 0 0 1 9.18 5.3 l-4.6 8 a5.3 5.3 0 0 1-4.58 2.65"
          fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          transform={`rotate(${deg} 16 16)`}
        />
      ))}
    </svg>
  );
}

export function GeminiSpark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs>
        <linearGradient id="gemGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4285F4" />
          <stop offset="0.5" stopColor="#9B72CB" />
          <stop offset="1" stopColor="#D96570" />
        </linearGradient>
      </defs>
      <path d="M16 2 C17.2 9.6 22.4 14.8 30 16 C22.4 17.2 17.2 22.4 16 30 C14.8 22.4 9.6 17.2 2 16 C9.6 14.8 14.8 9.6 16 2 Z" fill="url(#gemGrad)" />
    </svg>
  );
}

export function WorkdayLogo({ height = 22 }: { height?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: height * 0.28, lineHeight: 1 }}>
      <svg width={height} height={height} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="#F38B00" />
        <path d="M7 12 l3.2 9 3-7.4 2.8 7.4 3-7.4 2.8 7.4 3.2-9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: 600, fontSize: height * 0.82, color: '#005cb9', letterSpacing: '-0.02em' }}>workday<span style={{ color: '#F38B00' }}>.</span></span>
    </span>
  );
}

export function AdpLogo({ height = 22 }: { height?: number }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: '#d0271d', borderRadius: height * 0.22,
      padding: `${height * 0.14}px ${height * 0.36}px`, lineHeight: 1,
    }}>
      <span style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: 800, fontStyle: 'italic', fontSize: height * 0.82, color: '#fff', letterSpacing: '-0.01em' }}>ADP</span>
    </span>
  );
}

export function GmailM({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 48 36">
      <path d="M4 36 h7 V16 L0 8 v24 a4 4 0 0 0 4 4z" fill="#4285F4" />
      <path d="M37 36 h7 a4 4 0 0 0 4-4 V8 l-11 8z" fill="#34A853" />
      <path d="M11 16 24 25.5 37 16 V6 L24 15.5 11 6z" fill="#EA4335" />
      <path d="M0 8 l11 8 V6 L6.5 2.6 A4 4 0 0 0 0 5.8z" fill="#C5221F" />
      <path d="M48 8 l-11 8 V6 l4.5-3.4 A4 4 0 0 1 48 5.8z" fill="#FBBC04" />
    </svg>
  );
}

export function GoogleWordmark({ height = 34 }: { height?: number }) {
  const letters: Array<[string, string]> = [['G', '#4285F4'], ['o', '#EA4335'], ['o', '#FBBC04'], ['g', '#4285F4'], ['l', '#34A853'], ['e', '#EA4335']];
  return (
    <span style={{ fontFamily: "'Product Sans', 'Century Gothic', 'Futura', 'Segoe UI', sans-serif", fontWeight: 500, fontSize: height, letterSpacing: '-0.02em', lineHeight: 1 }}>
      {letters.map(([ch, color], i) => <span key={i} style={{ color }}>{ch}</span>)}
    </span>
  );
}

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
