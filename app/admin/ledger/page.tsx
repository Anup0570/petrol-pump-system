import { createClient } from '@/lib/supabase/server'
import LedgerClient from './LedgerClient'

export default async function LedgerPage() {
  const supabase = await createClient()
  const { data: entries } = await supabase
    .from('credit_ledger')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Credit Ledger</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>Track outstanding credits and payments received</p>
      </div>
      <LedgerClient initialEntries={entries || []} />
    </div>
  )
}
