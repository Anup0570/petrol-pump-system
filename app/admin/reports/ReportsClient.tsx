'use client'

import { useState } from 'react'
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import type { FuelEntry } from '@/lib/types'
import React from 'react'

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

  // 2. Payment Breakdown (Pie Chart) - Brand-Aligned Orange, Amber, Green, Red
  const totalCash = filtered.reduce((s, e) => s + (e.counted_cash || e.expected_cash || 0), 0)
  const totalUPI = filtered.reduce((s, e) => s + (e.gpay_amount || 0), 0)
  const totalCard = filtered.reduce((s, e) => s + (e.card_amount || 0), 0)
  const totalCredit = filtered.reduce((s, e) => s + (e.credit_given || []).reduce((cs, c) => cs + c.amt, 0), 0)

  const paymentData = [
    { name: 'Cash', value: totalCash, color: '#10b981' },        // Success green
    { name: 'UPI/GPay', value: totalUPI, color: '#ff6a00' },     // Brand Orange
    { name: 'Card', value: totalCard, color: '#d97706' },        // Deep Amber
    { name: 'Credit Given', value: totalCredit, color: '#ef4444' }, // Danger Red
  ].filter(d => d.value > 0)

  // 3. Fuel Volume Breakdown (Pie Chart) - Petrol Orange, Diesel Deep Amber
  const totalPetrol = filtered.reduce((s, e) => s + (e.petrol_litres || 0), 0)
  const totalDiesel = filtered.reduce((s, e) => s + (e.diesel_litres || 0), 0)

  const fuelData = [
    { name: 'Petrol', value: totalPetrol, color: '#ff6a00' },
    { name: 'Diesel', value: totalDiesel, color: '#d97706' },
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
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-md text-slate-800 text-xs">
          <p className="font-bold mb-2 text-slate-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.fill || entry.color }} className="font-semibold my-1">
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
      <div className="glass-panel mb-6 flex items-center justify-between bg-white border border-slate-200 shadow-sm p-6 rounded-2xl">
        <div>
          <h3 className="font-extrabold text-slate-800 text-base tracking-tight">Analytics Overview</h3>
          <p className="text-xs text-slate-400 mt-1">Operational sales intelligence reporting</p>
        </div>
        <select 
          value={days} 
          onChange={e => setDays(Number(e.target.value))} 
          className="w-40 cursor-pointer bg-white border border-slate-200 text-slate-800 rounded-xl focus:border-[#ff6a00] text-xs font-bold py-2 px-3"
        >
          <option value={7}>Last 7 Days</option>
          <option value={15}>Last 15 Days</option>
          <option value={30}>Last 30 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Sales Bar Chart */}
        <div className="glass-panel bg-white border border-slate-200 shadow-sm p-6 rounded-2xl col-span-1 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
            <i className="fa-solid fa-chart-column text-[#ff6a00]"></i>Daily Revenue Trend
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={value => `₹${value / 1000}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '12px' }} />
                <Bar dataKey="gross" name="Gross Sales" fill="#ff6a00" radius={[4, 4, 0, 0]} maxBarSize={45} />
                <Bar dataKey="cash" name="Cash Expected" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="glass-panel bg-white border border-slate-200 shadow-sm p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-chart-pie text-[#ff6a00]"></i>Payment Breakdown
          </h3>
          <div style={{ width: '100%', height: '240px' }}>
            {paymentData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                    {paymentData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => `₹${Number(value).toLocaleString()}`} 
                    contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                    itemStyle={{ color: '#0f172a', fontWeight: 600, fontSize: '12px' }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No payment data recorded.</div>
            )}
          </div>
        </div>

        {/* Fuel Volumes */}
        <div className="glass-panel bg-white border border-slate-200 shadow-sm p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-gas-pump text-[#ff6a00]"></i>Fuel Volume Split (Litres)
          </h3>
          <div style={{ width: '100%', height: '240px' }}>
            {fuelData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={fuelData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                    {fuelData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => `${Number(value).toFixed(1)} L`} 
                    contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                    itemStyle={{ color: '#0f172a', fontWeight: 600, fontSize: '12px' }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No volume data recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* Nozzle Table */}
      <div className="glass-panel bg-white border border-slate-200 shadow-sm p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-list-ol text-[#ff6a00]"></i>Pump / Nozzle Performance
        </h3>
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3.5 text-left text-slate-500 font-bold uppercase tracking-wider text-[9px]">Nozzle / Dispenser</th>
                <th className="px-4 py-3.5 text-right text-slate-500 font-bold uppercase tracking-wider text-[9px]">Total Litres Sold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {nozzleData.length === 0 ? (
                <tr><td colSpan={2} className="text-center py-4 text-slate-400">No nozzle sales recorded.</td></tr>
              ) : nozzleData.map(n => (
                <tr key={n.label} className="enhanced-row">
                  <td className="px-4 py-4 text-slate-800 font-bold">{n.label}</td>
                  <td className="px-4 py-4 text-[#ff6a00] font-black text-right">{n.volume.toFixed(2)} L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
