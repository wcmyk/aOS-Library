import { useMemo, useState } from 'react';
import { useWalletStore, nextOrderId, type WalletOrder } from '../../../state/useWalletStore';
import { useMailStore } from '../../../state/useMailStore';
import './apple.css';

/*
 * Apple.com replica — a full multi-page storefront rendered inside Safari.
 * Internal navigation uses a view union (no router), mirroring the pattern in
 * AdpSite/WorkdaySite. Shopping is real: checkout writes a WalletOrder so the
 * charge appears in the Chase banking app, exactly like the Amazon site. The
 * "Talk to a Specialist" advisor flow sends a real email via the mail store.
 */

type View =
  | { name: 'home' }
  | { name: 'store'; category: Category | 'all' }
  | { name: 'product'; id: string }
  | { name: 'bag' }
  | { name: 'checkout' }
  | { name: 'support' }
  | { name: 'specialist' };

type Category = 'Mac' | 'iPad' | 'iPhone' | 'Watch' | 'AirPods' | 'Accessories';

type Product = {
  id: string;
  name: string;
  category: Category;
  tagline: string;
  from: number;
  colors: { name: string; hex: string }[];
  options?: { label: string; values: { name: string; delta: number }[] };
  emoji: string;
  grad: [string, string];
  bullets: string[];
};

type BagLine = { id: string; name: string; color: string; option?: string; price: number; qty: number };

