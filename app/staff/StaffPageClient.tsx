'use client'

import { useState, useCallback, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { logout } from '@/app/login/actions'
import type { NozzleReading, CreditItem, Denomination } from '@/lib/types'
import { motion, AnimatePresence, Variants } from 'framer-motion'

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

// Framer motion variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
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
    console.log("SESSION:", session);

    if (!session) {
      alert('Authentication error: You must be logged in to submit a shift.');
      setSubmitting(false);
      return;
    }
    console.log('Before shift insert:', { staffName, shiftDateOnly, grossSales });
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

    console.log('After shift insert, error:', error);

    if (error) {
      alert('Error submitting shift: ' + error.message)
      setSubmitting(false)
      return
    }

    console.log('Before WhatsApp call');
    try {
      const formattedDate = String(finalDateObj.getDate()).padStart(2, '0') + '/' + String(finalDateObj.getMonth() + 1).padStart(2, '0') + '/' + finalDateObj.getFullYear();
      const approvalLink = `${window.location.origin}/api/approve-shift?id=${shiftData?.id || ''}`;

      const waRes = await fetch("https://cbpdteymzglrwfgeepys.supabase.co/functions/v1/send-whatsapp", {
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
      console.log('After WhatsApp call, status:', waRes.status);
    } catch (waErr) {
      console.error('WhatsApp API call failed:', waErr);
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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <div className="text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20"
            style={{ background: 'rgba(16,185,129,0.2)', border: '2px solid #10b981' }}>
            <i className="fa-solid fa-check text-3xl" style={{ color: '#10b981' }}></i>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Shift Submitted!</h2>
          <p className="text-slate-400">The owner has been notified. Status: Pending Verification</p>
          <div className="glass-panel mt-6 p-6 text-left max-w-sm mx-auto">
            <div className="flex justify-between mb-2">
               <span className="text-slate-400">Expected Cash</span>
              <span className="font-bold text-white">₹{expectedCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-400">Counted Cash</span>
              <span className="font-bold text-white">₹{countedCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Difference</span>
              <span className={`font-bold ${difference === 0 ? 'text-green-400' : difference > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {difference >= 0 ? '+' : ''}₹{difference.toFixed(2)}
              </span>
            </div>
          </div>
          <button
            onClick={() => { setSubmitted(false); setClosings({}); setGpay(0); setCard(0); setExpenseAmt(0); setExpenseDesc(''); setCreditGiven([]); setCreditReceived([]); setDenoms(Object.fromEntries(DENOMINATIONS.map(d => [d, 0]))); }}
            className="mt-6 px-8 py-3 rounded-xl btn-primary shadow-xl shadow-blue-500/20"
          >
            <i className="fa-solid fa-plus mr-2"></i>Start New Shift
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Config Panel */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants} className="glass-panel mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="w-full">
              <label className="block text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">Shift Type</label>
              <select value={shiftType} onChange={e => setShiftType(e.target.value)} className="w-full">
                <option>Morning Shift</option>
                <option>Night Shift</option>
              </select>
            </div>
            <div className="w-full">
              <label className="block text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">Staff Name</label>
              <select required value={staffName} onChange={e => setStaffName(e.target.value)} className="w-full">
                <option value="" disabled>Select Staff Name...</option>
                {staffNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="block text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">Date & Time</label>
              <input type="datetime-local" value={shiftDate} onChange={e => setShiftDate(e.target.value)} required className="w-full" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Fuel Rates */}
            <motion.div variants={itemVariants} className="glass-panel">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 text-white">
                <i className="fa-solid fa-tag" style={{ color: '#fbbf24' }}></i>
                Today's Fuel Rates (₹/L)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#fbbf24' }}>Petrol Rate</label>
                  <PaymentInput step="0.01" value={ratePetrol} onChange={setRatePetrol} style={{ borderColor: '#d97706' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#60a5fa' }}>Diesel Rate</label>
                  <PaymentInput step="0.01" value={rateDiesel} onChange={setRateDiesel} style={{ borderColor: '#2563eb' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#a78bfa' }}>2T Oil Rate</label>
                  <PaymentInput step="0.01" value={rateOil} onChange={setRateOil} style={{ borderColor: '#7c3aed' }} />
                </div>
              </div>
            </motion.div>

            {/* Pump 1 */}
            <motion.div variants={itemVariants}>
              <PumpTable pump="1" nozzles={nozzleCalcs.slice(0, 2)} closings={closings} setClosings={setClosings} />
            </motion.div>
            {/* Pump 2 */}
            <motion.div variants={itemVariants}>
              <PumpTable pump="2" nozzles={nozzleCalcs.slice(2, 4)} closings={closings} setClosings={setClosings} />
            </motion.div>
            {/* 2T Oil */}
            <motion.div variants={itemVariants} className="glass-panel">
              <h3 className="text-sm font-semibold flex items-center gap-2 pump-header-gradient text-white" style={{ borderLeftColor: '#a78bfa' }}>
                <i className="fa-solid fa-oil-can" style={{ color: '#a78bfa' }}></i>2T Oil Dispenser
              </h3>
              <div className="overflow-x-auto">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      {['Nozzle', 'Fuel', 'Opening', 'Closing', 'Volume'].map(h => (
                        <th key={h} className="text-slate-400 font-medium uppercase tracking-wider text-[11px]" style={{ padding: '8px 12px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
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
            {/* Morning Test Toggle */}
            <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '16px 24px' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                    <i className="fa-solid fa-vial" style={{ color: '#fbbf24' }}></i>Morning Test Performed?
                  </h3>
                  <p className="text-xs mt-1 text-slate-400">Deducts 10L Petrol + 10L Diesel from sales</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={testPerformed} onChange={e => setTestPerformed(e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </motion.div>

            {/* Digital Payments */}
            <motion.div variants={itemVariants} className="glass-panel">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-white">
                <i className="fa-solid fa-money-bill-transfer" style={{ color: '#60a5fa' }}></i>Digital Payments & Expenses
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <label className="text-sm sm:w-36 shrink-0 text-slate-400">
                    <i className="fa-brands fa-google-pay mr-1"></i>GPay / UPI (₹)
                  </label>
                  <PaymentInput value={gpay} onChange={setGpay} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <label className="text-sm sm:w-36 shrink-0 text-slate-400">
                    <i className="fa-regular fa-credit-card mr-1"></i>Card Swipes (₹)
                  </label>
                  <PaymentInput value={card} onChange={setCard} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <label className="text-sm sm:w-36 shrink-0 text-slate-400">
                    <i className="fa-solid fa-receipt mr-1"></i>Other Expenses
                  </label>
                  <PaymentInput value={expenseAmt} onChange={setExpenseAmt} />
                </div>
                {expenseAmt > 0 && (
                  <input type="text" value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)}
                    placeholder="Expense description (e.g. Tea/Coffee)" />
                )}
              </div>
            </motion.div>

            {/* Credit Management */}
            <motion.div variants={itemVariants} className="glass-panel">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-white">
                <i className="fa-solid fa-book-open" style={{ color: '#f87171' }}></i>Credit Management
              </h3>
              <CreditSection type="given" label="Credit Given"
                items={creditGiven} setItems={setCreditGiven}
                nameVal={cgName} setName={setCgName} amtVal={cgAmt} setAmt={setCgAmt} />
              <div className="mt-4">
                <CreditSection type="received" label="Credit Received"
                  items={creditReceived} setItems={setCreditReceived}
                  nameVal={crName} setName={setCrName} amtVal={crAmt} setAmt={setCrAmt} />
              </div>
            </motion.div>

            {/* Cash Denominations */}
            <motion.div variants={itemVariants} className="glass-panel">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-white">
                <i className="fa-solid fa-money-bill-wave" style={{ color: '#10b981' }}></i>Count Cash in Drawer
              </h3>
              <div className="space-y-2">
                {DENOMINATIONS.map(d => (
                  <div key={d} className="flex items-center gap-3">
                    <span className="text-sm w-16 shrink-0 text-slate-400">₹{d} ×</span>
                    <PaymentInput inputMode="numeric" value={denoms[d] || 0}
                      onChange={val => setDenoms(prev => ({ ...prev, [d]: val }))} />
                    <span className="text-sm w-20 text-right font-medium shrink-0 text-slate-400">
                      ₹{((denoms[d] || 0) * d).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 flex justify-between items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="font-bold text-white">Total Cash Counted</span>
                <span className="text-xl font-bold" style={{ color: '#10b981' }}>₹{countedCash.toLocaleString()}</span>
              </div>
            </motion.div>

            {/* Reconciliation */}
            <motion.div variants={itemVariants} className="glass-panel">
              <h2 className="text-lg font-bold mb-4 text-white">Shift Reconciliation</h2>
              <div className="space-y-2 text-sm">
                <ReconcRow label="Fuel Sales Value" value={`₹${grossSales.toFixed(2)}`} />
                {testPerformed && <ReconcRow label="Test Volume Deduction" value={`- ₹${testCost.toFixed(2)}`} valueColor="#ef4444" />}
                <ReconcRow label="Digital Payments (UPI + Card)" value={`- ₹${digitalTotal.toFixed(2)}`} valueColor="#ef4444" />
                <ReconcRow label="Credit Given" value={`- ₹${totalCreditGiven.toFixed(2)}`} valueColor="#ef4444" />
                <ReconcRow label="Expenses" value={`- ₹${expenseAmt.toFixed(2)}`} valueColor="#ef4444" />
                <ReconcRow label="Credit Received" value={`+ ₹${totalCreditReceived.toFixed(2)}`} valueColor="#10b981" />
              </div>
              <div className="h-px my-4" style={{ background: 'rgba(255,255,255,0.1)' }}></div>
              <div className="mb-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px', padding: '16px' }}>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Expected Cash in Drawer</span>
                  <span className="text-lg font-bold text-white">₹{expectedCash.toFixed(2)}</span>
                </div>
              </div>
              <div className="mb-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Total Cash Counted</span>
                  <span className="text-lg font-bold text-white">₹{countedCash.toFixed(2)}</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg mb-4 ${difference === 0 ? 'diff-balanced' : difference > 0 ? 'diff-excess' : 'diff-shortage'}`}>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Difference (Counted - Expected)</span>
                  <span>{difference >= 0 ? '+' : ''}₹{difference.toFixed(2)} ({difference === 0 ? 'Balanced' : difference > 0 ? 'Cash Excess' : 'Cash Shortage'})</span>
                </div>
              </div>
              {/* Final Cash Box */}
              <div className="rounded-xl p-5 mb-6 shadow-2xl" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.1))', border: '1px solid rgba(37,99,235,0.2)' }}>
                <p className="text-sm font-medium mb-1 text-slate-400 uppercase tracking-wider">Cash to Give to Owner / Next Shift</p>
                <p className="text-4xl font-bold text-white">₹{countedCash.toFixed(2)}</p>
              </div>

              <motion.button type="submit" disabled={submitting}
                whileHover={!submitting ? { scale: 1.02 } : {}}
                whileTap={!submitting ? { scale: 0.98 } : {}}
                className={`w-full py-4 text-base transition-all shadow-lg ${submitting ? '' : 'btn-primary'}`}
                style={submitting ? { background: 'rgba(255,255,255,0.1)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'not-allowed' } : {}}>
                {submitting ? (
                  <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Submitting...</>
                ) : (
                  <><i className="fa-solid fa-check-double mr-2"></i>Submit Shift & Complete Handover</>
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
    <div className="glass-panel">
      <h3 className="text-sm font-semibold flex items-center gap-2 pump-header-gradient" style={{ color: 'white' }}>
        <i className="fa-solid fa-gas-pump" style={{ color: '#3b82f6' }}></i>Pump {pump}
      </h3>
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {['Nozzle', 'Fuel', 'Opening', 'Closing', 'Volume Sold'].map(h => (
                <th key={h} className="text-slate-400" style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
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
  const volColor = nozzle.fuelType === 'petrol' ? '#fbbf24' : nozzle.fuelType === 'diesel' ? '#60a5fa' : '#a78bfa'
  const accentBorderColor = nozzle.fuelType === 'petrol' ? 'rgba(245, 158, 11, 0.3)' : nozzle.fuelType === 'diesel' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(139, 92, 246, 0.3)'

  return (
    <tr className="enhanced-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: `2px solid ${accentBorderColor}` }}>
      <td style={{ padding: '12px', color: 'white', fontWeight: 500 }}>{nozzle.label}</td>
      <td style={{ padding: '12px' }}><span className={`badge ${badgeClass}`}>{nozzle.fuelType.charAt(0).toUpperCase() + nozzle.fuelType.slice(1)}</span></td>
      <td style={{ padding: '12px' }}><input type="number" value={nozzle.open.toFixed(2)} readOnly style={{ width: '90px' }} /></td>
      <td style={{ padding: '12px' }}>
        <input type="number" step="0.01" value={closings[nozzle.id] ?? ''}
          onChange={e => setClosings(prev => ({ ...prev, [nozzle.id]: e.target.value }))}
          placeholder="0.00" style={{ width: '100px' }} />
      </td>
      <td style={{ padding: '12px', fontWeight: 700, color: volColor }}>
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           key={nozzle.volume}
        >{nozzle.volume.toFixed(2)} L</motion.div>
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
  const color = type === 'given' ? '#f87171' : '#34d399';

  return (
    <div className={cardClass}>
      <h4 className="text-sm font-bold mb-1" style={{ color }}>{label}</h4>
      <p className="text-xs mb-4 text-slate-400">{type === 'given' ? '(Fuel given, cash NOT received. Deducts from expected cash.)' : '(Cash collected for past dues. Adds to expected cash.)'}</p>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Name/Vehicle" value={nameVal} onChange={e => setName(e.target.value)}
          className="w-full" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} />
        <input type="number" placeholder="₹ Amt" value={amtVal} onChange={e => setAmt(e.target.value)}
          className="w-full sm:w-32" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} />
        <button type="button" onClick={add} className="btn-primary w-full sm:w-auto"
          style={{ padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '18px', flexShrink: 0 }}>+</button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, i) => (
          <li key={i} className="flex justify-between items-center py-2 text-sm enhanced-row" style={{ borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingLeft: '8px', paddingRight: '8px', borderRadius: '6px' }}>
            <span style={{ color: 'white', fontWeight: 500 }}>{item.name}</span>
            <span style={{ fontWeight: 700, color }}>
              ₹{item.amt.toFixed(2)}
              <button type="button" onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', marginLeft: '12px', padding: 0, opacity: 0.8 }}
                onMouseOver={e => e.currentTarget.style.opacity = '1'}
                onMouseOut={e => e.currentTarget.style.opacity = '0.8'}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </span>
          </li>
        ))}
      </ul>
      {items.length > 0 && (
        <div className="text-right text-sm font-bold mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', color }}>
          Total: ₹{items.reduce((s, c) => s + c.amt, 0).toFixed(2)}
        </div>
      )}
    </div>
  )
}

function ReconcRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-slate-400">{label}</span>
      <span style={{ fontWeight: 600, color: valueColor || 'white' }}>{value}</span>
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
