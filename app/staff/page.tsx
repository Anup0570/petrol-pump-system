import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StaffPageClient from './StaffPageClient'
import { logout } from '@/app/login/actions'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role?.trim().toLowerCase() === 'admin') redirect('/admin/dashboard')

  // Fetch latest closing readings to use as openings for next shift
  const { data: lastEntry } = await supabase
    .from('fuel_entries')
    .select('nozzle_readings, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Fetch latest emergency pump reset
  const { data: lastReset } = await supabase
    .from('pump_resets')
    .select('p1n1, p1n2, p2n3, p2n4, oil, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const initialOpenings: Record<string, number> = {
    p1n1: 45201.50, p1n2: 12050.20, p2n3: 89004.10, p2n4: 34102.80, oil: 50.50
  }

  // Determine if we should use the emergency reset or the last shift's closing
  let useReset = false;
  if (lastReset) {
    if (!lastEntry) {
      useReset = true;
    } else {
      const resetTime = new Date(lastReset.created_at).getTime();
      const entryTime = new Date(lastEntry.created_at).getTime();
      if (resetTime > entryTime) useReset = true;
    }
  }

  if (useReset && lastReset) {
    initialOpenings.p1n1 = lastReset.p1n1;
    initialOpenings.p1n2 = lastReset.p1n2;
    initialOpenings.p2n3 = lastReset.p2n3;
    initialOpenings.p2n4 = lastReset.p2n4;
    initialOpenings.oil = lastReset.oil;
  } else if (lastEntry?.nozzle_readings) {
    const lastReadings = lastEntry.nozzle_readings as any[]
    lastReadings.forEach((r: any) => {
      if (r.id && r.close !== undefined) initialOpenings[r.id] = r.close
    })
  }

  // Fetch all staff members for the dropdown
  const { data: staffList } = await supabase
    .from('staff_list')
    .select('name')
    .order('name')

  const staffNames = staffList?.map(s => s.name) || []

  return (
    <div className="min-h-screen" style={{ background: '#0f172a' }}>
      {/* Top Nav */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '12px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
              <i className="fa-solid fa-gas-pump text-white text-sm"></i>
            </div>
            <span className="font-bold text-white text-lg">Sai Priya Fuels</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: '#64748b' }}>
              <i className="fa-solid fa-clipboard-user mr-1"></i>
              {profile?.name || user.email}
            </span>
            <form action={logout}>
              <button type="submit" style={{ background: '#334155', border: 'none', color: '#94a3b8', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <i className="fa-solid fa-arrow-right-from-bracket mr-1"></i>Logout
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Shift Handover</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Enter digital payments first, then count the physical cash in the drawer and verify the difference before submitting.
          </p>
        </div>

        <StaffPageClient staffNames={staffNames} initialOpenings={initialOpenings} />
      </div>
    </div>
  )
}
