import { useMemo, useState } from 'react';
import { useWalletStore, nextOrderId, type WalletOrder } from '../../../state/useWalletStore';
import { useMailStore } from '../../../state/useMailStore';
import './samsung.css';

/*
 * samsung.com/us replica — consumer electronics storefront with a working
 * shop → product → cart → checkout flow (checkout writes a WalletOrder so the
 * charge appears in Chase), plus Support and a Contact form that emails Mail.
 */

type Cat = 'Mobile' | 'TV & AV' | 'Appliances' | 'Computing' | 'Accessories';
type View =
  | { name: 'home' }
  | { name: 'shop'; cat: Cat | 'all' }
  | { name: 'product'; id: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'support' }
  | { name: 'contact' };

type Product = {
  id: string; name: string; cat: Cat; tagline: string; price: number;
  colors: { name: string; hex: string }[]; storage?: { name: string; delta: number }[];
  emoji: string; grad: [string, string]; specs: string[];
};

const P: Product[] = [
  { id: 's24-ultra', name: 'Galaxy S24 Ultra', cat: 'Mobile', tagline: 'The ultimate Galaxy AI experience.', price: 1299,
    colors: [{ name: 'Titanium Gray', hex: '#6f7378' }, { name: 'Titanium Black', hex: '#2c2c2e' }, { name: 'Titanium Violet', hex: '#b3a7c9' }, { name: 'Titanium Yellow', hex: '#e6d38a' }],
    storage: [{ name: '256GB', delta: 0 }, { name: '512GB', delta: 120 }, { name: '1TB', delta: 340 }], emoji: '📱', grad: ['#2b2b30', '#5b5b64'],
    specs: ['6.8” Dynamic AMOLED 2X, 120Hz', 'Snapdragon 8 Gen 3 for Galaxy', '200MP quad camera + S Pen', 'Galaxy AI · 5000mAh'] },
  { id: 's24', name: 'Galaxy S24', cat: 'Mobile', tagline: 'Epic, just like that.', price: 799,
    colors: [{ name: 'Onyx Black', hex: '#2c2c2e' }, { name: 'Marble Gray', hex: '#a8abb0' }, { name: 'Cobalt Violet', hex: '#8f86c4' }, { name: 'Amber Yellow', hex: '#e6d38a' }],
    storage: [{ name: '128GB', delta: 0 }, { name: '256GB', delta: 60 }], emoji: '📱', grad: ['#3a3550', '#6f6a90'],
    specs: ['6.2” Dynamic AMOLED 2X', 'Galaxy AI built in', '50MP triple camera', 'All‑day battery'] },
  { id: 'z-fold6', name: 'Galaxy Z Fold6', cat: 'Mobile', tagline: 'Unfold your world.', price: 1899,
    colors: [{ name: 'Silver Shadow', hex: '#c7cace' }, { name: 'Navy', hex: '#2b3a55' }, { name: 'Pink', hex: '#e6c2cc' }],
    storage: [{ name: '256GB', delta: 0 }, { name: '512GB', delta: 120 }, { name: '1TB', delta: 340 }], emoji: '📲', grad: ['#26303f', '#4a5a72'],
    specs: ['7.6” foldable main display', 'Snapdragon 8 Gen 3', 'Multitasking with S Pen', 'Galaxy AI on a big screen'] },
  { id: 'neo-qled', name: 'Neo QLED 4K TV', cat: 'TV & AV', tagline: 'Quantum Matrix. Brilliant contrast.', price: 1499,
    colors: [{ name: 'Titan Black', hex: '#1c1c1e' }], storage: [{ name: '55"', delta: 0 }, { name: '65"', delta: 300 }, { name: '75"', delta: 800 }], emoji: '📺', grad: ['#101216', '#2b2f36'],
    specs: ['Neo Quantum Processor 4K', 'Quantum Matrix Technology', 'Dolby Atmos · 120Hz', 'Smart Hub with Gaming Hub'] },
  { id: 'bespoke-fridge', name: 'Bespoke 4‑Door Refrigerator', cat: 'Appliances', tagline: 'Made to fit your life and style.', price: 3299,
    colors: [{ name: 'Matte White', hex: '#eceae6' }, { name: 'Navy Steel', hex: '#3a4657' }, { name: 'Matte Black', hex: '#2c2c2e' }], emoji: '🧊', grad: ['#dfe4ea', '#b3bcc7'],
    specs: ['Family Hub™ touchscreen', 'Customizable panels', 'AI Energy Mode', 'Beverage Center™'] },
  { id: 'galaxy-book4', name: 'Galaxy Book4 Pro', cat: 'Computing', tagline: 'Powerful. Portable. Connected.', price: 1449,
    colors: [{ name: 'Moonstone Gray', hex: '#7d8189' }], storage: [{ name: '512GB', delta: 0 }, { name: '1TB', delta: 200 }], emoji: '💻', grad: ['#3a3f47', '#5f6672'],
    specs: ['14” Dynamic AMOLED 2X', 'Intel Core Ultra 7', 'Galaxy ecosystem continuity', 'All‑day battery'] },
  { id: 'watch7', name: 'Galaxy Watch7', cat: 'Accessories', tagline: 'Your AI health companion.', price: 299,
    colors: [{ name: 'Green', hex: '#7f8f76' }, { name: 'Cream', hex: '#e7e0d2' } , { name: 'Silver', hex: '#d5d7da' }], storage: [{ name: '40mm', delta: 0 }, { name: '44mm', delta: 30 }], emoji: '⌚', grad: ['#232a24', '#48553f'],
    specs: ['Advanced BioActive sensor', 'Energy Score & sleep', 'Wear OS powered by Samsung', 'Sapphire crystal glass'] },
  { id: 'buds3-pro', name: 'Galaxy Buds3 Pro', cat: 'Accessories', tagline: 'Sound like never before.', price: 249,
    colors: [{ name: 'Silver', hex: '#d5d7da' }, { name: 'White', hex: '#f2f2f4' }], emoji: '🎧', grad: ['#d7dde6', '#aab4c2'],
    specs: ['Adaptive ANC', 'Blade light design', 'Galaxy AI interpreter', 'Hi‑Fi 24‑bit audio'] },
];

