import { useMemo, useState } from 'react';
import './amazon.css';

/* ─── Product catalog (grocery: instant ramen, noodles, snacks & drinks) ─────── */

type Pack = {
  bg: string; // CSS background for the "package"
  fg: string; // text color on the package
  brand: string;
  short: string;
  motif: string;
  band?: { text: string; bg: string; fg: string };
  spicy?: boolean;
  shape?: 'packet' | 'cup';
};

type Product = {
  id: string;
  title: string;
  pack: Pack;
  price: number;
  listPrice?: number;
  rating: number; // 0-5
  reviews: number;
  bought?: string; // "2K+ bought in past month"
  badge?: { kind: 'choice' | 'best' | 'deal'; text: string };
  coupon?: number; // percent
  prime?: boolean;
  delivery: string;
};

const PRODUCTS: Product[] = [
  {
    id: 'buldak-2x',
    title: 'Samyang Buldak Hot Chicken Flavor Ramen (2x Spicy), Pack of 5',
    pack: { bg: 'linear-gradient(160deg,#1c1c1c,#3a0a0a)', fg: '#fff', brand: 'Samyang', short: 'BULDAK', motif: '🐔', band: { text: 'HOT CHICKEN', bg: '#d8232a', fg: '#fff' }, spicy: true },
    price: 9.48, listPrice: 12.99, rating: 4.8, reviews: 41250, bought: '10K+ bought in past month',
    badge: { kind: 'best', text: '#1 Best Seller' }, coupon: 10, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'buldak-carbonara',
    title: 'Samyang Buldak Carbonara Hot Chicken Flavor Ramen, Pack of 5',
    pack: { bg: 'linear-gradient(160deg,#2a2a2a,#7a1140)', fg: '#fff', brand: 'Samyang', short: 'CARBO', motif: '🍝', band: { text: 'CARBONARA', bg: '#e75480', fg: '#fff' }, spicy: true },
    price: 10.99, rating: 4.7, reviews: 18740, bought: '5K+ bought in past month',
    badge: { kind: 'choice', text: "Amazon's Choice" }, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'buldak-3x',
    title: 'Samyang Buldak 3x Spicy Extra Hot Chicken Flavor Ramen, Pack of 5',
    pack: { bg: 'linear-gradient(160deg,#0a0a0a,#5c0000)', fg: '#fff', brand: 'Samyang', short: '3× SPICY', motif: '🔥', band: { text: 'EXTRA HOT', bg: '#8b0000', fg: '#ffd400' }, spicy: true },
    price: 11.49, listPrice: 13.99, rating: 4.6, reviews: 22910, bought: '3K+ bought in past month',
    coupon: 15, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'topramen-chicken',
    title: 'Nissin Top Ramen Chicken Flavor Instant Ramen Noodle Soup, 24 Pack',
    pack: { bg: 'linear-gradient(160deg,#ff8a00,#e85d00)', fg: '#fff', brand: 'Nissin', short: 'TOP RAMEN', motif: '🍜', band: { text: 'CHICKEN', bg: '#fff', fg: '#e85d00' } },
    price: 7.68, listPrice: 9.36, rating: 4.8, reviews: 68420, bought: '20K+ bought in past month',
    badge: { kind: 'choice', text: "Amazon's Choice" }, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'topramen-beef',
    title: 'Nissin Top Ramen Beef Flavor Instant Ramen Noodle Soup, 24 Pack',
    pack: { bg: 'linear-gradient(160deg,#a0331f,#6e1a0e)', fg: '#fff', brand: 'Nissin', short: 'TOP RAMEN', motif: '🍜', band: { text: 'BEEF', bg: '#fff', fg: '#8b2f1a' } },
    price: 7.68, rating: 4.7, reviews: 39110, bought: '9K+ bought in past month',
    prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'shin-ramyun',
    title: 'Nongshim Shin Ramyun Spicy Noodle Soup, Pack of 20',
    pack: { bg: 'linear-gradient(160deg,#c8102e,#7a0a1c)', fg: '#fff', brand: 'Nongshim', short: '辛 SHIN', motif: '🌶️', band: { text: 'GOURMET SPICY', bg: '#111', fg: '#fff' }, spicy: true },
    price: 18.99, listPrice: 23.49, rating: 4.8, reviews: 51200, bought: '8K+ bought in past month',
    badge: { kind: 'best', text: '#1 Best Seller' }, coupon: 5, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'cup-noodles',
    title: 'Nissin Cup Noodles Chicken Flavor Ramen Soup, 24 Cups',
    pack: { bg: 'linear-gradient(160deg,#fafafa,#e6e6e6)', fg: '#c8102e', brand: 'Nissin', short: 'CUP NOODLES', motif: '🍜', band: { text: 'CHICKEN', bg: '#c8102e', fg: '#fff' }, shape: 'cup' },
    price: 14.28, rating: 4.7, reviews: 44300, bought: '7K+ bought in past month',
    prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'indomie',
    title: 'Indomie Mi Goreng Instant Stir Fry Noodles, Pack of 30',
    pack: { bg: 'linear-gradient(160deg,#ffd21f,#f39c00)', fg: '#a11', brand: 'Indomie', short: 'MI GORENG', motif: '🍜', band: { text: 'STIR FRY', bg: '#0a7d34', fg: '#fff' } },
    price: 19.99, listPrice: 24.99, rating: 4.8, reviews: 62100, bought: '6K+ bought in past month',
    badge: { kind: 'choice', text: "Amazon's Choice" }, coupon: 8, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'chapagetti',
    title: 'Nongshim Chapagetti Chajang Noodle, Pack of 8',
    pack: { bg: 'linear-gradient(160deg,#1a1a1a,#332600)', fg: '#ffcf33', brand: 'Nongshim', short: 'CHAPAGETTI', motif: '🍝', band: { text: 'CHAJANG', bg: '#ffcf33', fg: '#111' } },
    price: 12.49, rating: 4.7, reviews: 15980, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'jin-ramen',
    title: 'Ottogi Jin Ramen Spicy Instant Noodle, Pack of 20',
    pack: { bg: 'linear-gradient(160deg,#0a7d34,#054d20)', fg: '#fff', brand: 'Ottogi', short: 'JIN RAMEN', motif: '🍲', band: { text: 'HOT', bg: '#d8232a', fg: '#fff' }, spicy: true },
    price: 16.99, rating: 4.6, reviews: 12040, coupon: 10, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'maruchan',
    title: 'Maruchan Ramen Chicken Flavor Instant Noodle Soup, 24 Pack',
    pack: { bg: 'linear-gradient(160deg,#ffd21f,#f0a400)', fg: '#c8102e', brand: 'Maruchan', short: 'RAMEN', motif: '🍜', band: { text: 'CHICKEN', bg: '#c8102e', fg: '#fff' } },
    price: 6.98, rating: 4.7, reviews: 58700, bought: '15K+ bought in past month',
    prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'sapporo',
    title: 'Sapporo Ichiban Original Ramen Noodle Soup, Pack of 24',
    pack: { bg: 'linear-gradient(160deg,#d8232a,#8b0f14)', fg: '#fff', brand: 'Sapporo', short: 'ICHIBAN', motif: '🍥', band: { text: 'ORIGINAL', bg: '#fff', fg: '#d8232a' } },
    price: 21.6, rating: 4.6, reviews: 9870, prime: true, delivery: 'Mon, Jul 22',
  },
  {
    id: 'pocky',
    title: 'Glico Pocky Chocolate Biscuit Sticks, Pack of 10',
    pack: { bg: 'linear-gradient(160deg,#e21b2c,#a2121f)', fg: '#fff', brand: 'Glico', short: 'POCKY', motif: '🍫', band: { text: 'CHOCOLATE', bg: '#fff', fg: '#a2121f' } },
    price: 13.49, rating: 4.8, reviews: 27600, bought: '4K+ bought in past month',
    prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'hichew',
    title: 'Hi-Chew Sensationally Chewy Candy Assorted Fruit, 12 Pack',
    pack: { bg: 'linear-gradient(160deg,#ff5da2,#ffd21f)', fg: '#fff', brand: 'Morinaga', short: 'HI-CHEW', motif: '🍬', band: { text: 'ASSORTED', bg: '#fff', fg: '#e6007e' } },
    price: 11.99, rating: 4.8, reviews: 33900, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'ramune',
    title: 'Hata Ramune Japanese Marble Soda Original, 6 Bottles',
    pack: { bg: 'linear-gradient(160deg,#37b6ea,#1f6fbf)', fg: '#fff', brand: 'Hata', short: 'RAMUNE', motif: '🥤', band: { text: 'ORIGINAL', bg: '#fff', fg: '#1f6fbf' } },
    price: 15.99, rating: 4.6, reviews: 8120, coupon: 5, prime: true, delivery: 'Mon, Jul 22',
  },
  {
    id: 'honey-butter',
    title: 'Haitai Honey Butter Chip Korean Potato Chips, 3 Pack',
    pack: { bg: 'linear-gradient(160deg,#ffe14d,#f2b705)', fg: '#7a4e00', brand: 'Haitai', short: 'HONEY BUTTER', motif: '🥔', band: { text: 'POTATO CHIP', bg: '#7a4e00', fg: '#ffe14d' } },
    price: 12.99, rating: 4.7, reviews: 6450, prime: true, delivery: 'Mon, Jul 22',
  },
];

