import { useMemo, useState } from 'react';

type CatalogCategory =
  | 'Circuit Boards'
  | 'Motherboards'
  | 'Wires & Cables'
  | 'Resistors'
  | 'Transistors'
  | 'Capacitors'
  | 'Phones'
  | 'Computers'
  | 'Batteries';

type CatalogItem = {
  sku: string;
  name: string;
  category: CatalogCategory;
  brand: string;
  price: number;
  rating: number;
  stock: number;
  voltage: string;
  tags: string[];
  description: string;
};

const categories: CatalogCategory[] = [
  'Circuit Boards',
  'Motherboards',
  'Wires & Cables',
  'Resistors',
  'Transistors',
  'Capacitors',
  'Phones',
  'Computers',
  'Batteries',
];

const brands = [
  'VoltForge', 'NanoEdge', 'CopperCore', 'Atlas Logic', 'Zenith Circuits', 'Helix Power', 'SignalNest', 'PolarAmp', 'Radian Tech', 'OhmWorks',
  'QuantumTrace', 'BluePeak', 'Kinetic Labs', 'Prism Electric', 'EverCell', 'Delta Silicon', 'Aurora Board Co', 'Synthex', 'Ion Harbor', 'Forgebyte',
];

const catalogBlueprint: Array<{
  category: CatalogCategory;
  count: number;
  names: string[];
  voltages: string[];
  tags: string[];
  basePrice: number;
  priceStep: number;
}> = [
  {
    category: 'Circuit Boards',
    count: 80,
    names: ['Prototype PCB', 'Sensor Control PCB', 'Embedded Logic Board', 'Power Distribution PCB'],
    voltages: ['3.3V', '5V', '12V', '24V'],
    tags: ['FR4', '4-layer', 'via shielded', 'SMT-ready'],
    basePrice: 12,
    priceStep: 2.75,
  },
  {
    category: 'Motherboards',
    count: 60,
    names: ['Industrial ATX Motherboard', 'Compact IoT Motherboard', 'Workstation Logic Board', 'Server Control Motherboard'],
    voltages: ['12V', '19V', '24V'],
    tags: ['PCIe Gen4', 'DDR5', 'dual LAN', 'TPM-ready'],
    basePrice: 145,
    priceStep: 8.25,
  },
  {
    category: 'Wires & Cables',
    count: 70,
    names: ['Silicone Hook-Up Wire', 'Ribbon Cable Kit', 'Shielded Signal Harness', 'Breadboard Jumper Pack'],
    voltages: ['5V', '12V', '48V'],
    tags: ['18 AWG', '22 AWG', 'shielded', 'heat-resistant'],
    basePrice: 6,
    priceStep: 1.15,
  },
  {
    category: 'Resistors',
    count: 90,
    names: ['Carbon Film Resistor', 'Metal Film Resistor', 'Power Resistor Pack', 'Precision Resistor Array'],
    voltages: ['0.25W', '0.5W', '1W', '5W'],
    tags: ['1%', '5%', 'through-hole', 'SMD'],
    basePrice: 0.18,
    priceStep: 0.07,
  },
  {
    category: 'Transistors',
    count: 75,
    names: ['NPN Switching Transistor', 'PNP Amplifier Transistor', 'MOSFET Driver', 'IGBT Power Transistor'],
    voltages: ['30V', '60V', '120V', '600V'],
    tags: ['TO-92', 'TO-220', 'logic-level', 'low Rds(on)'],
    basePrice: 0.85,
    priceStep: 0.42,
  },
  {
    category: 'Capacitors',
    count: 75,
    names: ['Ceramic Capacitor', 'Electrolytic Capacitor', 'Low-ESR Capacitor', 'Tantalum Capacitor'],
    voltages: ['16V', '25V', '50V', '100V'],
    tags: ['10uF', '100uF', '470uF', '1mF'],
    basePrice: 0.35,
    priceStep: 0.18,
  },
  {
    category: 'Phones',
    count: 55,
    names: ['Field Service Phone', 'Rugged Logic Phone', 'Bench Tester Phone', 'Factory Mesh Phone'],
    voltages: ['USB-C PD', '5V', '9V'],
    tags: ['5G', 'OLED', 'eSIM', 'thermal diagnostics'],
    basePrice: 299,
    priceStep: 11.5,
  },
  {
    category: 'Computers',
    count: 55,
    names: ['Embedded Control Laptop', 'Signal Analysis Workstation', 'Compact CAD Mini PC', 'Edge Compute Tower'],
    voltages: ['65W', '120W', '240W'],
    tags: ['CUDA-ready', 'AI assisted', 'lab certified', 'dual monitor'],
    basePrice: 649,
    priceStep: 22.5,
  },
  {
    category: 'Batteries',
    count: 65,
    names: ['Li-Ion Cell Pack', 'Bench Power Battery', 'UPS Backup Module', 'Rechargeable Coin Cell Kit'],
    voltages: ['1.5V', '3.7V', '12V', '24V'],
    tags: ['high-cycle', 'fast-charge', 'BMS included', 'low self-discharge'],
    basePrice: 4.5,
    priceStep: 2.1,
  },
];

