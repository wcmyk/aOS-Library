import { useMemo } from 'react'
import { useCircuitLabStore } from '../../state/useCircuitLabStore'
import { useWalletStore } from '../../state/useWalletStore'

const wrap: React.CSSProperties = { height: '100%', overflow: 'auto', background: 'radial-gradient(circle at top,#16233d,#090f1f 55%)', color: '#e2e8f0', padding: 18 }
const tableStyle: React.CSSProperties = { width: '100%', marginTop: 12, borderCollapse: 'collapse', fontSize: 13, background: 'rgba(2,6,23,.45)', borderRadius: 14, overflow: 'hidden' }
const th: React.CSSProperties = { textAlign: 'left', padding: '10px 8px' }
const thRight: React.CSSProperties = { ...th, textAlign: 'right' }
const td: React.CSSProperties = { padding: '10px 8px' }
const tdRight: React.CSSProperties = { ...td, textAlign: 'right' }
const emptyBox: React.CSSProperties = { marginTop: 12, border: '1px solid rgba(125,211,252,.2)', borderRadius: 12, padding: 14, color: '#64748b', background: 'rgba(15,23,42,.5)' }
const sectionTitle: React.CSSProperties = { margin: '26px 0 0', fontSize: 15, letterSpacing: '.02em' }

export function InventoryApp() {
  const inventory = useCircuitLabStore((s) => s.inventory)
  const updateInventoryQuantity = useCircuitLabStore((s) => s.updateInventoryQuantity)
  const orders = useWalletStore((s) => s.orders)
  const labRows = useMemo(() => Object.values(inventory), [inventory])

  // Aggregate everything ever purchased on Amazon (persisted wallet ledger)
  // into owned-item rows: the same item across orders stacks its quantity.
  const purchased = useMemo(() => {
    const map = new Map<string, { id: string; title: string; qty: number; unitPrice: number; lastOrdered: string }>()
    for (const order of orders) {
      for (const item of order.items ?? []) {
        const prev = map.get(item.id)
        if (prev) {
          prev.qty += item.qty
          if (order.date > prev.lastOrdered) prev.lastOrdered = order.date
        } else {
          map.set(item.id, { id: item.id, title: item.title, qty: item.qty, unitPrice: item.price, lastOrdered: order.date })
        }
      }
    }
    return [...map.values()].sort((a, b) => (a.lastOrdered < b.lastOrdered ? 1 : -1))
  }, [orders])

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div style={wrap}>
      <h2 style={{ marginTop: 0, letterSpacing: '.02em' }}>Inventory Control</h2>
      <p style={{ color: '#94a3b8', marginTop: 6 }}>
        Everything you own in the simulation. Amazon deliveries and CIRCUTE lab materials sync here automatically and persist across restarts.
      </p>

      <h3 style={{ ...sectionTitle, marginTop: 18 }}>Amazon Deliveries</h3>
      {purchased.length === 0 ? (
        <div style={emptyBox}>Nothing delivered yet. Order something in Safari → Amazon and it will appear here.</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr style={{ color: '#94a3b8', background: 'rgba(30,41,59,.5)' }}>
              <th style={th}>Item</th>
              <th style={thRight}>Qty</th>
              <th style={thRight}>Unit Price</th>
              <th style={thRight}>Last Ordered</th>
            </tr>
          </thead>
          <tbody>
            {purchased.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
                <td style={td}>{item.title}</td>
                <td style={tdRight}>{item.qty}</td>
                <td style={tdRight}>${item.unitPrice.toFixed(2)}</td>
                <td style={{ ...tdRight, color: '#94a3b8' }}>{fmtDate(item.lastOrdered)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={sectionTitle}>Lab Materials (CIRCUTE)</h3>
      {labRows.length === 0 ? (
        <div style={emptyBox}>No materials in stock. Buy parts in Safari → CIRCUTE to populate inventory.</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr style={{ color: '#94a3b8', background: 'rgba(30,41,59,.5)' }}>
              <th style={th}>SKU</th>
              <th style={th}>Item</th>
              <th style={thRight}>Qty</th>
              <th style={thRight}>Unit Price</th>
            </tr>
          </thead>
          <tbody>
            {labRows.map((item) => (
              <tr key={item.sku} style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
                <td style={{ ...td, color: '#7dd3fc' }}>{item.sku}</td>
                <td style={td}>{item.name}</td>
                <td style={tdRight}>
                  <input
                    value={item.quantity}
                    type="number"
                    min={0}
                    onChange={(e) => updateInventoryQuantity(item.sku, Number(e.target.value))}
                    style={{ width: 76, textAlign: 'right', padding: '5px 8px', borderRadius: 8, border: '1px solid rgba(125,211,252,.35)', background: 'rgba(15,23,42,.8)', color: '#e2e8f0' }}
                  />
                </td>
                <td style={tdRight}>${item.unitPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
