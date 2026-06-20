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
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top Nav (Clean White Enterprise) */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff6a00] to-[#ff8c00] flex items-center justify-center shadow-sm">
              <i className="fa-solid fa-gas-pump text-white text-sm"></i>
            </div>
            <span className="font-extrabold text-slate-800 text-[18px] tracking-tight">Sai Priya Fuels</span>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5 pr-2">
            <span className="text-[13px] font-semibold text-slate-600 pl-2 flex items-center gap-2">
              <i className="fa-solid fa-clipboard-user text-[#ff6a00]"></i>
              {profile?.name || user.email}
            </span>
            <form action={logout}>
              <button type="submit" className="bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-xl cursor-pointer text-[12px] font-bold transition-all shadow-sm">
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Shift Handover Console</h1>
          <p className="text-sm mt-1.5 text-slate-500 font-medium leading-relaxed">
            Record digital transactions, verify physical currency notes, and resolve discrepancies before initiating ledger commit protocols.
          </p>
        </div>

        <StaffPageClient staffNames={staffNames} initialOpenings={initialOpenings} />
      </div>
    </div>
  )
}