const NAV: { label: string; cat: Cat | 'all' }[] = [
  { label: 'Mobile', cat: 'Mobile' }, { label: 'TV & AV', cat: 'TV & AV' }, { label: 'Appliances', cat: 'Appliances' },
  { label: 'Computing', cat: 'Computing' }, { label: 'Accessories', cat: 'Accessories' }, { label: 'Shop All', cat: 'all' },
];

type Line = { id: string; name: string; color: string; option?: string; price: number; qty: number };
const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function SamsungSite() {
  const [view, setView] = useState<View>({ name: 'home' });
  const [cart, setCart] = useState<Line[]>([]);
  const addOrder = useWalletStore((s) => s.addOrder);
  const go = (v: View) => setView(v);
  const count = cart.reduce((s, l) => s + l.qty, 0);

  return (
    <div className="sg">
      <header className="sg-nav">
        <button className="sg-brand" onClick={() => go({ name: 'home' })}>SAMSUNG</button>
        <nav className="sg-links">
          {NAV.map((n) => <button key={n.label} className="sg-link" onClick={() => go({ name: 'shop', cat: n.cat })}>{n.label}</button>)}
          <button className="sg-link" onClick={() => go({ name: 'support' })}>Support</button>
        </nav>
        <button className="sg-cart-btn" onClick={() => go({ name: 'cart' })} aria-label="Cart">🛒{count > 0 && <span className="sg-cart-count">{count}</span>}</button>
      </header>

      <main className="sg-main">
        {view.name === 'home' && <Home go={go} />}
        {view.name === 'shop' && <Shop cat={view.cat} go={go} />}
        {view.name === 'product' && <ProductPage id={view.id} go={go} onAdd={(l) => { setCart((c) => merge(c, l)); go({ name: 'cart' }); }} />}
        {view.name === 'cart' && <Cart cart={cart} setCart={setCart} go={go} />}
        {view.name === 'checkout' && <Checkout cart={cart} go={go} addOrder={addOrder} onPlaced={() => setCart([])} />}
        {view.name === 'support' && <Support go={go} />}
        {view.name === 'contact' && <Contact go={go} />}
      </main>

      <footer className="sg-footer">
        <div className="sg-footer-cols">
          <div><h5>Products</h5>{['Mobile', 'TV & AV', 'Appliances', 'Computing', 'Accessories'].map((x) => <a key={x} onClick={() => go({ name: 'shop', cat: x as Cat })}>{x}</a>)}</div>
          <div><h5>Support</h5><a onClick={() => go({ name: 'support' })}>Get Support</a><a onClick={() => go({ name: 'contact' })}>Contact Us</a><a onClick={() => go({ name: 'support' })}>Track Order</a><a onClick={() => go({ name: 'support' })}>Register Product</a></div>
          <div><h5>Shop</h5><a onClick={() => go({ name: 'shop', cat: 'all' })}>Shop All</a><a onClick={() => go({ name: 'shop', cat: 'Mobile' })}>Deals</a><a onClick={() => go({ name: 'contact' })}>Trade‑In</a></div>
          <div><h5>Account</h5><a onClick={() => go({ name: 'contact' })}>Samsung Account</a><a onClick={() => go({ name: 'contact' })}>Samsung Rewards</a></div>
        </div>
        <div className="sg-legal">© {new Date().getFullYear()} Samsung Electronics America, Inc. Samsung is a registered trademark of Samsung Electronics Co., Ltd. This is a simulated experience. &nbsp;·&nbsp; Privacy &nbsp;·&nbsp; Terms</div>
      </footer>
    </div>
  );
}

