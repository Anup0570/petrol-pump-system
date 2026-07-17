-- ============================================================
-- Sai Priya Fuels — OCR Reading Image Database Setup
-- Run this script in Supabase → SQL Editor to support OCR audit trails.
-- ============================================================

-- 1. Create OCR Reading Images Table
CREATE TABLE IF NOT EXISTS public.ocr_reading_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT NOT NULL,                  -- URL of the uploaded image in Supabase Storage
  ocr_reading NUMERIC,                      -- The raw numeric reading output by OCR
  final_reading NUMERIC,                    -- The final reading manually verified/saved by staff
  confidence NUMERIC,                       -- Confidence percentage reported by OCR (0-100)
  ocr_engine TEXT DEFAULT 'Tesseract.js',   -- Engine used (e.g. 'Tesseract.js', 'Google ML Kit', 'Google Vision API')
  processing_time_ms INTEGER,               -- Total time taken to preprocess and perform OCR
  verified_by TEXT,                         -- Profile name or ID of the staff/admin who verified the reading
  reading_type TEXT NOT NULL CHECK (reading_type IN ('opening', 'closing')),
  pump_number TEXT NOT NULL,                -- e.g. 'Terminal Pump 01', 'Terminal Pump 02'
  nozzle_number TEXT NOT NULL,              -- e.g. 'P1-N1-Petrol-1', 'P1-N2-Petrol-2'
  shift_id UUID REFERENCES public.fuel_entries(id) ON DELETE SET NULL -- Associated shift entry
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.ocr_reading_images ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY "Authenticated users can view OCR records" 
  ON public.ocr_reading_images 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert OCR records" 
  ON public.ocr_reading_images 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can update or delete OCR records" 
  ON public.ocr_reading_images 
  FOR ALL 
  USING (public.get_user_role() = 'admin');

-- 4. Create Index on shift_id for faster retrieval
CREATE INDEX IF NOT EXISTS idx_ocr_readings_shift_id ON public.ocr_reading_images(shift_id);
CREATE INDEX IF NOT EXISTS idx_ocr_readings_nozzle ON public.ocr_reading_images(pump_number, nozzle_number);

-- ============================================================
-- NOTE ON STORAGE BUCKET:
-- You must also create a Supabase Storage bucket named 'ocr-meter-readings'
-- policy settings:
--   - SELECT: authenticated users
--   - INSERT: authenticated users
-- ============================================================
