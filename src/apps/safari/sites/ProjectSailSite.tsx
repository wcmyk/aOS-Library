import { useProfileStore } from '../../../state/useProfileStore';

const DEALS = [
  { id: 'SAIL-2024-0891', client: 'Meridian Capital Partners', size: '$2.4B', stage: 'Due Diligence', owner: 'You', eta: 'Jun 15', type: 'M&A Advisory' },
  { id: 'SAIL-2024-0756', client: 'Hartfield Global Holdings', size: '$780M', stage: 'Mandate', owner: 'Director', eta: 'Jul 30', type: 'Leveraged Finance' },
  { id: 'SAIL-2024-0644', client: 'Pacific Insurance Group', size: '$3.1B', stage: 'Execution', owner: 'You', eta: 'May 30', type: 'Debt Capital Markets' },
  { id: 'SAIL-2024-0512', client: 'NexGen Pharmaceuticals', size: '$1.2B', stage: 'Pitch', owner: 'Team Lead', eta: 'Aug 12', type: 'IPO Advisory' },
  { id: 'SAIL-2024-0401', client: 'Cromwell Infrastructure Fund IV', size: '$4.8B', stage: 'Closed', owner: 'You', eta: 'Completed', type: 'Infrastructure Finance' },
  { id: 'SAIL-2024-0378', client: 'Atlantic Digital SPAC', size: '$620M', stage: 'Closed', owner: 'Director', eta: 'Completed', type: 'SPAC Advisory' },
];

const TRANSFERS = [
  { id: 'TRN-88412', amount: '$14,200,000.00', from: 'JP Morgan Chase (Internal)', to: 'Deutsche Bank AG — Frankfurt', status: 'Settled', time: '09:14 AM ET' },
  { id: 'TRN-88389', amount: '$3,750,000.00', from: 'Client Escrow Account', to: 'Meridian Capital Partners', status: 'Pending', time: '10:02 AM ET' },
  { id: 'TRN-88344', amount: '$28,500,000.00', from: 'Syndication Account', to: 'BofA Securities', status: 'Settled', time: '08:45 AM ET' },
  { id: 'TRN-88301', amount: '$1,100,000.00', from: 'Fee Account', to: 'Internal Revenue', status: 'Settled', time: 'Yesterday' },
  { id: 'TRN-88289', amount: '$92,400,000.00', from: 'Deal Escrow — SAIL-0891', to: 'Meridian CP LLC', status: 'Processing', time: 'Yesterday' },
];

const STAGE_COLOR: Record<string, string> = {
  Pitch: '#5e7399',
  Mandate: '#0078d4',
  'Due Diligence': '#e05c00',
  Execution: '#d13438',
  Closed: '#107c10',
};

const TRANSFER_COLOR: Record<string, string> = {
  Settled: '#107c10',
  Pending: '#e05c00',
  Processing: '#0078d4',
};

export function ProjectSailSite() {
  const { acceptedJob } = useProfileStore();
  const role = acceptedJob?.role ?? 'Investment Banking Analyst';

  return (
    <div className="sail-shell">
      <header className="sail-header">
        <div className="sail-logo">
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="4" fill="#003087"/>
            <path d="M8 30L20 8L32 30" stroke="white" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
            <path d="M12 22h16" stroke="#4d88c4" strokeWidth="1.5"/>
          </svg>
          <span className="sail-brand">Project SAIL</span>
        </div>
        <div className="sail-header-right">
          <span className="sail-subtitle">J.P. Morgan — Technology & Operations</span>
          <span className="sail-role">{role}</span>
        </div>
      </header>

      <div className="sail-body">
        {/* Risk Dashboard */}
        <div className="sail-risk-bar">
          <div className="sail-risk-item">
            <div className="sail-risk-label">Market VaR (1-day, 99%)</div>
            <div className="sail-risk-val" style={{color:'#d13438'}}>$42.8M</div>
          </div>
          <div className="sail-risk-item">
            <div className="sail-risk-label">Credit Exposure</div>
            <div className="sail-risk-val" style={{color:'#e05c00'}}>$1.24B</div>
          </div>
          <div className="sail-risk-item">
            <div className="sail-risk-label">Open Deal Pipeline</div>
            <div className="sail-risk-val" style={{color:'#0078d4'}}>$7.6B</div>
          </div>
          <div className="sail-risk-item">
            <div className="sail-risk-label">Settled Today</div>
            <div className="sail-risk-val" style={{color:'#107c10'}}>$44.5M</div>
          </div>
          <div className="sail-risk-item">
            <div className="sail-risk-label">Regulatory Flags</div>
            <div className="sail-risk-val">2 Active</div>
          </div>
        </div>

        <div className="sail-grid">
          {/* Deal Tracker */}
          <div className="sail-panel">
            <div className="sail-panel-title">Deal Tracking — SAIL Mandate Tracker</div>
            <table className="sail-table">
              <thead>
                <tr><th>Deal ID</th><th>Client</th><th>Type</th><th>Size</th><th>Stage</th><th>Owner</th><th>ETA</th></tr>
              </thead>
              <tbody>
                {DEALS.map(d => (
                  <tr key={d.id}>
                    <td className="sail-code">{d.id}</td>
                    <td>{d.client}</td>
                    <td className="sail-type">{d.type}</td>
                    <td className="sail-amount">{d.size}</td>
                    <td><span className="sail-stage" style={{ color: STAGE_COLOR[d.stage] ?? '#5e7399', borderColor: STAGE_COLOR[d.stage] ?? '#5e7399' }}>{d.stage}</span></td>
                    <td>{d.owner}</td>
                    <td>{d.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Wire Transfer Monitor */}
          <div className="sail-panel">
            <div className="sail-panel-title">Wire Transfer Monitoring — Today</div>
            <table className="sail-table">
              <thead>
                <tr><th>TRN ID</th><th>Amount</th><th>From</th><th>To</th><th>Status</th><th>Time</th></tr>
              </thead>
              <tbody>
                {TRANSFERS.map(t => (
                  <tr key={t.id}>
                    <td className="sail-code">{t.id}</td>
                    <td className="sail-amount">{t.amount}</td>
                    <td className="sail-from">{t.from}</td>
                    <td className="sail-from">{t.to}</td>
                    <td><span style={{ color: TRANSFER_COLOR[t.status] }}>{t.status}</span></td>
                    <td>{t.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
