import { createClient } from '@/lib/supabase/server'
import EntriesClient from './EntriesClient'

export default async function EntriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    isAdmin = profile?.role === 'admin'
  }

  const { data: entries } = await supabase
    .from('fuel_entries')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Shift Entries</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>View, verify, and manage all staff shift submissions</p>
      </div>
      <EntriesClient initialEntries={entries || []} isAdmin={isAdmin} />
    </div>
  )
}
