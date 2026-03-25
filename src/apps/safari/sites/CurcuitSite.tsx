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
  description: 'Engineered for production-grade circuit assembly and validation workflows.',
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

  const upsertCart = (item: CatalogItem, quantity: number) => {
    const safeQty = Math.max(1, Math.floor(quantity))
    setCart((current) => {
      const found = current.find((entry) => entry.sku === item.sku)
      if (found) return current.map((entry) => (entry.sku === item.sku ? { ...entry, quantity: safeQty } : entry))
      return [...current, { ...item, quantity: safeQty }]
    })
  }

  const buyNow = (item: CatalogItem, qty = 1) => {
    addInventory({ sku: item.sku, name: item.name, unitPrice: item.price }, qty)
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
    <div style={{ minHeight: '100%', overflow: 'auto', background: '#f8fafc', color: '#0f172a' }}>
      <div style={{ padding: '24px 28px 18px', background: 'linear-gradient(115deg,#0f172a,#1d4ed8 55%,#0ea5e9)', color: 'white', borderBottom: '1px solid #93c5fd' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center' }}>
          <div>
            <div style={{ letterSpacing: '.2em', fontSize: 12, textTransform: 'uppercase', opacity: .82 }}>Industrial Marketplace</div>
            <h1 style={{ margin: '6px 0', fontSize: 34 }}>CIRCUTE</h1>
            <div style={{ opacity: .88 }}>Professional sourcing for precision electronics, motors, and modules.</div>
          </div>
          <button onClick={() => setCheckoutOpen(true)} style={{ borderRadius: 12, padding: '10px 14px', background: 'white', color: '#1e3a8a', fontWeight: 700, border: 'none' }}>
            Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)}) · ${cartTotal.toFixed(2)}
          </button>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search SKUs, components, categories..."
          style={{ width: '100%', borderRadius: 10, border: '1px solid #cbd5e1', padding: '12px 14px', fontSize: 14, background: 'white' }}
        />

        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
          {filtered.slice(0, 120).map((item) => {
            const inCart = cart.find((c) => c.sku === item.sku)
            const qty = inCart?.quantity ?? 1
            return (
              <article key={item.sku} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, display: 'grid', gap: 8, boxShadow: '0 8px 20px rgba(15,23,42,.05)' }}>
                <div style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 700 }}>{item.sku}</div>
                <div style={{ fontWeight: 700 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: '#475569' }}>{item.category} • {item.stock} in stock</div>
                <div style={{ fontSize: 12, color: '#64748b', minHeight: 34 }}>{item.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <strong>${item.price.toFixed(2)}</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => upsertCart(item, Number(e.target.value))}
                      style={{ width: 58, borderRadius: 8, border: '1px solid #cbd5e1', padding: '6px 7px' }}
                    />
                    <button onClick={() => upsertCart(item, qty)} style={{ borderRadius: 8, border: '1px solid #93c5fd', padding: '6px 8px', background: '#eff6ff', color: '#1d4ed8' }}>Add</button>
                    <button onClick={() => buyNow(item, qty)} style={{ borderRadius: 8, border: 'none', padding: '6px 8px', background: '#1d4ed8', color: 'white' }}>Buy</button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {checkoutOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ width: 560, background: 'white', borderRadius: 18, padding: 18, maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Secure checkout</h3>
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
                <button onClick={completeCheckout} style={{ padding: '8px 10px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 8 }}>Pay now</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