const ITEMS_PER_PAGE = 50;

function buildCatalog(): CatalogItem[] {
  const items: CatalogItem[] = [];
  let globalIndex = 0;

  for (const blueprint of catalogBlueprint) {
    for (let index = 0; index < blueprint.count; index += 1) {
      const brand = brands[(globalIndex + index * 3) % brands.length];
      const family = blueprint.names[index % blueprint.names.length];
      const voltage = blueprint.voltages[index % blueprint.voltages.length];
      const tag = blueprint.tags[index % blueprint.tags.length];
      const series = 100 + ((index * 7 + globalIndex) % 900);
      const price = Number((blueprint.basePrice + index * blueprint.priceStep).toFixed(2));
      items.push({
        sku: `CUR-${String(globalIndex + 1).padStart(4, '0')}`,
        name: `${brand} ${family} ${series}`,
        category: blueprint.category,
        brand,
        price,
        rating: 3.8 + ((index + globalIndex) % 12) * 0.1,
        stock: 12 + ((index * 13 + globalIndex) % 340),
        voltage,
        tags: [tag, blueprint.tags[(index + 1) % blueprint.tags.length], blueprint.category.toLowerCase()],
        description: `Built for realistic sourcing workflows with traceable specs, stocking forecasts, and compatibility notes for ${blueprint.category.toLowerCase()}.`,
      });
      globalIndex += 1;
    }
  }

  return items;
}

const catalog = buildCatalog();
const featuredItems = catalog.slice(0, 4);

