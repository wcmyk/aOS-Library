import { useMemo, useState } from 'react';
import './amazon.css';

const BASE_URL = import.meta.env.BASE_URL;
const img = (id: string) => `${BASE_URL}assets/amazon/${id}.jpg`;

/* ─── Product catalog (grocery: instant ramen, noodles, snacks & drinks) ─────── */

type Badge = { kind: 'overall' | 'choice' | 'best' | 'deal'; text: string };

type Product = {
  id: string;
  title: string;
  price: number;
  listPrice?: number;
  unit?: string;
  rating: number; // 0-5
  reviews: number;
  bought?: string;
  badge?: Badge;
  sponsored?: boolean;
  coupon?: number; // percent
  prime?: boolean;
  delivery: string;
  fastest?: string;
};

const PRODUCTS: Product[] = [
  {
    id: 'buldak-2x',
    title: 'Samyang Buldak Hot Chicken Flavor Ramen (2x Spicy), Pack of 5',
    price: 9.48, listPrice: 12.99, unit: '($1.90 / Count)', rating: 4.8, reviews: 41250, bought: '10K+ bought in past month',
    badge: { kind: 'best', text: '#1 Best Seller' }, coupon: 10, prime: true, delivery: 'Tomorrow, Jul 20', fastest: 'Today 7 PM',
  },
  {
    id: 'buldak-carbonara',
    title: 'Samyang Buldak Carbonara Hot Chicken Flavor Ramen, Pack of 5',
    price: 10.99, unit: '($2.20 / Count)', rating: 4.7, reviews: 18740, bought: '5K+ bought in past month',
    badge: { kind: 'overall', text: 'Overall Pick' }, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'buldak-3x',
    title: 'Samyang Buldak 3x Spicy Extra Hot Chicken Flavor Ramen, Pack of 5',
    price: 11.49, listPrice: 13.99, unit: '($2.30 / Count)', rating: 4.6, reviews: 22910, bought: '3K+ bought in past month',
    coupon: 15, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'topramen-chicken',
    title: 'Nissin Top Ramen Chicken Flavor Instant Ramen Noodle Soup, 24 Pack',
    price: 7.68, listPrice: 9.36, unit: '($0.32 / Count)', rating: 4.8, reviews: 68420, bought: '20K+ bought in past month',
    badge: { kind: 'choice', text: "Amazon's Choice" }, prime: true, delivery: 'Tomorrow, Jul 20', fastest: 'Today 7 PM',
  },
  {
    id: 'topramen-beef',
    title: 'Nissin Top Ramen Beef Flavor Instant Ramen Noodle Soup, 24 Pack',
    price: 7.68, unit: '($0.32 / Count)', rating: 4.7, reviews: 39110, bought: '9K+ bought in past month',
    prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'shin-ramyun',
    title: 'Nongshim Shin Ramyun Spicy Noodle Soup, Pack of 20',
    price: 18.99, listPrice: 23.49, unit: '($0.95 / Count)', rating: 4.8, reviews: 51200, bought: '8K+ bought in past month',
    badge: { kind: 'best', text: '#1 Best Seller' }, coupon: 5, prime: true, delivery: 'Tomorrow, Jul 20', fastest: 'Today 7 PM',
  },
  {
    id: 'cup-noodles',
    title: 'Nissin Cup Noodles Chicken Flavor Ramen Soup, 24 Cups',
    price: 14.28, unit: '($0.60 / Count)', rating: 4.7, reviews: 44300, bought: '7K+ bought in past month',
    sponsored: true, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'indomie',
    title: 'Indomie Mi Goreng Instant Stir Fry Noodles, Pack of 30',
    price: 19.99, listPrice: 24.99, unit: '($0.67 / Count)', rating: 4.8, reviews: 62100, bought: '6K+ bought in past month',
    badge: { kind: 'choice', text: "Amazon's Choice" }, coupon: 8, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'chapagetti',
    title: 'Nongshim Chapagetti Chajang Noodle, Pack of 8',
    price: 12.49, unit: '($1.56 / Count)', rating: 4.7, reviews: 15980, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'jin-ramen',
    title: 'Ottogi Jin Ramen Spicy Instant Noodle, Pack of 20',
    price: 16.99, unit: '($0.85 / Count)', rating: 4.6, reviews: 12040, coupon: 10, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'sapporo',
    title: 'Sapporo Ichiban Original Ramen Noodle Soup, Pack of 24',
    price: 21.6, unit: '($0.90 / Count)', rating: 4.6, reviews: 9870, sponsored: true, prime: true, delivery: 'Mon, Jul 22',
  },
  {
    id: 'maruchan',
    title: 'Maruchan Ramen Chicken Flavor Instant Noodle Soup, 24 Pack',
    price: 6.98, unit: '($0.29 / Count)', rating: 4.7, reviews: 58700, bought: '15K+ bought in past month',
    prime: true, delivery: 'Tomorrow, Jul 20', fastest: 'Today 7 PM',
  },
  {
    id: 'pocky',
    title: 'Glico Pocky Chocolate Biscuit Sticks, Pack of 10',
    price: 13.49, unit: '($1.35 / Count)', rating: 4.8, reviews: 27600, bought: '4K+ bought in past month',
    prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'hichew',
    title: 'Hi-Chew Sensationally Chewy Candy Assorted Fruit, 12 Pack',
    price: 11.99, unit: '($1.00 / Count)', rating: 4.8, reviews: 33900, badge: { kind: 'overall', text: 'Overall Pick' }, prime: true, delivery: 'Tomorrow, Jul 20',
  },
  {
    id: 'ramune',
    title: 'Hata Ramune Japanese Marble Soda Original, 6 Bottles',
    price: 15.99, unit: '($2.67 / Count)', rating: 4.6, reviews: 8120, coupon: 5, prime: true, delivery: 'Mon, Jul 22',
  },
  {
    id: 'honey-butter',
    title: 'Haitai Honey Butter Chip Korean Potato Chips, 3 Pack',
    price: 12.99, unit: '($4.33 / Count)', rating: 4.7, reviews: 6450, prime: true, delivery: 'Mon, Jul 22',
  },
];

