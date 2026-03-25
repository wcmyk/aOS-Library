import { useMemo } from 'react'
import { useCircuitLabStore } from '../../state/useCircuitLabStore'

export function InventoryApp() {
  const inventory = useCircuitLabStore((s) => s.inventory)
  const updateInventoryQuantity = useCircuitLabStore((s) => s.updateInventoryQuantity)
  const rows = useMemo(() => Object.values(inventory), [inventory])

  return (
    <div style={{ height: '100%', overflow: 'auto', background: 'radial-gradient(circle at top,#16233d,#090f1f 55%)', color: '#e2e8f0', padding: 18 }}>
      <h2 style={{ marginTop: 0, letterSpacing: '.02em' }}>Inventory Control</h2>
      <p style={{ color: '#94a3b8', marginTop: 6 }}>Materials purchased from CIRCUTE sync here and can be adjusted manually.</p>
      {rows.length === 0 ? (
        <div style={{ marginTop: 20, border: '1px solid rgba(125,211,252,.2)', borderRadius: 12, padding: 14, color: '#64748b', background: 'rgba(15,23,42,.5)' }}>
          No materials in stock. Buy parts in Safari → CIRCUTE to populate inventory.
        </div>
      ) : (
        <table style={{ width: '100%', marginTop: 18, borderCollapse: 'collapse', fontSize: 13, background: 'rgba(2,6,23,.45)', borderRadius: 14, overflow: 'hidden' }}>
          <thead>
            <tr style={{ color: '#94a3b8', background: 'rgba(30,41,59,.5)' }}>
              <th style={{ textAlign: 'left', padding: '10px 8px' }}>SKU</th>
              <th style={{ textAlign: 'left', padding: '10px 8px' }}>Item</th>
              <th style={{ textAlign: 'right', padding: '10px 8px' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '10px 8px' }}>Unit Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.sku} style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
                <td style={{ padding: '10px 8px', color: '#7dd3fc' }}>{item.sku}</td>
                <td style={{ padding: '10px 8px' }}>{item.name}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                  <input
                    value={item.quantity}
                    type="number"
                    min={0}
                    onChange={(e) => updateInventoryQuantity(item.sku, Number(e.target.value))}
                    style={{ width: 76, textAlign: 'right', padding: '5px 8px', borderRadius: 8, border: '1px solid rgba(125,211,252,.35)', background: 'rgba(15,23,42,.8)', color: '#e2e8f0' }}
                  />
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right' }}>${item.unitPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
