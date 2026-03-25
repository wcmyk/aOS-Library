import { useMemo } from 'react'
import { useCircuitLabStore } from '../../state/useCircuitLabStore'

export function InventoryApp() {
  const inventory = useCircuitLabStore((s) => s.inventory)
  const rows = useMemo(() => Object.values(inventory), [inventory])

  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#0b1324', color: '#e2e8f0', padding: 18 }}>
      <h2 style={{ marginTop: 0 }}>Lab Inventory</h2>
      <p style={{ color: '#94a3b8', marginTop: 6 }}>Materials are stocked dynamically from CIRCUTE purchases.</p>
      {rows.length === 0 ? (
        <div style={{ marginTop: 20, border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: 14, color: '#64748b' }}>
          No materials in stock. Buy parts in Safari → CIRCUTE to populate inventory.
        </div>
      ) : (
        <table style={{ width: '100%', marginTop: 18, borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: '#94a3b8' }}>
              <th style={{ textAlign: 'left', padding: '8px 6px' }}>SKU</th>
              <th style={{ textAlign: 'left', padding: '8px 6px' }}>Item</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>Unit Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.sku} style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
                <td style={{ padding: '10px 6px', color: '#7dd3fc' }}>{item.sku}</td>
                <td style={{ padding: '10px 6px' }}>{item.name}</td>
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>${item.unitPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
