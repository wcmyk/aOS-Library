import { useEffect, useMemo, useState } from 'react';
import { useProfileStore } from '../../../state/useProfileStore';
import { useDevStore } from '../../../state/useDevStore';
import { AZ_PRODUCTS, AZ_CATEGORIES, azSearch, type AzProduct, type AzCategory } from '../../../data/amazonCatalog';
import './amazon.css';

// Amazon storefront: 100-product catalog, search with department and price
// filters, ratings, Prime, product pages, cart, checkout charged to the Chase
// Freedom card, and order history.

type AzView =
  | { kind: 'home' }
  | { kind: 'results'; query: string; category: AzCategory | 'All' }
  | { kind: 'product'; id: string }
  | { kind: 'cart' }
  | { kind: 'checkout' }
  | { kind: 'orders' };

type CartLine = { id: string; qty: number };
type AzOrder = { id: string; date: string; items: CartLine[]; total: number };

function Stars({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <span className="az-stars" style={{ fontSize: size }} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.min(1, Math.max(0, rating - (i - 1)));
        return (
          <span key={i} className="az-star">
            <span className="az-star-bg">★</span>
            <span className="az-star-fg" style={{ width: `${fill * 100}%` }}>★</span>
          </span>
        );
      })}
    </span>
  );
}

function PrimeBadge() {
  return <span className="az-prime"><span className="az-prime-check">✓</span>prime</span>;
}

function usd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function deliveryDate(daysOut: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOut);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function ProductPhoto({ p, size }: { p: AzProduct; size: 'card' | 'hero' | 'thumb' }) {
  return (
    <div className={`az-photo az-photo-${size}`} style={{ backgroundColor: `hsl(${p.hue}deg 30% 94%)` }}>
      <img src={p.photo} alt={p.title} style={{ filter: `hue-rotate(${p.hue % 40}deg)` }} loading="lazy" />
    </div>
  );
}

