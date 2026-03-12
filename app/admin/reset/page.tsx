import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResetForm from './ResetForm'

export default async function ResetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Emergency Pump Reset</h1>
        <p className="text-sm mt-1" style={{ color: '#ef4444' }}>
          Use this only if a manager submitted wrong meter readings. This force-resets the starting readings for the next shift.
        </p>
      </div>
      <ResetForm adminName={profile?.name || user.email || 'Admin'} />
    </div>
  )
}
