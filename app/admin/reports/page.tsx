import { createClient } from '@/lib/supabase/server'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: entries } = await supabase
    .from('fuel_entries')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Analytics & Reports</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>Generate shift performance and financial reports</p>
      </div>
      <ReportsClient entries={entries || []} />
    </div>
  )
}