const PRODUCTS: Product[] = [
  {
    id: 'iphone-15-pro', name: 'iPhone 15 Pro', category: 'iPhone', tagline: 'Titanium. So strong. So light. So Pro.',
    from: 999, emoji: '📱', grad: ['#2b2b30', '#4a4a52'],
    colors: [{ name: 'Natural Titanium', hex: '#b3ada4' }, { name: 'Blue Titanium', hex: '#535d67' }, { name: 'White Titanium', hex: '#f2f1ec' }, { name: 'Black Titanium', hex: '#3b3b3d' }],
    options: { label: 'Storage', values: [{ name: '128GB', delta: 0 }, { name: '256GB', delta: 100 }, { name: '512GB', delta: 300 }, { name: '1TB', delta: 500 }] },
    bullets: ['6.1” Super Retina XDR display', 'A17 Pro chip', 'Pro camera system · 48MP', 'USB‑C · Action button'],
  },
  {
    id: 'iphone-15', name: 'iPhone 15', category: 'iPhone', tagline: 'New camera. New design. Newphoria.',
    from: 799, emoji: '📱', grad: ['#f3b7c5', '#a7c7e7'],
    colors: [{ name: 'Pink', hex: '#f4c6cf' }, { name: 'Yellow', hex: '#efe3a8' }, { name: 'Green', hex: '#c8d6c0' }, { name: 'Blue', hex: '#c3d3df' }, { name: 'Black', hex: '#3b3b3d' }],
    options: { label: 'Storage', values: [{ name: '128GB', delta: 0 }, { name: '256GB', delta: 100 }, { name: '512GB', delta: 300 }] },
    bullets: ['6.1” Super Retina XDR display', 'A16 Bionic chip', 'Dynamic Island', '48MP Main camera'],
  },
  {
    id: 'macbook-air', name: 'MacBook Air 15”', category: 'Mac', tagline: 'Impressively big. Impossibly thin.',
    from: 1299, emoji: '💻', grad: ['#dfe4ea', '#b9c2cc'],
    colors: [{ name: 'Midnight', hex: '#2e3641' }, { name: 'Starlight', hex: '#e9e2d4' }, { name: 'Silver', hex: '#e3e4e6' }, { name: 'Space Gray', hex: '#7d7f82' }],
    options: { label: 'Memory', values: [{ name: '8GB', delta: 0 }, { name: '16GB', delta: 200 }, { name: '24GB', delta: 400 }] },
    bullets: ['15.3” Liquid Retina display', 'Apple M2 chip', 'Up to 18 hours battery', '1080p FaceTime HD camera'],
  },
  {
    id: 'macbook-pro', name: 'MacBook Pro 14”', category: 'Mac', tagline: 'Mind-blowing. Head-turning.',
    from: 1999, emoji: '💻', grad: ['#3a3a3f', '#5c5c63'],
    colors: [{ name: 'Space Black', hex: '#2b2b2d' }, { name: 'Silver', hex: '#e3e4e6' }],
    options: { label: 'Chip', values: [{ name: 'M3', delta: 0 }, { name: 'M3 Pro', delta: 200 }, { name: 'M3 Max', delta: 700 }] },
    bullets: ['14.2” Liquid Retina XDR display', 'M3 family performance', 'Up to 22 hours battery', 'Three Thunderbolt 4 ports'],
  },
  {
    id: 'ipad-pro', name: 'iPad Pro', category: 'iPad', tagline: 'Supercharged by M2.',
    from: 799, emoji: '▭', grad: ['#e7e9ec', '#c4cad1'],
    colors: [{ name: 'Silver', hex: '#e3e4e6' }, { name: 'Space Gray', hex: '#7d7f82' }],
    options: { label: 'Storage', values: [{ name: '128GB', delta: 0 }, { name: '256GB', delta: 100 }, { name: '512GB', delta: 300 }, { name: '1TB', delta: 700 }] },
    bullets: ['11” or 12.9” Liquid Retina display', 'Apple M2 chip', 'Works with Apple Pencil', 'Thunderbolt / USB‑C'],
  },
  {
    id: 'ipad-air', name: 'iPad Air', category: 'iPad', tagline: 'Light. Bright. Full of might.',
    from: 599, emoji: '▭', grad: ['#c9dbe8', '#9db9cf'],
    colors: [{ name: 'Blue', hex: '#a9c6db' }, { name: 'Purple', hex: '#c3bcd8' }, { name: 'Starlight', hex: '#e9e2d4' }, { name: 'Space Gray', hex: '#7d7f82' }],
    options: { label: 'Storage', values: [{ name: '64GB', delta: 0 }, { name: '256GB', delta: 150 }] },
    bullets: ['10.9” Liquid Retina display', 'Apple M1 chip', 'Touch ID', 'USB‑C connector'],
  },
  {
    id: 'watch-9', name: 'Apple Watch Series 9', category: 'Watch', tagline: 'Smarter. Brighter. Mightier.',
    from: 399, emoji: '⌚', grad: ['#1f2933', '#3d4a57'],
    colors: [{ name: 'Midnight', hex: '#2e3641' }, { name: 'Starlight', hex: '#e9e2d4' }, { name: 'Silver', hex: '#e3e4e6' }, { name: 'Pink', hex: '#f4c6cf' }, { name: '(PRODUCT)RED', hex: '#b8272f' }],
    options: { label: 'Case', values: [{ name: '41mm', delta: 0 }, { name: '45mm', delta: 30 }] },
    bullets: ['Always-On Retina display', 'S9 SiP · Double Tap', 'Advanced health sensors', 'Carbon neutral options'],
  },
  {
    id: 'watch-ultra', name: 'Apple Watch Ultra 2', category: 'Watch', tagline: 'The most rugged and capable.',
    from: 799, emoji: '⌚', grad: ['#3a3320', '#6b5e3a'],
    colors: [{ name: 'Titanium', hex: '#b3ada4' }],
    options: { label: 'Band', values: [{ name: 'Trail Loop', delta: 0 }, { name: 'Ocean Band', delta: 0 }, { name: 'Alpine Loop', delta: 0 }] },
    bullets: ['49mm titanium case', 'Brightest Apple display · 3000 nits', 'Precision dual-frequency GPS', 'Up to 36 hours battery'],
  },
  {
    id: 'airpods-pro', name: 'AirPods Pro', category: 'AirPods', tagline: 'Adaptive Audio. Now playing.',
    from: 249, emoji: '🎧', grad: ['#eef0f2', '#cfd4da'],
    colors: [{ name: 'White', hex: '#f4f4f5' }],
    bullets: ['Active Noise Cancellation', 'Adaptive Audio', 'USB‑C charging case', 'Personalized Spatial Audio'],
  },
  {
    id: 'airpods-max', name: 'AirPods Max', category: 'AirPods', tagline: 'A magical listening experience.',
    from: 549, emoji: '🎧', grad: ['#d7dde6', '#aab4c2'],
    colors: [{ name: 'Space Gray', hex: '#7d7f82' }, { name: 'Silver', hex: '#e3e4e6' }, { name: 'Sky Blue', hex: '#a9c6db' }, { name: 'Pink', hex: '#f4c6cf' }, { name: 'Green', hex: '#c8d6c0' }],
    bullets: ['High-fidelity audio', 'Active Noise Cancellation', 'Spatial Audio', '20 hours of listening'],
  },
];

