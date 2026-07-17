'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { NozzleReading, CreditItem } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { pageFadeIn, containerVariants, itemVariants } from '@/lib/motion'

// OCR Imports
import { useOCR } from '@/hooks/useOCR'
import { ReadingCaptureButton } from '@/components/ocr/ReadingCaptureButton'
import { ReadingOCRModal } from '@/components/ocr/ReadingOCRModal'
import { OcrService } from '@/services/ocrService'

// Nozzles Configuration
const NOZZLES: Omit<NozzleReading, 'close' | 'volume'>[] = [
  { id: 'p1n1', label: 'Nozzle 1 (P1)', fuelType: 'petrol', open: 0 },
  { id: 'p1n2', label: 'Nozzle 2 (P1)', fuelType: 'diesel', open: 0 },
  { id: 'p2n3', label: 'Nozzle 3 (P2)', fuelType: 'petrol', open: 0 },
  { id: 'p2n4', label: 'Nozzle 4 (P2)', fuelType: 'diesel', open: 0 },
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

  // AI OCR meter reading hook
  const ocr = useOCR()

  // Draft Management State
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)

  // Step 1: Shift & Staff Details
  const [staffName, setStaffName] = useState('')
  const [shiftType, setShiftType] = useState('Morning Shift')
  const [shiftDate, setShiftDate] = useState('')

  // Step 2: Rates Setup
  const [ratePetrol, setRatePetrol] = useState(0)
  const [rateDiesel, setRateDiesel] = useState(0)
  const [rateOil, setRateOil] = useState(0) // Bulk 2T Oil Rate

  // Step 3: Pump & Oil Readings (Bulk Nozzles + Bottle Oils)
  const [closings, setClosings] = useState<Record<string, string>>({})
  
  // Bottle Oil Sales State
  const [rate20w40, setRate20w40] = useState(0)
  const [qty20w40, setQty20w40] = useState(0)
  const [rate15w40, setRate15w40] = useState(0)
  const [qty15w40, setQty15w40] = useState(0)
  const [rateGear, setRateGear] = useState(0)
  const [qtyGear, setQtyGear] = useState(0)
  const [rateOtherOil, setRateOtherOil] = useState(0)
  const [qtyOtherOil, setQtyOtherOil] = useState(0)

  // Step 4: Calibration Test State
  const [testPerformed, setTestPerformed] = useState(false)
  const [calibrationDetails, setCalibrationDetails] = useState<Record<string, { expected: number; actual: number }>>({
    p1n1: { expected: 20.0, actual: 20.0 },
    p1n2: { expected: 20.0, actual: 20.0 },
    p2n3: { expected: 20.0, actual: 20.0 },
    p2n4: { expected: 20.0, actual: 20.0 },
  })

  // Step 5: Payments & Expenses State
  const [gpay, setGpay] = useState(0)
  const [card, setCard] = useState(0)
  const [cashCollection, setCashCollection] = useState(0) // Cash Collection input
  const [expenseOperational, setExpenseOperational] = useState(0)
  const [expenseTea, setExpenseTea] = useState(0)
  const [expenseOther, setExpenseOther] = useState(0)
  const [expenseDesc, setExpenseDesc] = useState('')

  // Step 6: Credit Management State
  const [creditGiven, setCreditGiven] = useState<(CreditItem & { remarks?: string })[]>([])
  const [creditReceived, setCreditReceived] = useState<(CreditItem & { remarks?: string })[]>([])
  const [cgName, setCgName] = useState('')
  const [cgAmt, setCgAmt] = useState('')
  const [cgRemarks, setCgRemarks] = useState('')
  const [crName, setCrName] = useState('')
  const [crAmt, setCrAmt] = useState('')
  const [crRemarks, setCrRemarks] = useState('')

  // Physical Counts
  const [denoms, setDenoms] = useState<Record<number, number>>(
    Object.fromEntries(DENOMINATIONS.map(d => [d, 0]))
  )
  const [oilStock, setOilStock] = useState(0)
  const [bottleOilStock, setBottleOilStock] = useState(0)
  const [othersAmount, setOthersAmount] = useState(0)
  const [othersDesc, setOthersDesc] = useState('')

  // Step 7: Submit & Reconciliation State
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
      rate20w40,
      qty20w40,
      rate15w40,
      qty15w40,
      rateGear,
      qtyGear,
      rateOtherOil,
      qtyOtherOil,
      testPerformed,
      calibrationDetails,
      gpay,
      card,
      cashCollection,
      expenseOperational,
      expenseTea,
      expenseOther,
      expenseDesc,
      creditGiven,
      creditReceived,
      denoms,
      oilStock,
      bottleOilStock,
      othersAmount,
      othersDesc,
      generalRemarks,
      currentStep,
    }
    localStorage.setItem('sai_priya_fuels_draft', JSON.stringify(draftData))
  }, [
    staffName, shiftType, shiftDate, ratePetrol, rateDiesel, rateOil, closings,
    rate20w40, qty20w40, rate15w40, qty15w40, rateGear, qtyGear, rateOtherOil, qtyOtherOil,
    testPerformed, calibrationDetails, gpay, card, cashCollection, expenseOperational,
    expenseTea, expenseOther, expenseDesc, creditGiven, creditReceived, denoms,
    oilStock, bottleOilStock, othersAmount, othersDesc, generalRemarks, currentStep, draftLoaded
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
        setRate20w40(d.rate20w40 ?? 0)
        setQty20w40(d.qty20w40 ?? 0)
        setRate15w40(d.rate15w40 ?? 0)
        setQty15w40(d.qty15w40 ?? 0)
        setRateGear(d.rateGear ?? 0)
        setQtyGear(d.qtyGear ?? 0)
        setRateOtherOil(d.rateOtherOil ?? 0)
        setQtyOtherOil(d.qtyOtherOil ?? 0)
        setTestPerformed(d.testPerformed ?? false)
        if (d.calibrationDetails) setCalibrationDetails(d.calibrationDetails)
        setGpay(d.gpay ?? 0)
        setCard(d.card ?? 0)
        setCashCollection(d.cashCollection ?? 0)
        setExpenseOperational(d.expenseOperational ?? 0)
        setExpenseTea(d.expenseTea ?? 0)
        setExpenseOther(d.expenseOther ?? 0)
        setExpenseDesc(d.expenseDesc ?? '')
        setCreditGiven(d.creditGiven ?? [])
        setCreditReceived(d.creditReceived ?? [])
        if (d.denoms) setDenoms(d.denoms)
        setOilStock(d.oilStock ?? 0)
        setBottleOilStock(d.bottleOilStock ?? 0)
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
      'Ravi': '+91 9786543210',
      'Kumar': '+91 9988776655',
      'Satish': '+91 9123456789',
      'Anup': '+91 9443210987',
    }
    if (!name) return { id: '—', mobile: '—' }
    const id = `SPF-${name.slice(0, 3).toUpperCase()}${name.length.toString().padStart(2, '0')}`
    const mobile = mockMobiles[name] || `+91 98765${name.length.toString().padEnd(5, '0')}`
    return { id, mobile }
  }

  const { id: staffId, mobile: staffMobile } = getStaffDetails(staffName)

  // Computations for Step 3 Readings & Bottle Sales
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

  // Bulk 2T dispenser readings
  const bulkOilOpen = openings['oil'] ?? 0
  const bulkOilCloseStr = closings['oil'] ?? ''
  const bulkOilClose = bulkOilCloseStr === '' ? bulkOilOpen : parseFloat(bulkOilCloseStr)
  const bulkOilVolume = !isNaN(bulkOilClose) && bulkOilClose >= bulkOilOpen ? bulkOilClose - bulkOilOpen : 0
  const bulkOilValue = bulkOilVolume * rateOil

  // Bottle Oil Sales inline math
  const amt20w40 = qty20w40 * rate20w40
  const amt15w40 = qty15w40 * rate15w40
  const amtGear = qtyGear * rateGear
  const amtOtherOil = qtyOtherOil * rateOtherOil
  const totalBottleOilSales = amt20w40 + amt15w40 + amtGear + amtOtherOil

  // Total sales values
  const petrolSalesVal = nozzleCalcs.filter(n => n.fuelType === 'petrol').reduce((s, n) => s + n.value, 0)
  const dieselSalesVal = nozzleCalcs.filter(n => n.fuelType === 'diesel').reduce((s, n) => s + n.value, 0)
  const totalOilSalesVal = bulkOilValue + totalBottleOilSales

  const grossSales = petrolSalesVal + dieselSalesVal + totalOilSalesVal

  // Calibration checks
  const testCost = testPerformed && grossSales > 0 ? 10 * ratePetrol + 10 * rateDiesel : 0
  const preDeductRevenue = Math.max(0, grossSales - testCost)

  const totalCreditGiven = creditGiven.reduce((s, c) => s + c.amt, 0)
  const totalCreditReceived = creditReceived.reduce((s, c) => s + c.amt, 0)
  const digitalTotal = gpay + card
  
  // Sum of expenses
  const totalExpenses = expenseOperational + expenseTea + expenseOther
  const totalDeductions = digitalTotal + totalCreditGiven + totalExpenses

  // Expected Cash = Revenue after calibration - digital - credit given - expenses + credit recovered
  const expectedCash = Math.max(0, preDeductRevenue - totalDeductions + totalCreditReceived)
  
  // Total cash counted from denominations
  const countedCash = DENOMINATIONS.reduce((s, d) => s + (denoms[d] || 0) * d, 0)
  const difference = countedCash - expectedCash

  const petrolLitres = nozzleCalcs.filter(n => n.fuelType === 'petrol').reduce((s, n) => s + n.volume, 0) - (testPerformed ? 10 : 0)
  const dieselLitres = nozzleCalcs.filter(n => n.fuelType === 'diesel').reduce((s, n) => s + n.volume, 0) - (testPerformed ? 10 : 0)

  // Step validations
  const canContinue = () => {
    if (currentStep === 1) {
      return !!staffName && !!shiftDate && !!shiftType
    }
    if (currentStep === 2) {
      return ratePetrol > 0 && rateDiesel > 0 && rateOil > 0
    }
    if (currentStep === 3) {
      // Validate bulk nozzles
      for (const n of NOZZLES) {
        if (!closings[n.id] || closings[n.id] === '') return false
        const open = openings[n.id] ?? 0
        const close = parseFloat(closings[n.id])
        if (isNaN(close) || close < open) return false
      }
      // Validate bulk 2T oil dispenser
      if (!closings['oil'] || closings['oil'] === '') return false
      const closeOil = parseFloat(closings['oil'])
      if (isNaN(closeOil) || closeOil < bulkOilOpen) return false
      return true
    }
    if (currentStep === 4) {
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
      if (totalExpenses > 0 && !expenseDesc.trim()) return false
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

    // Merge multi-field expenses descriptions
    const mergedExpenseDesc = `Operational: ₹${expenseOperational}, Tea: ₹${expenseTea}, Other: ₹${expenseOther} | Details: ${expenseDesc || 'None'} ${
      generalRemarks ? `| Shift Remarks: ${generalRemarks}` : ''
    }`

    // Store custom fields in the denominations JSONB structure
    const savedDenoms = {
      ...denoms,
      oil_stock: oilStock,
      bottle_oil_stock: bottleOilStock,
      others_amount: othersAmount,
      others_desc: othersDesc,
      cash_collection_step5: cashCollection,
      bottle_oil_sales: {
        oil20w40: { rate: rate20w40, qty: qty20w40, amount: amt20w40 },
        oil15w40: { rate: rate15w40, qty: qty15w40, amount: amt15w40 },
        gear: { rate: rateGear, qty: qtyGear, amount: amtGear },
        other: { rate: rateOtherOil, qty: qtyOtherOil, amount: amtOtherOil }
      }
    }

    // Prepare readings array
    const readingsPayload = nozzleCalcs.map(n => ({
      id: n.id,
      label: n.label,
      fuelType: n.fuelType,
      open: n.open,
      close: n.close,
      volume: n.volume
    }))
    // Append bulk oil dispenser to nozzle readings
    readingsPayload.push({
      id: 'oil',
      label: 'Dispenser (Bulk 2T)',
      fuelType: 'oil',
      open: bulkOilOpen,
      close: bulkOilClose,
      volume: bulkOilVolume
    })

    const { data: shiftData, error } = await supabase.from('fuel_entries').insert({
      created_at: finalDateObj.toISOString(),
      shift_date: shiftDateOnly,
      shift_type: shiftType,
      staff_name: staffName,
      rate_petrol: ratePetrol,
      rate_diesel: rateDiesel,
      rate_oil: rateOil,
      nozzle_readings: readingsPayload,
      gpay_amount: gpay,
      card_amount: card,
      expense_amount: totalExpenses,
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

    // Process and upload OCR audit logs to Supabase Storage
    try {
      const nozzleIds = Object.keys(ocr.ocrRecords)
      for (const nid of nozzleIds) {
        const record = ocr.ocrRecords[nid]
        const fileName = `shift_${shiftData.id}_nozzle_${nid}_${Date.now()}.png`
        
        // Upload image to storage
        const publicUrl = await OcrService.uploadReadingImage(record.base64, fileName)
        
        // Log details in audit table
        const pumpName = nid.startsWith('p1') ? 'Terminal Pump 01' : 'Terminal Pump 02'
        const nozzleLabel = NOZZLES.find(nz => nz.id === nid)?.label || (nid === 'oil' ? 'Dispenser (Bulk 2T)' : nid)
        
        await OcrService.insertOcrAuditLog({
          image_url: publicUrl,
          ocr_reading: record.ocr_reading,
          final_reading: parseFloat(closings[nid]),
          confidence: record.confidence,
          ocr_engine: record.ocr_engine || 'Tesseract.js',
          processing_time_ms: record.speedMs,
          verified_by: staffName,
          reading_type: 'closing',
          pump_number: pumpName,
          nozzle_number: nozzleLabel,
          shift_id: shiftData.id
        })
      }
    } catch (ocrErr) {
      console.error('Failed to save OCR audit log details:', ocrErr)
    }

    // WhatsApp Message Summary
    try {
      const formattedDate = String(finalDateObj.getDate()).padStart(2, '0') + '/' + String(finalDateObj.getMonth() + 1).padStart(2, '0') + '/' + finalDateObj.getFullYear()
      const approvalLink = `${window.location.origin}/api/approve-shift?id=${shiftData?.id || ''}`
      
      const whatsappMsg = `⛽ SHIFT SUBMITTED — SAI PRIYA FUELS

👤 Staff Operator: ${staffName} (ID: ${staffId})
📅 Date & Shift: ${formattedDate} (${shiftType})

📊 SALES SUMMARY:
• Petrol Sold: ${Math.max(0, petrolLitres).toFixed(2)} L (₹${petrolSalesVal.toLocaleString()})
• Diesel Sold: ${Math.max(0, dieselLitres).toFixed(2)} L (₹${dieselSalesVal.toLocaleString()})
• 2T Oil Bulk Sold: ${bulkOilVolume.toFixed(2)} L (₹${bulkOilValue.toLocaleString()})
• Bottle Oil Sales: ₹${totalBottleOilSales.toLocaleString()}
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
• Total Expenses: ₹${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
• Credit Issued: ₹${totalCreditGiven.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
• Credit Recovered: ₹${totalCreditReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}

💵 VAULT DISCREPANCY:
• Expected Cash: ₹${expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
• Counted Cash: ₹${countedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
• Discrepancy: ₹${difference >= 0 ? '+' : ''}${difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${difference === 0 ? 'Balanced' : difference > 0 ? 'Surplus' : 'Deficit'})

🛢️ INVENTORY PHYSICAL COUNT:
• 2T Oil Stock: ${oilStock} L
• Bottle Oil Stock: ${bottleOilStock} Bottles
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
  const lastEntryRecord = recentEntries?.[0]
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
              className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl text-left relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#FF6600]"></div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-4 text-[#FF6600]">
                <i className="fa-solid fa-file-signature text-xl"></i>
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Restore Previous Draft?</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                We detected an incomplete shift entry saved as draft. Do you want to resume entering details or clear it and start fresh?
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleRestoreDraft}
                  className="flex-1 py-3 px-4 btn-primary rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Resume Draft
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

      {/* 2. SUCCESS SCREEN WITH PRINT OPTION */}
      {submitted && (
        <motion.div 
          variants={pageFadeIn}
          initial="hidden"
          animate="show"
          className="min-h-[70vh] flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg bg-white border border-slate-200 p-8 rounded-3xl shadow-xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#FF6600] to-[#003366]"></div>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 20 }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-200 bg-emerald-50 text-emerald-500"
            >
              <i className="fa-solid fa-check text-2xl"></i>
            </motion.div>
            
            <h2 className="text-xl font-black text-slate-800 mb-1 tracking-tight">Shift Report Committed</h2>
            <p className="text-slate-400 font-medium text-xs">Reference ID: {submittedRefId.toUpperCase()}</p>
            
            {/* Styled Printable Shift Summary Card */}
            <div id="print-area" className="bg-slate-50 border border-slate-200/80 mt-6 p-6 rounded-2xl text-left text-slate-700 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-extrabold text-[#003366] text-sm">Sai Priya Fuels</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Shift Ledger Summary</p>
                </div>
                <div className="text-right text-[10px] text-slate-500 font-semibold font-mono">
                  {new Date().toLocaleDateString('en-IN')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Operator Name</span>
                  <span className="text-slate-800 font-bold">{staffName} ({staffId})</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Shift Schedule</span>
                  <span className="text-slate-800 font-bold">{shiftType}</span>
                </div>
              </div>

              <div className="h-px bg-slate-200 w-full"></div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Fuel & Oil Revenue</span>
                  <span className="font-bold text-slate-800">₹{grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {testPerformed && (
                  <div className="flex justify-between text-red-500">
                    <span>Calibration Deductions</span>
                    <span>-₹{testCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">GPay & POS Swipes</span>
                  <span className="font-bold text-slate-800">₹{digitalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shift Payout Expenses</span>
                  <span className="font-bold text-slate-800">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Credit Balance Adjustments</span>
                  <span className="font-bold text-slate-800">₹{(totalCreditGiven - totalCreditReceived).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="h-px bg-slate-200 w-full"></div>

              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">Expected Cash vault</span>
                <span className="font-extrabold text-[#003366]">₹{expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">Counted Cash vault</span>
                <span className="font-extrabold text-[#003366]">₹{countedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className={`p-3.5 rounded-xl border flex justify-between items-center text-xs font-bold ${
                difference === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                difference > 0 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                <span>Discrepancy (Counted - Expected)</span>
                <span className="font-extrabold font-mono text-sm">
                  {difference >= 0 ? '+' : ''}₹{difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 btn-secondary rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                <i className="fa-solid fa-print mr-2"></i> Print Shift Summary
              </button>
              
              <button
                onClick={() => {
                  setSubmitted(false)
                  setSubmittedRefId('')
                  setClosings({})
                  setGpay(0)
                  setCard(0)
                  setCashCollection(0)
                  setExpenseOperational(0)
                  setExpenseTea(0)
                  setExpenseOther(0)
                  setExpenseDesc('')
                  setCreditGiven([])
                  setCreditReceived([])
                  setDenoms(Object.fromEntries(DENOMINATIONS.map(d => [d, 0])))
                  setOilStock(0)
                  setBottleOilStock(0)
                  setOthersAmount(0)
                  setOthersDesc('')
                  setGeneralRemarks('')
                  setView('dashboard')
                  setCurrentStep(1)
                }}
                className="flex-1 py-3 btn-primary rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                <i className="fa-solid fa-house mr-2"></i> Return Home
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. CORE VIEWS */}
      {!submitted && (
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            
            /* ================= OPERATOR DASHBOARD VIEW ================= */
            <motion.div
              key="dashboard"
              variants={pageFadeIn}
              initial="hidden"
              animate="show"
              exit="exit"
              className="space-y-6"
            >
              {/* Header card with branding */}
              <div className="glass-panel border-l-4 border-l-[#FF6600] bg-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                    Terminal Access System
                  </div>
                  <h1 className="text-2xl font-black text-[#003366] tracking-tight mt-2.5">Sai Priya Fuels</h1>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Guided shift handover ledger log panel for station operators.
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    setView('wizard')
                    setCurrentStep(1)
                  }}
                  className="px-6 py-3.5 btn-primary uppercase tracking-wider text-xs font-black shadow-md cursor-pointer shrink-0"
                >
                  <i className="fa-solid fa-circle-plus mr-2 text-sm"></i> Start New Shift Entry
                </button>
              </div>

              {/* Stats Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel bg-white p-5 border border-slate-200/80 shadow-sm rounded-2xl">
                  <div className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Last Expected Cash</div>
                  <div className="text-2xl font-black text-slate-800 mt-1.5">
                    {lastEntryRecord ? `₹${(lastEntryRecord.expected_cash || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0'}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 mt-1">
                    {lastEntryRecord ? `Staff: ${lastEntryRecord.staff_name}` : 'No previous log'}
                  </div>
                </div>
                
                <div className="glass-panel bg-white p-5 border border-slate-200/80 shadow-sm rounded-2xl">
                  <div className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Last Counted Cash</div>
                  <div className="text-2xl font-black text-slate-800 mt-1.5">
                    {lastEntryRecord ? `₹${(lastEntryRecord.counted_cash || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0'}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 mt-1">
                    {lastEntryRecord ? `Date: ${lastEntryRecord.shift_date}` : '—'}
                  </div>
                </div>

                <div className={`glass-panel p-5 border shadow-sm rounded-2xl ${
                  lastDiff === 0 ? 'bg-emerald-50/50 border-emerald-100' :
                  lastDiff > 0 ? 'bg-amber-50/50 border-amber-100' : 'bg-rose-50/50 border-rose-100'
                }`}>
                  <div className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Last Shift Discrepancy</div>
                  <div className={`text-2xl font-black mt-1.5 ${
                    lastDiff === 0 ? 'text-emerald-700' :
                    lastDiff > 0 ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {lastDiff >= 0 ? '+' : ''}₹{lastDiff.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                    {lastDiff === 0 ? 'Optimal (Balanced)' : lastDiff > 0 ? 'Surplus' : 'Deficit'}
                  </div>
                </div>
              </div>

              {/* Table list of recent entries */}
              <div className="glass-panel bg-white border border-slate-200/80 shadow-sm p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                    <i className="fa-solid fa-clock-rotate-left text-[#FF6600]"></i> Recent Shift Submissions
                  </h3>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Last 10 Logs</span>
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
                            <td className="px-4 py-3.5 text-slate-500 font-bold">{e.shift_type?.replace(' Shift', '')}</td>
                            <td className="px-4 py-3.5 text-[#FF6600] font-bold">₹{e.gross_sales?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                            <td className="px-4 py-3.5 text-slate-600 font-semibold">₹{e.expected_cash?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                            <td className="px-4 py-3.5 text-slate-600 font-semibold">₹{e.counted_cash?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                            <td className={`px-4 py-3.5 font-black tracking-tight ${diff === 0 ? 'text-[#22C55E]' : diff > 0 ? 'text-amber-600' : 'text-[#EF4444]'}`}>
                              {diff >= 0 ? '+' : ''}₹{diff.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`badge py-0.5 px-2 rounded text-[8px] ${
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
            
            /* ================= GUIDED WIZARD FLOW ================= */
            <motion.div
              key="wizard"
              variants={pageFadeIn}
              initial="hidden"
              animate="show"
              exit="exit"
              className="space-y-6"
            >
              {/* Stepper Header (Always Visible) */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-sm sticky top-[72px] z-40 backdrop-blur-md">
                
                {/* Horizontal Progress Timeline (Desktop) */}
                <div className="hidden md:flex justify-between items-center relative select-none">
                  {/* Connecting lines */}
                  <div className="absolute top-1/2 left-[5%] right-[5%] h-0.5 bg-slate-200 -translate-y-1/2 z-0">
                    <div 
                      className="h-full bg-gradient-to-r from-[#FF6600] to-[#22C55E] transition-all duration-300"
                      style={{ width: `${((currentStep - 1) / 6) * 100}%` }}
                    />
                  </div>
                  
                  {[
                    { nr: 1, label: 'Shift Details', icon: 'fa-user-clock' },
                    { nr: 2, label: 'Rates Setup', icon: 'fa-indian-rupee-sign' },
                    { nr: 3, label: 'Pump Readings', icon: 'fa-gauge-high' },
                    { nr: 4, label: 'Calibration', icon: 'fa-clipboard-check' },
                    { nr: 5, label: 'Payments', icon: 'fa-wallet' },
                    { nr: 6, label: 'Credits & Count', icon: 'fa-calculator' },
                    { nr: 7, label: 'Reconciliation', icon: 'fa-check-double' }
                  ].map((s) => {
                    const isCompleted = currentStep > s.nr
                    const isActive = currentStep === s.nr
                    
                    return (
                      <div key={s.nr} className="flex flex-col items-center z-10 w-24">
                        <div 
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border shadow-sm transition-all duration-300 ${
                            isCompleted ? 'bg-[#22C55E] border-[#22C55E] text-white' :
                            isActive ? 'bg-[#FF6600] border-[#FF6600] text-white shadow-[#FF6600]/25' :
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
                          isActive ? 'text-[#FF6600] font-black' : isCompleted ? 'text-[#22C55E]' : 'text-slate-400'
                        }`}>
                          STEP {s.nr}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 tracking-wider uppercase">{s.label}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Mobile Stepper Header */}
                <div className="flex md:hidden justify-between items-center select-none">
                  <button 
                    type="button" 
                    onClick={() => {
                      if (window.confirm("Return to Dashboard? Draft will be saved.")) {
                        setView('dashboard')
                      }
                    }}
                    className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 active:bg-slate-100"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                  </button>
                  <div className="text-center">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-[#FF6600]">Sai Priya Fuels</span>
                    <h2 className="text-xs font-black text-slate-800">
                      Step {currentStep} of 7: {
                        currentStep === 1 ? 'Shift & Staff Details' :
                        currentStep === 2 ? 'Fuel Rate Setup' :
                        currentStep === 3 ? 'Pump & Oil Readings' :
                        currentStep === 4 ? 'Calibration Test' :
                        currentStep === 5 ? 'Payments & Expenses' :
                        currentStep === 6 ? 'Credits & Physical Count' : 'Reconciliation'
                      }
                    </h2>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-xs font-bold text-[#FF6600]">
                    {Math.round((currentStep / 7) * 100)}%
                  </div>
                </div>

                {/* Mobile progress line */}
                <div className="md:hidden w-full h-1 bg-slate-100 mt-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#FF6600] to-[#22C55E] transition-all duration-300"
                    style={{ width: `${(currentStep / 7) * 100}%` }}
                  />
                </div>
              </div>

              {/* Wizard Cards Wrapper */}
              <div className="min-h-[50vh]">
                
                {/* ================= STEP 1: SHIFT DETAILS ================= */}
                {currentStep === 1 && (
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                    <div className="glass-panel bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF6600] border border-orange-100 flex items-center justify-center">
                          <i className="fa-solid fa-user-clock text-xs"></i>
                        </div>
                        Shift & Staff Details
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Date Picker */}
                        <div>
                          <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Date</label>
                          <input 
                            type="datetime-local" 
                            value={shiftDate} 
                            onChange={e => setShiftDate(e.target.value)} 
                            required 
                            className="w-full h-12 bg-white border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-4" 
                          />
                        </div>

                        {/* Shift Segmented Toggle */}
                        <div>
                          <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Shift Protocol</label>
                          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 h-12 items-center">
                            <button
                              type="button"
                              onClick={() => setShiftType('Morning Shift')}
                              className={`flex-1 h-10 rounded-lg text-xs font-bold transition-all ${
                                shiftType === 'Morning Shift'
                                  ? 'bg-[#FF6600] text-white shadow'
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              Morning
                            </button>
                            <button
                              type="button"
                              onClick={() => setShiftType('Night Shift')}
                              className={`flex-1 h-10 rounded-lg text-xs font-bold transition-all ${
                                shiftType === 'Night Shift'
                                  ? 'bg-[#FF6600] text-white shadow'
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              Evening
                            </button>
                          </div>
                        </div>

                        {/* Staff Name Dropdown */}
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Staff Name</label>
                          <select 
                            required 
                            value={staffName} 
                            onChange={e => setStaffName(e.target.value)} 
                            className="w-full h-12 bg-white border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-3 cursor-pointer"
                          >
                            <option value="" disabled>Select Operator Name</option>
                            {staffNames.map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Auto-filled details */}
                        {staffName && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200/50 p-4 rounded-xl text-slate-700"
                          >
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Staff ID (Auto)</span>
                              <span className="text-xs font-mono font-bold text-slate-800">{staffId}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Mobile Number (Auto)</span>
                              <span className="text-xs font-mono font-bold text-slate-800">{staffMobile}</span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ================= STEP 2: FUEL RATE SETUP ================= */}
                {currentStep === 2 && (
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                    <div className="glass-panel bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF6600] border border-orange-100 flex items-center justify-center">
                          <i className="fa-solid fa-indian-rupee-sign text-xs"></i>
                        </div>
                        Fuel Rate Setup (₹/L)
                      </h3>

                      <div className="space-y-4">
                        {/* Petrol Rate */}
                        <div>
                          <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Petrol Rate (₹/L)</label>
                          <div className="relative flex items-center">
                            <span className="absolute left-4 font-black text-slate-400 text-sm">₹</span>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              value={ratePetrol || ''}
                              onChange={e => setRatePetrol(parseFloat(e.target.value) || 0)}
                              className="pl-9 w-full h-12 bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-xl" 
                            />
                          </div>
                        </div>

                        {/* Diesel Rate */}
                        <div>
                          <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Diesel Rate (₹/L)</label>
                          <div className="relative flex items-center">
                            <span className="absolute left-4 font-black text-slate-400 text-sm">₹</span>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              value={rateDiesel || ''}
                              onChange={e => setRateDiesel(parseFloat(e.target.value) || 0)}
                              className="pl-9 w-full h-12 bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-xl" 
                            />
                          </div>
                        </div>

                        {/* 2T Oil Rate */}
                        <div>
                          <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">2T Oil Rate (₹/L)</label>
                          <div className="relative flex items-center">
                            <span className="absolute left-4 font-black text-slate-400 text-sm">₹</span>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              value={rateOil || ''}
                              onChange={e => setRateOil(parseFloat(e.target.value) || 0)}
                              className="pl-9 w-full h-12 bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-xl" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ================= STEP 3: PUMP & OIL READINGS ================= */}
                {currentStep === 3 && (
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                    
                    {/* A. Fuels - Terminal Pump Readings */}
                    {[
                      { pump: 'Terminal Pump 01', nozzles: nozzleCalcs.slice(0, 2) },
                      { pump: 'Terminal Pump 02', nozzles: nozzleCalcs.slice(2, 4) }
                    ].map((section, sidx) => (
                      <div key={sidx} className="glass-panel bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                        <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase flex items-center gap-2 border-b border-slate-100 pb-3">
                          <i className="fa-solid fa-gas-pump text-[#FF6600]"></i>
                          {section.pump}
                        </h4>

                        {section.nozzles.map(n => {
                          const open = openings[n.id] ?? 0
                          const closeVal = closings[n.id] ?? ''
                          const volume = n.volume
                          const isError = closeVal !== '' && parseFloat(closeVal) < open

                          return (
                            <div key={n.id} className="p-4 bg-slate-50/50 border border-slate-200/40 rounded-2xl flex flex-col gap-3">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-xs text-slate-800">{n.label}</span>
                                <span className={`badge py-0.5 px-2 rounded text-[8px] ${
                                  n.fuelType === 'petrol' ? 'petrol-badge' : 'diesel-badge'
                                }`}>{n.fuelType.toUpperCase()}</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Opening Reading */}
                                <div>
                                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Opening (L)</label>
                                  <input 
                                    type="text" 
                                    value={open.toFixed(2)}
                                    readOnly 
                                    className="w-full h-11 bg-slate-100 text-slate-500 font-mono font-bold border border-slate-200 rounded-xl text-center cursor-not-allowed" 
                                  />
                                </div>

                                {/* Closing Reading */}
                                <div className="relative">
                                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Closing (L)</label>
                                  <div className="relative">
                                    <input 
                                      type="number" 
                                      step="0.01"
                                      placeholder="0.00"
                                      value={closeVal}
                                      onChange={e => {
                                        if (ocr.ocrVerified[n.id]) {
                                          ocr.clearOcrNozzle(n.id)
                                        }
                                        setClosings(prev => ({ ...prev, [n.id]: e.target.value }))
                                      }}
                                      className={`w-full h-11 bg-white font-mono font-bold text-slate-800 text-center rounded-xl border pr-10 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/10 ${
                                        isError ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-[#FF6600]'
                                      }`} 
                                    />
                                    {ocr.ocrVerified[n.id] && (
                                      <span className="absolute left-3 top-[14px] bg-green-50 text-[#22C55E] border border-green-150 text-[7px] font-extrabold px-1 py-0.5 rounded flex items-center gap-0.5 select-none pointer-events-none z-10">
                                        ✓ AI Read
                                      </span>
                                    )}
                                    <ReadingCaptureButton 
                                      onImageSelected={(dataUrl) => ocr.startOcrFlow(n.id, n.label, open, dataUrl)}
                                      disabled={submitting}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Sales Calculation */}
                              <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-slate-100">
                                <span className="text-slate-400">Sale Litres</span>
                                {isError ? (
                                  <span className="text-[10px] text-red-500 font-bold leading-normal block">
                                    <i className="fa-solid fa-triangle-exclamation mr-1"></i> Less than Opening
                                  </span>
                                ) : volume > 0 ? (
                                  <span className="text-[#22C55E] font-mono font-black text-sm block">
                                    +{volume.toFixed(2)} Litres
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-semibold block">0.00 Litres</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))}

                    {/* B. 2T Oil Dispenser (Bulk Oil) */}
                    <div className="glass-panel bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase flex items-center gap-2 border-b border-slate-100 pb-3">
                        <i className="fa-solid fa-oil-can text-purple-600"></i>
                        2T Oil Dispenser (Bulk Oil)
                      </h4>

                      <div className="p-4 bg-slate-50/50 border border-slate-200/40 rounded-2xl flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-slate-800">2T Bulk Dispenser</span>
                          <span className="badge py-0.5 px-2 rounded text-[8px] oil-badge">OIL</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Opening (L)</label>
                            <input 
                              type="text" 
                              value={bulkOilOpen.toFixed(2)}
                              readOnly 
                              className="w-full h-11 bg-slate-100 text-slate-500 font-mono font-bold border border-slate-200 rounded-xl text-center cursor-not-allowed" 
                            />
                          </div>

                          <div className="relative">
                            <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Closing (L)</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00"
                                value={bulkOilCloseStr}
                                onChange={e => {
                                  if (ocr.ocrVerified['oil']) {
                                    ocr.clearOcrNozzle('oil')
                                  }
                                  setClosings(prev => ({ ...prev, oil: e.target.value }))
                                }}
                                className={`w-full h-11 bg-white font-mono font-bold text-slate-800 text-center rounded-xl border pr-10 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/10 ${
                                  bulkOilCloseStr !== '' && parseFloat(bulkOilCloseStr) < bulkOilOpen ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-[#FF6600]'
                                }`} 
                              />
                              {ocr.ocrVerified['oil'] && (
                                <span className="absolute left-3 top-[14px] bg-green-50 text-[#22C55E] border border-green-150 text-[7px] font-extrabold px-1 py-0.5 rounded flex items-center gap-0.5 select-none pointer-events-none z-10">
                                  ✓ AI Read
                                </span>
                              )}
                              <ReadingCaptureButton 
                                onImageSelected={(dataUrl) => ocr.startOcrFlow('oil', 'Dispenser (Bulk 2T)', bulkOilOpen, dataUrl)}
                                disabled={submitting}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-slate-100">
                          <span className="text-slate-400">Sale Litres</span>
                          {bulkOilCloseStr !== '' && parseFloat(bulkOilCloseStr) < bulkOilOpen ? (
                            <span className="text-[10px] text-red-500 font-bold leading-normal block">
                              <i className="fa-solid fa-triangle-exclamation mr-1"></i> Less than Opening
                            </span>
                          ) : bulkOilVolume > 0 ? (
                            <span className="text-[#22C55E] font-mono font-black text-sm block">
                              +{bulkOilVolume.toFixed(2)} Litres
                            </span>
                          ) : (
                            <span className="text-slate-400 font-semibold block">0.00 Litres</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* C. Bottle Oil Sales (New Subsection) */}
                    <div className="glass-panel bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase flex items-center gap-2 border-b border-slate-100 pb-3">
                        <i className="fa-solid fa-bottle-droplet text-[#003366]"></i>
                        Bottle Oil Sales
                      </h4>

                      <div className="space-y-4">
                        {[
                          { label: '20W-40 Oil Sales', rate: rate20w40, qty: qty20w40, setRate: setRate20w40, setQty: setQty20w40, amt: amt20w40 },
                          { label: '15W-40 Oil Sales', rate: rate15w40, qty: qty15w40, setRate: setRate15w40, setQty: setQty15w40, amt: amt15w40 },
                          { label: 'Gear Oil Sales', rate: rateGear, qty: qtyGear, setRate: setRateGear, setQty: setQtyGear, amt: amtGear },
                          { label: 'Other Oil Sales (Optional)', rate: rateOtherOil, qty: qtyOtherOil, setRate: setRateOtherOil, setQty: setQtyOtherOil, amt: amtOtherOil }
                        ].map((prod, pidx) => (
                          <div key={pidx} className="p-4 bg-slate-50/50 border border-slate-200/40 rounded-2xl flex flex-col gap-3">
                            <span className="font-bold text-xs text-slate-700">{prod.label}</span>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Rate (₹/Bottle)</label>
                                <input 
                                  type="number"
                                  min="0"
                                  placeholder="Rate (₹)"
                                  value={prod.rate || ''}
                                  onChange={e => prod.setRate(parseFloat(e.target.value) || 0)}
                                  className="w-full h-11 bg-white border border-slate-200 rounded-xl text-center text-sm font-semibold focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                                />
                              </div>

                              <div>
                                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Quantity Sold</label>
                                <input 
                                  type="number"
                                  min="0"
                                  placeholder="Quantity"
                                  value={prod.qty || ''}
                                  onChange={e => prod.setQty(parseInt(e.target.value) || 0)}
                                  className="w-full h-11 bg-white border border-slate-200 rounded-xl text-center text-sm font-semibold focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                                />
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-slate-100">
                              <span className="text-slate-400">Total Product Amount</span>
                              <span className="text-[#22C55E] font-black text-sm">
                                ₹{prod.amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        ))}

                        <div className="p-4 bg-[#003366] text-white rounded-2xl flex justify-between items-center shadow-md">
                          <span className="font-black uppercase tracking-widest text-[9px]">Total Bottle Oil Sales</span>
                          <span className="text-lg font-black">₹{totalBottleOilSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ================= STEP 4: CALIBRATION TEST ================= */}
                {currentStep === 4 && (
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                    <div className="glass-panel bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-5 select-none">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6600]">
                            <i className="fa-solid fa-flask-vial text-xs"></i>
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Calibration Test Log</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Log daily nozzle quality audits (±0.5% limit)</p>
                          </div>
                        </div>

                        {/* Yes/No Segmented Selector Toggle */}
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 h-10 items-center w-28">
                          <button
                            type="button"
                            onClick={() => setTestPerformed(true)}
                            className={`flex-1 h-8 rounded-lg text-[10px] font-bold transition-all ${
                              testPerformed
                                ? 'bg-[#FF6600] text-white shadow'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setTestPerformed(false)}
                            className={`flex-1 h-8 rounded-lg text-[10px] font-bold transition-all ${
                              !testPerformed
                                ? 'bg-white text-slate-400 border border-slate-100 font-bold shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {testPerformed ? (
                        <div className="space-y-4">
                          <div className="bg-orange-50/50 p-3 border border-orange-100/50 rounded-xl">
                            <span className="text-[9px] font-black uppercase text-orange-700 tracking-widest block">Operational Deduction</span>
                            <p className="text-[10px] text-orange-600 font-medium mt-1 leading-normal">
                              Testing auto-deducts 10L Petrol and 10L Diesel fromexpected vault cash calculations to adjust for quality checking volume.
                            </p>
                          </div>

                          <div className="space-y-4">
                            {[
                              { key: 'p1n1', label: 'P1-N1 Petrol Nozzle' },
                              { key: 'p1n2', label: 'P1-N2 Diesel Nozzle' },
                              { key: 'p2n3', label: 'P2-N3 Petrol Nozzle' },
                              { key: 'p2n4', label: 'P2-N4 Diesel Nozzle' }
                            ].map(nozzle => {
                              const exp = calibrationDetails[nozzle.key]?.expected ?? 20.0
                              const act = calibrationDetails[nozzle.key]?.actual ?? 20.0
                              const diff = act - exp
                              const varPct = exp > 0 ? (diff / exp) * 100 : 0
                              const isPass = Math.abs(varPct) <= 0.5

                              return (
                                <div key={nozzle.key} className="p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl space-y-3">
                                  <span className="font-bold text-xs text-slate-700 block">{nozzle.label}</span>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expected (L)</label>
                                      <input 
                                        type="number"
                                        step="0.01"
                                        value={exp}
                                        onChange={e => setCalibrationDetails(prev => ({
                                          ...prev,
                                          [nozzle.key]: { ...prev[nozzle.key], expected: parseFloat(e.target.value) || 0 }
                                        }))}
                                        className="w-full h-10 bg-slate-50 text-center font-mono font-bold text-slate-700 border border-slate-200 rounded-xl"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Actual (L)</label>
                                      <input 
                                        type="number"
                                        step="0.01"
                                        value={act}
                                        onChange={e => setCalibrationDetails(prev => ({
                                          ...prev,
                                          [nozzle.key]: { ...prev[nozzle.key], actual: parseFloat(e.target.value) || 0 }
                                        }))}
                                        className="w-full h-10 bg-white text-center font-mono font-bold text-slate-800 border border-slate-200 focus:border-[#FF6600] rounded-xl"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-slate-100">
                                    <div className="flex flex-col">
                                      <span className="text-slate-400 text-[9px] uppercase">Variation</span>
                                      <span className={`font-mono font-black ${isPass ? 'text-emerald-600' : 'text-[#EF4444]'}`}>
                                        {diff >= 0 ? '+' : ''}{diff.toFixed(3)} L ({varPct >= 0 ? '+' : ''}{varPct.toFixed(2)}%)
                                      </span>
                                    </div>

                                    <span className={`badge py-1 px-3 rounded text-[8px] font-black ${
                                      isPass ? 'status-verified' : 'status-pending'
                                    }`}>
                                      {isPass ? 'PASS' : 'FAIL'}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-10 text-slate-400 font-semibold border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                          <i className="fa-solid fa-ban text-2xl block mb-2 opacity-50"></i>
                          No calibration checks logged this shift.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ================= STEP 5: PAYMENTS & EXPENSES ================= */}
                {currentStep === 5 && (
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                    <div className="glass-panel bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF6600] border border-orange-100 flex items-center justify-center">
                          <i className="fa-solid fa-receipt text-xs"></i>
                        </div>
                        Payments & Expenses Details
                      </h3>

                      <div className="space-y-4">
                        {/* UPI */}
                        <div>
                          <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">UPI (GPay) Amount (₹)</label>
                          <div className="relative flex items-center">
                            <span className="absolute left-4 font-black text-slate-400 text-sm">₹</span>
                            <input 
                              type="number"
                              min="0"
                              placeholder="0.00"
                              value={gpay || ''}
                              onChange={e => setGpay(parseFloat(e.target.value) || 0)}
                              className="pl-9 w-full h-12 bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-xl"
                            />
                          </div>
                        </div>

                        {/* POS */}
                        <div>
                          <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">POS Swipes Amount (₹)</label>
                          <div className="relative flex items-center">
                            <span className="absolute left-4 font-black text-slate-400 text-sm">₹</span>
                            <input 
                              type="number"
                              min="0"
                              placeholder="0.00"
                              value={card || ''}
                              onChange={e => setCard(parseFloat(e.target.value) || 0)}
                              className="pl-9 w-full h-12 bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-xl"
                            />
                          </div>
                        </div>

                        {/* Cash Collection */}
                        <div>
                          <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Cash Collection (₹)</label>
                          <div className="relative flex items-center">
                            <span className="absolute left-4 font-black text-slate-400 text-sm">₹</span>
                            <input 
                              type="number"
                              min="0"
                              placeholder="0.00"
                              value={cashCollection || ''}
                              onChange={e => setCashCollection(parseFloat(e.target.value) || 0)}
                              className="pl-9 w-full h-12 bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-xl"
                            />
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4 mt-2">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Expenses Log</span>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Operational */}
                            <div>
                              <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Operational Exp. (₹)</label>
                              <input 
                                type="number"
                                min="0"
                                placeholder="0.00"
                                value={expenseOperational || ''}
                                onChange={e => setExpenseOperational(parseFloat(e.target.value) || 0)}
                                className="w-full h-11 bg-white border border-slate-200 text-xs font-semibold rounded-xl text-center"
                              />
                            </div>
                            
                            {/* Tea */}
                            <div>
                              <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tea Expenses (₹)</label>
                              <input 
                                type="number"
                                min="0"
                                placeholder="0.00"
                                value={expenseTea || ''}
                                onChange={e => setExpenseTea(parseFloat(e.target.value) || 0)}
                                className="w-full h-11 bg-white border border-slate-200 text-xs font-semibold rounded-xl text-center"
                              />
                            </div>

                            {/* Other */}
                            <div>
                              <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Other Expenses (₹)</label>
                              <input 
                                type="number"
                                min="0"
                                placeholder="0.00"
                                value={expenseOther || ''}
                                onChange={e => setExpenseOther(parseFloat(e.target.value) || 0)}
                                className="w-full h-11 bg-white border border-slate-200 text-xs font-semibold rounded-xl text-center"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Explanation Notes */}
                        <AnimatePresence>
                          {totalExpenses > 0 && (
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
                                  !expenseDesc.trim() ? 'border-red-300 focus:border-red-450' : 'border-slate-200 focus:border-[#FF6600]'
                                }`}
                              />
                              {!expenseDesc.trim() && (
                                <p className="text-[9px] text-red-500 font-bold mt-1">Please enter explanation notes before continuing.</p>
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
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      
                      {/* Credit Issued */}
                      <div className="credit-given-card bg-white">
                        <div className="flex items-center gap-2 mb-1 text-[#EF4444] font-bold text-sm">
                          <i className="fa-solid fa-file-invoice-dollar"></i>
                          <h4>Credit Issued</h4>
                        </div>
                        <p className="text-[9px] mb-4 text-slate-400 font-semibold uppercase tracking-wider">
                          Fuel given on credit (Deducted from Expected Cash)
                        </p>
                        
                        <div className="flex flex-col gap-3.5 mb-4">
                          <input 
                            type="text" 
                            placeholder="Customer Name / Plate Number" 
                            value={cgName} 
                            onChange={e => setCgName(e.target.value)}
                            className="text-sm bg-white border border-slate-200 text-slate-800 focus:border-[#FF6600] h-[40px] px-3 rounded-lg"
                          />
                          <div className="flex gap-3">
                            <input 
                              type="number" 
                              placeholder="Value (₹)" 
                              value={cgAmt} 
                              onChange={e => setCgAmt(e.target.value)}
                              className="w-full text-sm bg-white border border-slate-200 text-slate-800 focus:border-[#FF6600] h-[40px] px-3 rounded-lg"
                            />
                            <input 
                              type="text" 
                              placeholder="Remarks (optional)" 
                              value={cgRemarks} 
                              onChange={e => setCgRemarks(e.target.value)}
                              className="w-full text-sm bg-white border border-slate-200 text-slate-800 focus:border-[#FF6600] h-[40px] px-3 rounded-lg"
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
                            className="btn-secondary h-[40px] text-xs font-bold border-slate-200 hover:border-red-300 w-full flex items-center justify-center cursor-pointer"
                          >
                            <i className="fa-solid fa-plus text-[#FF6600] mr-1.5"></i> Add Credit Record
                          </button>
                        </div>

                        {/* List */}
                        <ul className="space-y-2 mt-4 max-h-48 overflow-y-auto custom-scrollbar">
                          {creditGiven.map((item, idx) => (
                            <li key={idx} className="flex justify-between items-center py-2 px-3 text-xs bg-slate-50 border border-slate-200/50 rounded-xl">
                              <div className="flex flex-col">
                                <span className="text-slate-700 font-bold">{item.name}</span>
                                {item.remarks && <span className="text-[9px] text-slate-400 font-semibold italic">{item.remarks}</span>}
                              </div>
                              <span className="font-extrabold text-[#EF4444] flex items-center gap-2.5">
                                ₹{item.amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                <button 
                                  type="button" 
                                  onClick={() => setCreditGiven(prev => prev.filter((_, j) => j !== idx))}
                                  className="text-slate-400 hover:text-[#EF4444] hover:bg-red-50 w-5 h-5 flex items-center justify-center rounded border border-slate-200/60 cursor-pointer"
                                >
                                  <i className="fa-solid fa-xmark text-[10px]"></i>
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Credit Recovered */}
                      <div className="credit-received-card bg-white">
                        <div className="flex items-center gap-2 mb-1 text-[#22C55E] font-bold text-sm">
                          <i className="fa-solid fa-file-invoice-dollar"></i>
                          <h4>Credit Recovered</h4>
                        </div>
                        <p className="text-[9px] mb-4 text-slate-400 font-semibold uppercase tracking-wider">
                          Outstanding balance payments collected (Added to Expected Cash)
                        </p>
                        
                        <div className="flex flex-col gap-3.5 mb-4">
                          <input 
                            type="text" 
                            placeholder="Customer Name / Plate Number" 
                            value={crName} 
                            onChange={e => setCrName(e.target.value)}
                            className="text-sm bg-white border border-slate-200 text-slate-800 focus:border-[#FF6600] h-[40px] px-3 rounded-lg"
                          />
                          <div className="flex gap-3">
                            <input 
                              type="number" 
                              placeholder="Value (₹)" 
                              value={crAmt} 
                              onChange={e => setCrAmt(e.target.value)}
                              className="w-full text-sm bg-white border border-slate-200 text-slate-800 focus:border-[#FF6600] h-[40px] px-3 rounded-lg"
                            />
                            <input 
                              type="text" 
                              placeholder="Remarks (optional)" 
                              value={crRemarks} 
                              onChange={e => setCrRemarks(e.target.value)}
                              className="w-full text-sm bg-white border border-slate-200 text-slate-800 focus:border-[#FF6600] h-[40px] px-3 rounded-lg"
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
                            className="btn-secondary h-[40px] text-xs font-bold border-slate-200 hover:border-emerald-300 w-full flex items-center justify-center cursor-pointer"
                          >
                            <i className="fa-solid fa-plus text-[#FF6600] mr-1.5"></i> Add Recovery Record
                          </button>
                        </div>

                        {/* List */}
                        <ul className="space-y-2 mt-4 max-h-48 overflow-y-auto custom-scrollbar">
                          {creditReceived.map((item, idx) => (
                            <li key={idx} className="flex justify-between items-center py-2 px-3 text-xs bg-slate-50 border border-slate-200/50 rounded-xl">
                              <div className="flex flex-col">
                                <span className="text-slate-700 font-bold">{item.name}</span>
                                {item.remarks && <span className="text-[9px] text-slate-400 font-semibold italic">{item.remarks}</span>}
                              </div>
                              <span className="font-extrabold text-[#22C55E] flex items-center gap-2.5">
                                ₹{item.amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                <button 
                                  type="button" 
                                  onClick={() => setCreditReceived(prev => prev.filter((_, j) => j !== idx))}
                                  className="text-slate-400 hover:text-[#EF4444] hover:bg-red-50 w-5 h-5 flex items-center justify-center rounded border border-slate-200/60 cursor-pointer"
                                >
                                  <i className="fa-solid fa-xmark text-[10px]"></i>
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Physical Count Card */}
                    <div className="glass-panel bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                      <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase flex items-center gap-3">
                        <i className="fa-solid fa-wallet text-emerald-600 animate-pulse"></i>
                        Physical Count & Inventory Stock
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

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
                        {/* 2T Oil Stock */}
                        <div className="bg-purple-50/20 p-3.5 border border-purple-100/50 rounded-xl">
                          <label className="block text-[9px] font-bold text-purple-700 uppercase tracking-widest mb-1.5">2T Oil Stock (L)</label>
                          <input 
                            type="number" 
                            min="0"
                            placeholder="0"
                            value={oilStock || ''}
                            onChange={e => setOilStock(parseFloat(e.target.value) || 0)}
                            className="w-full h-9 bg-white border border-slate-200 text-xs font-bold text-slate-800 text-center rounded-lg" 
                          />
                        </div>

                        {/* Bottle Oil Stock */}
                        <div className="bg-blue-50/20 p-3.5 border border-blue-100/50 rounded-xl">
                          <label className="block text-[9px] font-bold text-blue-700 uppercase tracking-widest mb-1.5">Bottle Oil Stock (Qty)</label>
                          <input 
                            type="number" 
                            min="0"
                            placeholder="0"
                            value={bottleOilStock || ''}
                            onChange={e => setBottleOilStock(parseInt(e.target.value) || 0)}
                            className="w-full h-9 bg-white border border-slate-200 text-xs font-bold text-slate-800 text-center rounded-lg" 
                          />
                        </div>

                        {/* Others Count */}
                        <div className="bg-slate-50 p-3.5 border border-slate-200/50 rounded-xl">
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Others Count (₹)</label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              min="0"
                              placeholder="₹"
                              value={othersAmount || ''}
                              onChange={e => setOthersAmount(parseFloat(e.target.value) || 0)}
                              className="w-1/2 h-9 bg-white border border-slate-200 text-xs font-bold text-slate-800 text-center rounded-lg" 
                            />
                            <input 
                              type="text" 
                              placeholder="Details"
                              value={othersDesc}
                              onChange={e => setOthersDesc(e.target.value)}
                              className="w-1/2 h-9 bg-white border border-slate-200 text-[10px] text-slate-700 rounded-lg px-2" 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center shadow-md">
                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Drawer Cash Vault</span>
                        <span className="text-xl font-black text-emerald-450">₹{countedCash.toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ================= STEP 7: RECONCILIATION SUMMARY ================= */}
                {currentStep === 7 && (
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Left: Summary breakdown list */}
                      <div className="space-y-6">
                        
                        {/* Fuel Sales Summary */}
                        <div className="glass-panel bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-100 pb-2">Fuel Sales Summary</h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100 font-semibold">
                              <span className="text-slate-500">Petrol Sales</span>
                              <span className="font-bold text-slate-800">
                                {petrolLitres.toFixed(2)} L (₹{petrolSalesVal.toLocaleString()})
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 font-semibold">
                              <span className="text-slate-500">Diesel Sales</span>
                              <span className="font-bold text-slate-800">
                                {dieselLitres.toFixed(2)} L (₹{dieselSalesVal.toLocaleString()})
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 font-semibold">
                              <span className="text-slate-500">Oil Sales (Bulk + Bottle)</span>
                              <span className="font-bold text-slate-800">
                                ₹{totalOilSalesVal.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Deductions & Expenses */}
                        <div className="glass-panel bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-100 pb-2">Financial Deductions</h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100 font-semibold">
                              <span className="text-slate-500">UPI/GPay receipts</span>
                              <span className="font-bold text-slate-800">₹{gpay.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 font-semibold">
                              <span className="text-slate-500">POS Card Swipes</span>
                              <span className="font-bold text-slate-800">₹{card.toLocaleString()}</span>
                            </div>
                            {testPerformed && (
                              <div className="flex justify-between py-1 border-b border-slate-100 font-semibold text-[#EF4444]">
                                <span>Calibration deduction</span>
                                <span className="font-bold">-₹{testCost.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between py-1 border-b border-slate-100 font-semibold">
                              <span className="text-slate-500">Operational Expenses</span>
                              <span className="font-bold text-slate-800">
                                ₹{totalExpenses.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 font-semibold text-[#EF4444]">
                              <span>Credit Issued</span>
                              <span className="font-bold">-₹{totalCreditGiven.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 font-semibold text-[#22C55E]">
                              <span>Credit Recovered</span>
                              <span className="font-bold">+₹{totalCreditReceived.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Net reconciliation */}
                      <div className="space-y-6">
                        
                        <div className="glass-panel bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 border-b border-slate-100 pb-2">Collection Summary</h4>
                            
                            <div className="space-y-3.5 text-sm font-semibold">
                              <div className="flex justify-between py-1 hover:bg-slate-50 rounded px-2">
                                <span className="text-slate-500 text-xs">Expected Collection (₹)</span>
                                <span className="font-extrabold text-slate-800">₹{expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between py-1 hover:bg-slate-50 rounded px-2">
                                <span className="text-slate-500 text-xs">Actual Collection (Cash in Hand) (₹)</span>
                                <span className="font-extrabold text-slate-800">₹{countedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Discrepancy block */}
                          <div className={`p-4 rounded-xl border mt-6 transition-all duration-300 ${
                            difference === 0 ? 'bg-emerald-50 border-emerald-200 text-[#22C55E]' :
                            difference > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            'bg-red-50 border-red-200 text-[#EF4444]'
                          }`}>
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                              <span>Net Difference</span>
                              <span>{difference === 0 ? 'Balanced' : difference > 0 ? 'Surplus' : 'Deficit'}</span>
                            </div>
                            <div className="flex justify-between items-end mt-1">
                              <span className="text-[11px] font-medium text-slate-600">Reconciliation Offset</span>
                              <span className="text-2xl font-black tracking-tight">
                                {difference >= 0 ? '+' : ''}₹{difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Handover remarks */}
                        <div className="glass-panel bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Shift Remarks (Optional)</label>
                          <textarea 
                            value={generalRemarks}
                            onChange={e => setGeneralRemarks(e.target.value)}
                            placeholder="Enter shift handover comments..."
                            className="w-full text-xs bg-white text-slate-800 rounded-xl focus:border-[#FF6600] p-3 h-20 border border-slate-200"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Navigation Actions Footer */}
              <div className="flex justify-between gap-4 border-t border-slate-200/60 pt-4 mt-6 bg-[#F5F5F5] select-none">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="h-12 px-6 btn-secondary rounded-xl uppercase tracking-wider text-xs font-bold cursor-pointer"
                  >
                    <i className="fa-solid fa-chevron-left mr-2"></i> Previous Step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Exit wizard? Your draft is saved.")) {
                        setView('dashboard')
                      }
                    }}
                    className="h-12 px-6 bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200/50 rounded-xl uppercase tracking-wider text-xs font-bold cursor-pointer"
                  >
                    Exit Wizard
                  </button>
                )}

                {currentStep < 7 ? (
                  <button
                    type="button"
                    disabled={!canContinue()}
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="h-12 px-8 btn-primary rounded-xl uppercase tracking-wider text-xs font-bold cursor-pointer"
                  >
                    Continue Step <i className="fa-solid fa-chevron-right ml-2"></i>
                  </button>
                ) : (
                  <form onSubmit={handleSubmit} className="shrink-0 w-full sm:w-auto">
                    <button
                      type="submit"
                      disabled={submitting || !canContinue()}
                      className="w-full sm:w-auto h-12 px-10 btn-primary rounded-xl uppercase tracking-wider text-xs font-black shadow-md cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin mr-3"></i> Submitting...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-cloud-arrow-up mr-3"></i> Submit & Complete
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

      {/* Reusable Reading Confirmation OCR Modal */}
      <ReadingOCRModal
        isOpen={ocr.isModalOpen}
        onClose={ocr.cancelOcrFlow}
        imageSrc={ocr.imageSrc}
        openingReading={ocr.activeOpeningReading}
        onConfirm={(finalReading, confidence, timeMs, base64Image, ocrEngine) => {
          const res = ocr.confirmOcrFlow(finalReading, confidence, timeMs, base64Image, ocrEngine)
          if (res) {
            setClosings(prev => ({ ...prev, [res.nozzleId]: res.value }))
          }
        }}
        onRetake={() => {
          ocr.cancelOcrFlow()
        }}
        nozzleLabel={ocr.activeNozzleLabel}
      />
    </div>
  )
}
