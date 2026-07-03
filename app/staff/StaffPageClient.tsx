'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { NozzleReading, CreditItem } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { pageFadeIn, containerVariants, itemVariants, buttonHover, ambientPulse } from '@/lib/motion'

// Nozzles Configuration
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
  recentEntries: any[]
}

export default function StaffPageClient({ staffNames, initialOpenings, recentEntries }: StaffPageClientProps) {
  // Navigation & View State
  const [view, setView] = useState<'dashboard' | 'wizard'>('dashboard')
  const [currentStep, setCurrentStep] = useState(1)

  // Draft Management State
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)

  // Form States
  const [staffName, setStaffName] = useState('')
  const [shiftType, setShiftType] = useState('Morning Shift')
  const [shiftDate, setShiftDate] = useState('')
  const [ratePetrol, setRatePetrol] = useState(0)
  const [rateDiesel, setRateDiesel] = useState(0)
  const [rateOil, setRateOil] = useState(0)
  const [closings, setClosings] = useState<Record<string, string>>({})
  
  // Calibration Test State
  const [testPerformed, setTestPerformed] = useState(false)
  const [calibrationDetails, setCalibrationDetails] = useState<Record<string, { expected: number; actual: number }>>({
    p1n1: { expected: 5.0, actual: 5.0 },
    p1n2: { expected: 5.0, actual: 5.0 },
    p2n3: { expected: 5.0, actual: 5.0 },
    p2n4: { expected: 5.0, actual: 5.0 },
  })

  // Payments & Expenses State
  const [gpay, setGpay] = useState(0)
  const [card, setCard] = useState(0)
  const [expenseAmt, setExpenseAmt] = useState(0)
  const [expenseDesc, setExpenseDesc] = useState('')

  // Credit Management State
  const [creditGiven, setCreditGiven] = useState<(CreditItem & { remarks?: string })[]>([])
  const [creditReceived, setCreditReceived] = useState<(CreditItem & { remarks?: string })[]>([])
  const [cgName, setCgName] = useState('')
  const [cgAmt, setCgAmt] = useState('')
  const [cgRemarks, setCgRemarks] = useState('')
  const [crName, setCrName] = useState('')
  const [crAmt, setCrAmt] = useState('')
  const [crRemarks, setCrRemarks] = useState('')

  // Cash Denominations & Stock State
  const [denoms, setDenoms] = useState<Record<number, number>>(
    Object.fromEntries(DENOMINATIONS.map(d => [d, 0]))
  )
  const [oilStock, setOilStock] = useState(0)
  const [othersAmount, setOthersAmount] = useState(0)
  const [othersDesc, setOthersDesc] = useState('')

  // Submit & Reconciliation State
  const [generalRemarks, setGeneralRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedRefId, setSubmittedRefId] = useState('')

  // Setup initial date on mount
  useEffect(() => {
    const tzOffsetMs = new Date().getTimezoneOffset() * 60000
    const localISO = new Date(Date.now() - tzOffsetMs).toISOString().slice(0, 16)
    setShiftDate(localISO)
  }, [])

  // Auto-load draft check on mount
  useEffect(() => {
    const saved = localStorage.getItem('sai_priya_fuels_draft')
    if (saved) {
      setShowRestoreModal(true)
    } else {
      setDraftLoaded(true)
    }
  }, [])

  // Auto-save draft on form state changes
  useEffect(() => {
    if (!draftLoaded) return
    const draftData = {
      staffName,
      shiftType,
      shiftDate,
      ratePetrol,
      rateDiesel,
      rateOil,
      closings,
      testPerformed,
      calibrationDetails,
      gpay,
      card,
      expenseAmt,
      expenseDesc,
      creditGiven,
      creditReceived,
      denoms,
      oilStock,
      othersAmount,
      othersDesc,
      generalRemarks,
      currentStep,
    }
    localStorage.setItem('sai_priya_fuels_draft', JSON.stringify(draftData))
  }, [
    staffName, shiftType, shiftDate, ratePetrol, rateDiesel, rateOil, closings,
    testPerformed, calibrationDetails, gpay, card, expenseAmt, expenseDesc,
    creditGiven, creditReceived, denoms, oilStock, othersAmount, othersDesc,
    generalRemarks, currentStep, draftLoaded
  ])

  // Restore Draft logic
  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem('sai_priya_fuels_draft')
      if (saved) {
        const d = JSON.parse(saved)
        setStaffName(d.staffName ?? '')
        setShiftType(d.shiftType ?? 'Morning Shift')
        if (d.shiftDate) setShiftDate(d.shiftDate)
        setRatePetrol(d.ratePetrol ?? 0)
        setRateDiesel(d.rateDiesel ?? 0)
        setRateOil(d.rateOil ?? 0)
        setClosings(d.closings ?? {})
        setTestPerformed(d.testPerformed ?? false)
        if (d.calibrationDetails) setCalibrationDetails(d.calibrationDetails)
        setGpay(d.gpay ?? 0)
        setCard(d.card ?? 0)
        setExpenseAmt(d.expenseAmt ?? 0)
        setExpenseDesc(d.expenseDesc ?? '')
        setCreditGiven(d.creditGiven ?? [])
        setCreditReceived(d.creditReceived ?? [])
        if (d.denoms) setDenoms(d.denoms)
        setOilStock(d.oilStock ?? 0)
        setOthersAmount(d.othersAmount ?? 0)
        setOthersDesc(d.othersDesc ?? '')
        setGeneralRemarks(d.generalRemarks ?? '')
        setCurrentStep(d.currentStep ?? 1)
        setView('wizard')
      }
    } catch (e) {
      console.error('Failed to restore draft:', e)
    } finally {
      setDraftLoaded(true)
      setShowRestoreModal(false)
    }
  }

  const handleDiscardDraft = () => {
    localStorage.removeItem('sai_priya_fuels_draft')
    setDraftLoaded(true)
    setShowRestoreModal(false)
  }

  // Openings from Server DB
  const openings = { ...initialOpenings }

  // Helpers for Staff details
  const getStaffDetails = (name: string) => {
    const mockMobiles: Record<string, string> = {
      'Ravi': '+91 98765 43210',
      'Kumar': '+91 99887 76655',
      'Satish': '+91 91234 56789',
      'Anup': '+91 94432 10987',
    }
    if (!name) return { id: '—', mobile: '—' }
    const id = `SPF-${name.slice(0, 3).toUpperCase()}${name.length.toString().padStart(2, '0')}`
    const mobile = mockMobiles[name] || `+91 98765 ${name.length.toString().padEnd(5, '0')}`
    return { id, mobile }
  }

  const { id: staffId, mobile: staffMobile } = getStaffDetails(staffName)

  // Calculations
  const getPrice = (type: string) => {
    if (type === 'petrol') return ratePetrol
    if (type === 'diesel') return rateDiesel
    return rateOil
  }

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
  
  // Total cash counted from denominations
  const countedCash = DENOMINATIONS.reduce((s, d) => s + (denoms[d] || 0) * d, 0)
  const difference = countedCash - expectedCash

  const petrolLitres = nozzleCalcs.filter(n => n.fuelType === 'petrol').reduce((s, n) => s + n.volume, 0) - (testPerformed ? 10 : 0)
  const dieselLitres = nozzleCalcs.filter(n => n.fuelType === 'diesel').reduce((s, n) => s + n.volume, 0) - (testPerformed ? 10 : 0)

  // Sub-step Validation checks before moving to the next step
  const canContinue = () => {
    if (currentStep === 1) {
      return !!staffName && !!shiftDate && !!shiftType
    }
    if (currentStep === 2) {
      return ratePetrol > 0 && rateDiesel > 0 && rateOil > 0
    }
    if (currentStep === 3) {
      // Validate all closings entered and close >= open
      for (const n of NOZZLES) {
        if (!closings[n.id] || closings[n.id] === '') return false
        const open = openings[n.id] ?? 0
        const close = parseFloat(closings[n.id])
        if (isNaN(close) || close < open) return false
      }
      return true
    }
    if (currentStep === 4) {
      // If calibration test performed, ensure details are filled correctly
      if (testPerformed) {
        for (const key of Object.keys(calibrationDetails)) {
          const detail = calibrationDetails[key]
          if (isNaN(detail.expected) || detail.expected <= 0 || isNaN(detail.actual) || detail.actual <= 0) {
            return false
          }
        }
      }
      return true
    }
    if (currentStep === 5) {
      // Expenses description required if expense amount entered
      if (expenseAmt > 0 && !expenseDesc.trim()) return false
      return true
    }
    return true
  }

  // Handle final submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canContinue()) return

    setSubmitting(true)

    const finalDateStr = shiftDate || new Date().toISOString()
    const finalDateObj = new Date(finalDateStr)
    const shiftDateOnly = finalDateObj.getFullYear() + '-' + String(finalDateObj.getMonth() + 1).padStart(2, '0') + '-' + String(finalDateObj.getDate()).padStart(2, '0')

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert('Authentication error: You must be logged in to submit a shift.')
      setSubmitting(false)
      return
    }

    // Merge generalRemarks into expense_desc
    const mergedExpenseDesc = expenseDesc 
      ? `${expenseDesc}${generalRemarks ? ` | Shift Remarks: ${generalRemarks}` : ''}`
      : (generalRemarks ? `Remarks: ${generalRemarks}` : '')

    // Persist custom Step 6 fields (oilStock, othersAmount, othersDesc) inside denominations JSONB
    const savedDenoms = {
      ...denoms,
      oil_stock: oilStock,
      others_amount: othersAmount,
      others_desc: othersDesc
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
      expense_desc: mergedExpenseDesc,
      credit_given: creditGiven,
      credit_received: creditReceived,
      denominations: savedDenoms,
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

    // Attempt WhatsApp integration
    try {
      const formattedDate = String(finalDateObj.getDate()).padStart(2, '0') + '/' + String(finalDateObj.getMonth() + 1).padStart(2, '0') + '/' + finalDateObj.getFullYear()
      const approvalLink = `${window.location.origin}/api/approve-shift?id=${shiftData?.id || ''}`
      
      const whatsappMsg = `⛽ SHIFT SUBMITTED — SAI PRIYA FUELS

👤 Staff Operator: ${staffName} (ID: ${staffId})
📅 Date & Shift: ${formattedDate} (${shiftType})

📊 SALES SUMMARY:
• Petrol Sold: ${Math.max(0, petrolLitres).toFixed(2)} L
• Diesel Sold: ${Math.max(0, dieselLitres).toFixed(2)} L
• 2T Oil Sold: ${nozzleCalcs[4].volume.toFixed(2)} L
• Gross Sales: ₹${grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}

🧪 CALIBRATION CHECK:
• Status: ${testPerformed ? 'Performed (10L Petrol, 10L Diesel deducted)' : 'Not Performed'}
${testPerformed ? `• Nozzles Result: ${Object.keys(calibrationDetails).map(nid => {
  const c = calibrationDetails[nid]
  const varPct = ((c.actual - c.expected) / c.expected) * 100
  return `${nid.toUpperCase()}: ${varPct >= 0 ? '+' : ''}${varPct.toFixed(2)}% (${Math.abs(varPct) <= 0.5 ? 'Pass' : 'Fail'})`
}).join(', ')}` : ''}

💰 RECONCILIATION LEDGER:
• UPI (GPay): ₹${gpay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
• Card Swipes: ₹${card.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
• Expenses: ₹${expenseAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${expenseDesc || 'None'})
• Credit Issued: ₹${totalCreditGiven.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
• Credit Recovered: ₹${totalCreditReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}

💵 VAULT DISCREPANCY:
• Expected Cash: ₹${expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
• Counted Cash: ₹${countedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
• Discrepancy: ₹${difference >= 0 ? '+' : ''}${difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${difference === 0 ? 'Balanced' : difference > 0 ? 'Surplus' : 'Deficit'})

🛢️ INVENTORY PHYSICAL COUNT:
• 2T Oil Stock: ${oilStock} L
• Others: ₹${othersAmount} (${othersDesc || 'None'})

📝 Shift Remarks: ${generalRemarks || 'None'}

✅ Approve Shift:
${approvalLink}`

      await fetch("https://cbpdteymzglrwfgeepys.supabase.co/functions/v1/send-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicGR0ZXltemdscndmZ2VlcHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMjI0NDYsImV4cCI6MjA4ODY5ODQ0Nn0.DrAu9xietiI1faei-tKOG8-Uh0QX8ZoHPCb5GT5iORY",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicGR0ZXltemdscndmZ2VlcHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMjI0NDYsImV4cCI6MjA4ODY5ODQ0Nn0.DrAu9xietiI1faei-tKOG8-Uh0QX8ZoHPCb5GT5iORY"
        },
        body: JSON.stringify({ message: whatsappMsg })
      })
    } catch (waErr) {
      console.error('WhatsApp App API call failed:', waErr)
    }

    try {
      await supabase.rpc('decrement_tank', { fuel: 'petrol', litres: Math.max(0, petrolLitres) })
      await supabase.rpc('decrement_tank', { fuel: 'diesel', litres: Math.max(0, dieselLitres) })
    } catch (err) {
      console.error('Failed to decrement tank', err)
    }

    // Clear saved draft on successful submission
    localStorage.removeItem('sai_priya_fuels_draft')
    setSubmittedRefId(shiftData?.id || '')
    setSubmitted(true)
  }

  // Dashboard Stats/Metrics Helpers
  const lastEntryRecord = recentEntries[0]
  const lastDiff = lastEntryRecord?.difference ?? 0

  return (
    <div className="w-full relative">
      
      {/* 1. DRAFT RESTORE MODAL */}
      <AnimatePresence>
        {showRestoreModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-4 text-[#ff6a00]">
                <i className="fa-solid fa-file-signature text-xl"></i>
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Unfinished Shift Entry Found</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                We detected an autosaved draft from your previous session. Do you want to resume entering the data or discard it and start fresh?
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleRestoreDraft}
                  className="flex-1 py-3 px-4 btn-primary rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Resume Entry
                </button>
                <button
                  onClick={handleDiscardDraft}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Discard Draft
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. SUCCESS SCREEN */}
      {submitted && (
        <motion.div 
          variants={pageFadeIn}
          initial="hidden"
          animate="show"
          className="min-h-[70vh] flex items-center justify-center p-4"
        >
          <div className="text-center w-full max-w-md bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 20 }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-200 bg-emerald-50 text-emerald-600"
            >
              <i className="fa-solid fa-check text-3xl"></i>
            </motion.div>
            <h2 className="text-2xl font-black text-slate-800 mb-1.5 tracking-tight">Shift Submitted</h2>
            <p className="text-slate-500 font-medium text-xs">Operation record generated • Ref: {submittedRefId.slice(0,8).toUpperCase()}</p>
            
            <div className="bg-slate-50 border border-slate-200 mt-6 p-6 rounded-xl text-left relative overflow-hidden">
              <div className="flex justify-between mb-3 text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Expected Cash</span>
                <span className="font-extrabold text-slate-800">₹{expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between mb-3 text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Counted Cash</span>
                <span className="font-extrabold text-slate-800">₹{countedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200 text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Discrepancy</span>
                <span className={`font-black tracking-tight ${difference === 0 ? 'text-emerald-600' : difference > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {difference >= 0 ? '+' : ''}₹{difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setSubmitted(false)
                setSubmittedRefId('')
                setClosings({})
                setGpay(0)
                setCard(0)
                setExpenseAmt(0)
                setExpenseDesc('')
                setCreditGiven([])
                setCreditReceived([])
                setDenoms(Object.fromEntries(DENOMINATIONS.map(d => [d, 0])))
                setOilStock(0)
                setOthersAmount(0)
                setOthersDesc('')
                setGeneralRemarks('')
                setView('dashboard')
                setCurrentStep(1)
              }}
              className="mt-6 px-6 py-3.5 btn-primary w-full uppercase tracking-wider text-xs font-bold cursor-pointer"
            >
              <i className="fa-solid fa-house mr-2"></i> Return to Dashboard
            </button>
          </div>
        </motion.div>
      )}

      {/* 3. CORE VIEWS: DASHBOARD OR WIZARD */}
      {!submitted && (
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            
            /* ================= DASHBOARD VIEW ================= */
            <motion.div
              key="dashboard"
              variants={pageFadeIn}
              initial="hidden"
              animate="show"
              exit="exit"
              className="space-y-6"
            >
              {/* Header Card */}
              <div className="glass-panel border-l-4 border-l-[#ff6a00] bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                    Terminal Handover Console
                  </div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-1.5">Sai Priya Fuels</h1>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Log daily sales volumes, card payments, expenses, credits, and physical vaults step-by-step.
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    setView('wizard')
                    setCurrentStep(1)
                  }}
                  className="px-6 py-4 btn-primary uppercase tracking-wider text-xs font-black shadow-md cursor-pointer shrink-0"
                >
                  <i className="fa-solid fa-circle-plus mr-2 text-sm"></i> Start New Shift Entry
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel bg-white p-5 border border-slate-200 shadow-sm">
                  <div className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Last Entry Expected Cash</div>
                  <div className="text-2xl font-black text-slate-800 mt-2">
                    {lastEntryRecord ? `₹${(lastEntryRecord.expected_cash || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0'}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 mt-1">
                    {lastEntryRecord ? `Operator: ${lastEntryRecord.staff_name}` : 'No previous log'}
                  </div>
                </div>
                
                <div className="glass-panel bg-white p-5 border border-slate-200 shadow-sm">
                  <div className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Last Entry Counted Cash</div>
                  <div className="text-2xl font-black text-slate-800 mt-2">
                    {lastEntryRecord ? `₹${(lastEntryRecord.counted_cash || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0'}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 mt-1">
                    {lastEntryRecord ? `Date: ${lastEntryRecord.shift_date}` : '—'}
                  </div>
                </div>

                <div className={`glass-panel p-5 border shadow-sm ${
                  lastDiff === 0 ? 'bg-emerald-50/50 border-emerald-100' :
                  lastDiff > 0 ? 'bg-amber-50/50 border-amber-100' : 'bg-rose-50/50 border-rose-100'
                }`}>
                  <div className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Last Entry Discrepancy</div>
                  <div className={`text-2xl font-black mt-2 ${
                    lastDiff === 0 ? 'text-emerald-700' :
                    lastDiff > 0 ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {lastDiff >= 0 ? '+' : ''}₹{lastDiff.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                    {lastDiff === 0 ? 'Optimal (Balanced)' : lastDiff > 0 ? 'Surplus' : 'Deficit'}
                  </div>
                </div>
              </div>

              {/* Recent Logs Table */}
              <div className="glass-panel bg-white border border-slate-200 shadow-sm p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                    <i className="fa-solid fa-clock-rotate-left text-[#ff6a00]"></i> Recent Shift Submissions
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Latest 10 Logs</span>
                </div>
                
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        {['Date & Time', 'Shift', 'Sales (₹)', 'Expectancy (₹)', 'Counted (₹)', 'Diff', 'Status'].map(h => (
                          <th key={h} className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[9px]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentEntries.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                            No shift logs submitted by you yet.
                          </td>
                        </tr>
                      ) : recentEntries.map((e, idx) => {
                        const diff = e.difference ?? 0
                        return (
                          <tr key={e.id || idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3.5 font-medium text-slate-600">
                              {new Date(e.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-4 py-3.5 text-slate-500 font-semibold">{e.shift_type?.replace(' Shift', '')}</td>
                            <td className="px-4 py-3.5 text-[#ff6a00] font-bold">₹{e.gross_sales?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                            <td className="px-4 py-3.5 text-slate-600 font-semibold">₹{e.expected_cash?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                            <td className="px-4 py-3.5 text-slate-600 font-semibold">₹{e.counted_cash?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                            <td className={`px-4 py-3.5 font-black tracking-tight ${diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {diff >= 0 ? '+' : ''}₹{diff.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`badge py-1 px-2.5 rounded-md text-[9px] ${
                                e.status === 'Verified' ? 'status-verified' : 'status-pending'
                              }`}>{e.status}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : (
            
            /* ================= WIZARD VIEW ================= */
            <motion.div
              key="wizard"
              variants={pageFadeIn}
              initial="hidden"
              animate="show"
              exit="exit"
              className="space-y-6"
            >
              {/* Stepper Wizard Indicator */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm sticky top-[72px] sm:top-[76px] z-40 backdrop-blur-md">
                {/* Desktop Stepper */}
                <div className="hidden md:flex justify-between items-center relative select-none">
                  {/* Connecting background progress line */}
                  <div className="absolute top-1/2 left-[5%] right-[5%] h-0.5 bg-slate-200 -translate-y-1/2 z-0">
                    <div 
                      className="h-full bg-gradient-to-r from-[#ff6a00] to-emerald-500 transition-all duration-300"
                      style={{ width: `${((currentStep - 1) / 6) * 100}%` }}
                    />
                  </div>
                  
                  {/* Step Circles */}
                  {[
                    { nr: 1, label: 'Shift Info', icon: 'fa-user-clock' },
                    { nr: 2, label: 'Rates', icon: 'fa-indian-rupee-sign' },
                    { nr: 3, label: 'Readings', icon: 'fa-gauge-high' },
                    { nr: 4, label: 'Calibration', icon: 'fa-clipboard-check' },
                    { nr: 5, label: 'Expenses', icon: 'fa-wallet' },
                    { nr: 6, label: 'Credits & Vault', icon: 'fa-calculator' },
                    { nr: 7, label: 'Summary', icon: 'fa-check-double' }
                  ].map((s) => {
                    const isCompleted = currentStep > s.nr
                    const isActive = currentStep === s.nr
                    
                    return (
                      <div key={s.nr} className="flex flex-col items-center z-10 w-20">
                        <div 
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border shadow-sm transition-all duration-300 ${
                            isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                            isActive ? 'bg-[#ff6a00] border-[#ff6a00] text-white shadow-[#ff6a00]/25' :
                            'bg-white border-slate-200 text-slate-400'
                          }`}
                        >
                          {isCompleted ? (
                            <i className="fa-solid fa-check text-xs"></i>
                          ) : (
                            <i className={`fa-solid ${s.icon} text-xs`}></i>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold mt-2 text-center whitespace-nowrap tracking-wide ${
                          isActive ? 'text-[#ff6a00] font-black' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                        }`}>
                          {s.nr}. {s.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Mobile Stepper */}
                <div className="flex md:hidden justify-between items-center">
                  <button 
                    type="button" 
                    onClick={() => {
                      if (window.confirm("Return to dashboard? Draft will be saved.")) {
                        setView('dashboard')
                      }
                    }}
                    className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 active:bg-slate-100"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                  </button>
                  <div className="text-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#ff6a00]">Sai Priya Fuels</span>
                    <h2 className="text-xs font-black text-slate-800">
                      Step {currentStep} of 7: {
                        currentStep === 1 ? 'Shift Details' :
                        currentStep === 2 ? 'Rates Setup' :
                        currentStep === 3 ? 'Pump Readings' :
                        currentStep === 4 ? 'Calibration Check' :
                        currentStep === 5 ? 'Expenses' :
                        currentStep === 6 ? 'Credits & vault' : 'Submission Summary'
                      }
                    </h2>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-xs font-bold text-[#ff6a00]">
                    {Math.round((currentStep / 7) * 100)}%
                  </div>
                </div>
                
                {/* Mobile progress bar line */}
                <div className="md:hidden w-full h-1 bg-slate-100 mt-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#ff6a00] to-emerald-500 transition-all duration-300"
                    style={{ width: `${(currentStep / 7) * 100}%` }}
                  />
                </div>
              </div>

              {/* Active Step Panel */}
              <div className="min-h-[50vh]">
                
                {/* ================= STEP 1: SHIFT DETAILS ================= */}
                {currentStep === 1 && (
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                    <div className="glass-panel bg-white p-6 rounded-2xl">
                      <div className="flex items-center gap-3.5 mb-6">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#ff6a00] border border-orange-100 flex items-center justify-center">
                          <i className="fa-solid fa-user-clock text-sm"></i>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">Shift & Staff Details</h3>
                          <p className="text-[11px] text-slate-400 font-medium">Verify your identity and select your shift</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Select Staff Name</label>
                          <select 
                            required 
                            value={staffName} 
                            onChange={e => setStaffName(e.target.value)} 
                            className="w-full h-[48px] bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00] select-style cursor-pointer text-sm font-semibold"
                          >
                            <option value="" disabled>Choose Operator...</option>
                            {staffNames.map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Shift Protocol</label>
                          <select 
                            value={shiftType} 
                            onChange={e => setShiftType(e.target.value)} 
                            className="w-full h-[48px] bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00] select-style cursor-pointer text-sm font-semibold"
                          >
                            <option value="Morning Shift">Morning Shift</option>
                            <option value="Night Shift">Night Shift</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Date & Time</label>
                          <input 
                            type="datetime-local" 
                            value={shiftDate} 
                            onChange={e => setShiftDate(e.target.value)} 
                            required 
                            className="w-full h-[48px] bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00] text-sm font-semibold" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Auto-filled operator details card */}
                    {staffName && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between gap-4 text-white"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[#ff6a00] font-black text-sm">
                            {staffName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Identified Operator</span>
                            <h4 className="text-sm font-extrabold text-[#ff6a00] mt-0.5">{staffName}</h4>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-left sm:text-right shrink-0">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Staff ID</span>
                            <span className="text-xs font-mono font-bold text-slate-200">{staffId}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Registered Mobile</span>
                            <span className="text-xs font-mono font-bold text-slate-200">{staffMobile}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* ================= STEP 2: RATES SETUP ================= */}
                {currentStep === 2 && (
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                    <div className="glass-panel bg-white p-6 rounded-2xl">
                      <div className="flex items-center gap-3.5 mb-6">
                        <div className="w-9 h-9 rounded-xl bg-[#003366]/15 text-[#003366] border border-[#003366]/10 flex items-center justify-center">
                          <i className="fa-solid fa-tags text-sm"></i>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">Exchange Rates Setup</h3>
                          <p className="text-[11px] text-slate-400 font-medium">Verify standard fuel rates in ₹/L for today's shift</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Petrol Rate */}
                        <div className="bg-orange-50/40 p-4 rounded-2xl border border-orange-100/60 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-2 opacity-5 text-orange-600 text-6xl pointer-events-none">
                            <i className="fa-solid fa-gas-pump"></i>
                          </div>
                          <label className="block text-[9px] font-black text-orange-700 uppercase tracking-widest mb-3">Petrol Rate (₹/L)</label>
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-lg font-black text-orange-400">₹</span>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              min="0"
                              value={ratePetrol || ''}
                              onChange={e => setRatePetrol(parseFloat(e.target.value) || 0)}
                              className="pl-8 w-full h-[52px] bg-white border border-slate-200 text-lg font-black text-slate-800 focus:border-[#ff6a00] shadow-sm text-center" 
                            />
                          </div>
                          <p className="text-[10px] text-orange-500 font-semibold mt-2">Drives Petrol volume calculations</p>
                        </div>

                        {/* Diesel Rate */}
                        <div className="bg-sky-50/40 p-4 rounded-2xl border border-sky-100/60 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-2 opacity-5 text-sky-600 text-6xl pointer-events-none">
                            <i className="fa-solid fa-truck-field"></i>
                          </div>
                          <label className="block text-[9px] font-black text-sky-700 uppercase tracking-widest mb-3">Diesel Rate (₹/L)</label>
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-lg font-black text-sky-400">₹</span>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              min="0"
                              value={rateDiesel || ''}
                              onChange={e => setRateDiesel(parseFloat(e.target.value) || 0)}
                              className="pl-8 w-full h-[52px] bg-white border border-slate-200 text-lg font-black text-slate-800 focus:border-[#ff6a00] shadow-sm text-center" 
                            />
                          </div>
                          <p className="text-[10px] text-sky-500 font-semibold mt-2">Drives Diesel volume calculations</p>
                        </div>

                        {/* 2T Oil Rate */}
                        <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-100/60 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-2 opacity-5 text-purple-600 text-6xl pointer-events-none">
                            <i className="fa-solid fa-oil-can"></i>
                          </div>
                          <label className="block text-[9px] font-black text-purple-700 uppercase tracking-widest mb-3">2T Oil Rate (₹/L)</label>
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-lg font-black text-purple-400">₹</span>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              min="0"
                              value={rateOil || ''}
                              onChange={e => setRateOil(parseFloat(e.target.value) || 0)}
                              className="pl-8 w-full h-[52px] bg-white border border-slate-200 text-lg font-black text-slate-800 focus:border-[#ff6a00] shadow-sm text-center" 
                            />
                          </div>
                          <p className="text-[10px] text-purple-500 font-semibold mt-2">Drives 2T Oil dispenser sales</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ================= STEP 3: PUMP & OIL READINGS ================= */}
                {currentStep === 3 && (
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                    
                    {/* Pump Section Renderer */}
                    {[
                      { title: 'Terminal Pump 01', nozzles: nozzleCalcs.slice(0, 2), theme: 'orange' },
                      { title: 'Terminal Pump 02', nozzles: nozzleCalcs.slice(2, 4), theme: 'sky' },
                      { title: '2T Oil Dispenser', nozzles: [nozzleCalcs[4]], theme: 'purple' }
                    ].map((section, sidx) => (
                      <div key={sidx} className="glass-panel bg-white p-4 sm:p-6 rounded-2xl border border-slate-200">
                        <h3 className="font-extrabold text-sm text-slate-800 tracking-tight mb-5 flex items-center gap-2">
                          <i className={`fa-solid ${
                            section.theme === 'orange' ? 'fa-gas-pump text-[#ff6a00]' :
                            section.theme === 'sky' ? 'fa-gas-pump text-sky-600' : 'fa-oil-can text-purple-600'
                          }`}></i>
                          {section.title}
                        </h3>

                        <div className="space-y-6">
                          {section.nozzles.map(n => {
                            const open = openings[n.id] ?? 0
                            const closeVal = closings[n.id] ?? ''
                            const volume = n.volume
                            const isError = closeVal !== '' && parseFloat(closeVal) < open

                            return (
                              <div key={n.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-slate-800">{n.label}</span>
                                    <span className={`badge py-0.5 px-2 rounded font-black text-[9px] ${
                                      n.fuelType === 'petrol' ? 'petrol-badge' :
                                      n.fuelType === 'diesel' ? 'diesel-badge' : 'oil-badge'
                                    }`}>{n.fuelType.toUpperCase()}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-medium">Standard nozzle flow counter (Litres)</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                                  {/* Opening Input Box */}
                                  <div>
                                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Opening Reading</span>
                                    <input 
                                      type="number" 
                                      value={open.toFixed(2)}
                                      readOnly 
                                      className="w-full md:w-32 h-[44px] bg-slate-100 text-slate-500 font-mono font-bold border-dashed border-slate-200 cursor-not-allowed text-center" 
                                    />
                                  </div>

                                  {/* Closing Input Box */}
                                  <div>
                                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Closing Reading</span>
                                    <input 
                                      type="number" 
                                      step="0.01"
                                      placeholder="0.00"
                                      value={closeVal}
                                      onChange={e => setClosings(prev => ({ ...prev, [n.id]: e.target.value }))}
                                      className={`w-full md:w-36 h-[44px] bg-white font-mono font-bold text-slate-800 text-center focus:outline-none ${
                                        isError ? 'border-red-400 focus:border-red-500 focus:ring-red-150' : 'border-slate-200 focus:border-[#ff6a00]'
                                      }`} 
                                    />
                                  </div>
                                </div>

                                {/* Calculation Panel */}
                                <div className="w-full md:w-28 text-left md:text-right shrink-0 md:border-l md:border-slate-200 md:pl-4 min-h-[38px] flex flex-col justify-center">
                                  {isError ? (
                                    <span className="text-[10px] text-red-500 font-bold leading-normal block">
                                      <i className="fa-solid fa-triangle-exclamation mr-1"></i> Less than Opening
                                    </span>
                                  ) : volume > 0 ? (
                                    <div>
                                      <span className="text-emerald-600 font-mono font-black text-sm block">
                                        +{volume.toFixed(2)} L
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-bold block">
                                        ₹{n.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })} sold
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-semibold block">0.00 L sold</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* ================= STEP 4: CALIBRATION TEST ================= */}
                {currentStep === 4 && (
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                    <div className="glass-panel bg-white p-6 rounded-2xl">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ff6a00]">
                            <i className="fa-solid fa-flask-vial text-sm"></i>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-700 tracking-wide uppercase">Calibration Test Log</h3>
                            <p className="text-[11px] text-slate-400 font-medium">Verify standard nozzle accuracy checks (±0.5% limit)</p>
                          </div>
                        </div>

                        <label className="toggle-switch transform scale-110">
                          <input 
                            type="checkbox" 
                            checked={testPerformed} 
                            onChange={e => setTestPerformed(e.target.checked)} 
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      {/* Detail inputs shown only if toggle is YES */}
                      {testPerformed ? (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          className="space-y-6 overflow-hidden"
                        >
                          <div className="bg-orange-50/50 p-4 border border-orange-100/60 rounded-xl mb-4">
                            <span className="text-[9px] font-black uppercase text-orange-700 tracking-widest block">Note on Deductions</span>
                            <p className="text-[11px] text-orange-600 font-medium mt-1">
                              Enabling calibration tests will automatically deduct 10 Litres of Petrol (from nozzles P1N1 & P2N3 combined) and 10 Litres of Diesel (from nozzles P1N2 & P2N4 combined) from expected cash calculations to compensate for quality checks.
                            </p>
                          </div>

                          <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                  <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[9px]">Nozzle ID</th>
                                  <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[9px] text-center">Expected (L)</th>
                                  <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[9px] text-center">Actual Count (L)</th>
                                  <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[9px] text-center">Variation (%)</th>
                                  <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-[9px] text-right">Result</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white font-semibold">
                                {[
                                  { key: 'p1n1', label: 'P1-N1 Petrol' },
                                  { key: 'p1n2', label: 'P1-N2 Diesel' },
                                  { key: 'p2n3', label: 'P2-N3 Petrol' },
                                  { key: 'p2n4', label: 'P2-N4 Diesel' },
                                ].map(row => {
                                  const exp = calibrationDetails[row.key]?.expected ?? 5
                                  const act = calibrationDetails[row.key]?.actual ?? 5
                                  const diffPct = exp > 0 ? ((act - exp) / exp) * 100 : 0
                                  const isPass = Math.abs(diffPct) <= 0.5

                                  return (
                                    <tr key={row.key} className="hover:bg-slate-50/50">
                                      <td className="px-4 py-3.5 text-slate-700">{row.label}</td>
                                      
                                      {/* Expected Value Input */}
                                      <td className="px-4 py-3.5 text-center">
                                        <input 
                                          type="number"
                                          step="0.01"
                                          value={exp}
                                          onChange={e => setCalibrationDetails(prev => ({
                                            ...prev,
                                            [row.key]: { ...prev[row.key], expected: parseFloat(e.target.value) || 0 }
                                          }))}
                                          className="w-20 h-[36px] bg-slate-50 text-center font-mono font-bold text-slate-700 border border-slate-200 rounded-lg py-1 px-2"
                                        />
                                      </td>
                                      
                                      {/* Actual Value Input */}
                                      <td className="px-4 py-3.5 text-center">
                                        <input 
                                          type="number"
                                          step="0.01"
                                          value={act}
                                          onChange={e => setCalibrationDetails(prev => ({
                                            ...prev,
                                            [row.key]: { ...prev[row.key], actual: parseFloat(e.target.value) || 0 }
                                          }))}
                                          className="w-24 h-[36px] bg-white text-center font-mono font-bold text-slate-800 border border-slate-200 focus:border-[#ff6a00] rounded-lg py-1 px-2"
                                        />
                                      </td>

                                      {/* Variation Calculation */}
                                      <td className={`px-4 py-3.5 text-center font-mono font-black ${
                                        isPass ? 'text-emerald-600' : 'text-red-600'
                                      }`}>
                                        {diffPct >= 0 ? '+' : ''}{diffPct.toFixed(2)}%
                                      </td>

                                      {/* Pass/Fail Status */}
                                      <td className="px-4 py-3.5 text-right">
                                        <span className={`badge py-1 px-2.5 rounded-md text-[9px] font-black ${
                                          isPass ? 'status-verified' : 'status-pending'
                                        }`}>
                                          {isPass ? 'PASS' : 'FAIL'}
                                        </span>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="text-center py-8 text-slate-400 font-semibold border-2 border-dashed border-slate-100 rounded-xl">
                          <i className="fa-solid fa-ban text-2xl block mb-2 opacity-50"></i>
                          No calibration checks performed this shift.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ================= STEP 5: PAYMENTS & EXPENSES ================= */}
                {currentStep === 5 && (
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                    <div className="glass-panel bg-white p-6 rounded-2xl">
                      <div className="flex items-center gap-3.5 mb-6">
                        <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0ea5e9] border border-sky-100 flex items-center justify-center">
                          <i className="fa-solid fa-wifi text-sm"></i>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">Digital ledger & Expenses</h3>
                          <p className="text-[11px] text-slate-400 font-medium">Record UPI, Card swipes, and operational payouts</p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        {/* GPay/UPI */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                          <div className="space-y-0.5">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <i className="fa-brands fa-google-pay text-lg text-slate-700"></i> UPI/GPay Amount (₹)
                            </label>
                            <p className="text-[10px] text-slate-400 font-medium">Total payments received on phone QR code</p>
                          </div>
                          <div className="relative flex items-center shrink-0 w-full sm:w-44">
                            <span className="absolute left-3.5 font-bold text-slate-400 text-sm">₹</span>
                            <input 
                              type="number"
                              min="0"
                              placeholder="0.00"
                              value={gpay || ''}
                              onChange={e => setGpay(parseFloat(e.target.value) || 0)}
                              className="pl-8 text-right font-bold text-slate-800 focus:border-[#ff6a00] h-[44px]"
                            />
                          </div>
                        </div>

                        {/* Card POS */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                          <div className="space-y-0.5">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <i className="fa-regular fa-credit-card text-sm text-slate-700"></i> POS Card Swipes (₹)
                            </label>
                            <p className="text-[10px] text-slate-400 font-medium">Total credit/debit card swipe reports</p>
                          </div>
                          <div className="relative flex items-center shrink-0 w-full sm:w-44">
                            <span className="absolute left-3.5 font-bold text-slate-400 text-sm">₹</span>
                            <input 
                              type="number"
                              min="0"
                              placeholder="0.00"
                              value={card || ''}
                              onChange={e => setCard(parseFloat(e.target.value) || 0)}
                              className="pl-8 text-right font-bold text-slate-800 focus:border-[#ff6a00] h-[44px]"
                            />
                          </div>
                        </div>

                        {/* Operational Expense */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                          <div className="space-y-0.5">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <i className="fa-solid fa-receipt text-sm text-slate-700"></i> Operational Expenses (₹)
                            </label>
                            <p className="text-[10px] text-slate-400 font-medium">Cash paid out for tea, cleaning, or maintenance</p>
                          </div>
                          <div className="relative flex items-center shrink-0 w-full sm:w-44">
                            <span className="absolute left-3.5 font-bold text-slate-400 text-sm">₹</span>
                            <input 
                              type="number"
                              min="0"
                              placeholder="0.00"
                              value={expenseAmt || ''}
                              onChange={e => setExpenseAmt(parseFloat(e.target.value) || 0)}
                              className="pl-8 text-right font-bold text-slate-800 focus:border-[#ff6a00] h-[44px]"
                            />
                          </div>
                        </div>

                        {/* Operational Expense Description (Notes) */}
                        <AnimatePresence>
                          {expenseAmt > 0 && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="p-4 rounded-xl border border-dashed border-slate-200 bg-white"
                            >
                              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Expense Justification Notes *</span>
                              <input 
                                type="text"
                                required
                                value={expenseDesc}
                                onChange={e => setExpenseDesc(e.target.value)}
                                placeholder="Explain payout details (e.g. Tea for Staff - ₹120, Diesel generator backup - ₹300)"
                                className={`w-full text-sm bg-white focus:outline-none h-[44px] ${
                                  !expenseDesc.trim() ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-[#ff6a00]'
                                }`}
                              />
                              {!expenseDesc.trim() && (
                                <p className="text-[10px] text-red-500 font-bold mt-1">Please enter explanation before continuing.</p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ================= STEP 6: CREDITS & PHYSICAL COUNT ================= */}
                {currentStep === 6 && (
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                    
                    {/* Credit Sections Container */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      
                      {/* Credit Issued Card */}
                      <div className="credit-given-card bg-white">
                        <div className="flex items-center gap-2 mb-1 text-red-600 font-bold text-sm">
                          <i className="fa-solid fa-file-invoice-dollar"></i>
                          <h4>Credit Issued</h4>
                        </div>
                        <p className="text-[10px] mb-4 text-slate-400 font-semibold uppercase tracking-wider">
                          Fuel given on credit (Deducted from Expected Cash)
                        </p>
                        
                        <div className="flex flex-col gap-3.5 mb-4">
                          <input 
                            type="text" 
                            placeholder="Customer Name / Plate Number" 
                            value={cgName} 
                            onChange={e => setCgName(e.target.value)}
                            className="text-sm bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00] h-[40px] px-3 rounded-lg"
                          />
                          <div className="flex gap-3">
                            <input 
                              type="number" 
                              placeholder="Value (₹)" 
                              value={cgAmt} 
                              onChange={e => setCgAmt(e.target.value)}
                              className="w-full text-sm bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00] h-[40px] px-3 rounded-lg"
                            />
                            <input 
                              type="text" 
                              placeholder="Remarks (optional)" 
                              value={cgRemarks} 
                              onChange={e => setCgRemarks(e.target.value)}
                              className="w-full text-sm bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00] h-[40px] px-3 rounded-lg"
                            />
                          </div>
                          
                          <button 
                            type="button" 
                            onClick={() => {
                              const amt = parseFloat(cgAmt)
                              if (!cgName.trim() || isNaN(amt) || amt <= 0) { alert('Enter valid name and amount'); return }
                              setCreditGiven(prev => [...prev, { name: cgName.trim(), amt, remarks: cgRemarks.trim() }])
                              setCgName(''); setCgAmt(''); setCgRemarks('')
                            }} 
                            className="btn-secondary h-[40px] text-xs font-bold border-slate-200 hover:border-red-300 w-full flex items-center justify-center"
                          >
                            <i className="fa-solid fa-plus text-[#ff6a00] mr-1.5"></i> Add Credit Record
                          </button>
                        </div>

                        {/* List */}
                        <ul className="space-y-2 mt-4 max-h-48 overflow-y-auto custom-scrollbar">
                          {creditGiven.map((item, idx) => (
                            <li key={idx} className="flex justify-between items-center py-2 px-3 text-xs bg-slate-50 border border-slate-200/50 rounded-xl">
                              <div className="flex flex-col">
                                <span className="text-slate-700 font-bold">{item.name}</span>
                                {item.remarks && <span className="text-[10px] text-slate-400 font-semibold italic">{item.remarks}</span>}
                              </div>
                              <span className="font-extrabold text-red-500 flex items-center gap-2.5">
                                ₹{item.amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                <button 
                                  type="button" 
                                  onClick={() => setCreditGiven(prev => prev.filter((_, j) => j !== idx))}
                                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 w-5 h-5 flex items-center justify-center rounded border border-slate-200/60 cursor-pointer"
                                >
                                  <i className="fa-solid fa-xmark text-[10px]"></i>
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Credit Recovered Card */}
                      <div className="credit-received-card bg-white">
                        <div className="flex items-center gap-2 mb-1 text-emerald-600 font-bold text-sm">
                          <i className="fa-solid fa-file-invoice-dollar"></i>
                          <h4>Credit Recovered</h4>
                        </div>
                        <p className="text-[10px] mb-4 text-slate-400 font-semibold uppercase tracking-wider">
                          Outstanding balance payments collected (Added to Expected Cash)
                        </p>
                        
                        <div className="flex flex-col gap-3.5 mb-4">
                          <input 
                            type="text" 
                            placeholder="Customer Name / Plate Number" 
                            value={crName} 
                            onChange={e => setCrName(e.target.value)}
                            className="text-sm bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00] h-[40px] px-3 rounded-lg"
                          />
                          <div className="flex gap-3">
                            <input 
                              type="number" 
                              placeholder="Value (₹)" 
                              value={crAmt} 
                              onChange={e => setCrAmt(e.target.value)}
                              className="w-full text-sm bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00] h-[40px] px-3 rounded-lg"
                            />
                            <input 
                              type="text" 
                              placeholder="Remarks (optional)" 
                              value={crRemarks} 
                              onChange={e => setCrRemarks(e.target.value)}
                              className="w-full text-sm bg-white border border-slate-200 text-slate-800 focus:border-[#ff6a00] h-[40px] px-3 rounded-lg"
                            />
                          </div>
                          
                          <button 
                            type="button" 
                            onClick={() => {
                              const amt = parseFloat(crAmt)
                              if (!crName.trim() || isNaN(amt) || amt <= 0) { alert('Enter valid name and amount'); return }
                              setCreditReceived(prev => [...prev, { name: crName.trim(), amt, remarks: crRemarks.trim() }])
                              setCrName(''); setCrAmt(''); setCrRemarks('')
                            }} 
                            className="btn-secondary h-[40px] text-xs font-bold border-slate-200 hover:border-emerald-300 w-full flex items-center justify-center"
                          >
                            <i className="fa-solid fa-plus text-[#ff6a00] mr-1.5"></i> Add Recovery Record
                          </button>
                        </div>

                        {/* List */}
                        <ul className="space-y-2 mt-4 max-h-48 overflow-y-auto custom-scrollbar">
                          {creditReceived.map((item, idx) => (
                            <li key={idx} className="flex justify-between items-center py-2 px-3 text-xs bg-slate-50 border border-slate-200/50 rounded-xl">
                              <div className="flex flex-col">
                                <span className="text-slate-700 font-bold">{item.name}</span>
                                {item.remarks && <span className="text-[10px] text-slate-400 font-semibold italic">{item.remarks}</span>}
                              </div>
                              <span className="font-extrabold text-emerald-600 flex items-center gap-2.5">
                                ₹{item.amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                <button 
                                  type="button" 
                                  onClick={() => setCreditReceived(prev => prev.filter((_, j) => j !== idx))}
                                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 w-5 h-5 flex items-center justify-center rounded border border-slate-200/60 cursor-pointer"
                                >
                                  <i className="fa-solid fa-xmark text-[10px]"></i>
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Cash Denominations and Count Card */}
                    <div className="glass-panel bg-white p-6 rounded-2xl border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase mb-6 flex items-center gap-3">
                        <i className="fa-solid fa-wallet text-emerald-600 animate-pulse"></i>
                        Physical Currency Count & Inventory Stock
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {DENOMINATIONS.map(d => (
                          <div key={d} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/50">
                            <div className="w-10 h-8 rounded shrink-0 bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700 shadow-sm">
                              ₹{d}
                            </div>
                            <input 
                              type="number"
                              inputMode="numeric"
                              min="0"
                              placeholder="0"
                              value={denoms[d] || ''}
                              onChange={e => {
                                const val = parseInt(e.target.value) || 0
                                setDenoms(prev => ({ ...prev, [d]: val }))
                              }}
                              className="h-8 !px-2 bg-transparent border-none text-slate-800 text-center hover:bg-slate-100 focus:bg-slate-100 font-bold"
                            />
                            <div className="text-[10px] w-16 text-right font-bold shrink-0 text-slate-500">
                              = ₹{((denoms[d] || 0) * d).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Custom Inventory & Others Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                        {/* 2T Oil Stock Litres */}
                        <div className="bg-purple-50/20 p-3.5 border border-purple-100/50 rounded-xl">
                          <label className="block text-[9px] font-bold text-purple-700 uppercase tracking-widest mb-1.5">2T Oil Stock (Litres)</label>
                          <div className="relative flex items-center">
                            <input 
                              type="number" 
                              min="0"
                              placeholder="0"
                              value={oilStock || ''}
                              onChange={e => setOilStock(parseFloat(e.target.value) || 0)}
                              className="w-full h-[36px] bg-white border border-slate-200 text-sm font-bold text-slate-800 focus:border-purple-400 text-center rounded-lg" 
                            />
                          </div>
                        </div>

                        {/* Others Count (₹) */}
                        <div className="bg-sky-50/20 p-3.5 border border-sky-100/50 rounded-xl">
                          <label className="block text-[9px] font-bold text-sky-700 uppercase tracking-widest mb-1.5">Others Count (₹)</label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              min="0"
                              placeholder="Amount ₹"
                              value={othersAmount || ''}
                              onChange={e => setOthersAmount(parseFloat(e.target.value) || 0)}
                              className="w-1/2 h-[36px] bg-white border border-slate-200 text-sm font-bold text-slate-800 focus:border-sky-400 text-center rounded-lg" 
                            />
                            <input 
                              type="text" 
                              placeholder="Details (optional)"
                              value={othersDesc}
                              onChange={e => setOthersDesc(e.target.value)}
                              className="w-1/2 h-[36px] bg-white border border-slate-200 text-xs text-slate-800 focus:border-sky-400 rounded-lg px-2" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Cash Counter Total Panel */}
                      <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center shadow-md">
                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Drawer Cash Vault</span>
                        <span className="text-xl font-black text-emerald-400">₹{countedCash.toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ================= STEP 7: RECONCILIATION LEDGER ================= */}
                {currentStep === 7 && (
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                    
                    {/* Summary grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Left: General Telemetry values */}
                      <div className="space-y-6">
                        {/* Rates Summary */}
                        <div className="glass-panel bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-100 pb-2">Shift Fuel Rates</h4>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-700">
                            <div className="bg-orange-50/40 p-2 border border-orange-100/50 rounded-xl">
                              <span className="text-[8px] text-orange-600 uppercase tracking-widest block">Petrol</span>
                              <span className="text-sm font-black text-slate-800 mt-1 block">₹{ratePetrol}</span>
                            </div>
                            <div className="bg-sky-50/40 p-2 border border-sky-100/50 rounded-xl">
                              <span className="text-[8px] text-sky-600 uppercase tracking-widest block">Diesel</span>
                              <span className="text-sm font-black text-slate-800 mt-1 block">₹{rateDiesel}</span>
                            </div>
                            <div className="bg-purple-50/40 p-2 border border-purple-100/50 rounded-xl">
                              <span className="text-[8px] text-purple-600 uppercase tracking-widest block">2T Oil</span>
                              <span className="text-sm font-black text-slate-800 mt-1 block">₹{rateOil}</span>
                            </div>
                          </div>
                        </div>

                        {/* Nozzles Readings Summary */}
                        <div className="glass-panel bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-100 pb-2">Pump Readings Log</h4>
                          <div className="space-y-2">
                            {nozzleCalcs.map(n => (
                              <div key={n.id} className="flex justify-between text-xs py-1 border-b border-slate-100">
                                <span className="text-slate-500 font-semibold">{n.label} ({n.fuelType.toUpperCase()})</span>
                                <span className="font-bold text-slate-800">
                                  {n.open} → {closings[n.id]}
                                  <span className="text-emerald-600 font-black ml-2">({n.volume.toFixed(2)}L)</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Deductions Breakdown */}
                        <div className="glass-panel bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-100 pb-2">Financial Deductions</h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500 font-semibold">UPI/GPay Receipts</span>
                              <span className="font-bold text-slate-800">₹{gpay.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500 font-semibold">POS Card Payments</span>
                              <span className="font-bold text-slate-800">₹{card.toLocaleString()}</span>
                            </div>
                            {testPerformed && (
                              <div className="flex justify-between py-1 border-b border-slate-100">
                                <span className="text-slate-500 font-semibold">Calibration Deductions (-10L each)</span>
                                <span className="font-bold text-red-500">₹{testCost.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500 font-semibold">Operational Expenses</span>
                              <span className="font-bold text-slate-800">
                                ₹{expenseAmt.toLocaleString()} {expenseDesc && `(${expenseDesc})`}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500 font-semibold">Credit Issued</span>
                              <span className="font-bold text-red-500">₹{totalCreditGiven.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500 font-semibold">Credit Recovered</span>
                              <span className="font-bold text-emerald-600">₹{totalCreditReceived.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Net Discrepancy Reconciliation */}
                      <div className="space-y-6">
                        
                        {/* Overall Ledger Ledger */}
                        <div className="glass-panel bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 border-b border-slate-100 pb-2">Vault Reconciliation</h4>
                            
                            <div className="space-y-3.5 text-sm font-semibold">
                              <div className="flex justify-between py-1 hover:bg-slate-50 rounded px-2">
                                <span className="text-slate-500 text-xs">Gross Shift Sales</span>
                                <span className="font-extrabold text-[#ff6a00]">₹{grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between py-1 hover:bg-slate-50 rounded px-2">
                                <span className="text-slate-500 text-xs">Total Digital Receipts</span>
                                <span className="font-bold text-slate-700">₹{digitalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between py-1 hover:bg-slate-50 rounded px-2">
                                <span className="text-slate-500 text-xs">Total Credit Issued</span>
                                <span className="font-bold text-red-600">₹{totalCreditGiven.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between py-1 hover:bg-slate-50 rounded px-2">
                                <span className="text-slate-500 text-xs">Operational Expenses</span>
                                <span className="font-bold text-slate-700">₹{expenseAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between py-1 hover:bg-slate-50 rounded px-2 border-b border-slate-100 pb-3">
                                <span className="text-slate-500 text-xs">Credit Recovered</span>
                                <span className="font-bold text-emerald-600">₹{totalCreditReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                              
                              <div className="flex justify-between py-2 bg-slate-50 rounded px-2">
                                <span className="text-slate-600 text-xs font-black uppercase tracking-wider">Expected Cash Vault</span>
                                <span className="font-black text-slate-800">₹{expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                              
                              <div className="flex justify-between py-2 bg-slate-50 rounded px-2">
                                <span className="text-slate-600 text-xs font-black uppercase tracking-wider">Counted Cash Vault</span>
                                <span className="font-black text-slate-800">₹{countedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Discrepancy Highlight */}
                          <div className={`p-4 rounded-xl border mt-6 transition-all duration-300 ${
                            difference === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            difference > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            'bg-red-50 border-red-200 text-red-700'
                          }`}>
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                              <span>Difference Status</span>
                              <span>{difference === 0 ? 'Balanced (Zero Discrepancy)' : difference > 0 ? 'Surplus' : 'Deficit'}</span>
                            </div>
                            <div className="flex justify-between items-end mt-1">
                              <span className="text-[11px] font-medium text-slate-600">Drawer Count vs Expectancy</span>
                              <span className="text-2xl font-black tracking-tight">
                                {difference >= 0 ? '+' : ''}₹{difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* General Shift Remarks Input */}
                        <div className="glass-panel bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                          <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Shift Handover Remarks (Optional)</label>
                          <textarea 
                            value={generalRemarks}
                            onChange={e => setGeneralRemarks(e.target.value)}
                            placeholder="Describe any special occurrences (e.g. Pump 02 nozzle response lag, UPI QR code scanner scan issues, card machine print rolls out of stock...)"
                            className="w-full text-xs bg-white text-slate-800 rounded-xl focus:border-[#ff6a00] p-3 h-20 border border-slate-200"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Navigation Action Buttons fixed at bottom */}
              <div className="flex justify-between gap-4 border-t border-slate-200/60 pt-4 mt-6 bg-[#f8fafc]">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="h-[48px] px-6 btn-secondary rounded-xl uppercase tracking-wider text-xs font-extrabold cursor-pointer transition-transform"
                  >
                    <i className="fa-solid fa-chevron-left mr-2"></i> Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Return to operator dashboard? Your progress is saved as draft.")) {
                        setView('dashboard')
                      }
                    }}
                    className="h-[48px] px-6 bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200/50 rounded-xl uppercase tracking-wider text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                {currentStep < 7 ? (
                  <button
                    type="button"
                    disabled={!canContinue()}
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="h-[48px] px-8 btn-primary rounded-xl uppercase tracking-wider text-xs font-extrabold cursor-pointer"
                  >
                    Continue <i className="fa-solid fa-chevron-right ml-2"></i>
                  </button>
                ) : (
                  <form onSubmit={handleSubmit} className="shrink-0 w-full sm:w-auto">
                    <button
                      type="submit"
                      disabled={submitting || !canContinue()}
                      className="w-full sm:w-auto h-[48px] px-10 btn-primary rounded-xl uppercase tracking-wider text-xs font-black shadow-md shadow-[#ff6a00]/30 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin mr-3"></i> Submitting...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-cloud-arrow-up mr-3 text-sm"></i> Commit Operations
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
