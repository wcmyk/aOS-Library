import { useState } from 'react';
import { ChaseOctagon } from '../../../data/brands';
import { useShellStore } from '../../../state/useShellStore';
import './chase.css';

const BASE_URL = import.meta.env.BASE_URL;

// www.chase.com public homepage replica. Signing in hands off to the Chase
// Bank app (the logged-in online-banking experience).

const NAV = ['Checking', 'Savings & CDs', 'Credit cards', 'Home loans', 'Auto', 'Investing by J.P. Morgan', 'Education & goals', 'Travel'];

const TILES: Array<{ title: string; body: string; cta: string }> = [
  { title: 'Checking accounts', body: 'Choose the checking account that works best for you. See our Chase Total Checking® offer for new customers. Make purchases with your debit card, and bank from almost anywhere by phone, tablet or computer and more than 14,000 ATMs and more than 5,000 branches.', cta: 'Open a checking account' },
  { title: 'Savings accounts & CDs', body: "It's never too early to begin saving. Open a savings account or open a Certificate of Deposit (see interest rates) and start saving your money.", cta: 'Explore savings' },
  { title: 'Credit cards', body: 'Chase credit cards can help you buy the things you need. Many of our cards offer rewards that can be redeemed for cash back or travel-related perks. With so many options, it can be easy to find a card that matches your lifestyle.', cta: 'Explore credit cards' },
  { title: 'Mortgages', body: 'Apply for a mortgage or refinance your mortgage with Chase. View today’s mortgage rates or calculate what you can afford with our mortgage calculator. Visit our Education Center for homebuying tips and more.', cta: 'See today’s rates' },
  { title: 'Auto', body: 'Chase Auto is here to help you get the right car. Apply for auto financing for a new or used car with Chase. Use the payment calculator to estimate monthly payments.', cta: 'See auto financing' },
  { title: 'Chase for Business', body: 'With Chase for Business you’ll receive guidance from a team of business professionals who specialize in helping improve cash flow, providing credit solutions, and managing payroll.', cta: 'Explore business banking' },
];

const MORE: Array<{ title: string; body: string }> = [
  { title: 'Sports & Entertainment', body: 'Chase gives you access to unique sports, entertainment and culinary events through Chase Experiences and our exclusive partnerships.' },
  { title: 'Chase Security Center', body: 'We don’t just protect your money — we help protect you. Learn how to spot fraud and keep your accounts safe.' },
  { title: 'Investing by J.P. Morgan', body: 'Whether you choose to work with an advisor or invest on your own, we have the tools and resources to help you grow your wealth.' },
  { title: 'Chase Private Client', body: 'Get more from a personalized relationship with dedicated banking support and exclusive benefits.' },
];

export function ChaseSite() {
  const openWindow = useShellStore((s) => s.openWindow);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);

  const signIn = () => {
    openWindow('banking');
  };

  return (
    <div className="chs-page">
      {/* Utility bar */}
      <div className="chs-utility">
        <div className="chs-utility-inner">
          <div className="chs-utility-left">
            <button type="button" className="active">Personal</button>
            <button type="button">Business</button>
            <button type="button">Commercial</button>
          </div>
          <div className="chs-utility-right">
            <button type="button">Schedule a meeting</button>
            <button type="button">Customer service</button>
            <button type="button">Español</button>
            <button type="button" aria-label="Search">⌕</button>
          </div>
        </div>
      </div>

      {/* Brand header */}
      <header className="chs-header">
        <div className="chs-header-inner">
          <div className="chs-brand">
            <ChaseOctagon size={30} color="#fff" />
            <span className="chs-wordmark">CHASE</span>
          </div>
          <nav className="chs-nav">
            {NAV.map((item) => (
              <button key={item} type="button">{item} <span className="chs-caret">▾</span></button>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero: sign-in module + offer */}
      <section className="chs-hero">
        <div className="chs-hero-inner">
          <div className="chs-signin">
            <h2>Welcome</h2>
            <label className="chs-field">
              <span>Username</span>
              <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
            </label>
            <label className="chs-field">
              <span>Password</span>
              <div className="chs-pw-wrap">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="chs-showpw" onClick={() => setShowPw((v) => !v)}>{showPw ? 'Hide' : 'Show'}</button>
              </div>
            </label>
            <div className="chs-signin-row">
              <label className="chs-check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label>
              <label className="chs-check"><input type="checkbox" /> Use token</label>
            </div>
            <button type="button" className="chs-signin-btn" onClick={signIn}>Sign in</button>
            <div className="chs-signin-links">
              <button type="button">Forgot username/password?</button>
              <button type="button">Not Enrolled? Sign Up Now.</button>
            </div>
          </div>

          <div className="chs-offer">
            <div className="chs-offer-card">
              <div className="chs-offer-kicker">CHASE SAPPHIRE PREFERRED®</div>
              <h1>Earn 75,000 bonus points</h1>
              <p>after you spend $5,000 on purchases in the first 3 months from account opening. That’s $940 toward travel when you redeem through Chase Travel℠.</p>
              <div className="chs-offer-ctas">
                <button type="button" className="chs-cta-primary">Learn more</button>
                <button type="button" className="chs-cta-ghost">Compare cards</button>
              </div>
              <div className="chs-offer-card-art" aria-hidden>
                <img className="chs-card-photo" src={`${BASE_URL}assets/banking/sapphire-card.webp`} alt="" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product tiles */}
      <section className="chs-tiles">
        {TILES.map((t) => (
          <div key={t.title} className="chs-tile">
            <h3>{t.title}</h3>
            <p>{t.body}</p>
            <button type="button" className="chs-tile-link">{t.cta} ›</button>
          </div>
        ))}
      </section>

      <section className="chs-more">
        {MORE.map((m) => (
          <div key={m.title} className="chs-more-item">
            <h4>{m.title}</h4>
            <p>{m.body}</p>
          </div>
        ))}
      </section>

      <footer className="chs-footer">
        <div className="chs-footer-links">
          {['About Chase', 'J.P. Morgan', 'JPMorgan Chase & Co.', 'Media Center', 'Careers', 'Site map', 'Privacy & security', 'Terms of use', 'Accessibility', 'AdChoices', 'Member FDIC', 'Equal Housing Lender'].map((l) => (
            <button key={l} type="button">{l}</button>
          ))}
        </div>
        <p className="chs-legal">
          “Chase,” “JPMorgan,” “JPMorgan Chase,” the JPMorgan Chase logo and the Octagon Symbol are trademarks of JPMorgan Chase Bank, N.A. JPMorgan Chase Bank, N.A. is a wholly-owned subsidiary of JPMorgan Chase &amp; Co.
        </p>
        <p className="chs-legal">© 2026 JPMorgan Chase &amp; Co. · Simulation environment — for training use only.</p>
      </footer>
    </div>
  );
}
