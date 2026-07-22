import { useState } from 'react';
import { useMailStore } from '../../../state/useMailStore';
import './jpm.css';

/*
 * jpmorgan.com/global replica — corporate & investment banking site.
 * Multi-page (home, businesses, insights, careers, contact, advisor) via a
 * view union. "Find an Advisor" submits a real request that lands in Mail.
 */

type View = 'home' | 'businesses' | 'insights' | 'about' | 'careers' | 'contact' | 'advisor';

const BUSINESSES = [
  { id: 'ib', name: 'Investment Banking', body: 'M&A advisory, capital raising, and strategic corporate finance for the world’s leading companies, institutions and governments.', icon: '🏦' },
  { id: 'markets', name: 'Markets', body: 'Sales, trading and research across equities, fixed income, currencies and commodities with deep global liquidity.', icon: '📈' },
  { id: 'commercial', name: 'Commercial Banking', body: 'Credit, treasury and payments solutions for midsize businesses, corporations and municipalities.', icon: '🏢' },
  { id: 'awm', name: 'Asset & Wealth Management', body: 'Investment management and private banking for institutions, advisors and high‑net‑worth individuals.', icon: '💼' },
  { id: 'payments', name: 'Payments', body: 'Move money globally with treasury services, merchant acquiring and embedded finance.', icon: '💳' },
  { id: 'chase', name: 'Chase Consumer Banking', body: 'Everyday banking, cards, home lending and auto for nearly half of U.S. households.', icon: '🏛️' },
];

const INSIGHTS = [
  { tag: 'Global Research', title: 'The 2026 outlook: navigating a soft landing', read: '8 min', body: 'Our economists weigh growth, inflation and the path of central bank policy across major markets.' },
  { tag: 'Markets', title: 'Where AI capital expenditure goes next', read: '6 min', body: 'Hyperscaler spending is reshaping supply chains, power demand and equity leadership.' },
  { tag: 'Wealth Planning', title: 'Positioning portfolios for a lower‑rate regime', read: '5 min', body: 'Duration, quality and diversification as the rate cycle turns.' },
  { tag: 'Sustainability', title: 'Financing the energy transition at scale', read: '7 min', body: 'How capital markets are funding grid, storage and clean generation.' },
];

const STATS = [
  ['$4.0T', 'Assets'], ['100+', 'Markets'], ['~310k', 'Employees'], ['200 yrs', 'Of history'],
];

export function JPMorganSite() {
  const [view, setView] = useState<View>('home');
  const go = (v: View) => setView(v);
  const NAV: [View, string][] = [['businesses', 'Our Businesses'], ['insights', 'Insights'], ['about', 'About Us'], ['careers', 'Careers'], ['contact', 'Contact']];

  return (
    <div className="jpm">
      <header className="jpm-nav">
        <button className="jpm-brand" onClick={() => go('home')}>
          <span className="jpm-octagon" aria-hidden="true" />
          J.P.Morgan
        </button>
        <nav className="jpm-links">
          {NAV.map(([v, label]) => (
            <button key={v} className={`jpm-link ${view === v ? 'on' : ''}`} onClick={() => go(v)}>{label}</button>
          ))}
        </nav>
        <button className="jpm-cta" onClick={() => go('advisor')}>Find an Advisor</button>
      </header>

      <main className="jpm-main">
        {view === 'home' && <Home go={go} />}
        {view === 'businesses' && <Businesses go={go} />}
        {view === 'insights' && <Insights />}
        {view === 'about' && <About />}
        {view === 'careers' && <Careers go={go} />}
        {view === 'contact' && <Contact go={go} />}
        {view === 'advisor' && <Advisor go={go} />}
      </main>

      <footer className="jpm-footer">
        <div className="jpm-footer-cols">
          <div><h5>Our Businesses</h5>{BUSINESSES.map((b) => <a key={b.id} onClick={() => go('businesses')}>{b.name}</a>)}</div>
          <div><h5>Insights</h5><a onClick={() => go('insights')}>Global Research</a><a onClick={() => go('insights')}>Markets</a><a onClick={() => go('insights')}>Wealth Planning</a></div>
          <div><h5>About</h5><a onClick={() => go('about')}>Who We Are</a><a onClick={() => go('careers')}>Careers</a><a onClick={() => go('contact')}>Contact Us</a></div>
          <div><h5>Get Help</h5><a onClick={() => go('advisor')}>Find an Advisor</a><a onClick={() => go('contact')}>Client Support</a><a onClick={() => go('contact')}>Media Inquiries</a></div>
        </div>
        <div className="jpm-legal">© {new Date().getFullYear()} JPMorgan Chase &amp; Co. All rights reserved. &nbsp;·&nbsp; “J.P. Morgan” is a marketing name for the investment banking businesses of JPMorgan Chase &amp; Co. and its subsidiaries. &nbsp;·&nbsp; Privacy &nbsp;·&nbsp; Terms</div>
      </footer>
    </div>
  );
}

