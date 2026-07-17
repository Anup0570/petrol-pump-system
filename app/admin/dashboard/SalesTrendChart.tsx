'use client'

import { format, subDays } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Entry {
  shift_date: string
  petrol_litres: number
  diesel_litres: number
}

export default function SalesTrendChart({ entries }: { entries: Entry[] }) {
  // Aggregate sales over the last 7 days
  const endDate = new Date()
  const dailyDataMap = new Map<string, { date: string; dateLabel: string; Petrol: number; Diesel: number }>()

  // Initialize Map with past 7 days (including today)
  for (let i = 6; i >= 0; i--) {
    const d = subDays(endDate, i)
    const dateStr = format(d, 'yyyy-MM-dd')
    const dateLabel = format(d, 'dd MMM')
    dailyDataMap.set(dateStr, { date: dateStr, dateLabel, Petrol: 0, Diesel: 0 })
  }

  // Populate data from entries
  entries.forEach(e => {
    if (dailyDataMap.has(e.shift_date)) {
      const current = dailyDataMap.get(e.shift_date)!
      current.Petrol += e.petrol_litres || 0
      current.Diesel += e.diesel_litres || 0
      dailyDataMap.set(e.shift_date, current)
    }
  })

  const chartData = Array.from(dailyDataMap.values())

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="dateLabel" 
            stroke="#94a3b8" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={value => `${value}L`} 
          />
          <Tooltip 
            contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#0f172a' }}
            itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
            formatter={(value: any) => [`${Number(value).toFixed(1)} L`, '']}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
          <Line 
            type="monotone" 
            dataKey="Petrol" 
            name="Petrol Sales" 
            stroke="#FF6600" 
            strokeWidth={3} 
            dot={{ r: 4, stroke: '#FF6600', strokeWidth: 2, fill: '#ffffff' }}
            activeDot={{ r: 6 }} 
          />
          <Line 
            type="monotone" 
            dataKey="Diesel" 
            name="Diesel Sales" 
            stroke="#003366" 
            strokeWidth={3} 
            dot={{ r: 4, stroke: '#003366', strokeWidth: 2, fill: '#ffffff' }}
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