function merge(cart: Line[], line: Line): Line[] {
  const k = (l: Line) => `${l.id}|${l.color}|${l.option ?? ''}`;
  return cart.find((l) => k(l) === k(line)) ? cart.map((l) => (k(l) === k(line) ? { ...l, qty: l.qty + line.qty } : l)) : [...cart, line];
}

function Home({ go }: { go: (v: View) => void }) {
  const hero = P[0];
  const feat = [P[2], P[3], P[4]];
  return (
    <div className="sg-home">
      <section className="sg-hero" style={{ background: `linear-gradient(135deg, ${hero.grad[0]}, ${hero.grad[1]})` }}>
        <div className="sg-hero-txt">
          <h1>Galaxy S24 Ultra</h1>
          <p>The ultimate Galaxy AI experience is here.</p>
          <div className="sg-hero-btns">
            <button className="sg-btn" onClick={() => go({ name: 'product', id: hero.id })}>Buy now</button>
            <button className="sg-btn-ghost" onClick={() => go({ name: 'product', id: hero.id })}>Learn more</button>
          </div>
        </div>
        <div className="sg-hero-emoji">📱</div>
      </section>
      <div className="sg-feat-grid">
        {feat.map((p) => (
          <button key={p.id} className="sg-feat" onClick={() => go({ name: 'product', id: p.id })} style={{ background: `linear-gradient(135deg, ${p.grad[0]}, ${p.grad[1]})` }}>
            <div className="sg-feat-emoji">{p.emoji}</div>
            <div className="sg-feat-name">{p.name}</div>
            <div className="sg-feat-tag">{p.tagline}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Shop({ cat, go }: { cat: Cat | 'all'; go: (v: View) => void }) {
  const [c, setC] = useState<Cat | 'all'>(cat);
  const cats: (Cat | 'all')[] = ['all', 'Mobile', 'TV & AV', 'Appliances', 'Computing', 'Accessories'];
  const list = useMemo(() => (c === 'all' ? P : P.filter((p) => p.cat === c)), [c]);
  return (
    <div className="sg-shop">
      <h1>Shop {c === 'all' ? 'All Products' : c}</h1>
      <div className="sg-chiprow">{cats.map((x) => <button key={x} className={`sg-chip ${c === x ? 'on' : ''}`} onClick={() => setC(x)}>{x === 'all' ? 'All' : x}</button>)}</div>
      <div className="sg-grid">
        {list.map((p) => (
          <button key={p.id} className="sg-card" onClick={() => go({ name: 'product', id: p.id })}>
            <div className="sg-card-img" style={{ background: `linear-gradient(150deg, ${p.grad[0]}, ${p.grad[1]})` }}><span>{p.emoji}</span></div>
            <div className="sg-card-name">{p.name}</div>
            <div className="sg-card-tag">{p.tagline}</div>
            <div className="sg-card-price">{money(p.price)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductPage({ id, go, onAdd }: { id: string; go: (v: View) => void; onAdd: (l: Line) => void }) {
  const p = P.find((x) => x.id === id)!;
  const [color, setColor] = useState(p.colors[0].name);
  const [opt, setOpt] = useState(p.storage?.[0].name ?? '');
  const delta = p.storage?.find((s) => s.name === opt)?.delta ?? 0;
  const price = p.price + delta;
  return (
    <div className="sg-product">
      <div className="sg-product-media" style={{ background: `linear-gradient(160deg, ${p.grad[0]}, ${p.grad[1]})` }}><div className="sg-product-emoji">{p.emoji}</div></div>
      <div className="sg-product-info">
        <button className="sg-crumb" onClick={() => go({ name: 'shop', cat: p.cat })}>‹ {p.cat}</button>
        <h1>{p.name}</h1>
        <p className="sg-product-tag">{p.tagline}</p>
        <div className="sg-product-price">{money(price)}</div>
        <div className="sg-opt"><div className="sg-opt-label">Color — <b>{color}</b></div>
          <div className="sg-swatches">{p.colors.map((c) => <button key={c.name} className={`sg-swatch ${color === c.name ? 'on' : ''}`} style={{ background: c.hex }} onClick={() => setColor(c.name)} aria-label={c.name} />)}</div>
        </div>
        {p.storage && (
          <div className="sg-opt"><div className="sg-opt-label">Options</div>
            <div className="sg-opt-btns">{p.storage.map((s) => <button key={s.name} className={`sg-opt-btn ${opt === s.name ? 'on' : ''}`} onClick={() => setOpt(s.name)}>{s.name}<span>{money(p.price + s.delta)}</span></button>)}</div>
          </div>
        )}
        <ul className="sg-specs">{p.specs.map((s) => <li key={s}>{s}</li>)}</ul>
        <div className="sg-buy-row">
          <button className="sg-btn" onClick={() => onAdd({ id: p.id, name: p.name, color, option: p.storage ? opt : undefined, price, qty: 1 })}>Add to Cart</button>
          <button className="sg-btn-ghost" onClick={() => go({ name: 'contact' })}>Ask an expert</button>
        </div>
        <div className="sg-buy-note">Free shipping · Trade‑in offers · 0% APR financing available</div>
      </div>
    </div>
  );
}

function Cart({ cart, setCart, go }: { cart: Line[]; setCart: (f: (c: Line[]) => Line[]) => void; go: (v: View) => void }) {
  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  if (!cart.length) return <div className="sg-cart-empty"><h1>Your cart is empty.</h1><button className="sg-btn" onClick={() => go({ name: 'shop', cat: 'all' })}>Shop products</button></div>;
  return (
    <div className="sg-cartpage">
      <h1>Your Cart</h1>
      {cart.map((l, i) => (
        <div key={i} className="sg-cart-line">
          <div className="sg-cart-thumb">{P.find((p) => p.id === l.id)?.emoji}</div>
          <div className="sg-cart-desc"><div className="sg-cart-name">{l.name}</div><div className="sg-cart-sub">{l.color}{l.option ? ` · ${l.option}` : ''}</div><button className="sg-remove" onClick={() => setCart((c) => c.filter((_, j) => j !== i))}>Remove</button></div>
          <div className="sg-qty"><button onClick={() => setCart((c) => c.map((x, j) => (j === i ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))}>−</button><span>{l.qty}</span><button onClick={() => setCart((c) => c.map((x, j) => (j === i ? { ...x, qty: x.qty + 1 } : x)))}>+</button></div>
          <div className="sg-cart-price">{money(l.price * l.qty)}</div>
        </div>
      ))}
      <div className="sg-cart-summary">
        <div className="sg-cart-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
        <div className="sg-cart-row"><span>Shipping</span><span>FREE</span></div>
        <div className="sg-cart-row sg-cart-total"><span>Total</span><span>{money(subtotal)}</span></div>
        <button className="sg-btn sg-cart-checkout" onClick={() => go({ name: 'checkout' })}>Checkout</button>
      </div>
    </div>
  );
}

function Checkout({ cart, go, addOrder, onPlaced }: { cart: Line[]; go: (v: View) => void; addOrder: (o: WalletOrder) => void; onPlaced: () => void }) {
  const [placed, setPlaced] = useState<{ id: string; total: number } | null>(null);
  const [pay, setPay] = useState<'chk' | 'cc-freedom'>('cc-freedom');
  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const tax = Math.round(subtotal * 0.08875 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  if (placed) return (
    <div className="sg-thanks"><div className="sg-check">✓</div><h1>Order confirmed</h1><p>Order <b>{placed.id}</b> · {money(placed.total)} charged to your {pay === 'chk' ? 'Chase Checking' : 'Freedom Unlimited'}.</p><p className="sg-muted">Track this charge in the Chase app. A confirmation is on the way.</p><button className="sg-btn" onClick={() => go({ name: 'home' })}>Continue shopping</button></div>
  );

  const place = () => {
    const id = nextOrderId();
    addOrder({
      id, date: new Date().toISOString(), desc: 'SAMSUNG.COM 800-726-7864 NJ', total,
      itemCount: cart.reduce((s, l) => s + l.qty, 0),
      items: cart.map((l) => ({ id: l.id, title: `${l.name} (${l.color})`, price: l.price, qty: l.qty })),
      accountId: pay, accountKind: pay === 'chk' ? 'checking' : 'credit',
      last4: pay === 'chk' ? '1666' : '6399', cardName: pay === 'chk' ? 'Chase Total Checking' : 'Freedom Unlimited',
    });
    onPlaced();
    setPlaced({ id, total });
  };

  return (
    <div className="sg-checkout">
      <h1>Checkout</h1>
      <div className="sg-checkout-grid">
        <div>
          <section className="sg-co-card"><h3>Shipping</h3><div className="sg-co-fields"><input placeholder="Full name" /><input placeholder="Address" /><div className="sg-co-two"><input placeholder="City" /><input placeholder="ZIP" /></div></div></section>
          <section className="sg-co-card"><h3>Payment</h3>
            <label className={`sg-pay ${pay === 'cc-freedom' ? 'on' : ''}`}><input type="radio" checked={pay === 'cc-freedom'} onChange={() => setPay('cc-freedom')} /> Freedom Unlimited ···6399</label>
            <label className={`sg-pay ${pay === 'chk' ? 'on' : ''}`}><input type="radio" checked={pay === 'chk'} onChange={() => setPay('chk')} /> Chase Total Checking ···1666</label>
          </section>
        </div>
        <aside className="sg-co-summary"><h3>Summary</h3>
          {cart.map((l, i) => <div key={i} className="sg-co-line"><span>{l.name} ×{l.qty}</span><span>{money(l.price * l.qty)}</span></div>)}
          <div className="sg-co-line"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="sg-co-line"><span>Tax</span><span>{money(tax)}</span></div>
          <div className="sg-co-line sg-co-tot"><span>Total</span><span>{money(total)}</span></div>
          <button className="sg-btn" disabled={!cart.length} onClick={place}>Place Order</button>
          <button className="sg-btn-ghost" onClick={() => go({ name: 'cart' })}>‹ Back to cart</button>
        </aside>
      </div>
    </div>
  );
}

const SG_TOPICS = [
  { icon: '📱', title: 'Mobile', body: 'Setup, software updates, Galaxy AI and repairs.' },
  { icon: '📺', title: 'TV & Audio', body: 'Picture, sound, Smart Hub and connectivity.' },
  { icon: '🧊', title: 'Home Appliances', body: 'Installation, Family Hub, error codes and parts.' },
  { icon: '💻', title: 'Computing', body: 'Galaxy Book, drivers, continuity and warranty.' },
  { icon: '🧾', title: 'Orders & Payments', body: 'Track orders, returns, trade‑in and billing.' },
  { icon: '🛡️', title: 'Samsung Care+', body: 'Coverage, claims and accidental damage.' },
];
function Support({ go }: { go: (v: View) => void }) {
  const [q, setQ] = useState('');
  return (
    <div className="sg-support">
      <header className="sg-support-hero"><h1>Support</h1><div className="sg-support-search"><span>⌕</span><input placeholder="Search help articles, e.g. “Galaxy AI”, “return”" value={q} onChange={(e) => setQ(e.target.value)} /></div></header>
      <div className="sg-support-grid">
        {SG_TOPICS.filter((t) => !q.trim() || t.title.toLowerCase().includes(q.toLowerCase()) || t.body.toLowerCase().includes(q.toLowerCase())).map((t) => (
          <div key={t.title} className="sg-support-card"><div className="sg-support-ic">{t.icon}</div><div className="sg-support-title">{t.title}</div><div className="sg-support-body">{t.body}</div><button className="sg-btn-ghost" onClick={() => go({ name: 'contact' })}>Get help ›</button></div>
        ))}
      </div>
      <div className="sg-support-cta"><h2>Need to talk to someone?</h2><p>Chat, call 1‑800‑SAMSUNG, or schedule a callback with a product expert.</p><button className="sg-btn" onClick={() => go({ name: 'contact' })}>Contact Us</button></div>
    </div>
  );
}

function Contact({ go }: { go: (v: View) => void }) {
  const sendEmail = useMailStore((s) => s.sendEmail);
  const [form, setForm] = useState({ name: '', email: '', product: 'Galaxy S24 Ultra', topic: 'Product question', message: '' });
  const [mode, setMode] = useState<'chat' | 'call' | 'callback'>('callback');
  const [sent, setSent] = useState(false);
  const submit = () => {
    try {
      sendEmail({
        from: 'Samsung Support <support@samsung.com>', to: form.email || 'me',
        subject: `Samsung Support — ${form.topic}`,
        body: `Hi ${form.name || 'there'},\n\nThanks for contacting Samsung. A product expert will ${mode === 'call' ? 'be ready when you call 1‑800‑SAMSUNG' : mode === 'chat' ? 'continue with you over chat' : 'call you back shortly'} regarding your ${form.product}.\n\nTopic: ${form.topic}\nYour message: “${form.message}”\n\nWe’re here to help.\n— Samsung Support`,
        date: new Date().toISOString(), folder: 'inbox',
      });
    } catch { /* mail optional */ }
    setSent(true);
  };
  if (sent) return <div className="sg-thanks"><div className="sg-check">✓</div><h1>Request received</h1><p>A Samsung expert will {mode === 'callback' ? 'call you back' : mode === 'call' ? 'be ready when you call' : 'chat with you'} about your {form.product}.</p><p className="sg-muted">We sent a confirmation to your Mail inbox.</p><button className="sg-btn" onClick={() => go({ name: 'home' })}>Done</button></div>;
  return (
    <div className="sg-contact">
      <h1>Contact Us</h1>
      <p className="sg-lead">Get help from a Samsung product expert.</p>
      <div className="sg-modes">{([['chat', '💬', 'Chat'], ['call', '📞', 'Call'], ['callback', '📅', 'Callback']] as const).map(([m, ic, l]) => <button key={m} className={`sg-mode ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)}><span>{ic}</span>{l}</button>)}</div>
      <div className="sg-form">
        <div className="sg-co-two"><input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="sg-co-two">
          <select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>{P.map((p) => <option key={p.id}>{p.name}</option>)}</select>
          <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>{['Product question', 'Order status', 'Return / refund', 'Repair', 'Trade‑In', 'Billing'].map((t) => <option key={t}>{t}</option>)}</select>
        </div>
        <textarea rows={4} placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        <button className="sg-btn" onClick={submit}>Send request</button>
        <button className="sg-btn-ghost" onClick={() => go({ name: 'support' })}>‹ Back to Support</button>
      </div>
    </div>
  );
}
