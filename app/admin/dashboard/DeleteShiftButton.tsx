'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/server'

interface DeleteShiftButtonProps {
  shiftId: string
  petrolLitres: number
  dieselLitres: number
}

export default function DeleteShiftButton({ shiftId, petrolLitres, dieselLitres }: DeleteShiftButtonProps) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this shift? This action cannot be undone.")) {
      return
    }

    setDeleting(true)

    try {
      const supabase = await createClient()
      // 1. Delete the shift entry
      const { error: deleteError } = await supabase
        .from('fuel_entries')
        .delete()
        .eq('id', shiftId)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      // 2. Revert Tank Inventory safely (Add the liters back)
      if (petrolLitres > 0) {
        const { data: pTank } = await supabase.from('tank_inventory').select('current_stock, capacity').eq('fuel_type', 'petrol').single()
        if (pTank) {
          const newS = Math.min(pTank.capacity, Number(pTank.current_stock) + Number(petrolLitres))
          await supabase.from('tank_inventory').update({ current_stock: newS, updated_at: new Date().toISOString() }).eq('fuel_type', 'petrol')
        }
      }

      if (dieselLitres > 0) {
        const { data: dTank } = await supabase.from('tank_inventory').select('current_stock, capacity').eq('fuel_type', 'diesel').single()
        if (dTank) {
          const newS = Math.min(dTank.capacity, Number(dTank.current_stock) + Number(dieselLitres))
          await supabase.from('tank_inventory').update({ current_stock: newS, updated_at: new Date().toISOString() }).eq('fuel_type', 'diesel')
        }
      }

      // 3. Reload the page to reflect the deletion
      window.location.reload()

    } catch (error: any) {
        console.error("Error deleting shift:", error)
        alert('Failed to delete shift: ' + (error.message || 'Unknown error'))
        setDeleting(false) // only reset if error occurs
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      title="Delete Shift"
      style={{
        padding: '6px 10px',
        background: 'rgba(239,68,68,0.1)',
        color: '#f87171',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: '6px',
        cursor: deleting ? 'not-allowed' : 'pointer',
        fontSize: '12px',
        opacity: deleting ? 0.5 : 1,
        transition: 'all 0.2s ease',
      }}
      className="hover:bg-red-500/20 hover:border-red-500/40"
    >
      <i className={`fa-solid ${deleting ? 'fa-spinner fa-spin' : 'fa-trash'}`}></i>
    </button>
  )
}
