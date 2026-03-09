import { useMemo, useState } from 'react';
import { useMailStore } from '../../state/useMailStore';
import { useShellStore } from '../../state/useShellStore';

type Listing = { id: string; building: string; city: string; price: number; beds: number; baths: number; sqft: number; type: 'lease' | 'buy' };

const listings: Listing[] = [
  { id: 'l1', building: 'Parkview Tower', city: 'Seattle, WA', price: 2480, beds: 2, baths: 2, sqft: 1180, type: 'lease' },
  { id: 'l2', building: 'One Harbor Residences', city: 'Boston, MA', price: 3150, beds: 2, baths: 2, sqft: 1320, type: 'lease' },
  { id: 'l3', building: 'Riviera Crest', city: 'Austin, TX', price: 765000, beds: 3, baths: 3, sqft: 2240, type: 'buy' },
  { id: 'l4', building: 'Elmstone Place', city: 'Denver, CO', price: 685000, beds: 3, baths: 2, sqft: 1980, type: 'buy' },
];

export function RealtorApp() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Listing>(listings[0]);
  const sendEmail = useMailStore((s) => s.sendEmail);
  const openWindow = useShellStore((s) => s.openWindow);

  const filtered = useMemo(() => listings.filter((l) => `${l.building} ${l.city}`.toLowerCase().includes(query.toLowerCase())), [query]);

  const contactAgent = () => {
    const subject = `${selected.building} - ${selected.type === 'lease' ? 'Lease Request' : 'Application'}`;
    sendEmail({
      from: 'user@workspace.aos',
      to: 'agent@prime-residential.com',
      subject,
      body: `<p>Hello, I am interested in ${selected.building} and would like to proceed.</p>`,
      date: new Date().toISOString(),
      folder: 'sent',
    });
    sendEmail({
      from: 'Prime Residential <leasing@prime-residential.com>',
      to: 'user@workspace.aos',
      subject: `Re: ${subject}`,
      body: `<p>Thank you for your interest in <strong>${selected.building}</strong>. We will contact you within 3-5 business days with next steps.</p><p>To continue automatically, reply with APPLY%%%.</p>`,
      date: new Date().toISOString(),
      folder: 'inbox',
    });
    openWindow('outlook');
  };

  return (
    <div style={{ height: '100%', background: '#eef2f7', color: '#0f172a', display: 'grid', gridTemplateRows: 'auto 1fr', fontFamily: "'SF Pro Display','Inter',system-ui,sans-serif" }}>
      <header style={{ background: '#1e3a5f', color: 'white', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <strong style={{ fontSize: 20 }}>Prime Residential</strong>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search building or city" style={{ marginLeft: 'auto', width: 320, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.12)', color: 'white' }} />
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 14, padding: 14, overflow: 'hidden' }}>
        <aside style={{ background: 'white', borderRadius: 12, border: '1px solid #dbe3ee', overflow: 'auto', padding: 12 }}>
          {filtered.map((l) => (
            <button key={l.id} type="button" onClick={() => setSelected(l)} style={{ width: '100%', textAlign: 'left', background: selected.id === l.id ? '#eaf2ff' : 'transparent', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{l.building}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{l.city}</div>
              <div style={{ marginTop: 4, color: '#1e3a5f', fontWeight: 700 }}>{l.type === 'lease' ? `$${l.price.toLocaleString()}/mo` : `$${l.price.toLocaleString()}`}</div>
            </button>
          ))}
        </aside>
        <main style={{ background: 'white', borderRadius: 12, border: '1px solid #dbe3ee', padding: 18, overflow: 'auto' }}>
          <h2 style={{ marginTop: 0 }}>{selected.building}</h2>
          <div style={{ color: '#64748b' }}>{selected.city}</div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <Metric label="Beds" value={String(selected.beds)} /><Metric label="Baths" value={String(selected.baths)} /><Metric label="Square Feet" value={selected.sqft.toLocaleString()} /><Metric label="Listing" value={selected.type === 'lease' ? 'Lease' : 'Purchase'} />
          </div>
          <section style={{ marginTop: 14, border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
            <h3 style={{ marginTop: 0 }}>Workflow automation</h3>
            <p style={{ color: '#475569', fontSize: 14 }}>All communication routes through Outlook. Subject lines are generated from the selected building and request type. Automatic response handling is enabled for APPLY%%%, LEASEPLEASE, LEASEDONE%, and MORTPLEASE workflows.</p>
          </section>
          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            <button type="button" onClick={contactAgent} style={{ padding: '10px 14px', borderRadius: 8, background: '#1e3a5f', color: 'white', fontWeight: 700 }}>Contact agent through Outlook</button>
            <button type="button" onClick={() => openWindow('rentcafe')} style={{ padding: '10px 14px', borderRadius: 8, background: '#0b4ea2', color: 'white', fontWeight: 700 }}>Open RentCafe</button>
          </div>
        </main>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 10 }}><div style={{ color: '#64748b', fontSize: 12 }}>{label}</div><strong>{value}</strong></div>;
}
