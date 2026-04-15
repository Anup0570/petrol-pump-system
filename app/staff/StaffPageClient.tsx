'use client'

import { useState, useCallback, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { logout } from '@/app/login/actions'
import type { NozzleReading, CreditItem, Denomination } from '@/lib/types'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { containerVariants, itemVariants, pageFadeIn, magneticHover, ambientPulse } from '@/lib/motion'

const NOZZLES: Omit<NozzleReading, 'close' | 'volume'>[] = [
  { id: 'p1n1', label: 'Nozzle 1 (P1)', fuelType: 'petrol', open: 0 },
  { id: 'p1n2', label: 'Nozzle 2 (P1)', fuelType: 'diesel', open: 0 },
  { id: 'p2n3', label: 'Nozzle 3 (P2)', fuelType: 'petrol', open: 0 },
  { id: 'p2n4', label: 'Nozzle 4 (P2)', fuelType: 'diesel', open: 0 },
  { id: 'oil', label: 'Dispenser', fuelType: 'oil', open: 0 },
]

const DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1] as const

interface StaffPageClientProps {
  staffNames: string[]
  initialOpenings: Record<string, number>
}

export default function StaffPageClient({ staffNames, initialOpenings }: StaffPageClientProps) {

  // Form state
  const [staffName, setStaffName] = useState('')
  const [shiftType, setShiftType] = useState('Morning Shift')
  const [ratePetrol, setRatePetrol] = useState(101.53)
  const [rateDiesel, setRateDiesel] = useState(93.16)
  const [rateOil, setRateOil] = useState(400.00)
  const [closings, setClosings] = useState<Record<string, string>>({})
  const [testPerformed, setTestPerformed] = useState(true)
  const [gpay, setGpay] = useState(0)
  const [card, setCard] = useState(0)
  const [expenseAmt, setExpenseAmt] = useState(0)
  const [expenseDesc, setExpenseDesc] = useState('')
  const [creditGiven, setCreditGiven] = useState<CreditItem[]>([])
  const [creditReceived, setCreditReceived] = useState<CreditItem[]>([])
  const [cgName, setCgName] = useState('')
  const [cgAmt, setCgAmt] = useState('')
  const [crName, setCrName] = useState('')
  const [crAmt, setCrAmt] = useState('')
  const [denoms, setDenoms] = useState<Record<number, number>>(Object.fromEntries(DENOMINATIONS.map(d => [d, 0])))
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [shiftDate, setShiftDate] = useState<string>('')

  useEffect(() => {
    const tzOffsetMs = new Date().getTimezoneOffset() * 60000
    const localISO = new Date(Date.now() - tzOffsetMs).toISOString().slice(0, 16)
    setShiftDate(localISO)
  }, [])

  // Openings from DB (or fallback)
  const openings = { ...initialOpenings }

  // Calculations
  const getPrice = (type: string) =>
    type === 'petrol' ? ratePetrol : type === 'diesel' ? rateDiesel : rateOil

  const nozzleCalcs = NOZZLES.map(n => {
    const open = openings[n.id] ?? 0
    const closeStr = closings[n.id] ?? ''
    const close = closeStr === '' ? open : parseFloat(closeStr)
    const volume = !isNaN(close) && close >= open ? close - open : 0
    return { ...n, open, close, volume, value: volume * getPrice(n.fuelType) }
  })

  const grossSales = nozzleCalcs.reduce((s, n) => s + n.value, 0)
  const testCost = testPerformed && grossSales > 0 ? 10 * ratePetrol + 10 * rateDiesel : 0
  const preDeductRevenue = Math.max(0, grossSales - testCost)
  const totalCreditGiven = creditGiven.reduce((s, c) => s + c.amt, 0)
  const totalCreditReceived = creditReceived.reduce((s, c) => s + c.amt, 0)
  const digitalTotal = gpay + card
  const totalDeductions = digitalTotal + totalCreditGiven + expenseAmt
  const expectedCash = Math.max(0, preDeductRevenue - totalDeductions + totalCreditReceived)
  const countedCash = DENOMINATIONS.reduce((s, d) => s + (denoms[d] || 0) * d, 0)
  const difference = countedCash - expectedCash
  const petrolLitres = nozzleCalcs.filter(n => n.fuelType === 'petrol').reduce((s, n) => s + n.volume, 0)
    - (testPerformed ? 10 : 0)
  const dieselLitres = nozzleCalcs.filter(n => n.fuelType === 'diesel').reduce((s, n) => s + n.volume, 0)
    - (testPerformed ? 10 : 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Validate all closings filled
    if (!staffName) { alert('Please select your Staff Name.'); return }
    for (const n of NOZZLES) {
      if (!closings[n.id]) { alert(`Please enter closing reading for ${n.label}`); return }
      const open = openings[n.id] ?? 0
      if (parseFloat(closings[n.id]) < open) { alert(`Closing for ${n.label} cannot be less than opening!`); return }
    }
    if (expenseAmt > 0 && !expenseDesc.trim()) { alert('Please enter expense description.'); return }

    setSubmitting(true)

    // Calculate final inserted dates
    const finalDateStr = shiftDate || new Date().toISOString()
    const finalDateObj = new Date(finalDateStr)
    const shiftDateOnly = finalDateObj.getFullYear() + '-' + String(finalDateObj.getMonth() + 1).padStart(2, '0') + '-' + String(finalDateObj.getDate()).padStart(2, '0')

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      alert('Authentication error: You must be logged in to submit a shift.');
      setSubmitting(false);
      return;
    }
    const { data: shiftData, error } = await supabase.from('fuel_entries').insert({
      created_at: finalDateObj.toISOString(),
      shift_date: shiftDateOnly,
      shift_type: shiftType,
      staff_name: staffName,
      rate_petrol: ratePetrol,
      rate_diesel: rateDiesel,
      rate_oil: rateOil,
      nozzle_readings: nozzleCalcs.map(n => ({ id: n.id, label: n.label, fuelType: n.fuelType, open: n.open, close: n.close, volume: n.volume })),
      gpay_amount: gpay,
      card_amount: card,
      expense_amount: expenseAmt,
      expense_desc: expenseDesc,
      credit_given: creditGiven,
      credit_received: creditReceived,
      denominations: denoms,
      gross_sales: grossSales,
      expected_cash: expectedCash,
      counted_cash: countedCash,
      difference: difference,
      petrol_litres: Math.max(0, petrolLitres),
      diesel_litres: Math.max(0, dieselLitres),
      test_performed: testPerformed,
      status: 'Pending'
    }).select('id').single()

    if (error) {
      alert('Error submitting shift: ' + error.message)
      setSubmitting(false)
      return
    }

    try {
      const formattedDate = String(finalDateObj.getDate()).padStart(2, '0') + '/' + String(finalDateObj.getMonth() + 1).padStart(2, '0') + '/' + finalDateObj.getFullYear();
      const approvalLink = `${window.location.origin}/api/approve-shift?id=${shiftData?.id || ''}`;

      await fetch("https://cbpdteymzglrwfgeepys.supabase.co/functions/v1/send-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicGR0ZXltemdscndmZ2VlcHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMjI0NDYsImV4cCI6MjA4ODY5ODQ0Nn0.DrAu9xietiI1faei-tKOG8-Uh0QX8ZoHPCb5GT5iORY",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicGR0ZXltemdscndmZ2VlcHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMjI0NDYsImV4cCI6MjA4ODY5ODQ0Nn0.DrAu9xietiI1faei-tKOG8-Uh0QX8ZoHPCb5GT5iORY"
        },
        body: JSON.stringify({
          message: `⛽ SHIFT SUBMITTED\n\n👤 Staff: ${staffName}\n\n📅 Date: ${formattedDate}\n\n⛽ Petrol Sold: ${Math.max(0, petrolLitres).toFixed(2)} L\n⛽ Diesel Sold: ${Math.max(0, dieselLitres).toFixed(2)} L\n\n💰 Expected Cash: ₹${expectedCash.toFixed(2)}\n💵 Collected Cash: ₹${countedCash.toFixed(2)}\n📊 Difference: ₹${difference.toFixed(2)}\n\n✅ Approve Shift:\n${approvalLink}`
        })
      });
    } catch (waErr) {
      console.error('WhatsApp App API call failed:', waErr);
    }

    // Update tank inventory
    try {
      await supabase.rpc('decrement_tank', { fuel: 'petrol', litres: Math.max(0, petrolLitres) })
      await supabase.rpc('decrement_tank', { fuel: 'diesel', litres: Math.max(0, dieselLitres) })
    } catch (err) {
      console.error('Failed to decrement tank', err)
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <motion.div 
        variants={pageFadeIn}
        initial="hidden"
        animate="show"
        className="min-h-screen flex items-center justify-center p-4"
      >
        <div className="text-center w-full max-w-md">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 relative border border-emerald-500/30"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(4,120,87,0.1))' }}>
            <div className="absolute inset-0 rounded-[2rem] shadow-[0_0_40px_rgba(16,185,129,0.4)] pointer-events-none"></div>
            <i className="fa-solid fa-check text-4xl text-emerald-400"></i>
          </motion.div>
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Shift Secured</h2>
          <p className="text-zinc-400 font-medium tracking-wide">Ledger updated • Awaiting Manager Signature</p>
          
          <motion.div variants={itemVariants} className="glass-panel mt-8 p-6 text-left relative overflow-hidden">
             <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
            <div className="flex justify-between mb-4">
               <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Expected Vault</span>
              <span className="font-bold text-white tracking-tight">₹{expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Counted Vault</span>
              <span className="font-bold text-white tracking-tight">₹{countedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between pt-4 border-t border-white/5">
              <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Discrepancy</span>
              <span className={`font-black text-xl tracking-tighter ${difference === 0 ? 'text-emerald-400' : difference > 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                {difference >= 0 ? '+' : ''}₹{difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </motion.div>
          
          <motion.button
            whileHover={magneticHover}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setSubmitted(false); setClosings({}); setGpay(0); setCard(0); setExpenseAmt(0); setExpenseDesc(''); setCreditGiven([]); setCreditReceived([]); setDenoms(Object.fromEntries(DENOMINATIONS.map(d => [d, 0]))); setSubmitting(false); }}
            className="mt-8 px-8 py-4 rounded-xl btn-primary shadow-[0_0_20px_rgba(59,130,246,0.2)] w-full uppercase tracking-widest text-sm"
          >
            <i className="fa-solid fa-rotate-right mr-2"></i> Initialize Next Shift
          </motion.button>
        </div>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Config Panel */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        
        <motion.div variants={itemVariants} className="glass-panel mb-6 border-l-2 border-l-blue-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="w-full">
              <label className="block text-xs font-bold mb-2 text-zinc-500 uppercase tracking-widest">Shift Protocol</label>
              <select value={shiftType} onChange={e => setShiftType(e.target.value)} className="w-full cursor-pointer focus:ring-1 focus:ring-blue-500/50">
                <option>Morning Shift</option>
                <option>Night Shift</option>
              </select>
            </div>
            <div className="w-full">
              <label className="block text-xs font-bold mb-2 text-zinc-500 uppercase tracking-widest">Operator Identity</label>
              <select required value={staffName} onChange={e => setStaffName(e.target.value)} className="w-full cursor-pointer focus:ring-1 focus:ring-blue-500/50">
                <option value="" disabled>Select Operator...</option>
                {staffNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="block text-xs font-bold mb-2 text-zinc-500 uppercase tracking-widest">Timestamp</label>
              <input type="datetime-local" value={shiftDate} onChange={e => setShiftDate(e.target.value)} required className="w-full cursor-text" />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Fuel Rates */}
            <motion.div variants={itemVariants} className="glass-panel">
              <h3 className="text-sm font-bold flex items-center gap-3 mb-6 text-white tracking-widest uppercase">
                <i className="fa-solid fa-tags text-zinc-500"></i>
                Exchange Rates (₹/L)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-orange-500/5 p-3 rounded-xl border border-orange-500/20">
                  <label className="block text-[10px] font-bold mb-2 text-orange-400 uppercase tracking-widest">Petrol</label>
                  <PaymentInput step="0.01" value={ratePetrol} onChange={setRatePetrol} className="bg-transparent border-none p-0 text-xl font-bold text-white focus:ring-0 shadow-none h-auto" />
                </div>
                <div className="bg-sky-500/5 p-3 rounded-xl border border-sky-500/20">
                  <label className="block text-[10px] font-bold mb-2 text-sky-400 uppercase tracking-widest">Diesel</label>
                  <PaymentInput step="0.01" value={rateDiesel} onChange={setRateDiesel} className="bg-transparent border-none p-0 text-xl font-bold text-white focus:ring-0 shadow-none h-auto" />
                </div>
                <div className="bg-purple-500/5 p-3 rounded-xl border border-purple-500/20">
                  <label className="block text-[10px] font-bold mb-2 text-purple-400 uppercase tracking-widest">2T Oil</label>
                  <PaymentInput step="0.01" value={rateOil} onChange={setRateOil} className="bg-transparent border-none p-0 text-xl font-bold text-white focus:ring-0 shadow-none h-auto" />
                </div>
              </div>
            </motion.div>

            {/* Pump 1 */}
            <motion.div variants={itemVariants}>
              <PumpTable pump="01" nozzles={nozzleCalcs.slice(0, 2)} closings={closings} setClosings={setClosings} />
            </motion.div>
            {/* Pump 2 */}
            <motion.div variants={itemVariants}>
              <PumpTable pump="02" nozzles={nozzleCalcs.slice(2, 4)} closings={closings} setClosings={setClosings} />
            </motion.div>
            {/* 2T Oil */}
            <motion.div variants={itemVariants} className="glass-panel overflow-hidden border-t-2 border-t-purple-500 pt-0 px-0 pb-0">
               <div className="p-4 border-b border-white/5 bg-purple-500/5 flex items-center justify-between">
                 <h3 className="text-sm font-bold flex items-center gap-3 text-white tracking-widest uppercase">
                   <div className="w-8 h-8 rounded-lg bg-black border border-white/10 flex items-center justify-center">
                      <i className="fa-solid fa-oil-can text-purple-400"></i>
                   </div>
                   2T Oil Dispenser
                 </h3>
               </div>
              <div className="overflow-x-auto p-4">
                <table className="w-full text-[13px] border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Nozzle', 'Fuel', 'Opening', 'Closing'].map(h => (
                        <th key={h} className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] py-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <NozzleRow nozzle={nozzleCalcs[4]} closings={closings} setClosings={setClosings} />
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            
            {/* Live Calculation Display (Sticky-ish logic header) */}
            <motion.div variants={itemVariants} className="glass-panel border-r-2 border-r-blue-500 p-6 flex flex-col justify-center shadow-[inset_0_4px_24px_rgba(0,0,0,0.5)]">
               <div className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Live Telemetry</div>
               <div className="flex justify-between items-end">
                 <div className="text-zinc-300 font-medium">Expected Vault Balance</div>
                 <motion.div 
                    key={expectedCash}
                    variants={ambientPulse}
                    animate="animate"
                    className="text-4xl font-black text-white tracking-tighter"
                  >
                   ₹{expectedCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                 </motion.div>
               </div>
            </motion.div>

            {/* Morning Test Toggle */}
            <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '16px 24px' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                     <i className="fa-solid fa-vial text-orange-400"></i>
                   </div>
                   <div>
                     <h3 className="text-[13px] font-bold text-white tracking-wide">Morning Test Performed?</h3>
                     <p className="text-[11px] mt-0.5 text-zinc-500 font-medium tracking-wide">Deducts 10L Petrol + 10L Diesel</p>
                   </div>
                </div>
                <label className="toggle-switch transform scale-110">
                  <input type="checkbox" checked={testPerformed} onChange={e => setTestPerformed(e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </motion.div>

            {/* Digital Payments */}
            <motion.div variants={itemVariants} className="glass-panel">
              <h3 className="text-sm font-bold flex items-center gap-3 mb-6 text-white tracking-widest uppercase">
                <i className="fa-solid fa-wifi text-sky-400"></i>Digital Ledger
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group">
                  <label className="text-xs font-bold sm:w-40 shrink-0 text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors flex items-center gap-2">
                    <i className="fa-brands fa-google-pay text-lg"></i> UPI Network
                  </label>
                  <PaymentInput value={gpay} onChange={setGpay} className="focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-black/40" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group">
                  <label className="text-xs font-bold sm:w-40 shrink-0 text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors flex items-center gap-2">
                    <i className="fa-regular fa-credit-card"></i> POS Swipes
                  </label>
                  <PaymentInput value={card} onChange={setCard} className="focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-black/40" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group border-t border-white/5 pt-4 mt-2">
                  <label className="text-xs font-bold sm:w-40 shrink-0 text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors flex items-center gap-2">
                    <i className="fa-solid fa-receipt"></i> Operations Exp.
                  </label>
                  <PaymentInput value={expenseAmt} onChange={setExpenseAmt} className="focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-black/40" />
                </div>
                <AnimatePresence>
                  {expenseAmt > 0 && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: "auto", opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="origin-top"
                    >
                      <input type="text" value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)}
                        placeholder="Expense justification (e.g. Server maintenance, Tea)" className="bg-black/60 border-dashed border-zinc-600 focus:border-zinc-400 text-sm" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Credit Management */}
            <motion.div variants={itemVariants} className="glass-panel">
              <h3 className="text-sm font-bold flex items-center gap-3 mb-6 text-white tracking-widest uppercase">
                <i className="fa-solid fa-file-contract text-rose-400"></i>Credit Protocols
              </h3>
              <CreditSection type="given" label="Credit Issued"
                items={creditGiven} setItems={setCreditGiven}
                nameVal={cgName} setName={setCgName} amtVal={cgAmt} setAmt={setCgAmt} />
              <div className="mt-6">
                <CreditSection type="received" label="Credit Recovered"
                  items={creditReceived} setItems={setCreditReceived}
                  nameVal={crName} setName={setCrName} amtVal={crAmt} setAmt={setCrAmt} />
              </div>
            </motion.div>

            {/* Cash Denominations */}
            <motion.div variants={itemVariants} className="glass-panel">
              <h3 className="text-sm font-bold flex items-center gap-3 mb-6 text-white tracking-widest uppercase">
                <i className="fa-solid fa-wallet text-emerald-400"></i>Physical Vault Count
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {DENOMINATIONS.map((d, i) => (
                  <motion.div key={d} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-2 bg-black/30 p-2 rounded-xl border border-white/5">
                    <div className="w-10 h-8 rounded shrink-0 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[11px] font-bold text-emerald-400">
                      ₹{d}
                    </div>
                    <PaymentInput inputMode="numeric" value={denoms[d] || 0}
                      onChange={val => setDenoms(prev => ({ ...prev, [d]: val }))} className="h-8 !px-2 bg-transparent border-none text-center hover:bg-white/5 focus:bg-white/10" />
                    <div className="text-[11px] w-16 text-right font-bold shrink-0 text-zinc-400">
                      = ₹{((denoms[d] || 0) * d).toLocaleString()}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="p-4 rounded-xl bg-black border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] flex justify-between items-center">
                <span className="font-bold text-zinc-400 uppercase tracking-widest text-[11px]">Total Sum</span>
                <motion.span key={countedCash} initial={{ scale: 1.1, color: '#fff' }} animate={{ scale: 1, color: '#34d399' }} className="text-2xl font-black text-emerald-400">₹{countedCash.toLocaleString()}</motion.span>
              </div>
            </motion.div>

            {/* Reconciliation */}
            <motion.div variants={itemVariants} className="glass-panel relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <i className="fa-solid fa-scale-balanced text-9xl"></i>
              </div>
              <h2 className="text-lg font-bold mb-6 text-white tracking-tight relative z-10">Reconciliation Matrix</h2>
              
              <div className="space-y-3 text-[13px] relative z-10 mb-6 font-medium">
                <ReconcRow label="Gross Dispatch Value" value={`₹${grossSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
                {testPerformed && <ReconcRow label="Calibration Deduction (-)" value={`₹${testCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} valueColor="#ef4444" />}
                <ReconcRow label="Digital Transfer (-)" value={`₹${digitalTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} valueColor="#ef4444" />
                <ReconcRow label="Credit Issued (-)" value={`₹${totalCreditGiven.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} valueColor="#ef4444" />
                <ReconcRow label="Operational Expenses (-)" value={`₹${expenseAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} valueColor="#ef4444" />
                <ReconcRow label="Credit Recovered (+)" value={`₹${totalCreditReceived.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} valueColor="#34d399" />
              </div>
              
              <div className="h-px w-full bg-white/10 mb-6 relative z-10"></div>
              
              <div className={`p-5 rounded-2xl mb-8 relative z-10 border transition-colors duration-500 shadow-xl ${difference === 0 ? 'bg-emerald-500/10 border-emerald-500/30' : difference > 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Net Discrepancy</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{difference === 0 ? 'Optimal' : difference > 0 ? 'Surplus' : 'Deficit'}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-semibold text-white">Counted - Expected</span>
                  <span className={`text-2xl font-black tracking-tighter ${difference === 0 ? 'text-emerald-400' : difference > 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                    {difference >= 0 ? '+' : ''}₹{difference.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <motion.button type="submit" disabled={submitting}
                whileHover={!submitting ? magneticHover : {}}
                whileTap={!submitting ? { scale: 0.98 } : {}}
                className={`w-full py-5 text-[15px] transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] tracking-widest uppercase ${submitting ? '' : 'btn-primary'}`}
                style={submitting ? { background: '#1c1c21', color: '#71717a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'not-allowed' } : {}}>
                {submitting ? (
                  <><i className="fa-solid fa-spinner fa-spin mr-3"></i>Committing to Ledger...</>
                ) : (
                  <><i className="fa-solid fa-microchip mr-3"></i>Commit Operations</>
                )}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </form>
  )
}

// Sub-components
function PumpTable({ pump, nozzles, closings, setClosings }: {
  pump: string
  nozzles: any[]
  closings: Record<string, string>
  setClosings: React.Dispatch<React.SetStateAction<Record<string, string>>>
}) {
  return (
    <div className="glass-panel overflow-hidden pt-0 px-0 pb-0">
      <div className="p-4 border-b border-white/5 bg-blue-500/5 flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-3 text-white tracking-widest uppercase">
          <div className="w-8 h-8 rounded-lg bg-black border border-white/10 flex items-center justify-center">
             <i className="fa-solid fa-gas-pump text-blue-500"></i>
          </div>
          Terminal {pump}
        </h3>
      </div>
      <div className="overflow-x-auto p-4">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {['Nozzle', 'Fuel', 'Opening', 'Closing'].map(h => (
                <th key={h} className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nozzles.map(n => <NozzleRow key={n.id} nozzle={n} closings={closings} setClosings={setClosings} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function NozzleRow({ nozzle, closings, setClosings }: {
  nozzle: any
  closings: Record<string, string>
  setClosings: React.Dispatch<React.SetStateAction<Record<string, string>>>
}) {
  const badgeClass = nozzle.fuelType === 'petrol' ? 'petrol-badge' : nozzle.fuelType === 'diesel' ? 'diesel-badge' : 'oil-badge'
  const accentBorderColor = nozzle.fuelType === 'petrol' ? 'rgba(249, 115, 22, 0.4)' : nozzle.fuelType === 'diesel' ? 'rgba(14, 165, 233, 0.4)' : 'rgba(139, 92, 246, 0.4)'

  return (
    <tr className="enhanced-row" style={{ borderLeft: `2px solid ${accentBorderColor}` }}>
      <td style={{ padding: '16px 12px', color: 'white', fontWeight: 600 }}>{nozzle.label}</td>
      <td style={{ padding: '16px 12px' }}><span className={`badge ${badgeClass}`}>{nozzle.fuelType.charAt(0).toUpperCase() + nozzle.fuelType.slice(1)}</span></td>
      <td style={{ padding: '16px 12px' }}><input type="number" value={nozzle.open.toFixed(2)} readOnly className="w-24 bg-transparent border-dashed border-white/10" /></td>
      <td style={{ padding: '16px 12px' }}>
        <input type="number" step="0.01" value={closings[nozzle.id] ?? ''}
          onChange={e => setClosings(prev => ({ ...prev, [nozzle.id]: e.target.value }))}
          placeholder="0.00" className="w-28 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.3)] bg-black/50" />
        <motion.div 
           key={nozzle.volume}
           initial={{ opacity: 0, scale: 0.8, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }}
           className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2"
        >
          {nozzle.volume > 0 && <span className="text-emerald-400">+{nozzle.volume.toFixed(2)} Vol</span>}
        </motion.div>
      </td>
    </tr>
  )
}

function CreditSection({ type, label, items, setItems, nameVal, setName, amtVal, setAmt }: {
  type: string; label: string;
  items: CreditItem[]; setItems: React.Dispatch<React.SetStateAction<CreditItem[]>>
  nameVal: string; setName: (v: string) => void
  amtVal: string; setAmt: (v: string) => void
}) {
  function add() {
    const amt = parseFloat(amtVal)
    if (!nameVal.trim() || isNaN(amt) || amt <= 0) { alert('Enter valid name and amount'); return }
    setItems(prev => [...prev, { name: nameVal.trim(), amt }])
    setName(''); setAmt('')
  }

  const cardClass = type === 'given' ? 'credit-given-card' : 'credit-received-card';
  const color = type === 'given' ? '#ef4444' : '#10b981';

  return (
    <div className={cardClass}>
      <h4 className="text-[13px] font-bold mb-1 tracking-wide uppercase" style={{ color }}>{label}</h4>
      <p className="text-[10px] mb-5 text-zinc-500 font-medium uppercase tracking-widest">{type === 'given' ? 'Deducts from Expected Vault' : 'Adds to Expected Vault'}</p>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input type="text" placeholder="Identifier / License Plate" value={nameVal} onChange={e => setName(e.target.value)}
          className="w-full text-sm bg-black/40" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} />
        <input type="number" placeholder="Value (₹)" value={amtVal} onChange={e => setAmt(e.target.value)}
          className="w-full sm:w-32 text-sm bg-black/40" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} />
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={add} className="btn-primary w-full sm:w-auto px-6 py-2 shadow-none border border-white/10 shrink-0">
           <i className="fa-solid fa-plus"></i> Add
        </motion.button>
      </div>
      <ul className="space-y-2">
        <AnimatePresence>
          {items.map((item, i) => (
            <motion.li 
              key={i} 
              initial={{ opacity: 0, height: 0, scale: 0.95 }} 
              animate={{ opacity: 1, height: 'auto', scale: 1 }} 
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="flex justify-between items-center py-2 px-3 text-sm bg-black/30 border border-white/5 rounded-xl"
            >
              <span className="text-zinc-300 font-semibold">{item.name}</span>
              <span className="font-bold flex items-center gap-3" style={{ color }}>
                ₹{item.amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                <button type="button" onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                  className="text-zinc-500 hover:text-red-500 transition-colors w-6 h-6 flex items-center justify-center bg-white/5 rounded hover:bg-red-500/20"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {items.length > 0 && (
        <div className="text-right text-[11px] font-black uppercase tracking-widest mt-4 pt-4 border-t border-white/5" style={{ color }}>
          Aggregate: ₹{items.reduce((s, c) => s + c.amt, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      )}
    </div>
  )
}

function ReconcRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between py-1.5 px-3 rounded-lg hover:bg-white/5 transition-colors">
      <span className="text-zinc-400">{label}</span>
      <span className="font-bold tracking-tight" style={{ color: valueColor || '#fafafa' }}>{value}</span>
    </div>
  )
}

function PaymentInput({
  value,
  onChange,
  className,
  style,
  inputMode,
  step
}: {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  style?: React.CSSProperties;
  inputMode?: "numeric" | "text" | "decimal" | "none" | "tel" | "search" | "email" | "url";
  step?: string | number;
}) {
  const [localValue, setLocalValue] = useState<string>(value.toString());

  useEffect(() => {
    setLocalValue((prev) => {
      let parsedLocal = prev === '' ? 0 : parseFloat(prev);
      if (isNaN(parsedLocal)) parsedLocal = 0;
      if (value !== parsedLocal) {
        return value.toString();
      }
      return prev;
    });
  }, [value]);

  return (
    <input
      type="number"
      min="0"
      step={step}
      inputMode={inputMode}
      className={className}
      style={style}
      value={localValue}
      onFocus={() => {
        if (localValue === '0') setLocalValue('');
      }}
      onBlur={() => {
        if (localValue === '') {
          setLocalValue('0');
          onChange(0);
        }
      }}
      onChange={(e) => {
        let val = e.target.value;
        if (/^0+(?=\d)/.test(val)) {
          val = val.replace(/^0+(?=\d)/, '');
        }
        setLocalValue(val);
        const parsed = val === '' ? 0 : parseFloat(val);
        onChange(isNaN(parsed) ? 0 : parsed);
      }}
    />
  );
}
