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

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(kpi => (
          <div key={kpi.label} style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>{kpi.label}</div>
              <div className="text-2xl font-bold text-slate-800">{kpi.value}</div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`fa-solid ${kpi.icon}`} style={{ color: kpi.color, fontSize: '20px' }}></i>
            </div>
          </div>
        ))}
      </div>

      {/* Tank Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <TankCard label="Petrol Tank" fuelType="petrol" current={petrolTank.current_stock} capacity={petrolTank.capacity} />
        <TankCard label="Diesel Tank" fuelType="diesel" current={dieselTank.current_stock} capacity={dieselTank.capacity} />
      </div>

      {/* Actions Row */}
      <DashboardActions />

      {/* Recent Shifts Table */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '24px', marginTop: '24px' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <i className="fa-solid fa-table-list" style={{ color: '#3b82f6' }}></i>
            Recent Shifts
          </h3>
          <a href="/admin/entries" style={{ fontSize: '14px', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
            View all <i className="fa-solid fa-arrow-right ml-1"></i>
          </a>
        </div>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#ffffff' }}>
                {['Date', 'Staff', 'Shift', 'Gross (₹)', 'Exp. Cash (₹)', 'Petrol (L)', 'Diesel (L)', 'Difference', 'Status', 'Action'].map((h, index) => (
                  <th key={index} style={{ padding: '14px 16px', textAlign: 'left', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentEntries || []).length === 0 ? (
                <tr><td colSpan={10} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No shift entries yet.</td></tr>
              ) : (recentEntries || []).map((entry: any) => {
                const diff = entry.difference || 0
                return (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '14px 16px', color: '#0f172a', fontWeight: 500 }}>{format(new Date(entry.created_at), 'dd MMM, hh:mm a')}</td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>{entry.staff_name}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{entry.shift_type}</td>
                    <td style={{ padding: '14px 16px', color: '#0f172a', fontWeight: 600 }}>₹{(entry.gross_sales || 0).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', color: '#0f172a', fontWeight: 600 }}>₹{(entry.expected_cash || 0).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', color: '#d97706', fontWeight: 500 }}>{(entry.petrol_litres || 0).toFixed(1)}</td>
                    <td style={{ padding: '14px 16px', color: '#2563eb', fontWeight: 500 }}>{(entry.diesel_litres || 0).toFixed(1)}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: diff > 0 ? '#2563eb' : diff < 0 ? '#ef4444' : '#10b981' }}>
                      {diff >= 0 ? '+' : ''}₹{diff.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${entry.status === 'Verified' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`} style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600 }}>
                        {entry.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
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
      </div>
    </div>
  )
}

function TankCard({ label, fuelType, current, capacity }: { label: string; fuelType: string; current: number; capacity: number }) {
  const pct = Math.min(100, (current / capacity) * 100)
  const isLow = pct < 20
  const color = fuelType === 'petrol' ? (isLow ? '#ef4444' : '#d97706') : (isLow ? '#ef4444' : '#2563eb')
  const lightColor = fuelType === 'petrol' ? (isLow ? '#fca5a5' : '#fbbf24') : (isLow ? '#fca5a5' : '#60a5fa')

  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '24px' }}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <i className="fa-solid fa-gas-pump" style={{ color: fuelType === 'petrol' ? '#d97706' : '#2563eb' }}></i>
          {label}
        </h3>
        <span style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: isLow ? '#fef2f2' : '#ffffff', color: isLow ? '#ef4444' : '#64748b', border: `1px solid ${isLow ? '#fecaca' : '#e2e8f0'}` }}>
          {isLow ? 'Low Stock' : 'Stock OK'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        {/* Visual tank */}
        <div style={{ width: '60px', height: '120px', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{
            position: 'absolute', bottom: 0, width: '100%',
            height: `${pct}%`,
            background: color,
            transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}></div>
        </div>
        <div>
          <div className="text-3xl font-extrabold text-slate-800">{Math.round(current).toLocaleString()} <span className="text-lg text-slate-500 font-medium">L</span></div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>of {capacity.toLocaleString()} L capacity</div>
          <div style={{ marginTop: '12px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', width: '140px' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px' }}></div>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontWeight: 500 }}>{pct.toFixed(1)}% Full</div>
        </div>
      </div>
    </div>
  )
}