export function CurcuitSite() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'All' | CatalogCategory>('All');
  const [brand, setBrand] = useState<'All' | string>('All');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return catalog.filter((item) => {
      const matchesSearch =
        term.length === 0 ||
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.tags.some((tag) => tag.includes(term)) ||
        item.sku.toLowerCase().includes(term);
      const matchesCategory = category === 'All' || item.category === category;
      const matchesBrand = brand === 'All' || item.brand === brand;
      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [brand, category, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const brandOptions = useMemo(() => ['All', ...brands], []);
  const inventoryStats = useMemo(() => ({
    skus: catalog.length,
    brands: brands.length,
    readyToShip: catalog.reduce((sum, item) => sum + item.stock, 0),
  }), []);

  const paginationWindow = useMemo(() => {
    const start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [safePage, totalPages]);

  return (
    <div style={{ minHeight: '100%', background: '#f4f7fb', color: '#0f172a', overflow: 'auto' }}>
      <div style={{
        background: 'linear-gradient(135deg, #07111f 0%, #132d55 42%, #4f46e5 100%)',
        color: 'white',
        padding: '28px 28px 22px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.78 }}>Safari Storefront</div>
            <h1 style={{ margin: '6px 0 10px', fontSize: 36, lineHeight: 1.05 }}>curcuit</h1>
            <p style={{ margin: 0, maxWidth: 860, fontSize: 15, color: 'rgba(226, 232, 240, 0.92)' }}>
              Source boards, motherboards, wires, resistors, transistors, batteries, phones, and computers from a dense catalog with realistic browsing filters and paginated results.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))', gap: 12, minWidth: 360, maxWidth: 460, width: '100%' }}>
            {[
              ['SKUs', inventoryStats.skus.toLocaleString()],
              ['Brands', inventoryStats.brands.toLocaleString()],
              ['Units Ready', inventoryStats.readyToShip.toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'rgba(15, 23, 42, 0.22)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, opacity: 0.76 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: 24, display: 'grid', gap: 24 }}>
        <section style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>
          <div style={{ background: 'white', borderRadius: 24, border: '1px solid #dbe4f0', padding: 22, boxShadow: '0 18px 55px rgba(15, 23, 42, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#4f46e5', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.18em' }}>Buy by specs</div>
                <h2 style={{ margin: '8px 0 0', fontSize: 28 }}>Catalog filters</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCategory('All');
                  setBrand('All');
                  setPage(1);
                }}
                style={{ borderRadius: 14, padding: '10px 14px', background: '#eef2ff', color: '#312e81', fontWeight: 700 }}
              >
                Reset filters
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14, marginTop: 18 }}>
              <label style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Search products</span>
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search SKUs, parts, tags, or descriptions"
                  style={{ borderRadius: 14, border: '1px solid #cbd5e1', padding: '12px 14px', fontSize: 14, background: '#f8fafc' }}
                />
              </label>
              <label style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Category</span>
                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value as 'All' | CatalogCategory);
                    setPage(1);
                  }}
                  style={{ borderRadius: 14, border: '1px solid #cbd5e1', padding: '12px 14px', fontSize: 14, background: '#f8fafc' }}
                >
                  <option value="All">All categories</option>
                  {categories.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Brand</span>
                <select
                  value={brand}
                  onChange={(event) => {
                    setBrand(event.target.value);
                    setPage(1);
                  }}
                  style={{ borderRadius: 14, border: '1px solid #cbd5e1', padding: '12px 14px', fontSize: 14, background: '#f8fafc' }}
                >
                  {brandOptions.map((option) => <option key={option} value={option}>{option === 'All' ? 'All brands' : option}</option>)}
                </select>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
              {categories.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setCategory(option);
                    setPage(1);
                  }}
                  style={{
                    borderRadius: 999,
                    padding: '8px 14px',
                    background: category === option ? '#312e81' : '#eef2ff',
                    color: category === option ? 'white' : '#312e81',
                    fontWeight: 700,
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 18 }}>
            {featuredItems.map((item) => (
              <div key={item.sku} style={{ background: 'white', borderRadius: 22, border: '1px solid #dbe4f0', padding: 18, boxShadow: '0 18px 55px rgba(15, 23, 42, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em' }}>{item.category}</div>
                    <div style={{ marginTop: 8, fontWeight: 800, fontSize: 18 }}>{item.name}</div>
                  </div>
                  <div style={{ borderRadius: 999, background: '#ecfeff', color: '#155e75', padding: '6px 10px', height: 'fit-content', fontSize: 12, fontWeight: 700 }}>{item.brand}</div>
                </div>
                <div style={{ marginTop: 12, color: '#475569', fontSize: 14 }}>{item.description}</div>
                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>${item.price.toFixed(2)}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{item.voltage} • {item.stock} in stock</div>
                  </div>
                  <button type="button" style={{ borderRadius: 14, padding: '10px 14px', background: '#0f172a', color: 'white', fontWeight: 700 }}>Add to cart</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background: 'white', borderRadius: 24, border: '1px solid #dbe4f0', padding: 22, boxShadow: '0 18px 55px rgba(15, 23, 42, 0.08)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 28 }}>Catalog</h2>
              <p style={{ margin: '6px 0 0', color: '#64748b' }}>
                Showing {filtered.length.toLocaleString()} results with {ITEMS_PER_PAGE} results per page.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                style={{ borderRadius: 12, padding: '10px 14px', background: safePage === 1 ? '#e2e8f0' : '#e0e7ff', color: '#312e81', fontWeight: 700 }}
              >
                Prev
              </button>
              {paginationWindow.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPage(value)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: value === safePage ? '#312e81' : '#f1f5f9',
                    color: value === safePage ? 'white' : '#0f172a',
                    fontWeight: 700,
                  }}
                >
                  {value}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                style={{ borderRadius: 12, padding: '10px 14px', background: safePage === totalPages ? '#e2e8f0' : '#e0e7ff', color: '#312e81', fontWeight: 700 }}
              >
                Next
              </button>
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 14 }}>
            {pageItems.map((item) => (
              <article key={item.sku} style={{ borderRadius: 20, border: '1px solid #dbe4f0', background: '#f8fafc', padding: 16, display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}>
                  <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 700 }}>{item.sku}</div>
                  <div style={{ fontSize: 12, color: '#475569', background: '#e2e8f0', borderRadius: 999, padding: '4px 8px' }}>{item.rating.toFixed(1)}★</div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.35 }}>{item.name}</div>
                  <div style={{ color: '#475569', fontSize: 13, marginTop: 5 }}>{item.category}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {item.tags.slice(0, 2).map((tag) => (
                    <span key={tag} style={{ borderRadius: 999, padding: '4px 8px', background: '#e0f2fe', color: '#075985', fontSize: 12, fontWeight: 600 }}>{tag}</span>
                  ))}
                </div>
                <div style={{ color: '#64748b', fontSize: 13, minHeight: 56 }}>{item.description}</div>
                <div style={{ display: 'grid', gap: 4, fontSize: 13, color: '#334155' }}>
                  <div><strong>Brand:</strong> {item.brand}</div>
                  <div><strong>Spec:</strong> {item.voltage}</div>
                  <div><strong>Stock:</strong> {item.stock}</div>
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 19 }}>${item.price.toFixed(2)}</div>
                  <button type="button" style={{ borderRadius: 12, padding: '9px 12px', background: '#0f172a', color: 'white', fontWeight: 700 }}>Buy now</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