const NAV: { label: string; category?: Category | 'all'; view?: View }[] = [
  { label: 'Store', view: { name: 'store', category: 'all' } },
  { label: 'Mac', category: 'Mac' },
  { label: 'iPad', category: 'iPad' },
  { label: 'iPhone', category: 'iPhone' },
  { label: 'Watch', category: 'Watch' },
  { label: 'AirPods', category: 'AirPods' },
  { label: 'Support', view: { name: 'support' } },
];

const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function AppleSite() {
  const [view, setView] = useState<View>({ name: 'home' });
  const [bag, setBag] = useState<BagLine[]>([]);
  const addOrder = useWalletStore((s) => s.addOrder);

  const bagCount = bag.reduce((s, l) => s + l.qty, 0);
  const go = (v: View) => setView(v);

  return (
    <div className="ap">
      <nav className="ap-nav">
        <button className="ap-logo" onClick={() => go({ name: 'home' })} aria-label="Apple"></button>
        {NAV.map((n) => (
          <button
            key={n.label}
            className="ap-nav-link"
            onClick={() => go(n.view ?? { name: 'store', category: n.category ?? 'all' })}
          >{n.label}</button>
        ))}
        <button className="ap-nav-icon" onClick={() => go({ name: 'store', category: 'all' })} aria-label="Search">⌕</button>
        <button className="ap-nav-icon ap-bag" onClick={() => go({ name: 'bag' })} aria-label="Bag">
          🛍{bagCount > 0 && <span className="ap-bag-count">{bagCount}</span>}
        </button>
      </nav>

      <div className="ap-body">
        {view.name === 'home' && <Home go={go} />}
        {view.name === 'store' && <Store category={view.category} go={go} />}
        {view.name === 'product' && <ProductPage id={view.id} go={go} onAdd={(l) => { setBag((b) => mergeLine(b, l)); go({ name: 'bag' }); }} />}
        {view.name === 'bag' && <Bag bag={bag} setBag={setBag} go={go} />}
        {view.name === 'checkout' && <Checkout bag={bag} go={go} onPlaced={() => setBag([])} addOrder={addOrder} />}
        {view.name === 'support' && <Support go={go} />}
        {view.name === 'specialist' && <Specialist go={go} />}
      </div>

      <footer className="ap-footer">
        <div className="ap-footer-cols">
          <div><h5>Shop and Learn</h5>{['Store', 'Mac', 'iPad', 'iPhone', 'Watch', 'AirPods', 'Accessories'].map((x) => <a key={x} onClick={() => go({ name: 'store', category: (x === 'Store' ? 'all' : x) as Category })}>{x}</a>)}</div>
          <div><h5>Services</h5>{['Apple Music', 'Apple TV+', 'iCloud+', 'Apple One', 'Apple Card'].map((x) => <a key={x}>{x}</a>)}</div>
          <div><h5>Apple Store</h5><a onClick={() => go({ name: 'store', category: 'all' })}>Shop the Store</a><a onClick={() => go({ name: 'specialist' })}>Ways to Buy</a><a onClick={() => go({ name: 'support' })}>Order Status</a><a onClick={() => go({ name: 'support' })}>Returns</a></div>
          <div><h5>For Support</h5><a onClick={() => go({ name: 'support' })}>Apple Support</a><a onClick={() => go({ name: 'specialist' })}>Talk to a Specialist</a><a onClick={() => go({ name: 'support' })}>AppleCare+</a></div>
        </div>
        <div className="ap-footer-legal">Copyright © {new Date().getFullYear()} Apple Inc. All rights reserved. &nbsp;·&nbsp; Privacy Policy &nbsp;·&nbsp; Terms of Use &nbsp;·&nbsp; Sales and Refunds</div>
      </footer>
    </div>
  );
}

