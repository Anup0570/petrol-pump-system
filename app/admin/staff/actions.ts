'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addStaffName(formData: FormData) {
  const name = formData.get('name') as string

  if (!name || name.trim() === '') {
    return { error: 'Please enter a valid name.' }
  }

  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  // Insert into staff_list
  const { error } = await supabase.from('staff_list').insert({ name: name.trim() })

  if (error) {
    console.error('Error adding staff name:', error)
    return { error: 'Failed to add staff name.' }
  }

  revalidatePath('/admin/staff')
  revalidatePath('/staff')
  
  return { success: true }
}

export async function deleteStaffName(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) return { error: 'Invalid ID' }

  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase.from('staff_list').delete().eq('id', id)

  if (error) {
    console.error('Error deleting staff name:', error)
    return { error: 'Failed to delete staff name.' }
  }

  revalidatePath('/admin/staff')
  revalidatePath('/staff')
  
  return { success: true }
}