const DEPARTMENTS = ['Grocery & Gourmet Food', 'Instant Ramen', 'Snack Foods', 'Beverages', 'International Foods', 'Candy & Chocolate'];
const BRANDS = ['Samyang', 'Nissin', 'Nongshim', 'Maruchan', 'Indomie', 'Ottogi'];

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`}>
      {'★'.repeat(full)}
      {half ? '⯪' : ''}
      {'☆'.repeat(5 - full - (half ? 1 : 0))}
    </span>
  );
}

function ProductThumb({ pack }: { pack: Pack }) {
  return (
    <div className={`az-pack ${pack.shape === 'cup' ? 'cup' : ''}`} style={{ background: pack.bg, color: pack.fg }}>
      {pack.spicy ? <span className="flame">🌶️</span> : null}
      <span className="brand">{pack.brand}</span>
      <span className="motif">{pack.motif}</span>
      <span className="pname">{pack.short}</span>
      {pack.band ? (
        <span className="band" style={{ background: pack.band.bg, color: pack.band.fg }}>
          {pack.band.text}
        </span>
      ) : (
        <span style={{ height: 8 }} />
      )}
    </div>
  );
}

function Price({ value, list }: { value: number; list?: number }) {
  const [dollars, cents] = value.toFixed(2).split('.');
  return (
    <div className="az-price">
      <span className="now">
        <span className="sym">$</span>
        {dollars}
        <sup>{cents}</sup>
      </span>
      {list ? (
        <span className="was">
          List: <s>${list.toFixed(2)}</s>
        </span>
      ) : null}
    </div>
  );
}

function AmazonSmile({ scale = 1 }: { scale?: number }) {
  return (
    <svg width={62 * scale} height={20 * scale} viewBox="0 0 62 20" aria-hidden="true">
      <text x="0" y="15" fontFamily="Helvetica Neue, Arial" fontWeight="800" fontSize="17" letterSpacing="-1" fill="#fff">
        amazon
      </text>
      <path d="M6 17 C 22 22, 44 22, 56 15" fill="none" stroke="#ff9900" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M56 15 l-5-1.6 M56 15 l-1.4 4.6" fill="none" stroke="#ff9900" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function AmazonSite() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [added, setAdded] = useState<string | null>(null);
  const [query, setQuery] = useState('instant ramen');
  const [sort, setSort] = useState('featured');

  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);

  const products = useMemo(() => {
    const copy = [...PRODUCTS];
    if (sort === 'price-asc') copy.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') copy.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') copy.sort((a, b) => b.rating - a.rating);
    else if (sort === 'reviews') copy.sort((a, b) => b.reviews - a.reviews);
    return copy;
  }, [sort]);

  const addToCart = (id: string) => {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
    setAdded(id);
    window.setTimeout(() => setAdded((cur) => (cur === id ? null : cur)), 1400);
  };

  return (
    <div className="az">
      {/* Top nav */}
      <div className="az-top">
        <div className="az-cell az-logo">
          <AmazonSmile scale={1.15} />
        </div>
        <div className="az-cell az-deliver">
          <span className="pin">📍</span>
          <span className="lines">
            <span className="l1">Deliver to Michael</span>
            <span className="l2">New York 10001</span>
          </span>
        </div>
        <form
          className="az-search"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <select className="az-search-cat" aria-label="Search category" defaultValue="grocery">
            <option value="all">All</option>
            <option value="grocery">Grocery</option>
            <option value="ramen">Instant Ramen</option>
            <option value="snacks">Snacks</option>
          </select>
          <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search Amazon" placeholder="Search Amazon" />
          <button type="submit" className="az-search-btn" aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#111"><path d="M21.4 18.6l-5.3-5.3A6.8 6.8 0 1 0 10 17a6.8 6.8 0 0 0 3.3-.9l5.3 5.3a2 2 0 0 0 2.8-2.8zM5 10a5 5 0 1 1 5 5 5 5 0 0 1-5-5z" /></svg>
          </button>
        </form>
        <div className="az-cell az-flag">
          <span>🇺🇸</span> EN
        </div>
        <div className="az-cell az-acct">
          <span className="l1">Hello, Michael</span>
          <span className="l2">Account &amp; Lists ▾</span>
        </div>
        <div className="az-cell az-acct">
          <span className="l1">Returns</span>
          <span className="l2">&amp; Orders</span>
        </div>
        <div className="az-cell az-cart">
          <span className="count">{cartCount}</span>
          <svg width="34" height="30" viewBox="0 0 34 30" fill="none" aria-hidden="true">
            <path d="M2 3h4l3.2 15.2a2 2 0 0 0 2 1.6h13a2 2 0 0 0 2-1.5L31 8H8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="13" cy="25" r="2.2" fill="#fff" />
            <circle cx="26" cy="25" r="2.2" fill="#fff" />
          </svg>
          <span className="word">Cart</span>
        </div>
      </div>

      {/* Sub nav */}
      <div className="az-sub">
        <a className="all">
          <svg width="16" height="12" viewBox="0 0 16 12"><path d="M0 1h16M0 6h16M0 11h16" stroke="#fff" strokeWidth="1.6" /></svg>
          All
        </a>
        <a>Today&apos;s Deals</a>
        <a>Customer Service</a>
        <a>Registry</a>
        <a>Gift Cards</a>
        <a>Grocery</a>
        <a>Sell</a>
        <span className="spacer" />
        <a className="deal">
          Shop deals in <b>Grocery</b>
        </a>
      </div>

      {/* Body */}
      <div className="az-body">
        <aside className="az-rail">
          <h4>Department</h4>
          {DEPARTMENTS.map((d, i) => (
            <div key={d} className={`opt ${i === 0 ? '' : 'link'}`}>
              <span className="lbl">{i === 0 ? <b>{d}</b> : d}</span>
            </div>
          ))}
          <h4>Brands</h4>
          {BRANDS.map((b) => (
            <label key={b} className="opt">
              <input type="checkbox" /> <span className="lbl">{b}</span>
            </label>
          ))}
          <h4>Customer Reviews</h4>
          <div className="opt link">
            <span className="stars">★★★★</span>☆ <span className="lbl">&amp; Up</span>
          </div>
          <h4>Price</h4>
          <div className="opt link"><span className="lbl">Under $10</span></div>
          <div className="opt link"><span className="lbl">$10 to $20</span></div>
          <div className="opt link"><span className="lbl">$20 &amp; Above</span></div>
          <h4>Deals &amp; Discounts</h4>
          <label className="opt"><input type="checkbox" /> <span className="lbl">All Discounts</span></label>
          <label className="opt"><input type="checkbox" /> <span className="lbl">Today&apos;s Deals</span></label>
          <h4>Prime</h4>
          <label className="opt"><input type="checkbox" defaultChecked /> <span className="lbl az-prime"><span className="badge">✓prime</span></span></label>
        </aside>

        <main className="az-main">
          <div className="az-results-head">
            <div>
              <div className="count">
                1-{products.length} of over 4,000 results for <span className="q">&ldquo;{query}&rdquo;</span>
              </div>
              <h1>Results</h1>
            </div>
            <label className="az-sortbar">
              Sort by:
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Avg. Customer Review</option>
                <option value="reviews">Most Reviews</option>
              </select>
            </label>
          </div>

          <div className="az-grid">
            {products.map((p) => {
              const price = p.coupon ? p.price * (1 - p.coupon / 100) : p.price;
              return (
                <article key={p.id} className="az-card">
                  {p.badge ? (
                    <span className={`az-badge ${p.badge.kind}`}>
                      {p.badge.kind === 'choice' ? (
                        <>
                          <b>Amazon&apos;s</b> Choice
                        </>
                      ) : (
                        p.badge.text
                      )}
                    </span>
                  ) : (
                    <span style={{ height: 4 }} />
                  )}
                  <div className="az-thumb">
                    <ProductThumb pack={p.pack} />
                  </div>
                  <div className="az-title">{p.title}</div>
                  <div className="az-rating">
                    <Stars value={p.rating} />
                    <span className="n">{p.reviews.toLocaleString()}</span>
                  </div>
                  {p.bought ? <div className="az-bought">{p.bought}</div> : null}
                  <Price value={price} list={p.listPrice} />
                  {p.coupon ? (
                    <label className="az-coupon">
                      <input type="checkbox" className="box" defaultChecked /> <b>Save {p.coupon}%</b> with coupon
                    </label>
                  ) : null}
                  {p.prime ? (
                    <div className="az-prime">
                      <span className="badge">✓prime</span> FREE delivery
                    </div>
                  ) : null}
                  <div className="az-delivery">
                    Get it <b>{p.delivery}</b>
                  </div>
                  <button type="button" className={`az-add ${cart[p.id] ? 'added' : ''}`} onClick={() => addToCart(p.id)}>
                    {cart[p.id] ? `✓ In Cart (${cart[p.id]})` : 'Add to Cart'}
                  </button>
                </article>
              );
            })}
          </div>

          {added ? <div className="az-toast">Added to Cart · {cartCount} item{cartCount === 1 ? '' : 's'}</div> : null}
        </main>
      </div>

      {/* Footer */}
      <div className="az-backtotop">Back to top</div>
      <div className="az-foot">
        <div>
          <h5>Get to Know Us</h5>
          <a>Careers</a><a>Blog</a><a>About Amazon</a><a>Investor Relations</a>
        </div>
        <div>
          <h5>Make Money with Us</h5>
          <a>Sell on Amazon</a><a>Become an Affiliate</a><a>Advertise Your Products</a>
        </div>
        <div>
          <h5>Amazon Payment Products</h5>
          <a>Amazon Business Card</a><a>Shop with Points</a><a>Reload Your Balance</a>
        </div>
        <div>
          <h5>Let Us Help You</h5>
          <a>Your Account</a><a>Your Orders</a><a>Shipping Rates</a><a>Help</a>
        </div>
      </div>
      <div className="az-copy">© 1996–2026, aOS Marketplace demo · A storefront simulation</div>
    </div>
  );
}
