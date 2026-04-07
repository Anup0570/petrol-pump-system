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
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      {/* Top Nav */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200/60 p-4 sticky top-0 z-50 shadow-[0_1px_12px_rgba(15,23,42,0.04)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <i className="fa-solid fa-gas-pump text-white text-sm"></i>
            </div>
            <span className="font-extrabold text-slate-900 text-[18px] tracking-tight">Sai Priya Fuels</span>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 pr-2">
            <span className="text-[13px] font-semibold text-slate-600 pl-2 flex items-center gap-2">
              <i className="fa-solid fa-clipboard-user text-blue-500"></i>
              {profile?.name || user.email}
            </span>
            <form action={logout}>
              <button type="submit" className="bg-white hover:bg-red-50 border border-slate-200 hover:border-red-100 text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-xl cursor-pointer text-[12px] font-bold transition-colors shadow-sm">
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Shift Handover</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Enter digital payments first, then count the physical cash in the drawer and verify the difference before submitting.
          </p>
        </div>

        <StaffPageClient staffNames={staffNames} initialOpenings={initialOpenings} />
      </div>
    </div>
  )
}