export function AmazonSite() {
  const { fullName, location } = useProfileStore();
  const addCardCharge = useDevStore((s) => s.addCardCharge);
  const [view, setView] = useState<AzView>({ kind: 'home' });
  const [searchText, setSearchText] = useState('');
  const [searchCat, setSearchCat] = useState<AzCategory | 'All'>('All');
  const [cart, setCart] = useState<CartLine[]>(() => {
    try { return JSON.parse(localStorage.getItem('az_cart') ?? '[]'); } catch { return []; }
  });
  const [orders, setOrders] = useState<AzOrder[]>(() => {
    try { return JSON.parse(localStorage.getItem('az_orders') ?? '[]'); } catch { return []; }
  });
  const [minRating, setMinRating] = useState(0);
  const [primeOnly, setPrimeOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [qty, setQty] = useState(1);
  const [placedOrder, setPlacedOrder] = useState<AzOrder | null>(null);

  useEffect(() => { localStorage.setItem('az_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('az_orders', JSON.stringify(orders)); }, [orders]);

  const cartCount = cart.reduce((n, l) => n + l.qty, 0);
  const cartItems = cart.map((l) => ({ line: l, product: AZ_PRODUCTS.find((p) => p.id === l.id)! })).filter((x) => x.product);
  const cartTotal = cartItems.reduce((n, x) => n + x.product.price * x.line.qty, 0);

  const addToCart = (id: string, n = 1) => {
    setCart((c) => {
      const existing = c.find((l) => l.id === id);
      if (existing) return c.map((l) => (l.id === id ? { ...l, qty: l.qty + n } : l));
      return [...c, { id, qty: n }];
    });
  };

  const runSearch = (q: string, cat: AzCategory | 'All' = searchCat) => {
    setView({ kind: 'results', query: q, category: cat });
  };

  const results = useMemo(() => {
    if (view.kind !== 'results') return [];
    let list = azSearch(view.query, view.category);
    if (primeOnly) list = list.filter((p) => p.prime);
    if (minRating > 0) list = list.filter((p) => p.rating >= minRating);
    if (maxPrice !== null) list = list.filter((p) => p.price <= maxPrice);
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [view, primeOnly, minRating, maxPrice, sort]);

  const placeOrder = () => {
    const order: AzOrder = {
      id: `114-${String(Math.abs(cartTotal * 1000 + cartCount)).padStart(7, '0').slice(0, 7)}-${String(Date.now()).slice(-7)}`,
      date: new Date().toISOString(),
      items: cart,
      total: Math.round(cartTotal * 1.08 * 100) / 100,
    };
    addCardCharge('freedom', `AMZN Mktp US*${order.id.slice(-7)}`, order.total);
    setOrders((o) => [order, ...o]);
    setCart([]);
    setPlacedOrder(order);
    setView({ kind: 'orders' });
  };

  const product = view.kind === 'product' ? AZ_PRODUCTS.find((p) => p.id === view.id) : null;

  const card = (p: AzProduct) => (
    <div key={p.id} className="az-card">
      <button type="button" className="az-card-photo" onClick={() => { setQty(1); setView({ kind: 'product', id: p.id }); }}>
        <ProductPhoto p={p} size="card" />
      </button>
      {p.badge && <span className={`az-badge ${p.badge === 'Limited time deal' ? 'deal' : ''}`}>{p.badge}</span>}
      <button type="button" className="az-card-title" onClick={() => { setQty(1); setView({ kind: 'product', id: p.id }); }}>{p.title}</button>
      <div className="az-card-rating">
        <Stars rating={p.rating} size={13} />
        <span className="az-reviews">{p.reviews.toLocaleString()}</span>
      </div>
      <div className="az-card-price">
        <span className="az-price"><sup>$</sup>{Math.floor(p.price)}<sup>{String(Math.round((p.price % 1) * 100)).padStart(2, '0')}</sup></span>
        {p.listPrice && <span className="az-list">List: <s>{usd(p.listPrice)}</s></span>}
      </div>
      {p.prime && <PrimeBadge />}
      <div className="az-card-delivery">FREE delivery <strong>{deliveryDate(2)}</strong></div>
      <button type="button" className="az-btn-cart" onClick={() => addToCart(p.id)}>Add to cart</button>
    </div>
  );

  return (
    <div className="az-shell">
      {/* ── Header ── */}
      <header className="az-header">
        <button type="button" className="az-logo" onClick={() => setView({ kind: 'home' })} aria-label="Amazon home">
          <span className="az-logo-word">amazon</span>
          <svg className="az-logo-smile" viewBox="0 0 60 14"><path d="M2 3 C 18 13, 42 13, 56 5" fill="none" stroke="#FF9900" strokeWidth="3.2" strokeLinecap="round" /><path d="M56 5 l-5.5-2.2 M56 5 l-2 5.4" fill="none" stroke="#FF9900" strokeWidth="2.8" strokeLinecap="round" /></svg>
        </button>
        <button type="button" className="az-deliver">
          <span className="az-h-small">Deliver to {fullName.split(' ')[0]}</span>
          <span className="az-h-bold">
            <svg width="11" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>
            {location.split(',')[0]}
          </span>
        </button>
        <div className="az-searchbar">
          <select value={searchCat} onChange={(e) => setSearchCat(e.target.value as AzCategory | 'All')} aria-label="Search department">
            <option value="All">All</option>
            {AZ_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch(searchText)}
            placeholder="Search Amazon"
            aria-label="Search Amazon"
          />
          <button type="button" onClick={() => runSearch(searchText)} aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#131921"><path d="M21.41 18.59l-5.27-5.28A6.83 6.83 0 0 0 17 10a7 7 0 1 0-7 7 6.83 6.83 0 0 0 3.31-.86l5.28 5.27a2 2 0 0 0 2.82-2.82zM5 10a5 5 0 1 1 5 5 5 5 0 0 1-5-5z"/></svg>
          </button>
        </div>
        <button type="button" className="az-h-account">
          <span className="az-h-small">Hello, {fullName.split(' ')[0]}</span>
          <span className="az-h-bold">Account &amp; Lists</span>
        </button>
        <button type="button" className="az-h-account" onClick={() => setView({ kind: 'orders' })}>
          <span className="az-h-small">Returns</span>
          <span className="az-h-bold">&amp; Orders</span>
        </button>
        <button type="button" className="az-cartbtn" onClick={() => setView({ kind: 'cart' })}>
          <span className="az-cart-count">{cartCount}</span>
          <svg width="34" height="26" viewBox="0 0 40 30"><path d="M2 3h5l4 17h20l4-12H12" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="14" cy="26" r="2.8" fill="#fff"/><circle cx="28" cy="26" r="2.8" fill="#fff"/></svg>
          <span className="az-h-bold">Cart</span>
        </button>
      </header>

      {/* ── Nav strip ── */}
      <nav className="az-nav">
        <button type="button" onClick={() => runSearch('', 'All')}>
          <svg width="16" height="14" viewBox="0 0 24 20" fill="#fff"><rect y="1" width="24" height="2.6" rx="1.3"/><rect y="8.7" width="24" height="2.6" rx="1.3"/><rect y="16.4" width="24" height="2.6" rx="1.3"/></svg>
          All
        </button>
        <button type="button" onClick={() => runSearch('deal')}>Today's Deals</button>
        <button type="button">Prime</button>
        {(['Electronics', 'Home & Kitchen', 'Books', 'Toys & Games', 'Grocery', 'Smart Home'] as AzCategory[]).map((c) => (
          <button key={c} type="button" onClick={() => runSearch('', c)}>{c}</button>
        ))}
        <span className="az-nav-promo">Sponsored by Polymarket</span>
      </nav>

      <div className="az-body">
        {/* ── Home ── */}
        {view.kind === 'home' && (
          <>
            <div className="az-hero">
              <div className="az-hero-text">
                <h1>Shop everything for your first apartment</h1>
                <p>Kitchen, office, and smart home picks with fast, free Prime delivery.</p>
                <button type="button" onClick={() => runSearch('', 'Home & Kitchen')}>Shop now</button>
              </div>
            </div>
            <div className="az-home-grid">
              {AZ_CATEGORIES.slice(0, 8).map((cat) => {
                const p = AZ_PRODUCTS.find((x) => x.category === cat)!;
                return (
                  <div key={cat} className="az-home-card">
                    <h3>{cat}</h3>
                    <button type="button" onClick={() => runSearch('', cat)}>
                      <ProductPhoto p={p} size="card" />
                    </button>
                    <button type="button" className="az-link" onClick={() => runSearch('', cat)}>Shop {cat}</button>
                  </div>
                );
              })}
            </div>
            <section className="az-row-section">
              <h2>Best Sellers</h2>
              <div className="az-scroll-row">
                {AZ_PRODUCTS.filter((p) => p.badge === 'Best Seller' || p.reviews > 100000).slice(0, 10).map((p) => (
                  <button key={p.id} type="button" className="az-mini" onClick={() => { setQty(1); setView({ kind: 'product', id: p.id }); }}>
                    <ProductPhoto p={p} size="thumb" />
                    <span className="az-mini-price">{usd(p.price)}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="az-row-section">
              <h2>Deals under $30</h2>
              <div className="az-scroll-row">
                {AZ_PRODUCTS.filter((p) => p.price < 30).slice(0, 10).map((p) => (
                  <button key={p.id} type="button" className="az-mini" onClick={() => { setQty(1); setView({ kind: 'product', id: p.id }); }}>
                    <ProductPhoto p={p} size="thumb" />
                    <span className="az-mini-price">{usd(p.price)}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── Results ── */}
        {view.kind === 'results' && (
          <div className="az-results">
            <aside className="az-filters">
              <h4>Department</h4>
              <button type="button" className={view.category === 'All' ? 'active' : ''} onClick={() => setView({ ...view, category: 'All' })}>All Departments</button>
              {AZ_CATEGORIES.map((c) => (
                <button key={c} type="button" className={view.category === c ? 'active' : ''} onClick={() => setView({ ...view, category: c })}>{c}</button>
              ))}
              <h4>Customer Reviews</h4>
              <button type="button" className={minRating === 4 ? 'active' : ''} onClick={() => setMinRating(minRating === 4 ? 0 : 4)}>
                <Stars rating={4} size={13} /> &amp; Up
              </button>
              <h4>Price</h4>
              {[[25, 'Under $25'], [50, 'Under $50'], [100, 'Under $100'], [0, 'Any price']].map(([v, label]) => (
                <button key={String(label)} type="button" className={maxPrice === (v || null) ? 'active' : ''} onClick={() => setMaxPrice(v ? Number(v) : null)}>{label}</button>
              ))}
              <h4>Prime</h4>
              <label className="az-check"><input type="checkbox" checked={primeOnly} onChange={(e) => setPrimeOnly(e.target.checked)} /> <PrimeBadge /></label>
            </aside>
            <div className="az-results-main">
              <div className="az-results-bar">
                <span>{results.length} results{view.query ? <> for <strong>"{view.query}"</strong></> : null}{view.category !== 'All' ? <> in <strong>{view.category}</strong></> : null}</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort">
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Avg. Customer Review</option>
                </select>
              </div>
              <div className="az-grid">{results.map(card)}</div>
              {results.length === 0 && <div className="az-empty">No results. Try checking your spelling or use fewer filters.</div>}
            </div>
          </div>
        )}

        {/* ── Product ── */}
        {view.kind === 'product' && product && (
          <div className="az-product">
            <div className="az-product-photo"><ProductPhoto p={product} size="hero" /></div>
            <div className="az-product-info">
              <h1>{product.title}</h1>
              <button type="button" className="az-link">Visit the {product.brand} Store</button>
              <div className="az-product-rating">
                <span>{product.rating.toFixed(1)}</span>
                <Stars rating={product.rating} />
                <button type="button" className="az-link">{product.reviews.toLocaleString()} ratings</button>
              </div>
              {product.badge && <span className={`az-badge ${product.badge === 'Limited time deal' ? 'deal' : ''}`}>{product.badge}</span>}
              <hr />
              <div className="az-product-price">
                {product.listPrice && <span className="az-discount">-{Math.round((1 - product.price / product.listPrice) * 100)}%</span>}
                <span className="az-price az-price-lg"><sup>$</sup>{Math.floor(product.price)}<sup>{String(Math.round((product.price % 1) * 100)).padStart(2, '0')}</sup></span>
              </div>
              {product.listPrice && <div className="az-list">List Price: <s>{usd(product.listPrice)}</s></div>}
              {product.prime && <PrimeBadge />}
              <h3>About this item</h3>
              <ul className="az-bullets">
                {product.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
            <aside className="az-buybox">
              <div className="az-price az-price-lg"><sup>$</sup>{Math.floor(product.price)}<sup>{String(Math.round((product.price % 1) * 100)).padStart(2, '0')}</sup></div>
              <div className="az-buybox-delivery">FREE delivery <strong>{deliveryDate(2)}</strong>. Order within <span className="az-green">4 hrs 12 mins</span></div>
              <div className="az-buybox-loc">
                <svg width="11" height="14" viewBox="0 0 24 24" fill="#565959"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>
                Deliver to {fullName.split(' ')[0]} — {location.split(',')[0]}
              </div>
              <div className="az-instock">In Stock</div>
              <label className="az-qty">Quantity:
                <select value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <button type="button" className="az-btn-yellow" onClick={() => addToCart(product.id, qty)}>Add to Cart</button>
              <button type="button" className="az-btn-orange" onClick={() => { addToCart(product.id, qty); setView({ kind: 'checkout' }); }}>Buy Now</button>
              <div className="az-buybox-meta">
                <span>Ships from</span><span>Amazon.com</span>
                <span>Sold by</span><span>{product.brand}</span>
                <span>Returns</span><span>30-day refund / replacement</span>
                <span>Payment</span><span>Secure transaction</span>
              </div>
            </aside>
          </div>
        )}

        {/* ── Cart ── */}
        {view.kind === 'cart' && (
          <div className="az-cartpage">
            <div className="az-cart-main">
              <h1>Shopping Cart</h1>
              {cartItems.length === 0 && <div className="az-empty">Your Amazon Cart is empty. <button type="button" className="az-link" onClick={() => setView({ kind: 'home' })}>Shop today's deals</button></div>}
              {cartItems.map(({ line, product: p }) => (
                <div key={line.id} className="az-cart-row">
                  <ProductPhoto p={p} size="thumb" />
                  <div className="az-cart-row-body">
                    <button type="button" className="az-cart-row-title" onClick={() => setView({ kind: 'product', id: p.id })}>{p.title}</button>
                    <div className="az-instock">In Stock</div>
                    {p.prime && <PrimeBadge />}
                    <div className="az-cart-row-actions">
                      <select value={line.qty} onChange={(e) => {
                        const n = Number(e.target.value);
                        setCart((c) => n === 0 ? c.filter((l) => l.id !== line.id) : c.map((l) => (l.id === line.id ? { ...l, qty: n } : l)));
                      }}>
                        <option value={0}>0 (Delete)</option>
                        {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <button type="button" className="az-link" onClick={() => setCart((c) => c.filter((l) => l.id !== line.id))}>Delete</button>
                      <button type="button" className="az-link">Save for later</button>
                    </div>
                  </div>
                  <div className="az-cart-row-price">{usd(p.price * line.qty)}</div>
                </div>
              ))}
              {cartItems.length > 0 && (
                <div className="az-cart-subtotal">Subtotal ({cartCount} item{cartCount !== 1 ? 's' : ''}): <strong>{usd(cartTotal)}</strong></div>
              )}
            </div>
            {cartItems.length > 0 && (
              <aside className="az-cart-side">
                <div className="az-cart-subtotal">Subtotal ({cartCount} item{cartCount !== 1 ? 's' : ''}): <strong>{usd(cartTotal)}</strong></div>
                <button type="button" className="az-btn-yellow" onClick={() => setView({ kind: 'checkout' })}>Proceed to checkout</button>
              </aside>
            )}
          </div>
        )}

        {/* ── Checkout ── */}
        {view.kind === 'checkout' && (
          <div className="az-checkout">
            <h1>Checkout <span>({cartCount} item{cartCount !== 1 ? 's' : ''})</span></h1>
            <div className="az-checkout-grid">
              <div className="az-checkout-main">
                <section>
                  <h3><span className="az-step">1</span> Shipping address</h3>
                  <div className="az-box">
                    <strong>{fullName}</strong><br />
                    2201 Simulation Way, Apt 4B<br />
                    {location}
                  </div>
                </section>
                <section>
                  <h3><span className="az-step">2</span> Payment method</h3>
                  <div className="az-box az-payment">
                    <span className="az-cardchip">Visa</span>
                    <div>
                      <strong>Chase Freedom Unlimited</strong> ending in 6399<br />
                      <span className="az-muted">Charged at shipment. Manage in the Chase app.</span>
                    </div>
                  </div>
                </section>
                <section>
                  <h3><span className="az-step">3</span> Review items</h3>
                  {cartItems.map(({ line, product: p }) => (
                    <div key={line.id} className="az-box az-review-row">
                      <ProductPhoto p={p} size="thumb" />
                      <div>
                        <div className="az-review-title">{p.title}</div>
                        <div className="az-muted">Qty {line.qty} · {usd(p.price)} each</div>
                        <div className="az-green">Arriving {deliveryDate(2)}</div>
                      </div>
                    </div>
                  ))}
                </section>
              </div>
              <aside className="az-ordersummary">
                <button type="button" className="az-btn-yellow" disabled={cartItems.length === 0} onClick={placeOrder}>Place your order</button>
                <div className="az-summary-lines">
                  <span>Items:</span><span>{usd(cartTotal)}</span>
                  <span>Shipping &amp; handling:</span><span>$0.00</span>
                  <span>Estimated tax:</span><span>{usd(Math.round(cartTotal * 8) / 100)}</span>
                </div>
                <div className="az-ordertotal"><span>Order total:</span><span>{usd(Math.round(cartTotal * 1.08 * 100) / 100)}</span></div>
              </aside>
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {view.kind === 'orders' && (
          <div className="az-orders">
            {placedOrder && (
              <div className="az-placed">
                <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#067D62"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div>
                  <strong>Order placed, thank you!</strong>
                  <span>Confirmation will be sent to your email. {usd(placedOrder.total)} charged to Chase Freedom Unlimited ····6399.</span>
                </div>
              </div>
            )}
            <h1>Your Orders</h1>
            {orders.length === 0 && <div className="az-empty">You have no recent orders.</div>}
            {orders.map((o) => (
              <div key={o.id} className="az-order">
                <div className="az-order-head">
                  <div><span className="az-muted">ORDER PLACED</span><strong>{new Date(o.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></div>
                  <div><span className="az-muted">TOTAL</span><strong>{usd(o.total)}</strong></div>
                  <div><span className="az-muted">SHIP TO</span><strong>{fullName}</strong></div>
                  <div className="az-order-id"><span className="az-muted">ORDER # {o.id}</span></div>
                </div>
                <div className="az-order-body">
                  <div className="az-green az-order-status">Arriving {deliveryDate(2)}</div>
                  {o.items.map((l) => {
                    const p = AZ_PRODUCTS.find((x) => x.id === l.id);
                    if (!p) return null;
                    return (
                      <div key={l.id} className="az-order-item">
                        <ProductPhoto p={p} size="thumb" />
                        <button type="button" className="az-link" onClick={() => setView({ kind: 'product', id: p.id })}>{p.title}</button>
                        <span className="az-muted">Qty {l.qty}</span>
                        <button type="button" className="az-btn-small" onClick={() => addToCart(p.id, l.qty)}>Buy it again</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="az-footer">
        <button type="button" onClick={() => window.scrollTo(0, 0)}>Back to top</button>
        <div className="az-footer-brand">
          <span className="az-logo-word dark">amazon</span>
          <svg className="az-logo-smile" viewBox="0 0 60 14"><path d="M2 3 C 18 13, 42 13, 56 5" fill="none" stroke="#FF9900" strokeWidth="3.2" strokeLinecap="round" /><path d="M56 5 l-5.5-2.2 M56 5 l-2 5.4" fill="none" stroke="#FF9900" strokeWidth="2.8" strokeLinecap="round" /></svg>
          <span className="az-muted">Simulation storefront for workforce training</span>
        </div>
      </footer>
    </div>
  );
}