function mergeLine(bag: BagLine[], line: BagLine): BagLine[] {
  const key = (l: BagLine) => `${l.id}|${l.color}|${l.option ?? ''}`;
  const found = bag.find((l) => key(l) === key(line));
  if (found) return bag.map((l) => (key(l) === key(line) ? { ...l, qty: l.qty + line.qty } : l));
  return [...bag, line];
}

// ─────────────────────────── Home ───────────────────────────
function Home({ go }: { go: (v: View) => void }) {
  const heroes = PRODUCTS.filter((p) => ['iphone-15-pro', 'macbook-pro', 'watch-ultra', 'ipad-pro'].includes(p.id));
  return (
    <div className="ap-home">
      <section className="ap-hero" style={{ background: `linear-gradient(180deg, ${heroes[0].grad[0]}, ${heroes[0].grad[1]})` }}>
        <h1>iPhone 15 Pro</h1>
        <p>Titanium. So strong. So light. So Pro.</p>
        <div className="ap-hero-links">
          <button className="ap-link" onClick={() => go({ name: 'product', id: 'iphone-15-pro' })}>Learn more ›</button>
          <button className="ap-link" onClick={() => go({ name: 'product', id: 'iphone-15-pro' })}>Buy ›</button>
        </div>
        <div className="ap-hero-emoji">📱</div>
      </section>
      <div className="ap-hero-grid">
        {heroes.slice(1).map((p) => (
          <section key={p.id} className="ap-hero ap-hero-sm" style={{ background: `linear-gradient(180deg, ${p.grad[0]}, ${p.grad[1]})` }}>
            <h2>{p.name}</h2>
            <p>{p.tagline}</p>
            <div className="ap-hero-links">
              <button className="ap-link" onClick={() => go({ name: 'product', id: p.id })}>Learn more ›</button>
              <button className="ap-link" onClick={() => go({ name: 'product', id: p.id })}>Buy ›</button>
            </div>
            <div className="ap-hero-emoji">{p.emoji}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────── Store ───────────────────────────
function Store({ category, go }: { category: Category | 'all'; go: (v: View) => void }) {
  const [cat, setCat] = useState<Category | 'all'>(category);
  const cats: (Category | 'all')[] = ['all', 'Mac', 'iPad', 'iPhone', 'Watch', 'AirPods'];
  const list = useMemo(() => (cat === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat)), [cat]);
  return (
    <div className="ap-store">
      <header className="ap-store-head">
        <h1>Store. <span>The best way to buy the products you love.</span></h1>
      </header>
      <div className="ap-chiprow">
        {cats.map((c) => (
          <button key={c} className={`ap-chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c === 'all' ? 'All Products' : c}</button>
        ))}
      </div>
      <div className="ap-grid">
        {list.map((p) => (
          <button key={p.id} className="ap-card" onClick={() => go({ name: 'product', id: p.id })}>
            <div className="ap-card-img" style={{ background: `linear-gradient(150deg, ${p.grad[0]}, ${p.grad[1]})` }}><span>{p.emoji}</span></div>
            <div className="ap-card-cat">{p.category}</div>
            <div className="ap-card-name">{p.name}</div>
            <div className="ap-card-tag">{p.tagline}</div>
            <div className="ap-card-price">From {money(p.from)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────── Product ───────────────────────────
function ProductPage({ id, go, onAdd }: { id: string; go: (v: View) => void; onAdd: (l: BagLine) => void }) {
  const p = PRODUCTS.find((x) => x.id === id)!;
  const [color, setColor] = useState(p.colors[0].name);
  const [opt, setOpt] = useState(p.options?.values[0].name ?? '');
  const optDelta = p.options?.values.find((v) => v.name === opt)?.delta ?? 0;
  const price = p.from + optDelta;
  const colorHex = p.colors.find((c) => c.name === color)?.hex ?? '#ccc';

  return (
    <div className="ap-product">
      <div className="ap-product-media" style={{ background: `linear-gradient(160deg, ${p.grad[0]}, ${p.grad[1]})` }}>
        <div className="ap-product-emoji" style={{ filter: `drop-shadow(0 12px 30px ${colorHex}88)` }}>{p.emoji}</div>
      </div>
      <div className="ap-product-info">
        <div className="ap-crumb"><button onClick={() => go({ name: 'store', category: p.category })}>‹ {p.category}</button></div>
        <h1>{p.name}</h1>
        <p className="ap-product-tag">{p.tagline}</p>
        <div className="ap-product-price">From {money(price)}</div>

        <div className="ap-opt">
          <div className="ap-opt-label">Finish — <b>{color}</b></div>
          <div className="ap-swatches">
            {p.colors.map((c) => (
              <button key={c.name} className={`ap-swatch ${color === c.name ? 'on' : ''}`} style={{ background: c.hex }} onClick={() => setColor(c.name)} aria-label={c.name} />
            ))}
          </div>
        </div>

        {p.options && (
          <div className="ap-opt">
            <div className="ap-opt-label">{p.options.label}</div>
            <div className="ap-opt-btns">
              {p.options.values.map((v) => (
                <button key={v.name} className={`ap-opt-btn ${opt === v.name ? 'on' : ''}`} onClick={() => setOpt(v.name)}>
                  <span>{v.name}</span><span className="ap-opt-price">{money(p.from + v.delta)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <ul className="ap-bullets">{p.bullets.map((b) => <li key={b}>{b}</li>)}</ul>

        <div className="ap-buy-row">
          <button className="ap-buy" onClick={() => onAdd({ id: p.id, name: p.name, color, option: p.options ? opt : undefined, price, qty: 1 })}>Add to Bag</button>
          <button className="ap-buy-outline" onClick={() => go({ name: 'specialist' })}>Talk to a Specialist</button>
        </div>
        <div className="ap-buy-note">Free delivery · Or pick up available · Pay monthly at 0% APR with Apple Card¹</div>
      </div>
    </div>
  );
}

// ─────────────────────────── Bag ───────────────────────────
function Bag({ bag, setBag, go }: { bag: BagLine[]; setBag: (f: (b: BagLine[]) => BagLine[]) => void; go: (v: View) => void }) {
  const subtotal = bag.reduce((s, l) => s + l.price * l.qty, 0);
  if (bag.length === 0) {
    return (
      <div className="ap-bag-empty">
        <h1>Your bag is empty.</h1>
        <button className="ap-link" onClick={() => go({ name: 'store', category: 'all' })}>Continue shopping ›</button>
      </div>
    );
  }
  return (
    <div className="ap-bagpage">
      <h1>Review your bag.</h1>
      <p className="ap-bag-ship">Free delivery and free returns.</p>
      <div className="ap-bag-lines">
        {bag.map((l, i) => (
          <div key={i} className="ap-bag-line">
            <div className="ap-bag-thumb">{PRODUCTS.find((p) => p.id === l.id)?.emoji}</div>
            <div className="ap-bag-desc">
              <div className="ap-bag-name">{l.name}</div>
              <div className="ap-bag-sub">{l.color}{l.option ? ` · ${l.option}` : ''}</div>
              <button className="ap-bag-remove" onClick={() => setBag((b) => b.filter((_, j) => j !== i))}>Remove</button>
            </div>
            <div className="ap-bag-qty">
              <button onClick={() => setBag((b) => b.map((x, j) => (j === i ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))}>−</button>
              <span>{l.qty}</span>
              <button onClick={() => setBag((b) => b.map((x, j) => (j === i ? { ...x, qty: x.qty + 1 } : x)))}>+</button>
            </div>
            <div className="ap-bag-price">{money(l.price * l.qty)}</div>
          </div>
        ))}
      </div>
      <div className="ap-bag-summary">
        <div className="ap-bag-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
        <div className="ap-bag-row"><span>Shipping</span><span>FREE</span></div>
        <div className="ap-bag-row ap-bag-total"><span>Total</span><span>{money(subtotal)}</span></div>
        <button className="ap-buy ap-bag-checkout" onClick={() => go({ name: 'checkout' })}>Check Out</button>
      </div>
    </div>
  );
}

// ─────────────────────────── Checkout ───────────────────────────
function Checkout({ bag, go, onPlaced, addOrder }: { bag: BagLine[]; go: (v: View) => void; onPlaced: () => void; addOrder: (o: WalletOrder) => void }) {
  const [placed, setPlaced] = useState<{ id: string; total: number } | null>(null);
  const [pay, setPay] = useState<'chk' | 'cc-sapphire'>('chk');
  const subtotal = bag.reduce((s, l) => s + l.price * l.qty, 0);
  const tax = Math.round(subtotal * 0.08875 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  if (placed) {
    return (
      <div className="ap-thanks">
        <div className="ap-thanks-check">✓</div>
        <h1>Thank you for your order.</h1>
        <p>Order <b>{placed.id}</b> · {money(placed.total)} charged to your {pay === 'chk' ? 'Chase Checking' : 'Sapphire Reserve'}.</p>
        <p className="ap-thanks-sub">A confirmation and shipping details are on the way. You can track this charge in the Chase app.</p>
        <button className="ap-buy" onClick={() => go({ name: 'home' })}>Continue shopping</button>
      </div>
    );
  }

  const place = () => {
    const id = nextOrderId();
    const order: WalletOrder = {
      id, date: new Date().toISOString(),
      desc: `APPLE.COM/BILL 800-676-2775 CA`,
      total, itemCount: bag.reduce((s, l) => s + l.qty, 0),
      items: bag.map((l) => ({ id: l.id, title: `${l.name} (${l.color})`, price: l.price, qty: l.qty })),
      accountId: pay, accountKind: pay === 'chk' ? 'checking' : 'credit',
      last4: pay === 'chk' ? '1666' : '0077', cardName: pay === 'chk' ? 'Chase Total Checking' : 'Sapphire Reserve',
    };
    addOrder(order);
    onPlaced();
    setPlaced({ id, total });
  };

  return (
    <div className="ap-checkout">
      <h1>Checkout</h1>
      <div className="ap-checkout-grid">
        <div>
          <section className="ap-co-card">
            <h3>Delivery</h3>
            <div className="ap-co-fields">
              <input placeholder="Full name" defaultValue="" />
              <input placeholder="Address" />
              <div className="ap-co-two"><input placeholder="City" /><input placeholder="ZIP" /></div>
            </div>
          </section>
          <section className="ap-co-card">
            <h3>Payment</h3>
            <label className={`ap-pay ${pay === 'chk' ? 'on' : ''}`}><input type="radio" checked={pay === 'chk'} onChange={() => setPay('chk')} /> Chase Total Checking ···1666</label>
            <label className={`ap-pay ${pay === 'cc-sapphire' ? 'on' : ''}`}><input type="radio" checked={pay === 'cc-sapphire'} onChange={() => setPay('cc-sapphire')} /> Sapphire Reserve ···0077</label>
          </section>
        </div>
        <aside className="ap-co-summary">
          <h3>Summary</h3>
          {bag.map((l, i) => <div key={i} className="ap-co-line"><span>{l.name} ×{l.qty}</span><span>{money(l.price * l.qty)}</span></div>)}
          <div className="ap-co-line"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="ap-co-line"><span>Tax</span><span>{money(tax)}</span></div>
          <div className="ap-co-line ap-co-tot"><span>Total</span><span>{money(total)}</span></div>
          <button className="ap-buy" disabled={bag.length === 0} onClick={place}>Place Order</button>
          <button className="ap-link" onClick={() => go({ name: 'bag' })}>‹ Back to bag</button>
        </aside>
      </div>
    </div>
  );
}

// ─────────────────────────── Support ───────────────────────────
const SUPPORT_TOPICS = [
  { icon: '📱', title: 'iPhone', body: 'Repairs, battery, iOS, eSIM and setup.' },
  { icon: '💻', title: 'Mac', body: 'macOS, performance, hardware and trade‑in.' },
  { icon: '⌚', title: 'Apple Watch', body: 'Pairing, bands, health sensors and battery.' },
  { icon: '🎧', title: 'AirPods', body: 'Connection, audio, firmware and fit.' },
  { icon: '🧾', title: 'Billing & Subscriptions', body: 'Orders, refunds, Apple ID and payments.' },
  { icon: '🛡️', title: 'AppleCare+', body: 'Coverage, claims and accidental damage.' },
];
function Support({ go }: { go: (v: View) => void }) {
  const [q, setQ] = useState('');
  return (
    <div className="ap-support">
      <header className="ap-support-hero">
        <h1>Apple Support</h1>
        <div className="ap-support-search">
          <span>⌕</span>
          <input placeholder="Search for topics like “billing”, “repair”, or a product" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </header>
      <div className="ap-support-grid">
        {SUPPORT_TOPICS.filter((t) => !q.trim() || t.title.toLowerCase().includes(q.toLowerCase()) || t.body.toLowerCase().includes(q.toLowerCase())).map((t) => (
          <div key={t.title} className="ap-support-card">
            <div className="ap-support-ic">{t.icon}</div>
            <div className="ap-support-title">{t.title}</div>
            <div className="ap-support-body">{t.body}</div>
            <button className="ap-link" onClick={() => go({ name: 'specialist' })}>Get support ›</button>
          </div>
        ))}
      </div>
      <div className="ap-support-cta">
        <h2>Still need help?</h2>
        <p>Talk with an Apple Specialist by chat or phone — or set up a callback that fits your schedule.</p>
        <button className="ap-buy" onClick={() => go({ name: 'specialist' })}>Contact Apple Support</button>
      </div>
    </div>
  );
}

// ─────────────────────────── Specialist / Advisor ───────────────────────────
function Specialist({ go }: { go: (v: View) => void }) {
  const sendEmail = useMailStore((s) => s.sendEmail);
  const [form, setForm] = useState({ name: '', email: '', topic: 'Buying advice', message: '' });
  const [mode, setMode] = useState<'chat' | 'call' | 'callback'>('callback');
  const [sent, setSent] = useState(false);

  const submit = () => {
    // A real advisor request: drop a confirmation into the mail app.
    try {
      sendEmail({
        from: 'Apple Store Specialist <specialist@apple.com>',
        to: form.email || 'me',
        subject: `Your Apple Specialist request — ${form.topic}`,
        body: `Hi ${form.name || 'there'},\n\nThanks for reaching out to the Apple Store. A Specialist will ${mode === 'call' ? 'be ready when you call 1‑800‑MY‑APPLE' : mode === 'chat' ? 'continue with you over chat' : 'call you back shortly'} about: ${form.topic}.\n\nYour note:\n“${form.message}”\n\nWe’re here to help you choose, buy, and get the most out of your Apple products.\n\n— Apple Store`,
        date: new Date().toISOString(),
        folder: 'inbox',
      });
    } catch { /* mail store optional */ }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="ap-thanks">
        <div className="ap-thanks-check">✓</div>
        <h1>Your request is in.</h1>
        <p>An Apple Specialist will {mode === 'callback' ? 'call you back' : mode === 'call' ? 'be ready when you call' : 'chat with you'} about “{form.topic}”.</p>
        <p className="ap-thanks-sub">We sent a confirmation to your Mail inbox.</p>
        <button className="ap-buy" onClick={() => go({ name: 'home' })}>Done</button>
      </div>
    );
  }

  return (
    <div className="ap-spec">
      <header className="ap-spec-hero">
        <h1>Talk to a Specialist.</h1>
        <p>Get personalized help choosing, buying, and setting up your next Apple product. No question is too small.</p>
      </header>
      <div className="ap-spec-modes">
        {([['chat', '💬', 'Chat now'], ['call', '📞', 'Call 1‑800‑MY‑APPLE'], ['callback', '📅', 'Schedule a callback']] as const).map(([m, ic, label]) => (
          <button key={m} className={`ap-spec-mode ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)}>
            <span className="ap-spec-ic">{ic}</span>{label}
          </button>
        ))}
      </div>
      <div className="ap-spec-form">
        <div className="ap-co-two">
          <input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
          {['Buying advice', 'Business & education', 'Trade In', 'AppleCare+', 'Financing', 'Existing order'].map((t) => <option key={t}>{t}</option>)}
        </select>
        <textarea placeholder="How can we help?" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        <button className="ap-buy" onClick={submit}>Request a Specialist</button>
        <button className="ap-link" onClick={() => go({ name: 'support' })}>‹ Back to Support</button>
      </div>
    </div>
  );
}
