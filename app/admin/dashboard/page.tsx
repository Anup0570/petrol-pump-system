import { createClient } from '@/lib/supabase/server'
import { format, subDays } from 'date-fns'
import DashboardActions from './DashboardActions'
import DeleteShiftButton from './DeleteShiftButton'
import TankCardClient from './TankCardClient'
import SalesTrendChart from './SalesTrendChart'
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

  // Recent entries (last 10)
  const { data: recentEntries } = await supabase
    .from('fuel_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch entries from the last 7 days for the Sales Trend chart
  const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd')
  const { data: trendEntries } = await supabase
    .from('fuel_entries')
    .select('created_at, shift_date, petrol_litres, diesel_litres')
    .gte('shift_date', sevenDaysAgo)
    .order('shift_date', { ascending: true })

  // Compute KPIs
  const todayEntryList = todayEntries || []
  const totalGross = todayEntryList.reduce((s: number, e: any) => s + (e.gross_sales || 0), 0)
  const totalCredit = todayEntryList.reduce((s: number, e: any) => s + (e.credit_given || []).reduce((cs: number, c: any) => cs + c.amt, 0), 0)
  const totalPetrol = todayEntryList.reduce((s: number, e: any) => s + (e.petrol_litres || 0), 0)
  const totalDiesel = todayEntryList.reduce((s: number, e: any) => s + (e.diesel_litres || 0), 0)
  const totalVolume = totalPetrol + totalDiesel

  const petrolTank = (tanks || []).find((t: any) => t.fuel_type === 'petrol') || { current_stock: 0, capacity: 20000 }
  const dieselTank = (tanks || []).find((t: any) => t.fuel_type === 'diesel') || { current_stock: 0, capacity: 20000 }

  const kpiMetrics = [
    { label: "Today's Entries", value: String(todayEntryList.length), icon: 'fa-list-ol', color: '#003366', bg: 'bg-[#003366]/5' },
    { label: 'Total Sales', value: `₹${totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'fa-indian-rupee-sign', color: '#FF6600', bg: 'bg-[#FF6600]/5' },
    { label: 'Total Litres', value: `${totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })} L`, icon: 'fa-gas-pump', color: '#22C55E', bg: 'bg-[#22C55E]/5' },
    { label: 'Pending Credits', value: `₹${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'fa-book-open', color: '#E53935', bg: 'bg-[#E53935]/5' },
  ]

  return (
    <PageWrapper>
      {/* Dashboard Welcome Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard</h1>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">
          {format(new Date(), "EEEE, d MMMM yyyy")} • Sai Priya Fuels Console
        </p>
      </div>

      <StaggerContainer className="space-y-6">
        
        {/* KPI Metrics Cards (4 Columns) */}
        <StaggerItem>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiMetrics.map(m => (
              <div 
                key={m.label} 
                className="glass-panel bg-white p-5 border border-slate-200/80 shadow-sm rounded-2xl flex items-center justify-between hover:border-slate-350 transition-all duration-300 select-none"
              >
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">{m.label}</span>
                  <span className="text-lg font-black text-slate-800 mt-1 block tracking-tight">{m.value}</span>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.bg}`} style={{ color: m.color }}>
                  <i className={`fa-solid ${m.icon} text-sm`}></i>
                </div>
              </div>
            ))}
          </div>
        </StaggerItem>

        {/* Mid Grid: Trend Line Graph + Tank Inventory */}
        <StaggerItem>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sales Trend Line Graph (Left, Span 2) */}
            <div className="lg:col-span-2 glass-panel bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm">
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight mb-4 flex items-center gap-2">
                <i className="fa-solid fa-chart-line text-[#FF6600]"></i>
                Sales Trend (Litres)
              </h3>
              <SalesTrendChart entries={trendEntries || []} />
            </div>

            {/* Tank Inventory Levels (Right, Span 1) */}
            <div className="space-y-4">
              <TankCardClient 
                label="Petrol Reserve" 
                fuelType="petrol" 
                current={petrolTank.current_stock} 
                capacity={petrolTank.capacity} 
              />
              <TankCardClient 
                label="Diesel Reserve" 
                fuelType="diesel" 
                current={dieselTank.current_stock} 
                capacity={dieselTank.capacity} 
              />
            </div>
          </div>
        </StaggerItem>

        {/* Quick Actions Row */}
        <StaggerItem>
          <div className="glass-panel bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Controls</span>
            <DashboardActions />
          </div>
        </StaggerItem>

        {/* Recent Transactions Shifts Table */}
        <StaggerItem>
          <div className="glass-panel p-5 bg-white border border-slate-200/80 shadow-sm rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2.5 text-sm tracking-tight">
                <i className="fa-solid fa-table-list text-[#FF6600]"></i>
                Recent Shift Submissions
              </h3>
              <a 
                href="/admin/entries" 
                className="text-[10px] text-slate-500 font-bold hover:text-[#FF6600] transition-colors border border-slate-200 bg-white hover:bg-slate-50 py-1.5 px-3 rounded-lg shadow-sm uppercase tracking-wider"
              >
                Browse Ledger <i className="fa-solid fa-chevron-right ml-1"></i>
              </a>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {['Date & Time', 'Staff Operator', 'Shift Type', 'Gross Sales', 'Est. Cash', 'Petrol (L)', 'Diesel (L)', 'Discrepancy', 'Status', 'Action'].map((h, idx) => (
                      <th key={idx} className="px-4 py-3.5 text-slate-500 font-bold uppercase tracking-wider text-[9px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!recentEntries || recentEntries.length === 0) ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 font-semibold">No shift submissions recorded.</td>
                    </tr>
                  ) : (
                    recentEntries.map((entry: any) => {
                      const diff = entry.difference || 0
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">
                            {format(new Date(entry.created_at), 'dd MMM, HH:mm')}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">
                            {entry.staff_name}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-semibold whitespace-nowrap">
                            {entry.shift_type?.replace(' Shift', '')}
                          </td>
                          <td className="px-4 py-3 text-slate-800 font-bold whitespace-nowrap">
                            ₹{(entry.gross_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-semibold whitespace-nowrap">
                            ₹{(entry.expected_cash || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-4 py-3 text-[#FF6600] font-bold whitespace-nowrap">
                            {(entry.petrol_litres || 0).toFixed(1)} L
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-bold whitespace-nowrap">
                            {(entry.diesel_litres || 0).toFixed(1)} L
                          </td>
                          <td className={`px-4 py-3 font-black whitespace-nowrap tracking-tight ${
                            diff === 0 ? 'text-[#22C55E]' : diff > 0 ? 'text-amber-600' : 'text-[#EF4444]'
                          }`}>
                            {diff >= 0 ? '+' : ''}₹{diff.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`badge py-0.5 px-2 rounded text-[8px] ${
                              entry.status === 'Verified' ? 'status-verified' : 'status-pending'
                            }`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <DeleteShiftButton
                              shiftId={entry.id}
                              petrolLitres={entry.petrol_litres || 0}
                              dieselLitres={entry.diesel_litres || 0}
                            />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </StaggerItem>

      </StaggerContainer>
    </PageWrapper>
  )
}
