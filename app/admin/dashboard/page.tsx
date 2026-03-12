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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Owner Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          {format(new Date(), "EEEE, d MMMM yyyy")} — Live inventory and shift reports
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpis.map(kpi => (
          <div key={kpi.label} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`fa-solid ${kpi.icon}`} style={{ color: kpi.color, fontSize: '18px' }}></i>
            </div>
            <div>
              <div className="text-xl font-bold text-white">{kpi.value}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tank Inventory */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <TankCard label="Petrol Tank" fuelType="petrol" current={petrolTank.current_stock} capacity={petrolTank.capacity} />
        <TankCard label="Diesel Tank" fuelType="diesel" current={dieselTank.current_stock} capacity={dieselTank.capacity} />
      </div>

      {/* Actions Row */}
      <DashboardActions />

      {/* Recent Shifts Table */}
      <div className="glass-panel mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <i className="fa-solid fa-table-list" style={{ color: '#60a5fa' }}></i>
            Recent Shifts
          </h3>
          <a href="/admin/entries" style={{ fontSize: '13px', color: '#60a5fa', textDecoration: 'none' }}>
            View all <i className="fa-solid fa-arrow-right ml-1"></i>
          </a>
        </div>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['Date', 'Staff', 'Shift', 'Gross (₹)', 'Exp. Cash (₹)', 'Petrol (L)', 'Diesel (L)', 'Difference', 'Status', ''].map((h, index) => (
                  <th key={index} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentEntries || []).length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: '#4b5563' }}>No shift entries yet.</td></tr>
              ) : (recentEntries || []).map((entry: any) => {
                const diff = entry.difference || 0
                return (
                  <tr key={entry.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{format(new Date(entry.created_at), 'dd MMM, hh:mm a')}</td>
                    <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{entry.staff_name}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{entry.shift_type}</td>
                    <td style={{ padding: '10px 12px', color: '#fbbf24', fontWeight: 600 }}>₹{(entry.gross_sales || 0).toFixed(0)}</td>
                    <td style={{ padding: '10px 12px', color: '#34d399', fontWeight: 600 }}>₹{(entry.expected_cash || 0).toFixed(0)}</td>
                    <td style={{ padding: '10px 12px', color: '#fbbf24' }}>{(entry.petrol_litres || 0).toFixed(1)}</td>
                    <td style={{ padding: '10px 12px', color: '#60a5fa' }}>{(entry.diesel_litres || 0).toFixed(1)}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: diff > 0 ? '#60a5fa' : diff < 0 ? '#f87171' : '#34d399' }}>
                      {diff >= 0 ? '+' : ''}₹{diff.toFixed(0)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`badge ${entry.status === 'Verified' ? 'status-verified' : 'status-pending'}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
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
    <div className="glass-panel">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-white text-sm">{label}</h3>
        <span className={`badge ${isLow ? '' : ''}`} style={{ background: isLow ? 'rgba(239,68,68,0.15)' : 'rgba(71,85,105,0.3)', color: isLow ? '#f87171' : '#94a3b8' }}>
          {isLow ? 'Low Stock' : 'OK'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
        {/* Visual tank */}
        <div style={{ width: '48px', height: '100px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{
            position: 'absolute', bottom: 0, width: '100%',
            height: `${pct}%`,
            background: `linear-gradient(to top, ${color}, ${lightColor})`,
            transition: 'height 0.5s ease',
            borderRadius: '0 0 7px 7px'
          }}></div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{Math.round(current).toLocaleString()} L</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>of {capacity.toLocaleString()} L capacity</div>
          <div style={{ marginTop: '8px', height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden', width: '120px' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(to right, ${color}, ${lightColor})`, borderRadius: '3px' }}></div>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{pct.toFixed(1)}% full</div>
        </div>
      </div>
    </div>
  )
}
