'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { buttonHover, modalVariants } from '@/lib/motion'

export default function DashboardActions() {
  const router = useRouter()
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
      <div className="flex flex-wrap gap-4 mb-2">
        <motion.button 
          whileHover={buttonHover}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDelivery(true)} 
          className="btn-primary px-6 py-3.5 text-sm font-bold shadow-md cursor-pointer hover:shadow-lg transition-shadow flex items-center gap-2"
        >
          <i className="fa-solid fa-truck"></i> Log Fuel Delivery
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.03, y: -2, boxShadow: "0 10px 20px rgba(16,185,129,0.25)" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/admin/entries')} 
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3.5 text-sm rounded-xl cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.25)] flex items-center gap-2 transition-all duration-300 border border-emerald-400/20"
        >
          <i className="fa-solid fa-check-double"></i> Shift Approvals
        </motion.button>
      </div>

      <AnimatePresence>
        {showDelivery && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            {/* Modal Container */}
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="glass-panel w-full max-w-[420px] bg-[#0d1020]/95 border border-white/10 relative overflow-hidden p-8"
            >
              {/* Dynamic decorative top bar glow */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff6a00] to-transparent"></div>

              <h3 className="font-extrabold text-white mb-6 text-xl tracking-tight flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#ff6a00]/10 flex items-center justify-center border border-[#ff6a00]/25">
                  <i className="fa-solid fa-truck text-[#ff6a00]" style={{ filter: 'drop-shadow(0 0 6px #ff6a00)' }}></i>
                </div>
                Log Fuel Delivery
              </h3>

              <div className="mb-5">
                <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Fuel Cargo Type</label>
                <select 
                  value={fuelType} 
                  onChange={e => setFuelType(e.target.value)} 
                  className="w-full cursor-pointer bg-slate-900 border border-white/10 text-white rounded-xl focus:border-[#ff6a00]"
                >
                  <option value="petrol">Petrol (Motor Spirit)</option>
                  <option value="diesel">Diesel (High Speed Diesel)</option>
                </select>
              </div>

              <div className="mb-8">
                <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Volume Delivered (Litres)</label>
                <input 
                  type="number" 
                  value={litres} 
                  onChange={e => setLitres(e.target.value)} 
                  placeholder="e.g. 8000" 
                  min="1" 
                  className="w-full bg-slate-900 border border-white/10 text-white rounded-xl focus:border-[#ff6a00]"
                />
              </div>

              <div className="flex gap-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDelivery(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 hover:border-white/10 rounded-xl cursor-pointer font-bold text-sm transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileHover={!saving ? buttonHover : {}}
                  whileTap={!saving ? { scale: 0.98 } : {}}
                  onClick={handleDelivery} 
                  disabled={saving}
                  className="flex-1 py-3 btn-primary text-sm font-bold opacity-100 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Load'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
