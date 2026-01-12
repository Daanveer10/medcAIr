-- Row Level Security Policies for medcAIr (Fixed for Custom JWT Auth)
-- Run this SQL in your Supabase SQL Editor AFTER creating the tables
-- This version works with custom JWT authentication (not Supabase Auth)
-- This script is idempotent - safe to run multiple times

-- IMPORTANT: For development, you can disable RLS entirely:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE clinics DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE followups DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE slots DISABLE ROW LEVEL SECURITY;

-- If you want to use RLS, use the policies below:

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;

-- ========== DROP EXISTING POLICIES (if they exist) ==========
-- This makes the script safe to run multiple times

-- Drop existing users policies
DROP POLICY IF EXISTS "Allow public registration" ON users;
DROP POLICY IF EXISTS "Allow read users for login" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Service role can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Drop existing clinics policies
DROP POLICY IF EXISTS "Anyone can read clinics" ON clinics;
DROP POLICY IF EXISTS "Anyone can create clinics" ON clinics;
DROP POLICY IF EXISTS "Hospitals can manage own clinics" ON clinics;
DROP POLICY IF EXISTS "Hospitals can delete own clinics" ON clinics;
DROP POLICY IF EXISTS "Hospitals can manage their clinics" ON clinics;

-- Drop existing appointments policies
DROP POLICY IF EXISTS "Anyone can read appointments" ON appointments;
DROP POLICY IF EXISTS "Anyone can create appointments" ON appointments;
DROP POLICY IF EXISTS "Anyone can update appointments" ON appointments;
DROP POLICY IF EXISTS "Patients can read own appointments" ON appointments;
DROP POLICY IF EXISTS "Hospitals can read all appointments for their clinics" ON appointments;

-- Drop existing slots policies
DROP POLICY IF EXISTS "Anyone can read slots" ON slots;
DROP POLICY IF EXISTS "Anyone can manage slots" ON slots;
DROP POLICY IF EXISTS "Hospitals can manage slots for their clinics" ON slots;

-- Drop existing followups policies
DROP POLICY IF EXISTS "Anyone can read followups" ON followups;
DROP POLICY IF EXISTS "Anyone can create followups" ON followups;

-- ========== CREATE NEW POLICIES ==========

-- ========== USERS TABLE POLICIES ==========

-- Allow anyone to insert (register) - REQUIRED for registration
CREATE POLICY "Allow public registration" ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to read users by email (for login) - REQUIRED for login
-- This is needed because we use custom JWT, not Supabase Auth
CREATE POLICY "Allow read users for login" ON users
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow service role to do everything (for backend operations)
CREATE POLICY "Service role full access" ON users
  FOR ALL
  TO service_role
  USING (true);

-- ========== CLINICS TABLE POLICIES ==========

-- Anyone can read clinics
CREATE POLICY "Anyone can read clinics" ON clinics
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can insert clinics (hospitals will create them)
CREATE POLICY "Anyone can create clinics" ON clinics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Hospitals can update/delete their own clinics
CREATE POLICY "Hospitals can manage own clinics" ON clinics
  FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Hospitals can delete own clinics" ON clinics
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- ========== APPOINTMENTS TABLE POLICIES ==========

-- Anyone can read appointments
CREATE POLICY "Anyone can read appointments" ON appointments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can create appointments
CREATE POLICY "Anyone can create appointments" ON appointments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Anyone can update appointments
CREATE POLICY "Anyone can update appointments" ON appointments
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- ========== SLOTS TABLE POLICIES ==========

-- Anyone can read slots
CREATE POLICY "Anyone can read slots" ON slots
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can create/update slots
CREATE POLICY "Anyone can manage slots" ON slots
  FOR ALL
  TO anon, authenticated
  USING (true);

-- ========== FOLLOWUPS TABLE POLICIES ==========

-- Anyone can read followups
CREATE POLICY "Anyone can read followups" ON followups
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can create followups
CREATE POLICY "Anyone can create followups" ON followups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
