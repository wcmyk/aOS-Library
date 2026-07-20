import { useMemo, useState } from 'react';
import { useWalletStore, nextOrderId, type WalletOrder } from '../../state/useWalletStore';
import './spacey.css';

const BASE_URL = import.meta.env.BASE_URL;
const photo = (name: string) => `${BASE_URL}assets/spacey/${name}.jpg`;

type Kind = 'unit' | 'container' | 'warehouse' | 'locker';
type Space = {
  id: string;
  name: string;
  kind: Kind;
  image: string;
  dims: string;
  sqft: number;
  price: number; // per month
  city: string;
  desc: string;
  features: string[];
};

const KIND_LABEL: Record<Kind, string> = {
  unit: 'Self-Storage Unit',
  container: 'Portable Container',
  warehouse: 'Warehouse',
  locker: 'Climate Locker',
};

const SPACES: Space[] = [
  { id: 's1', name: '5×5 Climate Locker', kind: 'locker', image: 'locker', dims: "5' × 5' × 8'", sqft: 25, price: 49, city: 'Brooklyn, NY', desc: 'A tidy climate-controlled locker perfect for documents, seasonal clothing and a few boxes. Access it any day from our secure indoor facility.', features: ['Climate controlled', '24/7 keypad access', 'Indoor & secure', 'Ground floor', 'Month-to-month', 'Free moving cart'] },
  { id: 's2', name: '5×10 Storage Unit', kind: 'unit', image: 'unit-empty', dims: "5' × 10' × 8'", sqft: 50, price: 89, city: 'Jersey City, NJ', desc: 'Holds the contents of a small apartment — a mattress set, dresser, and around 15 boxes. Drive right up and roll your things in.', features: ['Drive-up access', 'Roll-up door', 'Well-lit facility', 'Video monitored', 'Month-to-month', 'No deposit'] },
  { id: 's3', name: '10×10 Storage Unit', kind: 'unit', image: 'unit-full', dims: "10' × 10' × 8'", sqft: 100, price: 149, city: 'Queens, NY', desc: 'Our most popular size — fits two bedrooms of furniture, appliances and boxes with room to spare. Ideal between moves.', features: ['Fits ~2 bedrooms', 'Drive-up access', 'Wide roll-up door', 'Gated & alarmed', 'Month-to-month', 'Free lock included'] },
  { id: 's4', name: '10×15 Drive-Up Unit', kind: 'unit', image: 'facility', dims: "10' × 15' × 8'", sqft: 150, price: 189, city: 'Newark, NJ', desc: 'A large drive-up unit for a full home or small business inventory. Pull your vehicle right to the door for easy loading.', features: ['Vehicle-height clearance', 'Drive-up loading', 'Perimeter fencing', 'Individually alarmed', 'Business friendly', '24/7 access'] },
  { id: 's5', name: '10×20 Large Unit', kind: 'unit', image: 'unit-empty', dims: "10' × 20' × 9'", sqft: 200, price: 249, city: 'Yonkers, NY', desc: 'Garage-sized storage for a three-to-four bedroom home, a car, or bulk inventory. Extra ceiling height for stacking.', features: ['Fits ~4 bedrooms or a car', 'Extra height', 'Drive-up access', 'Gated & monitored', 'Business friendly', 'Free dolly use'] },
  { id: 's6', name: 'Portable Container — 16 ft', kind: 'container', image: 'container', dims: "16' × 8' × 8'", sqft: 128, price: 199, city: 'Delivered to you', desc: 'We drop a weatherproof container at your door, you pack it on your schedule, and we store or move it. No truck rental required.', features: ['Delivered & picked up', 'Weatherproof steel', 'Pack at your pace', 'Store or move it', 'Ground-level loading', 'Flexible term'] },
  { id: 's7', name: 'Portable Container — 8 ft', kind: 'container', image: 'container', dims: "8' × 7' × 8'", sqft: 56, price: 129, city: 'Delivered to you', desc: 'A compact portable container ideal for a studio move or a renovation. Delivered flat to your driveway and stored securely when you are done.', features: ['Delivered to your door', 'Great for studios', 'Weatherproof', 'Pack at your pace', 'Secure warehouse storage', 'No deposit'] },
  { id: 's8', name: 'Warehouse Bay — 500 sq ft', kind: 'warehouse', image: 'warehouse', dims: "20' × 25' × 16'", sqft: 500, price: 899, city: 'Elizabeth, NJ', desc: 'A dedicated warehouse bay with pallet racking and dock access — built for growing businesses that have outgrown a storage unit.', features: ['Loading dock access', 'Pallet racking included', 'Forklift on site', '16 ft clear height', 'Business address use', '24/7 secured access'] },
  { id: 's9', name: 'Warehouse Suite — 1,200 sq ft', kind: 'warehouse', image: 'warehouse', dims: "40' × 30' × 18'", sqft: 1200, price: 1850, city: 'Elizabeth, NJ', desc: 'A private warehouse suite for serious inventory, distribution or workshop needs, with drive-in and dock loading and optional office space.', features: ['Drive-in & dock loading', 'Optional office space', 'High clear height', 'Fiber internet ready', 'Fulfillment friendly', 'Dedicated access'] },
  { id: 's10', name: '5×5 Premium Locker', kind: 'locker', image: 'locker', dims: "5' × 5' × 9'", sqft: 25, price: 69, city: 'Manhattan, NY', desc: 'A premium climate-controlled locker in a concierge-serviced building in the heart of the city — spotless, bright and always secure.', features: ['Concierge building', 'Climate controlled', 'Extra tall', 'App-based access', 'Package acceptance', 'Month-to-month'] },
];

