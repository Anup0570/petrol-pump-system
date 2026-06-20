'use client'

import { useState, useCallback, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { logout } from '@/app/login/actions'
import type { NozzleReading, CreditItem, Denomination } from '@/lib/types'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { containerVariants, itemVariants, pageFadeIn, magneticHover, ambientPulse, buttonHover } from '@/lib/motion'

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
  const [ratePetrol, setRatePetrol] = useState(0)
  const [rateDiesel, setRateDiesel] = useState(0)
  const [rateOil, setRateOil] = useState(0)
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

  // Openings from DB
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
    if (!staffName) { alert('Please select your Staff Name.'); return }
    if (ratePetrol <= 0) { alert('Validation Error: Petrol rate must be greater than 0.'); return }
    if (rateDiesel <= 0) { alert('Validation Error: Diesel rate must be greater than 0.'); return }
    if (rateOil <= 0) { alert('Validation Error: 2T Oil rate must be greater than 0.'); return }
    for (const n of NOZZLES) {
      if (!closings[n.id]) { alert(`Please enter closing reading for ${n.label}`); return }
      const open = openings[n.id] ?? 0
      if (parseFloat(closings[n.id]) < open) { alert(`Closing for ${n.label} cannot be less than opening!`); return }
    }
    if (expenseAmt > 0 && !expenseDesc.trim()) { alert('Please enter expense description.'); return }

    setSubmitting(true)

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
        className="min-h-[70vh] flex items-center justify-center p-4 bg-transparent"
      >
        <div className="text-center w-full max-w-md bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 relative border border-emerald-200 bg-emerald-50"
          >
            <i className="fa-solid fa-check text-3xl text-emerald-600"></i>
          </motion.div>
          <h2 className="text-2xl font-black text-slate-800 mb-1.5 tracking-tight">Shift Submitted</h2>
          <p className="text-slate-500 font-medium text-sm">Operation record generated • Pending approval</p>
          
          <motion.div variants={itemVariants} className="bg-slate-50 border border-slate-200 mt-6 p-6 rounded-xl text-left relative overflow-hidden">
            <div className="flex justify-between mb-4">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Expected Vault</span>
              <span className="font-extrabold text-slate-800 tracking-tight">₹{expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Counted Vault</span>
              <span className="font-extrabold text-slate-800 tracking-tight">₹{countedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between pt-4 border-t border-slate-200">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Discrepancy</span>
              <span className={`font-black text-lg tracking-tight ${difference === 0 ? 'text-emerald-600' : difference > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                {difference >= 0 ? '+' : ''}₹{difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </motion.div>
          
          <motion.button
            whileHover={magneticHover}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setSubmitted(false); setClosings({}); setGpay(0); setCard(0); setExpenseAmt(0); setExpenseDesc(''); setCreditGiven([]); setCreditReceived([]); setDenoms(Object.fromEntries(DENOMINATIONS.map(d => [d, 0]))); setSubmitting(false); setRatePetrol(0); setRateDiesel(0); setRateOil(0); }}
            className="mt-6 px-6 py-3.5 btn-primary w-full uppercase tracking-wider text-xs font-bold cursor-pointer"
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
        
        <motion.div variants={itemVariants} className="glass-panel mb-6 border-l-3 border-l-[#ff6a00] bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="w-full">
              <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Shift Protocol</label>
              <select value={shiftType} onChange={e => setShiftType(e.target.value)} className="w-full cursor-pointer bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00]">
                <option>Morning Shift</option>
                <option>Night Shift</option>
              </select>
            </div>
            <div className="w-full">
              <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Operator Identity</label>
              <select required value={staffName} onChange={e => setStaffName(e.target.value)} className="w-full cursor-pointer bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00]">
                <option value="" disabled>Select Operator...</option>
                {staffNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Timestamp</label>
              <input type="datetime-local" value={shiftDate} onChange={e => setShiftDate(e.target.value)} required className="w-full bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00]" />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Fuel Rates */}
            <motion.div variants={itemVariants} className="glass-panel bg-white">
              <h3 className="text-xs font-bold flex items-center gap-3.5 mb-6 text-slate-800 tracking-widest uppercase">
                <i className="fa-solid fa-tags text-[#ff6a00]"></i>
                Exchange Rates (₹/L)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-orange-50/50 p-3.5 rounded-xl border border-orange-100/80">
                  <label className="block text-[10px] font-bold mb-2 text-[#cc5200] uppercase tracking-widest">Petrol</label>
                  <PaymentInput step="0.01" value={ratePetrol} onChange={setRatePetrol} className="bg-transparent border-none p-0 text-xl font-black text-slate-800 focus:ring-0 shadow-none h-auto" />
                </div>
                <div className="bg-sky-50/50 p-3.5 rounded-xl border border-sky-100/80">
                  <label className="block text-[10px] font-bold mb-2 text-[#0369a1] uppercase tracking-widest">Diesel</label>
                  <PaymentInput step="0.01" value={rateDiesel} onChange={setRateDiesel} className="bg-transparent border-none p-0 text-xl font-black text-slate-800 focus:ring-0 shadow-none h-auto" />
                </div>
                <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100/80">
                  <label className="block text-[10px] font-bold mb-2 text-[#7e22ce] uppercase tracking-widest">2T Oil</label>
                  <PaymentInput step="0.01" value={rateOil} onChange={setRateOil} className="bg-transparent border-none p-0 text-xl font-black text-slate-800 focus:ring-0 shadow-none h-auto" />
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
            <motion.div variants={itemVariants} className="glass-panel bg-white overflow-hidden border-t-3 border-t-purple-500 pt-0 px-0 pb-0">
               <div className="p-4 border-b border-slate-100 bg-purple-50/40 flex items-center justify-between">
                 <h3 className="text-xs font-bold flex items-center gap-3 text-slate-800 tracking-widest uppercase">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                       <i className="fa-solid fa-oil-can text-purple-600"></i>
                    </div>
                    2T Oil Dispenser
                 </h3>
               </div>
              <div className="overflow-x-auto p-4 bg-white">
                <table className="w-full text-[13px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Nozzle', 'Fuel', 'Opening', 'Closing'].map(h => (
                        <th key={h} className="text-slate-400 font-bold uppercase tracking-widest text-[9px] py-3.5 text-left">{h}</th>
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
            
            {/* Live Calculation Display */}
            <motion.div variants={itemVariants} className="glass-panel border-r-3 border-r-[#ff6a00] p-6 flex flex-col justify-center bg-white shadow-sm">
               <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Telemetry Aggregate</div>
               <div className="flex justify-between items-end">
                 <div className="text-slate-600 font-semibold text-sm">Expected Vault Balance</div>
                 <motion.div 
                    key={expectedCash}
                    variants={ambientPulse}
                    animate="animate"
                    className="text-4xl font-black text-slate-800 tracking-tight"
                  >
                   ₹{expectedCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                 </motion.div>
               </div>
            </motion.div>

            {/* Calibration Test Toggle */}
            <motion.div variants={itemVariants} className="glass-panel bg-white" style={{ padding: '16px 24px' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                     <i className="fa-solid fa-vial text-[#ff6a00]"></i>
                   </div>
                   <div>
                     <h3 className="text-[13px] font-bold text-slate-700 tracking-wide">Calibration Test Performed?</h3>
                     <p className="text-[11px] mt-0.5 text-slate-400 font-medium">Deducts 10L Petrol + 10L Diesel</p>
                   </div>
                </div>
                <label className="toggle-switch transform scale-110">
                  <input type="checkbox" checked={testPerformed} onChange={e => setTestPerformed(e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </motion.div>

            {/* Digital Payments */}
            <motion.div variants={itemVariants} className="glass-panel bg-white">
              <h3 className="text-xs font-bold flex items-center gap-3.5 mb-6 text-slate-800 tracking-widest uppercase">
                <i className="fa-solid fa-wifi text-[#0ea5e9]"></i>Digital Ledger
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group">
                  <label className="text-[10px] font-bold sm:w-40 shrink-0 text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors flex items-center gap-2">
                    <i className="fa-brands fa-google-pay text-lg"></i> UPI Network
                  </label>
                  <PaymentInput value={gpay} onChange={setGpay} className="bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00] focus:shadow-sm" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group">
                  <label className="text-[10px] font-bold sm:w-40 shrink-0 text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors flex items-center gap-2">
                    <i className="fa-regular fa-credit-card text-sm"></i> POS Swipes
                  </label>
                  <PaymentInput value={card} onChange={setCard} className="bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00] focus:shadow-sm" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group border-t border-slate-100 pt-4 mt-2">
                  <label className="text-[10px] font-bold sm:w-40 shrink-0 text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors flex items-center gap-2">
                    <i className="fa-solid fa-receipt text-sm"></i> Operational Exp.
                  </label>
                  <PaymentInput value={expenseAmt} onChange={setExpenseAmt} className="bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00] focus:shadow-sm" />
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
                        placeholder="Expense justification (e.g. Tea, Maintenance)" className="bg-white border-dashed border-slate-300 focus:border-slate-400 text-slate-800 text-sm mt-2" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Credit Management */}
            <motion.div variants={itemVariants} className="glass-panel bg-white">
              <h3 className="text-xs font-bold flex items-center gap-3.5 mb-6 text-slate-800 tracking-widest uppercase">
                <i className="fa-solid fa-file-contract text-red-500"></i>Credit Accounts
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
            <motion.div variants={itemVariants} className="glass-panel bg-white">
              <h3 className="text-xs font-bold flex items-center gap-3.5 mb-6 text-slate-800 tracking-widest uppercase">
                <i className="fa-solid fa-wallet text-emerald-500"></i>Physical Currency Count
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {DENOMINATIONS.map((d, i) => (
                  <motion.div key={d} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                    <div className="w-10 h-8 rounded shrink-0 bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[11px] font-bold text-emerald-700 shadow-sm">
                      ₹{d}
                    </div>
                    <PaymentInput inputMode="numeric" value={denoms[d] || 0}
                      onChange={val => setDenoms(prev => ({ ...prev, [d]: val }))} className="h-8 !px-2 bg-transparent border-none text-slate-800 text-center hover:bg-slate-100 focus:bg-slate-100 font-bold" />
                    <div className="text-[11px] w-16 text-right font-bold shrink-0 text-slate-500">
                      = ₹{((denoms[d] || 0) * d).toLocaleString()}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center shadow-md">
                <span className="font-bold text-slate-300 uppercase tracking-widest text-[9px]">Drawer Sum</span>
                <motion.span key={countedCash} initial={{ scale: 1.05 }} animate={{ scale: 1 }} className="text-2xl font-black text-emerald-400">₹{countedCash.toLocaleString()}</motion.span>
              </div>
            </motion.div>

            {/* Reconciliation */}
            <motion.div variants={itemVariants} className="glass-panel bg-white relative overflow-hidden">
              <h2 className="text-lg font-bold mb-6 text-slate-800 tracking-tight">Reconciliation Ledger</h2>
              
              <div className="space-y-2 text-[13px] font-medium">
                <ReconcRow label="Gross Sales Value" value={`₹${grossSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
                {testPerformed && <ReconcRow label="Calibration Deduction (-)" value={`₹${testCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} valueColor="#dc2626" />}
                <ReconcRow label="Digital Transfer (-)" value={`₹${digitalTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} valueColor="#dc2626" />
                <ReconcRow label="Credit Issued (-)" value={`₹${totalCreditGiven.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} valueColor="#dc2626" />
                <ReconcRow label="Operational Expenses (-)" value={`₹${expenseAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} valueColor="#dc2626" />
                <ReconcRow label="Credit Recovered (+)" value={`₹${totalCreditReceived.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} valueColor="#059669" />
              </div>
              
              <div className="h-px w-full bg-slate-200 my-6"></div>
              
              <div className={`p-5 rounded-2xl mb-6 border transition-all duration-300 shadow-sm ${difference === 0 ? 'bg-emerald-50 border-emerald-200' : difference > 0 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Net Balance Status</span>
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest ${difference === 0 ? 'text-emerald-700' : difference > 0 ? 'text-orange-700' : 'text-red-700'}`}>{difference === 0 ? 'Optimal' : difference > 0 ? 'Surplus' : 'Deficit'}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xs font-semibold text-slate-600">Drawer - Expectancy</span>
                  <span className={`text-2xl font-black tracking-tight ${difference === 0 ? 'text-emerald-700' : difference > 0 ? 'text-orange-700' : 'text-red-700'}`}>
                    {difference >= 0 ? '+' : ''}₹{difference.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <motion.button type="submit" disabled={submitting}
                whileHover={!submitting ? buttonHover : {}}
                whileTap={!submitting ? { scale: 0.98 } : {}}
                className={`w-full py-4 text-[13px] font-extrabold transition-all tracking-wider uppercase cursor-pointer ${submitting ? '' : 'btn-primary'}`}
                style={submitting ? { background: '#cbd5e1', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '12px', cursor: 'not-allowed' } : {}}>
                {submitting ? (
                  <><i className="fa-solid fa-spinner fa-spin mr-3"></i>Submitting shift logs...</>
                ) : (
                  <><i className="fa-solid fa-cloud-arrow-up mr-3"></i>Commit Operations</>
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
    <div className="glass-panel bg-white overflow-hidden pt-0 px-0 pb-0 shadow-sm">
      <div className="p-4 border-b border-slate-100 bg-orange-50/40 flex items-center justify-between">
        <h3 className="text-xs font-bold flex items-center gap-3 text-slate-800 tracking-widest uppercase">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
             <i className="fa-solid fa-gas-pump text-[#ff6a00]"></i>
          </div>
          Terminal Pump {pump}
        </h3>
      </div>
      <div className="overflow-x-auto p-4 bg-white">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              {['Nozzle', 'Fuel', 'Opening', 'Closing'].map(h => (
                <th key={h} className="text-slate-400 font-bold uppercase tracking-widest text-[9px] py-3.5 text-left">{h}</th>
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
  const accentBorderColor = nozzle.fuelType === 'petrol' ? 'rgba(255, 106, 0, 0.2)' : nozzle.fuelType === 'diesel' ? 'rgba(14, 165, 233, 0.2)' : 'rgba(126, 34, 206, 0.2)'

  return (
    <tr className="enhanced-row" style={{ borderLeft: `2px solid ${accentBorderColor}` }}>
      <td className="font-semibold text-slate-800" style={{ padding: '16px 12px' }}>{nozzle.label}</td>
      <td style={{ padding: '16px 12px' }}><span className={`badge ${badgeClass}`}>{nozzle.fuelType.charAt(0).toUpperCase() + nozzle.fuelType.slice(1)}</span></td>
      <td style={{ padding: '16px 12px' }}><input type="number" value={nozzle.open.toFixed(2)} readOnly className="w-24 bg-slate-50 border-dashed border-slate-200 text-slate-500 font-medium" /></td>
      <td style={{ padding: '16px 12px' }}>
        <input type="number" step="0.01" value={closings[nozzle.id] ?? ''}
          onChange={e => setClosings(prev => ({ ...prev, [nozzle.id]: e.target.value }))}
          placeholder="0.00" className="w-28 bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00]" />
        <motion.div 
           key={nozzle.volume}
           initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
           className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2"
        >
          {nozzle.volume > 0 && <span className="text-emerald-600 font-bold">+{nozzle.volume.toFixed(2)} Litres</span>}
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
      <h4 className="text-[12px] font-bold mb-1 tracking-wide uppercase" style={{ color }}>{label}</h4>
      <p className="text-[9px] mb-4 text-slate-400 font-semibold uppercase tracking-wider">{type === 'given' ? 'Deducted from Expected Vault' : 'Added to Expected Vault'}</p>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Identifier / Plate Num" value={nameVal} onChange={e => setName(e.target.value)}
          className="w-full text-sm bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00]" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} />
        <input type="number" placeholder="Value (₹)" value={amtVal} onChange={e => setAmt(e.target.value)}
          className="w-full sm:w-32 text-sm bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00]" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={add} className="btn-secondary w-full sm:w-auto px-5 py-2 shrink-0 cursor-pointer text-xs font-bold border-slate-200">
           <i className="fa-solid fa-plus text-[#ff6a00]"></i> Add
        </motion.button>
      </div>
      <ul className="space-y-2">
        <AnimatePresence>
          {items.map((item, i) => (
            <motion.li 
              key={i} 
              initial={{ opacity: 0, height: 0, scale: 0.98 }} 
              animate={{ opacity: 1, height: 'auto', scale: 1 }} 
              exit={{ opacity: 0, height: 0, scale: 0.98 }}
              className="flex justify-between items-center py-2.5 px-3 text-sm bg-slate-50 border border-slate-200/60 rounded-xl"
            >
              <span className="text-slate-600 font-semibold">{item.name}</span>
              <span className="font-bold flex items-center gap-3" style={{ color }}>
                ₹{item.amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                <button type="button" onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors w-6 h-6 flex items-center justify-center bg-slate-100 rounded border border-slate-200/50 cursor-pointer"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {items.length > 0 && (
        <div className="text-right text-[10px] font-extrabold uppercase tracking-widest mt-4 pt-4 border-t border-slate-100" style={{ color }}>
          Aggregate: ₹{items.reduce((s, c) => s + c.amt, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      )}
    </div>
  )
}

function ReconcRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
      <span className="text-slate-500 text-xs font-semibold">{label}</span>
      <span className="font-extrabold tracking-tight" style={{ color: valueColor || '#1e293b' }}>{value}</span>
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
