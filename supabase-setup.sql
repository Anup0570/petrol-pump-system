-- ============================================================
-- Sai Priya Fuels — Supabase Database Setup
-- Run this entire script in Supabase → SQL Editor
-- ============================================================

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
-- Fix for infinite recursion block: Use a SECURITY DEFINER function to bypass RLS when checking role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Admin can view all profiles" ON public.profiles FOR SELECT USING (
  public.get_user_role() = 'admin'
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), COALESCE(NEW.raw_user_meta_data->>'role', 'staff'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. FUEL ENTRIES
CREATE TABLE IF NOT EXISTS public.fuel_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shift_date DATE DEFAULT CURRENT_DATE,
  shift_type TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  rate_petrol NUMERIC DEFAULT 0,
  rate_diesel NUMERIC DEFAULT 0,
  rate_oil NUMERIC DEFAULT 0,
  nozzle_readings JSONB DEFAULT '[]'::jsonb,
  gpay_amount NUMERIC DEFAULT 0,
  card_amount NUMERIC DEFAULT 0,
  expense_amount NUMERIC DEFAULT 0,
  expense_desc TEXT DEFAULT '',
  credit_given JSONB DEFAULT '[]'::jsonb,
  credit_received JSONB DEFAULT '[]'::jsonb,
  denominations JSONB DEFAULT '{}'::jsonb,
  gross_sales NUMERIC DEFAULT 0,
  expected_cash NUMERIC DEFAULT 0,
  counted_cash NUMERIC DEFAULT 0,
  difference NUMERIC DEFAULT 0,
  petrol_litres NUMERIC DEFAULT 0,
  diesel_litres NUMERIC DEFAULT 0,
  test_performed BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verified'))
);
ALTER TABLE public.fuel_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can insert entries" ON public.fuel_entries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin can view all entries" ON public.fuel_entries FOR SELECT USING (
  public.get_user_role() = 'admin'
);
CREATE POLICY "Staff can view own entries" ON public.fuel_entries FOR SELECT USING (
  staff_name = (SELECT name FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Admin can update entries" ON public.fuel_entries FOR UPDATE USING (
  public.get_user_role() = 'admin'
);
CREATE POLICY "Admin can delete entries" ON public.fuel_entries FOR DELETE USING (
  public.get_user_role() = 'admin'
);

-- 3. CREDIT LEDGER
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  customer_name TEXT NOT NULL,
  vehicle_number TEXT DEFAULT '',
  fuel_type TEXT DEFAULT '',
  litres NUMERIC DEFAULT 0,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid')),
  paid_at TIMESTAMPTZ,
  notes TEXT DEFAULT ''
);
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on ledger" ON public.credit_ledger USING (
  public.get_user_role() = 'admin'
);

-- 4. TANK INVENTORY
CREATE TABLE IF NOT EXISTS public.tank_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fuel_type TEXT UNIQUE NOT NULL CHECK (fuel_type IN ('petrol', 'diesel')),
  current_stock NUMERIC DEFAULT 0,
  capacity NUMERIC DEFAULT 20000,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tank_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view tanks" ON public.tank_inventory FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can update tanks" ON public.tank_inventory FOR UPDATE USING (
  public.get_user_role() = 'admin'
);

-- Seed initial tank data
INSERT INTO public.tank_inventory (fuel_type, current_stock, capacity)
VALUES ('petrol', 12050, 20000), ('diesel', 17000, 20000)
ON CONFLICT (fuel_type) DO NOTHING;

-- 5. FUEL DELIVERIES
CREATE TABLE IF NOT EXISTS public.fuel_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  fuel_type TEXT NOT NULL,
  litres NUMERIC NOT NULL,
  logged_by TEXT DEFAULT ''
);
ALTER TABLE public.fuel_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on deliveries" ON public.fuel_deliveries USING (
  public.get_user_role() = 'admin'
);
CREATE POLICY "Authenticated can insert deliveries" ON public.fuel_deliveries FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- MANUAL STEPS: Create your first admin user
-- After running this script, go to Supabase → Authentication → Users
-- Click "Add user" and create:
--   Email: owner@saipriyafuels.com
--   Password: (choose a strong password)
--   User Metadata: {"name": "Owner", "role": "admin"}
-- Then create staff users with role: "staff"
-- ============================================================

-- 6. PUMP RESETS
CREATE TABLE IF NOT EXISTS public.pump_resets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  p1n1 NUMERIC DEFAULT 0,
  p1n2 NUMERIC DEFAULT 0,
  p2n3 NUMERIC DEFAULT 0,
  p2n4 NUMERIC DEFAULT 0,
  oil NUMERIC DEFAULT 0,
  created_by TEXT DEFAULT ''
);
ALTER TABLE public.pump_resets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on pump resets" ON public.pump_resets USING (
  public.get_user_role() = 'admin'
);
CREATE POLICY "Staff can view pump resets" ON public.pump_resets FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- 7. TANK RESETS
CREATE TABLE IF NOT EXISTS public.tank_resets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  petrol_stock NUMERIC DEFAULT 0,
  diesel_stock NUMERIC DEFAULT 0,
  reason TEXT DEFAULT '',
  created_by TEXT DEFAULT ''
);
ALTER TABLE public.tank_resets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on tank resets" ON public.tank_resets USING (
  public.get_user_role() = 'admin'
);