const CARDS = [
  { id: 'chk', name: 'Chase Total Checking (Debit)', last4: '1666', kind: 'checking' as const },
  { id: 'cc-freedom', name: 'Chase Freedom Unlimited', last4: '6399', kind: 'credit' as const },
  { id: 'cc-sapphire', name: 'Chase Sapphire Reserve', last4: '0077', kind: 'credit' as const },
];

const KINDS: { k: 'all' | Kind; label: string }[] = [
  { k: 'all', label: 'All spaces' },
  { k: 'unit', label: 'Storage Units' },
  { k: 'container', label: 'Portable Containers' },
  { k: 'warehouse', label: 'Warehouses' },
  { k: 'locker', label: 'Climate Lockers' },
];

const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const usd0 = (n: number) => `$${n.toLocaleString('en-US')}`;

export function SpaceyApp() {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | Kind>('all');
  const [sort, setSort] = useState('featured');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [payCardId, setPayCardId] = useState('chk');
  const [reserved, setReserved] = useState<{ space: Space; card: (typeof CARDS)[number]; total: number } | null>(null);
  const addOrder = useWalletStore((s) => s.addOrder);

  const results = useMemo(() => {
    let list = SPACES.filter((s) => (kind === 'all' ? true : s.kind === kind)).filter((s) =>
      `${s.name} ${s.city} ${KIND_LABEL[s.kind]}`.toLowerCase().includes(query.toLowerCase()),
    );
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === 'size') list = [...list].sort((a, b) => b.sqft - a.sqft);
    return list;
  }, [kind, query, sort]);

  const detail = SPACES.find((s) => s.id === detailId) ?? null;

  const reserve = (space: Space) => {
    const card = CARDS.find((c) => c.id === payCardId) ?? CARDS[0];
    const firstMonth = Math.round(space.price * 1.08875 * 100) / 100; // + tax, waived admin fee
    const id = nextOrderId();
    const order: WalletOrder = {
      id,
      date: new Date().toISOString(),
      desc: `SPACEY STORAGE*${space.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 10).toUpperCase()}`,
      total: firstMonth,
      itemCount: 1,
      items: [{ id: space.id, title: `${space.name} — first month`, price: firstMonth, qty: 1 }],
      accountId: card.id,
      accountKind: card.kind,
      last4: card.last4,
      cardName: card.name,
    };
    addOrder(order);
    setReserved({ space, card, total: firstMonth });
  };

  return (
    <div className="sp">
      <header className="sp-top">
        <div className="sp-logo"><span className="mark">S</span> Spacey</div>
        <nav className="sp-nav">
          <button type="button" onClick={() => { setKind('all'); setDetailId(null); }}>Find storage</button>
          <button type="button">How it works</button>
          <button type="button">List your space</button>
        </nav>
        <div className="sp-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#6b6a86"><path d="M21.4 18.6l-5.3-5.3A6.8 6.8 0 1 0 10 17a6.8 6.8 0 0 0 3.3-.9l5.3 5.3a2 2 0 0 0 2.8-2.8zM5 10a5 5 0 1 1 5 5 5 5 0 0 1-5-5z" /></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by size or city" />
        </div>
        <button type="button" className="sp-cta">List your space</button>
      </header>

      {!detail ? (
        <>
          <div className="sp-hero">
            <h1>Storage space, on demand — from a locker to a whole warehouse.</h1>
            <p>Your inventory outgrew your closet. Rent secure, flexible space by the month and scale up or down whenever you need to.</p>
            <div className="sp-hero-stats">
              <div className="s"><b>1,200+</b><span>Verified facilities</span></div>
              <div className="s"><b>Month-to-month</b><span>No long contracts</span></div>
              <div className="s"><b>$1M</b><span>Contents protection</span></div>
            </div>
          </div>

          <div className="sp-filters">
            {KINDS.map((k) => (
              <button key={k.k} type="button" className={`sp-chip ${kind === k.k ? 'on' : ''}`} onClick={() => setKind(k.k)}>{k.label}</button>
            ))}
            <select className="sp-chip" value={sort} onChange={(e) => setSort(e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="size">Largest</option>
            </select>
            <span className="sp-count">{results.length} spaces available</span>
          </div>

          <div className="sp-body">
            <div className="sp-grid">
              {results.map((s) => (
                <article key={s.id} className="sp-card" onClick={() => { setDetailId(s.id); }}>
                  <div className="sp-card-photo">
                    <img src={photo(s.image)} alt={s.name} loading="lazy" />
                    <span className="sp-kind">{KIND_LABEL[s.kind]}</span>
                    <span className="sp-avail">Available now</span>
                  </div>
                  <div className="sp-card-body">
                    <h3>{s.name}</h3>
                    <div className="sp-card-loc">{s.city} · {s.dims}</div>
                    <div className="sp-card-foot">
                      <div className="sp-price">{usd0(s.price)}<small>/mo</small></div>
                      <span className="sp-size">{s.sqft} sq ft</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="sp-body">
          <div className="sp-detail">
            <button type="button" className="sp-back" onClick={() => setDetailId(null)}>‹ Back to spaces</button>
            <div className="sp-detail-hero"><img src={photo(detail.image)} alt={detail.name} /></div>
            <div className="sp-detail-cols">
              <div className="sp-detail-main">
                <h1>{detail.name}</h1>
                <p className="loc">{KIND_LABEL[detail.kind]} · {detail.city}</p>
                <div className="sp-facts">
                  <div className="f"><b>{detail.dims}</b><span>Dimensions</span></div>
                  <div className="f"><b>{detail.sqft}</b><span>Sq Ft</span></div>
                  <div className="f"><b>{usd0(detail.price)}/mo</b><span>Rent</span></div>
                </div>
                <h3>About this space</h3>
                <p>{detail.desc}</p>
                <h3>Features</h3>
                <ul className="sp-feat">{detail.features.map((f) => <li key={f}>{f}</li>)}</ul>
              </div>

              <aside className="sp-side">
                <div className="big">{usd0(detail.price)}<small>/mo</small></div>
                <div className="note">First month due today · then billed monthly · cancel anytime</div>
                <div className="sp-pay">
                  {CARDS.map((c) => (
                    <label key={c.id} className={payCardId === c.id ? 'sel' : ''}>
                      <input type="radio" name="spcard" checked={payCardId === c.id} onChange={() => setPayCardId(c.id)} />
                      {c.name} ••{c.last4}
                    </label>
                  ))}
                </div>
                <button type="button" className="sp-reserve" onClick={() => reserve(detail)}>Reserve — pay first month</button>
                <button type="button" className="sp-reserve ghost" onClick={() => setDetailId(null)}>Keep browsing</button>
                <div className="sp-guarantee">Charged to your Chase card · appears in your bank activity</div>
              </aside>
            </div>
          </div>
        </div>
      )}

      {reserved ? (
        <div className="sp-scrim" onClick={() => setReserved(null)}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="check">✓</div>
            <h2>Space reserved!</h2>
            <p><b>{reserved.space.name}</b> in {reserved.space.city} is yours.</p>
            <p>{usd(reserved.total)} (first month + tax) was charged to <b>{reserved.card.name}</b> (••{reserved.card.last4}).</p>
            <p>Open the <b>Chase</b> app to see the charge in your account activity.</p>
            <button type="button" className="done" onClick={() => { setReserved(null); setDetailId(null); }}>Done</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
