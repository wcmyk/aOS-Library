import { useEffect, useMemo, useState } from 'react';
import { useTechStore } from '../../state/useTechStore';
import {
  HARDWARE_CATALOG,
  CATALOG_BY_ID,
  CATEGORY_LABEL,
  modelsByCategory,
} from '../../data/hardwareCatalog';
import { analyzeBlueprint, bomFromSlots } from '../../data/hardwareEngine';
import type { BlueprintSlots, ComponentCategory, BottleneckKind } from '../../types/hardware';

type Tab = 'projects' | 'designer' | 'inventory' | 'suppliers';

const ACCENT = '#f97316';
const BG = 'radial-gradient(circle at top, #1b1508, #0a0906 60%)';

const wrap: React.CSSProperties = { height: '100%', overflow: 'auto', background: BG, color: '#f4ede0', padding: 0, fontSize: 13 };
const pad: React.CSSProperties = { padding: 18 };
const card: React.CSSProperties = { border: '1px solid rgba(249,115,22,.22)', borderRadius: 12, padding: 14, background: 'rgba(20,14,6,.55)' };

function money(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

const BOTTLENECK_COLOR: Record<BottleneckKind, string> = {
  CPU: '#60a5fa',
  GPU: '#f472b6',
  MEMORY: '#a78bfa',
  STORAGE: '#34d399',
  THERMAL: '#f87171',
  POWER: '#fbbf24',
  BALANCED: '#22d3ee',
};

// ---- A sensible default gaming build so the Designer opens populated ----
const DEFAULT_SLOTS: BlueprintSlots = {
  cpu: 'cpu-a7-16',
  gpu: ['gpu-rx90'],
  motherboard: 'mb-x-atx',
  ram: 'ram-ddr5-32',
  ramSticks: 2,
  storage: 'ssd-nvme-2',
  storageCount: 1,
  psu: 'psu-1000-p',
  cooling: 'cool-aio360',
  case: 'case-mid',
  caseFans: 3,
};

export function ForgeApp() {
  const [tab, setTab] = useState<Tab>('projects');
  const settleClock = useTechStore((s) => s.settleClock);

  // resolve any due shipments / assemblies whenever the app is opened or refocused
  useEffect(() => {
    settleClock();
    const onFocus = () => settleClock();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [settleClock]);

  return (
    <div style={wrap}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderBottom: '1px solid rgba(249,115,22,.18)', position: 'sticky', top: 0, background: 'rgba(10,9,6,.85)', backdropFilter: 'blur(8px)', zIndex: 2 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${ACCENT}, #b45309)`, display: 'grid', placeItems: 'center', fontWeight: 800 }}>⚒</div>
        <div>
          <div style={{ fontWeight: 700, letterSpacing: '.02em' }}>Forge</div>
          <div style={{ color: '#9a8c74', fontSize: 11 }}>Technology Projects · design, build, and scale computing hardware</div>
        </div>
        <nav style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {(['projects', 'designer', 'inventory', 'suppliers'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                textTransform: 'capitalize',
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid ' + (tab === t ? 'rgba(249,115,22,.6)' : 'transparent'),
                background: tab === t ? 'rgba(249,115,22,.16)' : 'transparent',
                color: tab === t ? '#fed7aa' : '#c9bda6',
                cursor: 'pointer',
                fontSize: 12.5,
              }}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'projects' && <ProjectsTab onDesign={() => setTab('designer')} />}
      {tab === 'designer' && <DesignerTab />}
      {tab === 'inventory' && <InventoryTab />}
      {tab === 'suppliers' && <SuppliersTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

const PROJECT_TEMPLATES = [
  { kind: 'pc.gaming', label: 'Gaming PC', budget: 2500, purpose: 'High-refresh gaming' },
  { kind: 'pc.workstation', label: 'Workstation', budget: 5000, purpose: 'Content & compute' },
  { kind: 'biz.prebuilt-line', label: 'Prebuilt PC Business', budget: 120000, purpose: 'Sell gaming PCs' },
  { kind: 'infra.server-room', label: 'Server Room', budget: 250000, purpose: 'Internal compute' },
  { kind: 'infra.ai-training', label: 'AI Training Cluster', budget: 40000000, purpose: 'Rent GPU capacity' },
];

function ProjectsTab({ onDesign }: { onDesign: () => void }) {
  const projects = useTechStore((s) => s.projects);
  const assets = useTechStore((s) => s.assets);
  const blueprints = useTechStore((s) => s.blueprints);
  const createProject = useTechStore((s) => s.createProject);
  const cancelProject = useTechStore((s) => s.cancelProject);
  const startAssembly = useTechStore((s) => s.startAssembly);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [tmpl, setTmpl] = useState(PROJECT_TEMPLATES[0]);

  return (
    <div style={pad}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 17 }}>Projects</h2>
        <span style={{ color: '#9a8c74' }}>{projects.length} active · {assets.length} built</span>
        <button onClick={() => setCreating((v) => !v)} style={primaryBtn}>{creating ? 'Close' : '+ New project'}</button>
      </div>

      {creating && (
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={lbl}>Name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Gaming Rig" style={input} />
            </label>
            <label style={lbl}>Type
              <select value={tmpl.kind} onChange={(e) => setTmpl(PROJECT_TEMPLATES.find((t) => t.kind === e.target.value)!)} style={input}>
                {PROJECT_TEMPLATES.map((t) => <option key={t.kind} value={t.kind}>{t.label}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, color: '#9a8c74', fontSize: 12 }}>
            <span>Purpose: {tmpl.purpose}</span>
            <span>Suggested budget: {money(tmpl.budget)}</span>
          </div>
          <button
            style={{ ...primaryBtn, marginTop: 12 }}
            onClick={() => {
              createProject({ name: name.trim() || tmpl.label, kind: tmpl.kind, purpose: tmpl.purpose, budgetUSD: tmpl.budget });
              setName('');
              setCreating(false);
            }}
          >Create project</button>
        </div>
      )}

      {projects.length === 0 ? (
        <div style={{ ...card, color: '#9a8c74' }}>
          No projects yet. Create one, then open the <b style={{ color: '#fed7aa' }}>Designer</b> to spec a build, order parts, and assemble it.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {projects.map((p) => {
            const bp = p.blueprintId ? blueprints.find((b) => b.id === p.blueprintId) : undefined;
            const asset = assets.find((a) => a.projectId === p.id);
            return (
              <div key={p.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                  <span style={phasePill(p.phase)}>{p.phase}</span>
                  <span style={{ color: '#9a8c74', fontSize: 12 }}>{p.kind}</span>
                  <span style={{ marginLeft: 'auto', color: '#9a8c74', fontSize: 12 }}>Budget {money(p.budgetUSD)}</span>
                </div>
                <div style={{ color: '#c9bda6', fontSize: 12, marginTop: 4 }}>{p.purpose}</div>
                {bp && <div style={{ color: '#9a8c74', fontSize: 12, marginTop: 6 }}>Blueprint: {bp.name} v{bp.version}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {!bp && <button style={ghostBtn} onClick={onDesign}>Open Designer →</button>}
                  {bp && p.phase !== 'operating' && (
                    <button
                      style={ghostBtn}
                      onClick={() => {
                        const res = startAssembly(p.id);
                        if (!res.ok) alert('Missing components in inventory:\n' + (res.missing ?? []).join('\n') + '\n\nOrder the bill of materials from the Designer first.');
                      }}
                    >Assemble</button>
                  )}
                  {asset && <span style={{ color: '#34d399', fontSize: 12, alignSelf: 'center' }}>● {asset.name} operating</span>}
                  <button style={{ ...ghostBtn, marginLeft: 'auto', borderColor: 'rgba(248,113,113,.4)', color: '#fca5a5' }} onClick={() => cancelProject(p.id)}>Cancel</button>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: '#8a7d67' }}>{p.log[p.log.length - 1]?.text}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Designer
// ---------------------------------------------------------------------------

function DesignerTab() {
  const [slots, setSlots] = useState<BlueprintSlots>(DEFAULT_SLOTS);
  const [bpName, setBpName] = useState('High-End Gaming PC');
  const projects = useTechStore((s) => s.projects);
  const [projectId, setProjectId] = useState<string>('');
  const saveBlueprint = useTechStore((s) => s.saveBlueprint);
  const setProjectBlueprint = useTechStore((s) => s.setProjectBlueprint);
  const orderBom = useTechStore((s) => s.orderBom);

  const analysis = useMemo(() => analyzeBlueprint(slots), [slots]);
  const bom = useMemo(() => bomFromSlots(slots), [slots]);

  const set = (patch: Partial<BlueprintSlots>) => setSlots((s) => ({ ...s, ...patch }));

  return (
    <div style={{ ...pad, display: 'grid', gridTemplateColumns: 'minmax(320px, 1.4fr) minmax(300px, 1fr)', gap: 16, alignItems: 'start' }}>
      {/* left: slot pickers + BOM */}
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={card}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <input value={bpName} onChange={(e) => setBpName(e.target.value)} style={{ ...input, fontWeight: 700 }} />
          </div>
          <SlotPicker label="CPU" cat="cpu" value={slots.cpu} onChange={(id) => set({ cpu: id })} />
          <SlotPickerMulti label="GPU" value={slots.gpu ?? []} onChange={(ids) => set({ gpu: ids })} />
          <SlotPicker label="Motherboard" cat="motherboard" value={slots.motherboard} onChange={(id) => set({ motherboard: id })} />
          <SlotPicker label="Memory" cat="ram" value={slots.ram} onChange={(id) => set({ ram: id })} count={slots.ramSticks} onCount={(n) => set({ ramSticks: n })} maxCount={8} />
          <SlotPicker label="Storage" cat="storage" value={slots.storage} onChange={(id) => set({ storage: id })} count={slots.storageCount} onCount={(n) => set({ storageCount: n })} maxCount={12} />
          <SlotPicker label="Power Supply" cat="psu" value={slots.psu} onChange={(id) => set({ psu: id })} />
          <SlotPicker label="Cooling" cat="cooling" value={slots.cooling} onChange={(id) => set({ cooling: id })} />
          <SlotPicker label="Case" cat="case" value={slots.case} onChange={(id) => set({ case: id })} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{ width: 110, color: '#c9bda6', fontSize: 12 }}>Case fans</span>
            <input type="number" min={0} max={10} value={slots.caseFans ?? 0} onChange={(e) => set({ caseFans: Math.max(0, Math.min(10, Number(e.target.value))) })} style={{ ...input, width: 70 }} />
          </div>
        </div>

        {/* BOM */}
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Bill of Materials</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <tbody>
              {bom.map((l) => (
                <tr key={l.modelId} style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
                  <td style={{ padding: '6px 4px', color: '#9a8c74' }}>{CATEGORY_LABEL[l.category]}</td>
                  <td style={{ padding: '6px 4px' }}>{l.name}{l.qty > 1 ? ` ×${l.qty}` : ''}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'right' }}>{money(l.unitPrice * l.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontWeight: 700 }}>
            <span>Total (retail)</span><span>{money(analysis.totalCost)}</span>
          </div>
        </div>

        {/* actions */}
        <div style={{ ...card, display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ ...input, flex: 1 }}>
              <option value="">— attach to project (optional) —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button
              style={ghostBtn}
              onClick={() => {
                const bp = saveBlueprint({ name: bpName, kind: 'pc', slots, priorities: [] });
                if (projectId) setProjectBlueprint(projectId, bp.id);
              }}
            >Save blueprint</button>
          </div>
          <button
            style={{ ...primaryBtn, opacity: analysis.buildable ? 1 : 0.5 }}
            disabled={!analysis.buildable}
            title={analysis.buildable ? 'Order all parts to Home; charged to your Chase card' : 'Fix errors before ordering'}
            onClick={() => {
              const bp = saveBlueprint({ name: bpName, kind: 'pc', slots, priorities: [] });
              if (projectId) setProjectBlueprint(projectId, bp.id);
              orderBom({ projectId: projectId || undefined, locationId: 'loc-home', lines: bom });
              alert('Order placed — parts ship to Home and appear in Inventory in 2 days (open Forge again to receive). The charge shows in Chase.');
            }}
          >Buy all on Amazon → Home ({money(analysis.totalCost)})</button>
          <div style={{ fontSize: 11, color: '#8a7d67' }}>Charges route through the wallet ledger, so the purchase appears in the Chase banking app just like any other Amazon order.</div>
        </div>
      </div>

      {/* right: live analysis */}
      <AnalysisPanel slots={slots} />
    </div>
  );
}

function SlotPicker({ label, cat, value, onChange, count, onCount, maxCount }: {
  label: string; cat: ComponentCategory; value?: string; onChange: (id: string) => void;
  count?: number; onCount?: (n: number) => void; maxCount?: number;
}) {
  const models = modelsByCategory(cat);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ width: 110, color: '#c9bda6', fontSize: 12 }}>{label}</span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} style={{ ...input, flex: 1 }}>
        <option value="">— none —</option>
        {models.map((m) => <option key={m.id} value={m.id}>{m.name} · {money(Math.round(m.basePrice * 1.2))}</option>)}
      </select>
      {onCount && (
        <input type="number" min={1} max={maxCount ?? 8} value={count ?? 1} onChange={(e) => onCount(Math.max(1, Math.min(maxCount ?? 8, Number(e.target.value))))} style={{ ...input, width: 56 }} title="Quantity" />
      )}
    </div>
  );
}

function SlotPickerMulti({ label, value, onChange }: { label: string; value: string[]; onChange: (ids: string[]) => void }) {
  const models = modelsByCategory('gpu');
  const count = Math.max(1, value.length);
  const model = value[0] ?? '';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ width: 110, color: '#c9bda6', fontSize: 12 }}>{label}</span>
      <select
        value={model}
        onChange={(e) => onChange(e.target.value ? Array(count).fill(e.target.value) : [])}
        style={{ ...input, flex: 1 }}
      >
        <option value="">— none —</option>
        {models.map((m) => <option key={m.id} value={m.id}>{m.name} · {money(Math.round(m.basePrice * 1.2))}</option>)}
      </select>
      <input
        type="number" min={0} max={8} value={value.length}
        onChange={(e) => {
          const n = Math.max(0, Math.min(8, Number(e.target.value)));
          onChange(n === 0 || !model ? [] : Array(n).fill(model));
        }}
        style={{ ...input, width: 56 }} title="GPU count"
      />
    </div>
  );
}

function AnalysisPanel({ slots }: { slots: BlueprintSlots }) {
  const a = useMemo(() => analyzeBlueprint(slots), [slots]);
  return (
    <div style={{ display: 'grid', gap: 10, position: 'sticky', top: 78 }}>
      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Analysis</div>
        {a.errors.length === 0 && a.warnings.length === 0 && <div style={{ color: '#34d399', fontSize: 12 }}>✓ Compatible, no warnings.</div>}
        {a.errors.map((e) => <div key={e.code} style={{ color: '#fca5a5', fontSize: 12, marginBottom: 3 }}>✕ {e.message}</div>)}
        {a.warnings.map((w) => <div key={w.code} style={{ color: '#fbbf24', fontSize: 12, marginBottom: 3 }}>⚠ {w.message}</div>)}
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Performance by workload</div>
        {a.workloads.map((w) => (
          <div key={w.workload} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ width: 108, fontSize: 12, color: '#c9bda6' }}>{w.label}</span>
            <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,.08)', borderRadius: 999 }}>
              <div style={{ width: `${Math.min(100, w.score / 12)}%`, height: '100%', borderRadius: 999, background: BOTTLENECK_COLOR[w.bottleneck] }} />
            </div>
            <span style={{ width: 44, textAlign: 'right', fontSize: 11 }}>{w.fps ? `${w.fps}f` : w.score}</span>
            <span style={{ width: 62, fontSize: 10, color: BOTTLENECK_COLOR[w.bottleneck] }}>{w.bottleneck}</span>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Physical & reliability</div>
        <Stat k="Primary bottleneck" v={a.primaryBottleneck} color={BOTTLENECK_COLOR[a.primaryBottleneck]} />
        <Stat k="Heat output" v={`${a.heatW} W`} />
        <Stat k="Thermal margin" v={`${a.thermalMarginW} W`} color={a.thermalMarginW < 0 ? '#fca5a5' : '#34d399'} />
        <Stat k="PSU load" v={`${a.psuLoadW} W${a.psuHeadroomPct != null ? ` (${a.psuHeadroomPct}% headroom)` : ''}`} color={(a.psuHeadroomPct ?? 100) < 20 ? '#fbbf24' : undefined} />
        <Stat k="Noise" v={`${a.noiseDb} dBA`} />
        <Stat k="Annual failure risk" v={`${a.annualFailPct}%`} />
        <Stat k="Est. lifespan" v={`${a.lifespanYears} yrs`} />
        <Stat k="Upgrade headroom" v={`${a.upgradeScore}`} />
        <Stat k="Assembly difficulty" v={`${a.assemblyDifficulty}/100`} />
        <Stat k="Resale value" v={money(a.resaleValue)} />
      </div>
    </div>
  );
}

function Stat({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
      <span style={{ color: '#9a8c74' }}>{k}</span>
      <span style={{ color: color ?? '#f4ede0', fontWeight: 600 }}>{v}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

function InventoryTab() {
  const inventory = useTechStore((s) => s.inventory);
  const shipments = useTechStore((s) => s.shipments);
  const locations = useTechStore((s) => s.locations);
  const settleClock = useTechStore((s) => s.settleClock);

  const inTransit = shipments.filter((s) => s.status === 'in-transit');

  return (
    <div style={pad}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 17 }}>Inventory & Logistics</h2>
        <button style={ghostBtn} onClick={() => settleClock()}>Receive due shipments</button>
      </div>

      {inTransit.length > 0 && (
        <div style={{ ...card, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>In transit ({inTransit.length})</div>
          {inTransit.map((s) => {
            const days = Math.max(0, Math.ceil((s.etaAt - Date.now()) / 86400000));
            return (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>{s.lines.reduce((a, l) => a + l.qty, 0)} item(s) → {locations.find((l) => l.id === s.destinationId)?.name ?? s.destinationId}</span>
                <span style={{ color: '#9a8c74' }}>{days === 0 ? 'arriving now — refresh' : `~${days}d`}</span>
              </div>
            );
          })}
        </div>
      )}

      {locations.map((loc) => {
        const lots = inventory[loc.id] ?? [];
        return (
          <div key={loc.id} style={{ ...card, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{loc.name} <span style={{ color: '#9a8c74', fontWeight: 400, fontSize: 12 }}>· {loc.kind}</span></div>
            {lots.length === 0 ? (
              <div style={{ color: '#9a8c74', fontSize: 12 }}>Empty. Order a bill of materials from the Designer.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ color: '#9a8c74', textAlign: 'left' }}><th style={th}>Item</th><th style={th}>Condition</th><th style={th}>State</th><th style={{ ...th, textAlign: 'right' }}>Qty</th></tr></thead>
                <tbody>
                  {lots.map((lot) => (
                    <tr key={lot.lotId} style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
                      <td style={td}>{lot.name}</td>
                      <td style={{ ...td, color: lot.condition === 'damaged' ? '#fca5a5' : '#c9bda6' }}>{lot.condition}</td>
                      <td style={td}>{lot.state}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{lot.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Suppliers (Phase-1 preview)
// ---------------------------------------------------------------------------

function SuppliersTab() {
  const brands = useMemo(() => {
    const map: Record<string, { count: number; tiers: Set<string> }> = {};
    for (const m of HARDWARE_CATALOG) {
      map[m.brand] = map[m.brand] ?? { count: 0, tiers: new Set() };
      map[m.brand].count += 1;
      map[m.brand].tiers.add(m.wholesaleTier);
    }
    return Object.entries(map);
  }, []);

  return (
    <div style={pad}>
      <h2 style={{ margin: 0, fontSize: 17, marginBottom: 6 }}>Suppliers</h2>
      <p style={{ color: '#9a8c74', marginTop: 0, fontSize: 12, maxWidth: 640 }}>
        Retail purchasing (Amazon) is live today. Wholesale distributor accounts and direct
        manufacturer contracts — with relationship scores, allocation limits, and negotiation
        — arrive in a later phase (see the design document). Manufacturers already in the catalog:
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 12 }}>
        {brands.map(([brand, info]) => (
          <div key={brand} style={card}>
            <div style={{ fontWeight: 700 }}>{brand}</div>
            <div style={{ color: '#9a8c74', fontSize: 12, marginTop: 4 }}>{info.count} SKUs</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {[...info.tiers].map((t) => (
                <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, border: '1px solid rgba(249,115,22,.3)', color: '#fed7aa' }}>{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- shared style bits ----
const primaryBtn: React.CSSProperties = { padding: '8px 14px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${ACCENT}, #b45309)`, color: '#1a1206', fontWeight: 700, cursor: 'pointer', fontSize: 12.5 };
const ghostBtn: React.CSSProperties = { padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(249,115,22,.4)', background: 'transparent', color: '#fed7aa', cursor: 'pointer', fontSize: 12 };
const input: React.CSSProperties = { padding: '7px 9px', borderRadius: 8, border: '1px solid rgba(249,115,22,.28)', background: 'rgba(10,9,6,.7)', color: '#f4ede0', fontSize: 12.5, outline: 'none' };
const lbl: React.CSSProperties = { display: 'grid', gap: 5, fontSize: 12, color: '#c9bda6' };
const th: React.CSSProperties = { padding: '6px 4px', fontWeight: 600 };
const td: React.CSSProperties = { padding: '6px 4px' };

function phasePill(phase: string): React.CSSProperties {
  const c = phase === 'operating' ? '#34d399' : phase === 'assembly' ? '#fbbf24' : phase === 'procurement' ? '#60a5fa' : '#a78bfa';
  return { fontSize: 10.5, padding: '2px 8px', borderRadius: 999, border: `1px solid ${c}55`, color: c, textTransform: 'capitalize' };
}
