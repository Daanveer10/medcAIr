-- Row Level Security Policies for medcAIr
-- Run this SQL in your Supabase SQL Editor AFTER creating the tables

-- Option 1: Disable RLS (for development/testing - NOT recommended for production)
-- Uncomment these lines if you want to disable RLS temporarily:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE clinics DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE followups DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE slots DISABLE ROW LEVEL SECURITY;

-- Option 2: Enable RLS with proper policies (recommended)
-- Allow anyone to insert into users (for registration)
CREATE POLICY "Allow public registration" ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Allow service role to read all users (for backend operations)
CREATE POLICY "Service role can read all users" ON users
  FOR SELECT
  TO service_role
  USING (true);

-- Allow authenticated users to update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Clinics policies
CREATE POLICY "Anyone can read clinics" ON clinics
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Hospitals can manage their clinics" ON clinics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = clinics.hospital_id
      AND users.role = 'hospital'
    )
  );

-- Appointments policies
CREATE POLICY "Patients can read own appointments" ON appointments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = appointments.patient_id
      AND users.role = 'patient'
    )
  );

CREATE POLICY "Anyone can create appointments" ON appointments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Hospitals can read all appointments for their clinics" ON appointments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      JOIN users ON users.id = clinics.hospital_id
      WHERE clinics.id = appointments.clinic_id
      AND users.role = 'hospital'
    )
  );

-- Slots policies
CREATE POLICY "Anyone can read slots" ON slots
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Hospitals can manage slots for their clinics" ON slots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinics
      JOIN users ON users.id = clinics.hospital_id
      WHERE clinics.id = slots.clinic_id
      AND users.role = 'hospital'
    )
  );

-- Followups policies
CREATE POLICY "Anyone can read followups" ON followups
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create followups" ON followups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