const DEPARTMENTS = ['Grocery & Gourmet Food', 'Instant Ramen', 'Snack Foods', 'Beverages', 'International Foods', 'Candy & Chocolate'];
const BRANDS = ['Samyang', 'Nissin', 'Nongshim', 'Maruchan', 'Indomie', 'Ottogi'];

function Stars({ value }: { value: number }) {
  const pct = (value / 5) * 100;
  return (
    <span className="az-stars" role="img" aria-label={`${value} out of 5 stars`}>
      <span className="az-stars-bg">★★★★★</span>
      <span className="az-stars-fg" style={{ width: `${pct}%` }}>★★★★★</span>
    </span>
  );
}

function Price({ value, list, unit }: { value: number; list?: number; unit?: string }) {
  const [dollars, cents] = value.toFixed(2).split('.');
  return (
    <div className="az-price-row">
      <span className="az-price">
        <span className="sym">$</span>
        <span className="whole">{dollars}</span>
        <span className="frac">{cents}</span>
      </span>
      {unit ? <span className="az-unit">{unit}</span> : null}
      {list ? (
        <span className="az-was">
          List: <s>${list.toFixed(2)}</s>
        </span>
      ) : null}
    </div>
  );
}

function AmazonSmile({ scale = 1 }: { scale?: number }) {
  return (
    <svg width={80 * scale} height={26 * scale} viewBox="0 0 80 26" aria-hidden="true">
      <text x="1" y="19" fontFamily="Helvetica Neue, Arial" fontWeight="800" fontSize="22" letterSpacing="-1.4" fill="#fff">
        amazon
      </text>
      <path d="M8 22 C 28 28, 58 28, 72 20" fill="none" stroke="#ff9900" strokeWidth="3.1" strokeLinecap="round" />
      <path d="M72 20 l-6.5-2 M72 20 l-1.8 6" fill="none" stroke="#ff9900" strokeWidth="2.8" strokeLinecap="round" />
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
    window.setTimeout(() => setAdded((cur) => (cur === id ? null : cur)), 1600);
  };

  return (
    <div className="az">
      {/* Top nav */}
      <div className="az-top">
        <div className="az-cell az-logo">
          <AmazonSmile scale={1.1} />
          <span className="az-logo-tld">.com</span>
        </div>
        <div className="az-cell az-deliver">
          <span className="pin">
            <svg width="15" height="16" viewBox="0 0 15 16" fill="#fff"><path d="M7.5 0C4 0 1.5 2.6 1.5 5.9 1.5 10 7.5 16 7.5 16s6-6 6-10.1C13.5 2.6 11 0 7.5 0zm0 8.2a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6z" /></svg>
          </span>
          <span className="lines">
            <span className="l1">Deliver to Michael</span>
            <span className="l2">New York 10001</span>
          </span>
        </div>
        <form className="az-search" onSubmit={(e) => e.preventDefault()}>
          <select className="az-search-cat" aria-label="Search category" defaultValue="grocery">
            <option value="all">All</option>
            <option value="grocery">Grocery</option>
            <option value="ramen">Instant Ramen</option>
            <option value="snacks">Snacks</option>
          </select>
          <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search Amazon" placeholder="Search Amazon" />
          <button type="submit" className="az-search-btn" aria-label="Search">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="#111"><path d="M21.4 18.6l-5.3-5.3A6.8 6.8 0 1 0 10 17a6.8 6.8 0 0 0 3.3-.9l5.3 5.3a2 2 0 0 0 2.8-2.8zM5 10a5 5 0 1 1 5 5 5 5 0 0 1-5-5z" /></svg>
          </button>
        </form>
        <div className="az-cell az-flag">
          <svg width="22" height="15" viewBox="0 0 22 15" style={{ borderRadius: 2 }}><rect width="22" height="15" fill="#b22234" /><g fill="#fff"><rect y="1.15" width="22" height="1.15" /><rect y="3.46" width="22" height="1.15" /><rect y="5.77" width="22" height="1.15" /><rect y="8.08" width="22" height="1.15" /><rect y="10.38" width="22" height="1.15" /><rect y="12.69" width="22" height="1.15" /></g><rect width="9" height="8.08" fill="#3c3b6e" /></svg>
          <span>EN ▾</span>
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
          <span className="az-cart-ico">
            <span className="count">{cartCount}</span>
            <svg width="38" height="32" viewBox="0 0 38 32" fill="none" aria-hidden="true">
              <path d="M2 4h5l3.6 16.4a2.4 2.4 0 0 0 2.35 1.9h14.3a2.4 2.4 0 0 0 2.34-1.8L34.5 10H9" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="14.5" cy="28" r="2.6" fill="#fff" />
              <circle cx="28.5" cy="28" r="2.6" fill="#fff" />
            </svg>
          </span>
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
            <Stars value={4} /> <span className="lbl">&amp; Up</span>
          </div>
          <h4>Price</h4>
          <div className="opt link"><span className="lbl">Under $10</span></div>
          <div className="opt link"><span className="lbl">$10 to $20</span></div>
          <div className="opt link"><span className="lbl">$20 &amp; Above</span></div>
          <h4>Deals &amp; Discounts</h4>
          <label className="opt"><input type="checkbox" /> <span className="lbl">All Discounts</span></label>
          <label className="opt"><input type="checkbox" /> <span className="lbl">Today&apos;s Deals</span></label>
          <h4>Prime</h4>
          <label className="opt prime-opt"><input type="checkbox" defaultChecked /> <span className="az-prime-badge">✓prime</span></label>
        </aside>

        <main className="az-main">
          <div className="az-results-head">
            <div>
              <div className="count">
                1-{products.length} of over 4,000 results for <span className="q">&ldquo;{query}&rdquo;</span>
              </div>
              <h1>Results</h1>
              <div className="subnote">Check each product page for other buying options.</div>
            </div>
            <label className="az-sortbar">
              Sort by:
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Avg. Customer Review</option>
                <option value="reviews">Newest Arrivals</option>
              </select>
            </label>
          </div>

          <div className="az-grid">
            {products.map((p) => {
              const price = p.coupon ? p.price * (1 - p.coupon / 100) : p.price;
              return (
                <article key={p.id} className="az-card">
                  {p.sponsored ? <span className="az-sponsored">Sponsored ⓘ</span> : null}
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
                  ) : !p.sponsored ? (
                    <span className="az-badge-spacer" />
                  ) : null}
                  <div className="az-thumb">
                    <img src={img(p.id)} alt={p.title} loading="lazy" />
                  </div>
                  <div className="az-title">{p.title}</div>
                  <div className="az-rating">
                    <span className="val">{p.rating.toFixed(1)}</span>
                    <Stars value={p.rating} />
                    <span className="n">{p.reviews.toLocaleString()}</span>
                  </div>
                  {p.bought ? <div className="az-bought">{p.bought}</div> : null}
                  <Price value={price} list={p.listPrice} unit={p.unit} />
                  {p.coupon ? (
                    <label className="az-coupon">
                      <input type="checkbox" className="box" defaultChecked /> <b>Save {p.coupon}%</b> with coupon
                    </label>
                  ) : null}
                  {p.prime ? (
                    <div className="az-prime">
                      <span className="az-prime-badge">✓prime</span> <span>FREE delivery</span> <b>{p.delivery}</b>
                    </div>
                  ) : null}
                  {p.fastest ? (
                    <div className="az-fastest">
                      Or fastest delivery <b>{p.fastest}</b>
                    </div>
                  ) : null}
                  <button type="button" className={`az-add ${cart[p.id] ? 'added' : ''}`} onClick={() => addToCart(p.id)}>
                    {cart[p.id] ? `✓ In Cart (${cart[p.id]})` : 'Add to cart'}
                  </button>
                </article>
              );
            })}
          </div>
        </main>
      </div>

      {/* Added-to-cart toast (fixed, no layout shift) */}
      {added ? (
        <div className="az-toast">
          <span className="az-toast-check">✓</span> Added to Cart · {cartCount} item{cartCount === 1 ? '' : 's'}
        </div>
      ) : null}

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
