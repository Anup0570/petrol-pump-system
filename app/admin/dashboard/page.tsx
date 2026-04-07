import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import DashboardActions from './DashboardActions'
import DeleteShiftButton from './DeleteShiftButton'

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

  const kpis = [
    { label: "Today's Gross Sales", value: `₹${totalGross.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: 'fa-indian-rupee-sign', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    { label: 'Cash Collected', value: `₹${totalCash.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: 'fa-money-bills', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    { label: 'UPI / GPay', value: `₹${totalUPI.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: 'fa-mobile-screen-button', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    { label: 'Card Payments', value: `₹${totalCard.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: 'fa-credit-card', color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
    { label: 'Petrol Sold', value: `${totalPetrol.toFixed(1)} L`, icon: 'fa-gas-pump', color: '#fbbf24', bg: 'rgba(217,119,6,0.1)' },
    { label: 'Diesel Sold', value: `${totalDiesel.toFixed(1)} L`, icon: 'fa-gas-pump', color: '#60a5fa', bg: 'rgba(37,99,235,0.1)' },
    { label: 'Credit Given', value: `₹${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: 'fa-book-open', color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Pending Verifications', value: String(pendingCount), icon: 'fa-clock', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  ]

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Owner Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            {format(new Date(), "EEEE, d MMMM yyyy")} — Live inventory and shift reports
          </p>
        </div>
      </div>

      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden md:block">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map(kpi => <KpiCard key={kpi.label} kpi={kpi} />)}
        </div>

        {/* Tank Inventory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <TankCard label="Petrol Tank" fuelType="petrol" current={petrolTank.current_stock} capacity={petrolTank.capacity} />
          <TankCard label="Diesel Tank" fuelType="diesel" current={dieselTank.current_stock} capacity={dieselTank.capacity} />
        </div>

        {/* Actions Row */}
        <div className="mb-8">
          <DashboardActions />
        </div>

        {/* Recent Shifts Table */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <i className="fa-solid fa-table-list text-blue-500"></i>
              Recent Shifts
            </h3>
            <a href="/admin/entries" className="text-[14px] text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors">
              View all <i className="fa-solid fa-arrow-right ml-1"></i>
            </a>
          </div>
          <RecentShiftsTable recentEntries={recentEntries || []} />
        </div>
      </div>

      {/* --- MOBILE LAYOUT --- */}
      <div className="md:hidden space-y-8 mb-8 pb-4">
        {/* Section 1 - Key Metrics */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Key Metrics</h2>
          </div>
          <div className="flex flex-col gap-4">
            {kpis.map(kpi => (
              <div key={kpi.label} className="w-full">
                <KpiCard kpi={kpi} />
              </div>
            ))}
          </div>
        </section>

        {/* Section 2 - Fuel Tank Status */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Fuel Tank Status</h2>
          <div className="grid grid-cols-1 gap-4">
            <TankCard label="Petrol Tank" fuelType="petrol" current={petrolTank.current_stock} capacity={petrolTank.capacity} />
            <TankCard label="Diesel Tank" fuelType="diesel" current={dieselTank.current_stock} capacity={dieselTank.capacity} />
          </div>
        </section>

        {/* Section 3 - Quick Action */}
        <section>
          <DashboardActions />
        </section>

        {/* Section 4 - Recent Shifts */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Shifts</h2>
            <a href="/admin/entries" className="text-sm font-semibold text-blue-600">View all →</a>
          </div>
          <div className="space-y-4">
            {(recentEntries || []).length === 0 ? (
              <div className="glass-panel text-center text-slate-500 text-sm py-8">No shift entries yet.</div>
            ) : (recentEntries || []).map((entry: any) => (
              <MobileShiftCard key={entry.id} entry={entry} />
            ))}
          </div>
          <div className="mt-6 text-center">
            <a href="/admin/entries" className="inline-block text-sm font-semibold text-blue-600 bg-blue-50 py-3 px-6 rounded-xl w-full text-center border border-blue-100">View all shifts →</a>
          </div>
        </section>
      </div>
    </div>
  )
}

function KpiCard({ kpi }: { kpi: any }) {
  return (
    <div className="glass-panel flex items-start justify-between p-5 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div>
        <div className="text-[13px] text-slate-500 font-semibold mb-2">{kpi.label}</div>
        <div className="text-2xl font-bold text-slate-800 tracking-tight">{kpi.value}</div>
      </div>
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
        style={{ background: kpi.bg }}
      >
        <i className={`fa-solid ${kpi.icon} text-xl`} style={{ color: kpi.color }}></i>
      </div>
    </div>
  )
}

function RecentShiftsTable({ recentEntries }: { recentEntries: any[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/60 bg-white/50 backdrop-blur-sm">
      <table className="w-full text-[14px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/50">
            {['Date', 'Staff', 'Shift', 'Gross (₹)', 'Exp. Cash (₹)', 'Petrol (L)', 'Diesel (L)', 'Difference', 'Status', 'Action'].map((h, index) => (
              <th key={index} className="px-4 py-3.5 text-left text-slate-600 font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(recentEntries || []).length === 0 ? (
            <tr><td colSpan={10} className="p-8 text-center text-slate-500">No shift entries yet.</td></tr>
          ) : (recentEntries || []).map((entry: any) => {
            const diff = entry.difference || 0
            return (
              <tr key={entry.id} className="enhanced-row">
                <td className="px-4 py-3.5 text-slate-900 font-medium whitespace-nowrap">{format(new Date(entry.created_at), 'dd MMM, hh:mm a')}</td>
                <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{entry.staff_name}</td>
                <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{entry.shift_type}</td>
                <td className="px-4 py-3.5 text-slate-900 font-semibold whitespace-nowrap">₹{(entry.gross_sales || 0).toLocaleString()}</td>
                <td className="px-4 py-3.5 text-slate-900 font-semibold whitespace-nowrap">₹{(entry.expected_cash || 0).toLocaleString()}</td>
                <td className="px-4 py-3.5 text-orange-600 font-medium whitespace-nowrap">{(entry.petrol_litres || 0).toFixed(1)}</td>
                <td className="px-4 py-3.5 text-blue-600 font-medium whitespace-nowrap">{(entry.diesel_litres || 0).toFixed(1)}</td>
                <td className={`px-4 py-3.5 font-bold whitespace-nowrap ${diff > 0 ? 'text-blue-600' : diff < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {diff >= 0 ? '+' : ''}₹{diff.toLocaleString()}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className={entry.status === 'Verified' ? 'status-verified badge' : 'status-pending badge'}>
                    {entry.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right whitespace-nowrap">
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

function TankCard({ label, fuelType, current, capacity }: { label: string; fuelType: string; current: number; capacity: number }) {
  const pct = Math.min(100, (current / capacity) * 100)
  const isLow = pct < 20
  const color = fuelType === 'petrol' ? (isLow ? '#e11d48' : '#ea580c') : (isLow ? '#e11d48' : '#2563eb')
  const gradient = fuelType === 'petrol' 
    ? (isLow ? 'linear-gradient(to top, #be123c, #f43f5e)' : 'linear-gradient(to top, #c2410c, #f97316)') 
    : (isLow ? 'linear-gradient(to top, #be123c, #f43f5e)' : 'linear-gradient(to top, #1d4ed8, #3b82f6)')

  return (
    <div className="glass-panel p-6 overflow-hidden relative group">
      {/* Decorative blurred background orb */}
      <div 
        className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:opacity-20 group-hover:scale-125"
        style={{ background: color }}
      ></div>

      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100 shadow-sm">
            <i className="fa-solid fa-gas-pump" style={{ color: fuelType === 'petrol' ? 'var(--petrol)' : 'var(--diesel)' }}></i>
          </div>
          {label}
        </h3>
        <span className={isLow ? 'status-pending badge' : 'status-verified badge'}>
          {isLow ? 'Low Stock' : 'Stock OK'}
        </span>
      </div>
      
      <div className="flex gap-6 items-center relative z-10">
        {/* Visual tank */}
        <div className="w-[60px] h-[120px] bg-slate-100 rounded-xl border-2 border-slate-200/60 relative overflow-hidden shrink-0 shadow-inner">
          <div 
            className="absolute bottom-0 w-full transition-all duration-1000 ease-out"
            style={{ height: `${pct}%`, background: gradient, boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4)' }}
          >
            {/* Fluid bubbles effect */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/40"></div>
          </div>
        </div>
        <div>
          <div className="text-4xl font-black text-slate-800 tracking-tight">{Math.round(current).toLocaleString()} <span className="text-xl text-slate-400 font-semibold uppercase">L</span></div>
          <div className="text-[13px] text-slate-500 font-medium mt-1">of {capacity.toLocaleString()} L capacity</div>
          
          <div className="mt-4 h-2 w-36 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner relative">
            <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, background: gradient }}></div>
          </div>
          <div className="text-[12px] text-slate-500 mt-2 font-bold tracking-wide">{pct.toFixed(1)}% FULL</div>
        </div>
      </div>
    </div>
  )
}

function MobileShiftCard({ entry }: { entry: any }) {
  const diff = entry.difference || 0;
  return (
    <div className="glass-panel p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="font-bold text-slate-900 text-[15px]">{entry.staff_name}</div>
          <div className="text-[12px] font-semibold mt-1 text-slate-500 uppercase tracking-wide">
            {format(new Date(entry.created_at), 'dd MMM, hh:mm a')} • {entry.shift_type}
          </div>
        </div>
        <span className={entry.status === 'Verified' ? 'status-verified badge' : 'status-pending badge'}>
          {entry.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
          <div className="text-[11px] font-semibold mb-1 text-slate-400 uppercase tracking-wider">Gross Sales</div>
          <div className="font-bold text-slate-800">₹{(entry.gross_sales || 0).toLocaleString()}</div>
        </div>
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
          <div className="text-[11px] font-semibold mb-1 text-slate-400 uppercase tracking-wider">Exp. Cash</div>
          <div className="font-bold text-slate-800">₹{(entry.expected_cash || 0).toLocaleString()}</div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div>
           <div className="text-[11px] font-semibold mb-1 text-slate-400 uppercase tracking-wider">Difference</div>
           <div className={`font-bold text-base ${diff > 0 ? 'text-blue-600' : diff < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
             {diff >= 0 ? '+' : ''}₹{diff.toLocaleString()}
           </div>
        </div>
        <div>
           <DeleteShiftButton shiftId={entry.id} petrolLitres={entry.petrol_litres || 0} dieselLitres={entry.diesel_litres || 0} />
        </div>
      </div>
    </div>
  )
}
