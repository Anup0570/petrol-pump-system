'use client'

import { useState } from 'react'
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import type { FuelEntry } from '@/lib/types'

export default function ReportsClient({ entries }: { entries: FuelEntry[] }) {
  const [days, setDays] = useState(7)
  const endDate = new Date()
  const startDate = subDays(endDate, days - 1)

  const filtered = entries.filter(e => {
    const entryDate = new Date(e.created_at)
    return isWithinInterval(entryDate, { start: startOfDay(startDate), end: endOfDay(endDate) })
  })

  // 1. Daily Sales Data (Bar Chart)
  const dailyDataMap = new Map<string, { date: string, gross: number, cash: number }>()
  for (let i = 0; i < days; i++) {
    const d = format(subDays(endDate, days - 1 - i), 'MMM dd')
    dailyDataMap.set(d, { date: d, gross: 0, cash: 0 })
  }

  filtered.forEach(e => {
    const d = format(new Date(e.created_at), 'MMM dd')
    if (dailyDataMap.has(d)) {
      const current = dailyDataMap.get(d)!
      current.gross += e.gross_sales || 0
      current.cash += e.expected_cash || 0
      dailyDataMap.set(d, current)
    }
  })
  const dailyData = Array.from(dailyDataMap.values())

  // 2. Payment Breakdown (Pie Chart)
  const totalCash = filtered.reduce((s, e) => s + (e.counted_cash || e.expected_cash || 0), 0)
  const totalUPI = filtered.reduce((s, e) => s + (e.gpay_amount || 0), 0)
  const totalCard = filtered.reduce((s, e) => s + (e.card_amount || 0), 0)
  const totalCredit = filtered.reduce((s, e) => s + (e.credit_given || []).reduce((cs, c) => cs + c.amt, 0), 0)

  const paymentData = [
    { name: 'Cash', value: totalCash, color: '#34d399' },
    { name: 'UPI/GPay', value: totalUPI, color: '#60a5fa' },
    { name: 'Card', value: totalCard, color: '#818cf8' },
    { name: 'Credit Given', value: totalCredit, color: '#f87171' },
  ].filter(d => d.value > 0)

  // 3. Fuel Volume Breakdown (Pie Chart)
  const totalPetrol = filtered.reduce((s, e) => s + (e.petrol_litres || 0), 0)
  const totalDiesel = filtered.reduce((s, e) => s + (e.diesel_litres || 0), 0)

  const fuelData = [
    { name: 'Petrol', value: totalPetrol, color: '#fbbf24' },
    { name: 'Diesel', value: totalDiesel, color: '#2563eb' },
  ].filter(d => d.value > 0)

  // 4. Pump/Nozzle Volumes (Table)
  const nozzleMap = new Map<string, { label: string, volume: number }>()
  filtered.forEach(e => {
    (e.nozzle_readings || []).forEach(n => {
      const current = nozzleMap.get(n.id) || { label: n.label, volume: 0 }
      current.volume += n.volume
      nozzleMap.set(n.id, current)
    })
  })
  const nozzleData = Array.from(nozzleMap.values()).sort((a,b) => b.volume - a.volume)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel" style={{ padding: '12px', fontSize: '13px' }}>
          <p className="font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color, margin: '4px 0' }}>
              {entry.name}: ₹{entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div>
      {/* Date Filter */}
      <div className="glass-panel mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Analytics Overview</h3>
          <p className="text-xs text-slate-400 mt-1">Showing data for the selected period</p>
        </div>
        <select value={days} onChange={e => setDays(Number(e.target.value))} style={{ width: '160px', background: '#334155' }}>
          <option value={7}>Last 7 Days</option>
          <option value={15}>Last 15 Days</option>
          <option value={30}>Last 30 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Sales Bar Chart */}
        <div className="glass-panel col-span-1 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
            <i className="fa-solid fa-chart-column" style={{ color: '#fbbf24' }}></i>Daily Revenue Trend
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={value => `₹${value / 1000}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                <Bar dataKey="gross" name="Gross Sales" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="cash" name="Cash Expected" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="glass-panel">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <i className="fa-solid fa-chart-pie" style={{ color: '#60a5fa' }}></i>Payment Breakdown
          </h3>
          <div style={{ width: '100%', height: '240px' }}>
            {paymentData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {paymentData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString()}`} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">No data available</div>
            )}
          </div>
        </div>

        {/* Fuel Volumes */}
        <div className="glass-panel">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <i className="fa-solid fa-gas-pump" style={{ color: '#a78bfa' }}></i>Fuel Volume Split (Litres)
          </h3>
          <div style={{ width: '100%', height: '240px' }}>
            {fuelData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={fuelData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {fuelData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => `${Number(value).toFixed(1)} L`} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Nozzle Table */}
      <div className="glass-panel">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <i className="fa-solid fa-list-ol" style={{ color: '#fb923c' }}></i>Pump / Nozzle Performance
        </h3>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 500 }}>Nozzle / Dispenser</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>Total Litres Sold</th>
              </tr>
            </thead>
            <tbody>
              {nozzleData.length === 0 ? (
                <tr><td colSpan={2} className="text-center py-4 text-slate-500">No sales recorded</td></tr>
              ) : nozzleData.map(n => (
                <tr key={n.label} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{n.label}</td>
                  <td style={{ padding: '10px 12px', color: '#fbbf24', fontWeight: 600, textAlign: 'right' }}>{n.volume.toFixed(2)} L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
