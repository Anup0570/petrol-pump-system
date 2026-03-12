'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function resetTankStock(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const petrolStock = parseFloat(formData.get('petrolStock') as string)
  const dieselStock = parseFloat(formData.get('dieselStock') as string)
  const reason = formData.get('reason') as string || ''
  const adminName = formData.get('adminName') as string || 'Admin'

  if (isNaN(petrolStock) || isNaN(dieselStock)) {
    return { error: 'Invalid tank stock values format.' }
  }

  // 1. Log the correction
  const { error: logError } = await supabase.from('tank_resets').insert({
    petrol_stock: petrolStock,
    diesel_stock: dieselStock,
    reason,
    created_by: adminName
  })

  if (logError) {
    console.error('tank_resets error:', logError)
    return { error: 'Database logging error occurred.' }
  }

  // 2. Update tank_inventory
  const { error: pError } = await supabase.from('tank_inventory')
    .update({ current_stock: petrolStock, updated_at: new Date().toISOString() })
    .eq('fuel_type', 'petrol')

  if (pError) console.error('petrol update error:', pError)

  const { error: dError } = await supabase.from('tank_inventory')
    .update({ current_stock: dieselStock, updated_at: new Date().toISOString() })
    .eq('fuel_type', 'diesel')

  if (dError) console.error('diesel update error:', dError)

  if (pError || dError) {
    return { error: 'Failed to update one or more tank stocks.' }
  }

  // Next cache invalidation
  revalidatePath('/admin/dashboard')
  
  return { success: true }
}