function Home({ go }: { go: (v: View) => void }) {
  return (
    <>
      <section className="jpm-hero">
        <div className="jpm-hero-inner">
          <div className="jpm-eyebrow">A leader in financial services</div>
          <h1>Making dreams possible — for everyone, everywhere, every day.</h1>
          <p>For over 200 years, J.P. Morgan has helped clients do first‑class business by providing strategic advice, capital and world‑class execution across the globe.</p>
          <div className="jpm-hero-btns">
            <button className="jpm-cta" onClick={() => go('businesses')}>Explore our businesses</button>
            <button className="jpm-ghost" onClick={() => go('insights')}>Read the latest insights ›</button>
          </div>
        </div>
      </section>
      <section className="jpm-stats">
        {STATS.map(([n, l]) => <div key={l} className="jpm-stat"><div className="jpm-stat-n">{n}</div><div className="jpm-stat-l">{l}</div></div>)}
      </section>
      <section className="jpm-band">
        <h2>Our Businesses</h2>
        <div className="jpm-cards">
          {BUSINESSES.slice(0, 4).map((b) => (
            <button key={b.id} className="jpm-card" onClick={() => go('businesses')}>
              <div className="jpm-card-ic">{b.icon}</div>
              <div className="jpm-card-name">{b.name}</div>
              <div className="jpm-card-body">{b.body}</div>
              <span className="jpm-card-more">Learn more ›</span>
            </button>
          ))}
        </div>
      </section>
      <section className="jpm-insights-teaser">
        <h2>Latest thinking</h2>
        <div className="jpm-cards">
          {INSIGHTS.slice(0, 3).map((a) => (
            <button key={a.title} className="jpm-icard" onClick={() => go('insights')}>
              <div className="jpm-icard-tag">{a.tag}</div>
              <div className="jpm-icard-title">{a.title}</div>
              <div className="jpm-icard-read">{a.read} read</div>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function Businesses({ go }: { go: (v: View) => void }) {
  return (
    <div className="jpm-page">
      <h1>Our Businesses</h1>
      <p className="jpm-lead">We serve millions of consumers, small businesses and many of the world’s most prominent corporate, institutional and government clients.</p>
      <div className="jpm-cards">
        {BUSINESSES.map((b) => (
          <div key={b.id} className="jpm-card jpm-card-static">
            <div className="jpm-card-ic">{b.icon}</div>
            <div className="jpm-card-name">{b.name}</div>
            <div className="jpm-card-body">{b.body}</div>
            <button className="jpm-ghost" onClick={() => go('advisor')}>Talk to our team ›</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Insights() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="jpm-page">
      <h1>Insights</h1>
      <p className="jpm-lead">Timely research and expert perspective from across J.P. Morgan.</p>
      <div className="jpm-articles">
        {INSIGHTS.map((a) => (
          <article key={a.title} className="jpm-article">
            <div className="jpm-icard-tag">{a.tag}</div>
            <h3>{a.title}</h3>
            <div className="jpm-article-meta">{a.read} read</div>
            <p>{a.body}</p>
            {open === a.title && <p className="jpm-article-more">Our analysts examine the drivers, risks and portfolio implications in depth, with scenario analysis across base, bull and bear cases. Clients can request the full report and a briefing from their coverage team.</p>}
            <button className="jpm-ghost" onClick={() => setOpen(open === a.title ? null : a.title)}>{open === a.title ? 'Show less' : 'Read more ›'}</button>
          </article>
        ))}
      </div>
    </div>
  );
}

function About() {
  return (
    <div className="jpm-page">
      <h1>About Us</h1>
      <p className="jpm-lead">JPMorgan Chase &amp; Co. is a leading financial services firm based in the United States with operations worldwide.</p>
      <div className="jpm-stats jpm-stats-inline">
        {STATS.map(([n, l]) => <div key={l} className="jpm-stat"><div className="jpm-stat-n">{n}</div><div className="jpm-stat-l">{l}</div></div>)}
      </div>
      <div className="jpm-prose">
        <h3>Our purpose</h3>
        <p>We aim to be the most respected financial services firm in the world, serving corporations and individuals in more than 100 markets. We believe our strength lies in disciplined risk management, a fortress balance sheet, and a relentless focus on our clients.</p>
        <h3>Our values</h3>
        <p>Exceptional client service; operational excellence; a commitment to integrity, fairness and responsibility; and a great team and winning culture.</p>
      </div>
    </div>
  );
}

function Careers({ go }: { go: (v: View) => void }) {
  const ROLES = ['Investment Banking Analyst', 'Quantitative Researcher', 'Software Engineer', 'Wealth Advisor', 'Risk Manager', 'Data Scientist'];
  return (
    <div className="jpm-page">
      <h1>Careers</h1>
      <p className="jpm-lead">Bring your ambition. Do work that matters at a firm that shapes the future of finance.</p>
      <div className="jpm-roles">
        {ROLES.map((r) => (
          <div key={r} className="jpm-role">
            <div><div className="jpm-role-name">{r}</div><div className="jpm-role-meta">Full‑time · New York, London, Singapore</div></div>
            <button className="jpm-ghost" onClick={() => go('contact')}>Apply ›</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Contact({ go }: { go: (v: View) => void }) {
  const CARDS = [
    { icon: '👤', title: 'Individuals & Wealth', body: 'Find a J.P. Morgan advisor for planning, investing and private banking.', cta: 'Find an Advisor', act: () => go('advisor') },
    { icon: '🏢', title: 'Corporate & Institutional', body: 'Connect with our banking, markets and payments coverage teams.', cta: 'Request a call', act: () => go('advisor') },
    { icon: '💬', title: 'Client Support', body: 'Existing clients can reach 24/7 support for accounts and services.', cta: 'Chat / Call 1‑800‑935‑9935', act: () => go('advisor') },
    { icon: '📰', title: 'Media Inquiries', body: 'For press and media requests, contact our communications team.', cta: 'Email Media Relations', act: () => go('advisor') },
  ];
  return (
    <div className="jpm-page">
      <h1>Contact Us</h1>
      <p className="jpm-lead">However you work with us, we’re here to help.</p>
      <div className="jpm-cards">
        {CARDS.map((c) => (
          <div key={c.title} className="jpm-card jpm-card-static">
            <div className="jpm-card-ic">{c.icon}</div>
            <div className="jpm-card-name">{c.title}</div>
            <div className="jpm-card-body">{c.body}</div>
            <button className="jpm-cta jpm-cta-sm" onClick={c.act}>{c.cta}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Advisor({ go }: { go: (v: View) => void }) {
  const sendEmail = useMailStore((s) => s.sendEmail);
  const [form, setForm] = useState({ name: '', email: '', phone: '', interest: 'Wealth Management', investable: '$250k – $1M', message: '' });
  const [sent, setSent] = useState(false);

  const submit = () => {
    try {
      sendEmail({
        from: 'J.P. Morgan Advisors <advisors@jpmorgan.com>',
        to: form.email || 'me',
        subject: `Your request to connect with a J.P. Morgan advisor`,
        body: `Dear ${form.name || 'Client'},\n\nThank you for your interest in J.P. Morgan ${form.interest}. A dedicated advisor will reach out to you at ${form.phone || form.email || 'your contact details'} within one business day.\n\nArea of interest: ${form.interest}\nInvestable assets: ${form.investable}\nYour note: “${form.message}”\n\nWe look forward to helping you achieve your financial goals.\n\nSincerely,\nJ.P. Morgan Private Client Advisory`,
        date: new Date().toISOString(),
        folder: 'inbox',
      });
    } catch { /* mail optional */ }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="jpm-page jpm-thanks">
        <div className="jpm-check">✓</div>
        <h1>Your request has been received.</h1>
        <p>A J.P. Morgan advisor will contact you within one business day about {form.interest}.</p>
        <p className="jpm-muted">We’ve sent a confirmation to your Mail inbox.</p>
        <button className="jpm-cta" onClick={() => go('home')}>Back to home</button>
      </div>
    );
  }

  return (
    <div className="jpm-page jpm-advisor">
      <h1>Find an Advisor</h1>
      <p className="jpm-lead">Tell us a little about yourself and we’ll match you with the right J.P. Morgan professional.</p>
      <div className="jpm-form">
        <div className="jpm-form-two">
          <label>Full name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        </div>
        <div className="jpm-form-two">
          <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label>Area of interest
            <select value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })}>
              {['Wealth Management', 'Private Banking', 'Investment Banking', 'Commercial Banking', 'Markets', 'Retirement Planning'].map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
        </div>
        <label>Investable assets
          <select value={form.investable} onChange={(e) => setForm({ ...form, investable: e.target.value })}>
            {['Under $250k', '$250k – $1M', '$1M – $10M', '$10M+'].map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label>How can we help?<textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
        <button className="jpm-cta" onClick={submit}>Request a call</button>
        <div className="jpm-disclaimer">By submitting, you agree to be contacted by J.P. Morgan. Investing involves market risk, including possible loss of principal. This is a simulated experience.</div>
      </div>
    </div>
  );
}
