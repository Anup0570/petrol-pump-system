export interface Profile {
  id: string
  name: string
  role: 'staff' | 'admin'
}

export interface NozzleReading {
  id: string // e.g. p1n1, p1n2, p2n3, p2n4, oil
  label: string
  fuelType: 'petrol' | 'diesel' | 'oil'
  open: number
  close: number
  volume: number
}

export interface CreditItem {
  name: string
  amt: number
}

export interface Denomination {
  500: number
  200: number
  100: number
  50: number
  20: number
  10: number
  5: number
  2: number
  1: number
}

export interface FuelEntry {
  id: string
  created_at: string
  shift_date: string
  shift_type: string
  staff_name: string
  rate_petrol: number
  rate_diesel: number
  rate_oil: number
  nozzle_readings: NozzleReading[]
  gpay_amount: number
  card_amount: number
  expense_amount: number
  expense_desc: string
  credit_given: CreditItem[]
  credit_received: CreditItem[]
  denominations: Denomination
  gross_sales: number
  expected_cash: number
  counted_cash: number
  difference: number
  petrol_litres: number
  diesel_litres: number
  test_performed: boolean
  status: 'Pending' | 'Verified'
}

export interface CreditLedgerEntry {
  id: string
  created_at: string
  customer_name: string
  vehicle_number?: string
  fuel_type?: string
  litres?: number
  amount: number
  status: 'Pending' | 'Paid'
  paid_at?: string
  notes?: string
}

export interface TankInventory {
  id: string
  fuel_type: 'petrol' | 'diesel'
  current_stock: number
  capacity: number
  updated_at: string
}

export interface FuelDelivery {
  id: string
  created_at: string
  fuel_type: string
  litres: number
  logged_by: string
}
