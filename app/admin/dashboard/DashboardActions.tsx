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
      <div className="flex gap-3 mb-4">
        <button onClick={() => setShowDelivery(true)} 
          style={{ padding: '12px 24px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 10px rgba(37,99,235,0.2)', transition: 'all 0.2s ease' }}>
          <i className="fa-solid fa-truck mr-2"></i>Log Fuel Delivery
        </button>
      </div>

      {showDelivery && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '32px', width: '90%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h3 className="font-bold text-slate-800 mb-6 text-xl">
              <i className="fa-solid fa-truck mr-3" style={{ color: '#2563eb' }}></i>Log Fuel Delivery
            </h3>
            <div className="mb-5">
              <label className="block text-sm mb-2 font-semibold text-slate-600">Fuel Type</label>
              <select value={fuelType} onChange={e => setFuelType(e.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#0f172a', outline: 'none', fontSize: '15px', fontWeight: 500 }}>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
              </select>
            </div>
            <div className="mb-8">
              <label className="block text-sm mb-2 font-semibold text-slate-600">Volume Delivered (Litres)</label>
              <input type="number" value={litres} onChange={e => setLitres(e.target.value)} placeholder="e.g. 8000" min="1" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#0f172a', outline: 'none', fontSize: '15px', fontWeight: 500 }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDelivery(false)}
                style={{ flex: 1, padding: '14px', background: '#ffffff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600, fontSize: '15px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>Cancel</button>
              <button onClick={handleDelivery} disabled={saving}
                style={{ flex: 1, padding: '14px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '15px', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
                {saving ? 'Saving...' : 'Save Load'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
