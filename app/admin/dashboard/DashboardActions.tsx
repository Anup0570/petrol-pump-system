'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardActions() {
  const [showDelivery, setShowDelivery] = useState(false)
  const [fuelType, setFuelType] = useState('petrol')
  const [litres, setLitres] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleDelivery() {
    const l = parseFloat(litres)
    if (!l || l <= 0) { alert('Enter valid litres'); return }
    setSaving(true)

    const supabase = createClient()
    // Log delivery
    await supabase.from('fuel_deliveries').insert({ fuel_type: fuelType, litres: l, logged_by: 'Admin' })

    // Update tank
    const { data: tank } = await supabase.from('tank_inventory').select('current_stock, capacity').eq('fuel_type', fuelType).single()
    if (tank) {
      const newStock = Math.min(tank.capacity, tank.current_stock + l)
      await supabase.from('tank_inventory').update({ current_stock: newStock, updated_at: new Date().toISOString() }).eq('fuel_type', fuelType)
    }

    setSaving(false)
    setShowDelivery(false)
    setLitres('')
    window.location.reload()
  }

  return (
    <>
      <div className="flex gap-3 mb-2">
        <button onClick={() => setShowDelivery(true)} className="btn-primary"
          style={{ padding: '12px 24px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
          <i className="fa-solid fa-truck mr-2"></i>Log Fuel Delivery
        </button>
      </div>

      {showDelivery && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '360px', padding: '28px' }}>
            <h3 className="font-bold text-white mb-4 text-lg">
              <i className="fa-solid fa-truck mr-2" style={{ color: '#60a5fa' }}></i>Log Fuel Delivery
            </h3>
            <div className="mb-4">
              <label className="block text-sm mb-2" style={{ color: '#94a3b8' }}>Fuel Type</label>
              <select value={fuelType} onChange={e => setFuelType(e.target.value)}>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm mb-2" style={{ color: '#94a3b8' }}>Volume Delivered (Litres)</label>
              <input type="number" value={litres} onChange={e => setLitres(e.target.value)} placeholder="e.g. 8000" min="1" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDelivery(false)}
                style={{ flex: 1, padding: '12px', background: 'rgba(51, 65, 85, 0.4)', color: '#cbd5e1', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 }}>Cancel</button>
              <button onClick={handleDelivery} disabled={saving} className="btn-primary"
                style={{ flex: 1, padding: '12px', cursor: 'pointer', fontWeight: 600 }}>
                {saving ? 'Saving...' : 'Save Load'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
