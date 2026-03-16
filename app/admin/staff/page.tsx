import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StaffManager from './StaffManager'

export default async function StaffManagementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role?.trim().toLowerCase() !== 'admin') redirect('/staff')

  // Fetch all staff names
  const { data: staffList } = await supabase
    .from('staff_list')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Staff Management</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          Manage the list of staff names that appear in the shift entry form.
        </p>
      </div>
      
      <StaffManager initialStaff={staffList || []} />
    </div>
  )
}
