import { useMemo, useState } from 'react'
import { useCircuitLabStore } from '../../../state/useCircuitLabStore'

type CatalogItem = {
  sku: string
  name: string
  category: string
  price: number
  stock: number
  description: string
}

type CartItem = CatalogItem & { quantity: number }

const seedItems: CatalogItem[] = Array.from({ length: 180 }, (_, i) => ({
  sku: `CIR-${String(i + 1).padStart(4, '0')}`,
  name: `${['Proto', 'Flux', 'Aero', 'Volt', 'Sync'][i % 5]} ${['Board', 'Motor', 'Rotor', 'Antenna', 'Module'][i % 5]} ${100 + i}`,
  category: ['Boards', 'Motors', 'Rotors', 'Antennas', 'Modules'][i % 5],
  price: Number((5 + (i % 17) * 2.35).toFixed(2)),
  stock: 8 + (i % 40),
  description: 'Designed for build-side assembly workflows in Circuit Lab.',
}))

const paymentMethods = ['Credit Card', 'Klarna', 'Afterpay', 'Affirm Pay in 4', 'Cash'] as const

export function CurcuitSite() {
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<(typeof paymentMethods)[number]>('Credit Card')
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const addInventory = useCircuitLabStore((s) => s.addInventory)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return seedItems
    return seedItems.filter((item) =>
      item.name.toLowerCase().includes(term) ||
      item.sku.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term),
    )
  }, [search])

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart])

  const addToCart = (item: CatalogItem) => {
    setCart((current) => {
      const found = current.find((entry) => entry.sku === item.sku)
      if (found) return current.map((entry) => (entry.sku === item.sku ? { ...entry, quantity: entry.quantity + 1 } : entry))
      return [...current, { ...item, quantity: 1 }]
    })
  }

  const buyNow = (item: CatalogItem) => {
    addInventory({ sku: item.sku, name: item.name, unitPrice: item.price }, 1)
  }

  const completeCheckout = () => {
    cart.forEach((item) => addInventory({ sku: item.sku, name: item.name, unitPrice: item.price }, item.quantity))
    setCart([])
    setCheckoutOpen(false)
    setCardName('')
    setCardNumber('')
    setExpiry('')
    setCvv('')
  }

  return (
    <div style={{ minHeight: '100%', overflow: 'auto', background: '#fef6ff', color: '#312e81' }}>
      <div style={{ padding: '24px 24px 16px', background: 'linear-gradient(120deg,#fde2ff,#dbeafe,#e0f2fe)', borderBottom: '1px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center' }}>
          <div>
            <div style={{ letterSpacing: '.2em', fontSize: 12, textTransform: 'uppercase', color: '#7c3aed' }}>Safari Store</div>
            <h1 style={{ margin: '6px 0', fontSize: 34 }}>CIRCUTE</h1>
            <div style={{ color: '#6d28d9' }}>Find parts fast with searchable inventory and checkout.</div>
          </div>
          <button onClick={() => setCheckoutOpen(true)} style={{ borderRadius: 14, padding: '10px 14px', background: '#6366f1', color: 'white', fontWeight: 700, border: 'none' }}>
            Cart ({cart.length}) · ${cartTotal.toFixed(2)}
          </button>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search machinery, motors, antennas, bluetooth, boards..."
          style={{ width: '100%', borderRadius: 14, border: '1px solid #c4b5fd', padding: '12px 14px', fontSize: 14, background: 'white' }}
        />

        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12 }}>
          {filtered.slice(0, 120).map((item) => (
            <article key={item.sku} style={{ background: 'white', border: '1px solid #ddd6fe', borderRadius: 16, padding: 12, display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700 }}>{item.sku}</div>
              <div style={{ fontWeight: 700 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{item.category} • {item.stock} in stock</div>
              <div style={{ fontSize: 12, color: '#64748b', minHeight: 34 }}>{item.description}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <strong>${item.price.toFixed(2)}</strong>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => addToCart(item)} style={{ borderRadius: 9, border: '1px solid #a5b4fc', padding: '6px 8px', background: '#eef2ff', color: '#3730a3' }}>Add to cart</button>
                  <button onClick={() => buyNow(item)} style={{ borderRadius: 9, border: 'none', padding: '6px 8px', background: '#4f46e5', color: 'white' }}>Buy</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {checkoutOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ width: 560, background: 'white', borderRadius: 18, padding: 18, maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Payment</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              <label>Method
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as (typeof paymentMethods)[number])} style={{ width: '100%', marginTop: 4, borderRadius: 8, padding: 8 }}>
                  {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
              </label>
              <label>Name on card<input value={cardName} onChange={(e) => setCardName(e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 8, padding: 8 }} /></label>
              <label>Card number<input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 8, padding: 8 }} /></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <label>Expiry<input value={expiry} onChange={(e) => setExpiry(e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 8, padding: 8 }} /></label>
                <label>CVV<input value={cvv} onChange={(e) => setCvv(e.target.value)} style={{ width: '100%', marginTop: 4, borderRadius: 8, padding: 8 }} /></label>
              </div>
              <div style={{ marginTop: 8, borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                {cart.map((item) => <div key={item.sku} style={{ fontSize: 13 }}>{item.name} × {item.quantity}</div>)}
                <strong>Total: ${cartTotal.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'end', gap: 8 }}>
                <button onClick={() => setCheckoutOpen(false)} style={{ padding: '8px 10px' }}>Cancel</button>
                <button onClick={completeCheckout} style={{ padding: '8px 10px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 8 }}>Pay now</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
