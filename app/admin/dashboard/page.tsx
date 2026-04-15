import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import DashboardActions from './DashboardActions'
import DeleteShiftButton from './DeleteShiftButton'
import KpiCardClient from './KpiCardClient'
import TankCardClient from './TankCardClient'
import { PageWrapper, StaggerContainer, StaggerItem } from './MotionWrapper'

export default async function DashboardPage() {
  const supabase = await createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  // Today's entries
  const { data: todayEntries } = await supabase
    .from('fuel_entries')
    .select('*')
    .eq('shift_date', today)
    .order('created_at', { ascending: false })

  // Tank inventory
  const { data: tanks } = await supabase
    .from('tank_inventory')
    .select('*')

  // Recent entries (last 7)
  const { data: recentEntries } = await supabase
    .from('fuel_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(7)

  // Compute KPIs
  const todayEntryList = todayEntries || []
  const totalGross = todayEntryList.reduce((s: number, e: any) => s + (e.gross_sales || 0), 0)
  const totalCash = todayEntryList.reduce((s: number, e: any) => s + (e.expected_cash || 0), 0)
  const totalUPI = todayEntryList.reduce((s: number, e: any) => s + (e.gpay_amount || 0), 0)
  const totalCard = todayEntryList.reduce((s: number, e: any) => s + (e.card_amount || 0), 0)
  const totalCredit = todayEntryList.reduce((s: number, e: any) => s + (e.credit_given || []).reduce((cs: number, c: any) => cs + c.amt, 0), 0)
  const totalPetrol = todayEntryList.reduce((s: number, e: any) => s + (e.petrol_litres || 0), 0)
  const totalDiesel = todayEntryList.reduce((s: number, e: any) => s + (e.diesel_litres || 0), 0)
  const pendingCount = todayEntryList.filter((e: any) => e.status === 'Pending').length

  const petrolTank = (tanks || []).find((t: any) => t.fuel_type === 'petrol') || { current_stock: 0, capacity: 20000 }
  const dieselTank = (tanks || []).find((t: any) => t.fuel_type === 'diesel') || { current_stock: 0, capacity: 20000 }

  // Elite palette tuning for the KPI cards
  const kpis = [
    { label: "Today's Gross Sales", value: `₹${totalGross.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: 'fa-indian-rupee-sign', color: '#3b82f6' },
    { label: 'Cash Collected', value: `₹${totalCash.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: 'fa-money-bills', color: '#10b981' },
    { label: 'UPI / GPay', value: `₹${totalUPI.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: 'fa-mobile-screen-button', color: '#6366f1' },
    { label: 'Card Payments', value: `₹${totalCard.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: 'fa-credit-card', color: '#8b5cf6' },
    { label: 'Petrol Sold', value: `${totalPetrol.toFixed(1)} L`, icon: 'fa-gas-pump', color: '#f97316' },
    { label: 'Diesel Sold', value: `${totalDiesel.toFixed(1)} L`, icon: 'fa-gas-pump', color: '#0ea5e9' },
    { label: 'Credit Given', value: `₹${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: 'fa-book-open', color: '#ef4444' },
    { label: 'Pending Verifications', value: String(pendingCount), icon: 'fa-clock', color: '#f59e0b' },
  ]

  return (
    <PageWrapper>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Main Command Center</h1>
          <p className="text-sm mt-1 text-zinc-500 font-medium tracking-wide uppercase">
            {format(new Date(), "EEEE, d MMMM yyyy")} • Live Metrics
          </p>
        </div>
      </div>

      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden md:block">
        {/* KPI Grid */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map(kpi => (
            <StaggerItem key={kpi.label}>
              <KpiCardClient kpi={kpi} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Tank Inventory */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <StaggerItem>
            <TankCardClient label="Petrol Reserve" fuelType="petrol" current={petrolTank.current_stock} capacity={petrolTank.capacity} />
          </StaggerItem>
          <StaggerItem>
            <TankCardClient label="Diesel Reserve" fuelType="diesel" current={dieselTank.current_stock} capacity={dieselTank.capacity} />
          </StaggerItem>
        </StaggerContainer>

        {/* Actions Row */}
        <StaggerContainer className="mb-8">
          <StaggerItem>
            <DashboardActions />
          </StaggerItem>
        </StaggerContainer>

        {/* Recent Shifts Table */}
        <StaggerContainer>
          <StaggerItem className="glass-panel p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-white flex items-center gap-3 text-xl tracking-tight">
                <i className="fa-solid fa-table-list text-blue-500"></i>
                Terminal Activity
              </h3>
              <a href="/admin/entries" className="text-[13px] text-zinc-400 font-semibold hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg transition-all border border-transparent hover:border-white/10 tracking-widest uppercase">
                Browse Complete Ledger <i className="fa-solid fa-arrow-right ml-2 opacity-50"></i>
              </a>
            </div>
            <RecentShiftsTable recentEntries={recentEntries || []} />
          </StaggerItem>
        </StaggerContainer>
      </div>

      {/* --- MOBILE LAYOUT --- */}
      <div className="md:hidden space-y-8 mb-8 pb-4">
        {/* Section 1 - Key Metrics */}
        <StaggerContainer>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Key Metrics</h2>
          </div>
          <div className="flex flex-col gap-4">
            {kpis.map(kpi => (
              <StaggerItem key={kpi.label} className="w-full">
                <KpiCardClient kpi={kpi} />
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>

        {/* Section 2 - Fuel Tank Status */}
        <StaggerContainer>
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 px-2 mt-4">Reserves</h2>
          <div className="grid grid-cols-1 gap-4">
            <StaggerItem>
              <TankCardClient label="Petrol Reserve" fuelType="petrol" current={petrolTank.current_stock} capacity={petrolTank.capacity} />
            </StaggerItem>
            <StaggerItem>
              <TankCardClient label="Diesel Reserve" fuelType="diesel" current={dieselTank.current_stock} capacity={dieselTank.capacity} />
            </StaggerItem>
          </div>
        </StaggerContainer>

        {/* Section 3 - Quick Action */}
        <StaggerContainer>
          <StaggerItem>
            <DashboardActions />
          </StaggerItem>
        </StaggerContainer>

        {/* Section 4 - Recent Shifts */}
        <StaggerContainer>
          <div className="flex items-center justify-between mb-4 px-2 mt-4">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {(recentEntries || []).length === 0 ? (
              <div className="glass-panel text-center text-zinc-500 text-sm py-8 border-dashed border-zinc-700 font-medium">No system activity detected.</div>
            ) : (recentEntries || []).map((entry: any) => (
              <StaggerItem key={entry.id}>
                <MobileShiftCard entry={entry} />
              </StaggerItem>
            ))}
          </div>
          <div className="mt-6 text-center">
            <a href="/admin/entries" className="inline-block text-sm font-semibold text-white bg-zinc-900 py-4 px-6 rounded-xl w-full text-center border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:bg-zinc-800 hover:shadow-lg transition-all tracking-widest uppercase">Browse All Intelligence</a>
          </div>
        </StaggerContainer>
      </div>
    </PageWrapper>
  )
}

function RecentShiftsTable({ recentEntries }: { recentEntries: any[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-inner">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-white/5 bg-black/20">
            {['Timestamp', 'Operator', 'Type', 'Gross (₹)', 'Est. Cash (₹)', 'Petrol (L)', 'Diesel (L)', 'Discrepancy', 'Status', 'Manage'].map((h, index) => (
              <th key={index} className="px-5 py-4 text-left text-zinc-500 font-bold uppercase tracking-widest whitespace-nowrap text-[11px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {(recentEntries || []).length === 0 ? (
            <tr><td colSpan={10} className="p-10 text-center text-zinc-500 font-medium">No intelligence logs found.</td></tr>
          ) : (recentEntries || []).map((entry: any) => {
            const diff = entry.difference || 0
            return (
              <tr key={entry.id} className="enhanced-row">
                <td className="px-5 py-4 text-zinc-300 font-medium whitespace-nowrap">{format(new Date(entry.created_at), 'dd MMM, HH:mm')}</td>
                <td className="px-5 py-4 text-zinc-400 font-semibold whitespace-nowrap flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] text-white">
                    {entry.staff_name.charAt(0).toUpperCase()}
                  </div>
                  {entry.staff_name}
                </td>
                <td className="px-5 py-4 text-zinc-500 font-medium whitespace-nowrap">{entry.shift_type}</td>
                <td className="px-5 py-4 text-white font-semibold whitespace-nowrap tracking-tight">₹{(entry.gross_sales || 0).toLocaleString()}</td>
                <td className="px-5 py-4 text-white font-semibold whitespace-nowrap tracking-tight">₹{(entry.expected_cash || 0).toLocaleString()}</td>
                <td className="px-5 py-4 text-orange-400 font-bold whitespace-nowrap">{(entry.petrol_litres || 0).toFixed(1)}</td>
                <td className="px-5 py-4 text-sky-400 font-bold whitespace-nowrap">{(entry.diesel_litres || 0).toFixed(1)}</td>
                <td className={`px-5 py-4 font-bold whitespace-nowrap tracking-tight ${diff > 0 ? 'text-blue-500' : diff < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {diff >= 0 ? '+' : ''}₹{diff.toLocaleString()}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className={entry.status === 'Verified' ? 'status-verified badge' : 'status-pending badge'}>
                    {entry.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right whitespace-nowrap">
                  <DeleteShiftButton
                    shiftId={entry.id}
                    petrolLitres={entry.petrol_litres || 0}
                    dieselLitres={entry.diesel_litres || 0}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MobileShiftCard({ entry }: { entry: any }) {
  const diff = entry.difference || 0;
  return (
    <div className="glass-panel p-6 border-l-4 border-l-transparent hover:border-l-blue-500 transition-colors">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-sm font-bold text-white shadow-lg">
            {entry.staff_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-white text-[16px] tracking-tight">{entry.staff_name}</div>
            <div className="text-[11px] font-bold mt-1 text-zinc-500 uppercase tracking-widest">
              {format(new Date(entry.created_at), 'dd MMM, HH:mm')} • {entry.shift_type}
            </div>
          </div>
        </div>
        <span className={entry.status === 'Verified' ? 'status-verified badge shadow-sm' : 'status-pending badge shadow-sm'}>
          {entry.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-zinc-900/80 p-4 rounded-xl border border-white/5 shadow-inner">
          <div className="text-[10px] font-bold mb-1.5 text-zinc-500 uppercase tracking-widest">Gross Sales</div>
          <div className="font-extrabold text-white text-lg tracking-tight">₹{(entry.gross_sales || 0).toLocaleString()}</div>
        </div>
        <div className="bg-zinc-900/80 p-4 rounded-xl border border-white/5 shadow-inner">
          <div className="text-[10px] font-bold mb-1.5 text-zinc-500 uppercase tracking-widest">Exp. Cash</div>
          <div className="font-extrabold text-white text-lg tracking-tight">₹{(entry.expected_cash || 0).toLocaleString()}</div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div>
           <div className="text-[10px] font-bold mb-1 text-zinc-500 uppercase tracking-widest">Discrepancy</div>
           <div className={`font-black text-xl tracking-tighter ${diff > 0 ? 'text-blue-500' : diff < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
             {diff >= 0 ? '+' : ''}₹{diff.toLocaleString()}
           </div>
        </div>
        <div className="opacity-80 hover:opacity-100 transition-opacity">
           <DeleteShiftButton shiftId={entry.id} petrolLitres={entry.petrol_litres || 0} dieselLitres={entry.diesel_litres || 0} />
        </div>
      </div>
    </div>
  )
}
