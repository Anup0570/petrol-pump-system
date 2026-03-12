'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function forceResetPumps(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const p1n1 = parseFloat(formData.get('p1n1') as string)
  const p1n2 = parseFloat(formData.get('p1n2') as string)
  const p2n3 = parseFloat(formData.get('p2n3') as string)
  const p2n4 = parseFloat(formData.get('p2n4') as string)
  const oil = parseFloat(formData.get('oil') as string)
  const adminName = formData.get('adminName') as string || 'Admin'

  const { error } = await supabase.from('pump_resets').insert({
    p1n1,
    p1n2,
    p2n3,
    p2n4,
    oil,
    created_by: adminName
  })

  if (error) {
    console.error('Reset error:', error)
    return { error: 'Database error occurred while resetting pump values.' }
  }

  revalidatePath('/staff')
  revalidatePath('/admin/dashboard')
  
  return { success: true }
}
