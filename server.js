const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { format, parseISO, addDays } = require('date-fns');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('./db/supabase');

// Timeout helper for Supabase queries (5 seconds default for faster response)
function withTimeout(promise, timeoutMs = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Database operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

// Wrapper for Supabase queries with timeout and error handling
async function safeSupabaseQuery(queryPromise, timeoutMs = 5000) {
  try {
    const result = await withTimeout(queryPromise, timeoutMs);
    return result;
  } catch (error) {
    if (error.message && error.message.includes('timed out')) {
      console.error('Supabase query timeout:', error.message);
      throw new Error('Database request timed out. Please try again.');
    }
    throw error;
  }
}

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'medcair-secret-key-change-in-production';

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '10mb' }));

// Only serve static files in non-Vercel mode
if (process.env.VERCEL !== '1') {
  app.use(express.static(path.join(__dirname, 'client/build')));
}

// Request logging middleware (only in development, not on Vercel)
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    }
    next();
  });
}

// Health check endpoint - must respond immediately
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    supabase_configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    jwt_configured: !!process.env.JWT_SECRET,
    supabase_client: supabase ? 'initialized' : 'not initialized'
  });
});

// Test Supabase connection endpoint
app.get('/api/test-db', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ 
      error: 'Supabase client not initialized',
      env_check: {
        SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'NOT SET',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Set' : 'NOT SET'
      }
    });
  }

  try {
    // Try a simple query to test connection (10 second timeout for test endpoint)
    const { data, error } = await safeSupabaseQuery(
      supabase.from('users').select('count', { count: 'exact', head: true }),
      10000
    );

    if (error) {
      return res.status(500).json({
        error: 'Database connection test failed',
        details: error.message,
        hint: error.hint || 'Check your Supabase configuration and RLS policies'
      });
    }

    res.json({
      status: 'success',
      message: 'Database connection successful',
      user_count: data?.length || 0
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database connection test failed',
      message: error.message
    });
  }
});

// Test endpoint to verify routing
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', path: req.path, method: req.method });
});

// Test POST endpoint
app.post('/api/test', (req, res) => {
  res.json({ 
    message: 'POST is working!', 
    body: req.body,
    path: req.path, 
    method: req.method 
  });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Initialize sample data (run once)
async function initializeSampleData() {
  // Skip if Supabase is not configured
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('Skipping sample data initialization - Supabase not configured');
    return;
  }

  try {
    // Check if clinics exist
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('id')
      .limit(1);

    if (clinicsError || clinics.length === 0) {
      // Create sample hospital user
      const hashedPassword = await bcrypt.hash('hospital123', 8);
      
      const { data: hospitalUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: 'hospital@medcair.com',
          password: hashedPassword,
          name: 'City General Hospital',
          role: 'hospital',
          phone: '555-0100'
        })
        .select()
        .single();

      if (userError && !userError.message.includes('duplicate')) {
        console.error('Error creating hospital user:', userError);
        return;
      }

      const hospitalId = hospitalUser?.id || (await supabase.from('users').select('id').eq('email', 'hospital@medcair.com').single()).data?.id;

      if (!hospitalId) return;

      // Create sample clinics
      const sampleClinics = [
        {
          hospital_id: hospitalId,
          name: 'City General Hospital - Main Branch',
          address: '123 Medical Plaza',
          city: 'New York',
          state: 'NY',
          zip_code: '10001',
          latitude: 40.7128,
          longitude: -74.0060,
          phone: '555-0101',
          email: 'main@cityhospital.com',
          specialties: 'General Medicine, Cardiology, Pediatrics',
          diseases_handled: 'Diabetes, Hypertension, Heart Disease, Asthma, Flu, COVID-19',
          operating_hours: 'Mon-Fri: 9AM-5PM, Sat: 9AM-1PM'
        },
        {
          hospital_id: hospitalId,
          name: 'City General Hospital - Downtown Clinic',
          address: '456 Health Avenue',
          city: 'New York',
          state: 'NY',
          zip_code: '10002',
          latitude: 40.7589,
          longitude: -73.9851,
          phone: '555-0102',
          email: 'downtown@cityhospital.com',
          specialties: 'Orthopedics, Dermatology, ENT',
          diseases_handled: 'Arthritis, Skin Disorders, Sinusitis, Migraine, Allergies',
          operating_hours: 'Mon-Fri: 8AM-6PM'
        },
        {
          hospital_id: hospitalId,
          name: 'City General Hospital - Emergency Care',
          address: '789 Emergency Way',
          city: 'New York',
          state: 'NY',
          zip_code: '10003',
          latitude: 40.7282,
          longitude: -73.9942,
          phone: '555-0103',
          email: 'emergency@cityhospital.com',
          specialties: 'Emergency Medicine, Trauma Care',
          diseases_handled: 'Emergency Cases, Trauma, Acute Illness, Injuries',
          operating_hours: '24/7'
        }
      ];

      const { data: createdClinics, error: clinicsInsertError } = await supabase
        .from('clinics')
        .insert(sampleClinics)
        .select();

      if (clinicsInsertError) {
        console.error('Error creating clinics:', clinicsInsertError);
        return;
      }

      // Create sample slots
      const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
      const doctors = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams'];
      const today = new Date();
      const slots = [];

      createdClinics.forEach(clinic => {
        for (let day = 0; day < 7; day++) {
          const slotDate = addDays(today, day);
          const dateStr = format(slotDate, 'yyyy-MM-dd');
          
          doctors.forEach(doctor => {
            times.forEach(time => {
              slots.push({
                clinic_id: clinic.id,
                date: dateStr,
                time: time,
                doctor_name: doctor,
                is_available: true
              });
            });
          });
        }
      });

      if (slots.length > 0) {
        await supabase.from('slots').insert(slots);
      }

      console.log('Sample data initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}

// Initialize on startup (ONLY in local development, NEVER on Vercel)
// This function is completely disabled on Vercel to prevent timeouts
// Check multiple ways to ensure it NEVER runs on Vercel
const isVercel = process.env.VERCEL === '1' || 
                 process.env.VERCEL === 'true' || 
                 process.env.VERCEL_ENV === 'production' ||
                 process.env.VERCEL_ENV === 'preview' ||
                 !!process.env.VERCEL;

if (!isVercel) {
  // Only run in local development
  setTimeout(() => {
    initializeSampleData().catch(err => {
      console.error('Error initializing sample data:', err);
    });
  }, 1000);
}

// ==================== AUTHENTICATION ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  // Set response timeout to prevent hanging
  res.setTimeout(10000); // 10 seconds

  const { email, password, name, role, phone } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!['patient', 'hospital'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be patient or hospital' });
  }

  // Check if Supabase is configured
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured. Please check environment variables.' });
  }

  try {
    // Use bcrypt rounds=6 for much faster hashing on serverless (still secure for most use cases)
    // This significantly reduces hashing time from ~500ms to ~100ms
    const hashedPassword = await bcrypt.hash(password, 6);

    // Sanitize inputs
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedName = name.trim();
    const sanitizedPhone = phone ? phone.trim() : null;

    // Create the query - use .select() without .single() for faster response
    const insertQuery = supabase
      .from('users')
      .insert({
        email: sanitizedEmail,
        password: hashedPassword,
        name: sanitizedName,
        role: role,
        phone: sanitizedPhone
      })
      .select();

    // Execute with timeout (8 seconds for registration)
    const result = await safeSupabaseQuery(insertQuery, 8000);
    
    const { data, error } = result;

    if (error) {
      // Ensure duplicate email errors return 400 status
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique') || error.message?.includes('already exists')) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      if (error.message?.includes('permission denied') || error.message?.includes('RLS') || error.message?.includes('row-level security')) {
        return res.status(500).json({ 
          error: 'Database permission error. Please check Row Level Security policies.' 
        });
      }
      if (error.code === 'PGRST116') {
        return res.status(500).json({ error: 'Database connection error. Please check your Supabase configuration.' });
      }
      return res.status(500).json({ 
        error: error.message || 'Database error occurred'
      });
    }

    // Handle array response (since we removed .single())
    const userData = Array.isArray(data) && data.length > 0 ? data[0] : data;
    
    if (!userData) {
      return res.status(500).json({ error: 'User creation failed. No data returned from database.' });
    }
    
    const token = jwt.sign(
      { id: userData.id, email: userData.email, role: userData.role, name: userData.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { 
        id: userData.id, 
        email: userData.email, 
        name: userData.name, 
        role: userData.role, 
        phone: userData.phone || null
      }
    });
  } catch (error) {
    // Handle timeout errors
    if (error.message && error.message.includes('timed out')) {
      return res.status(504).json({ error: 'Registration request timed out. Please try again.' });
    }
    
    res.status(500).json({ 
      error: error.message || 'Error creating user'
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Check if Supabase is configured
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured. Please check environment variables.' });
  }

  try {
    const loginQuery = supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    const result = await safeSupabaseQuery(loginQuery, 8000);
    const { data: user, error } = result;

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || null
      }
    });
  } catch (error) {
    if (error.message && error.message.includes('timed out')) {
      return res.status(504).json({ error: 'Login request timed out. Please try again.' });
    }
    
    res.status(500).json({ error: 'Error during login. Please try again.' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await safeSupabaseQuery(
      supabase
        .from('users')
        .select('id, email, name, role, phone')
        .eq('id', req.user.id)
        .single()
    );

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CLINIC ROUTES ====================

// Get all clinics (for patients) - optimized for speed
app.get('/api/clinics', async (req, res) => {
  // Set response timeout (3 seconds - very fast)
  res.setTimeout(3000);
  
  // Check if Supabase is configured
  if (!supabase) {
    return res.json([]); // Return empty array if not configured
  }
  
  try {
    const { disease, city, search } = req.query;
    
    // Very simple query - just get first 10 clinics, no filters for speed
    // Only apply filters if they're provided and keep it simple
    let query = supabase
      .from('clinics')
      .select('id, name, address, city, state')
      .limit(10); // Very small limit for fastest response

    // Only apply filters if provided (adds complexity)
    if (disease && disease.trim()) {
      query = query.ilike('diseases_handled', `%${disease}%`);
    }

    if (city && city.trim()) {
      query = query.eq('city', city);
    }

    if (search && search.trim()) {
      query = query.ilike('name', `%${search}%`);
    }

    // Use very short timeout (3 seconds)
    const { data, error } = await safeSupabaseQuery(query, 3000);

    if (error) {
      // Return empty array instead of error for better UX
      return res.json([]);
    }

    // Return clinics directly
    res.json(data || []);
  } catch (error) {
    // Return empty array on timeout/error instead of failing
    res.json([]);
  }
});

// Get clinic by ID
app.get('/api/clinics/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await safeSupabaseQuery(
      supabase
        .from('clinics')
        .select(`
          *,
          users!inner(name)
        `)
        .eq('id', id)
        .single()
    );

    if (error || !data) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    res.json({
      ...data,
      hospital_name: data.users?.name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get slots for a clinic
app.get('/api/clinics/:id/slots', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    let query = supabase
      .from('slots')
      .select('*')
      .eq('clinic_id', id);

    if (date) {
      query = query.eq('date', date);
    } else {
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      query = query.gte('date', today).lte('date', nextWeek);
    }

    query = query.order('date', { ascending: true }).order('time', { ascending: true });

    const { data: slots, error: slotsError } = await safeSupabaseQuery(query);

    if (slotsError) {
      return res.status(500).json({ error: slotsError.message });
    }

    // Check which slots are booked
    const slotIds = slots?.map(s => s.id) || [];
    if (slotIds.length === 0) {
      return res.json([]);
    }
    
    const { data: appointments } = await safeSupabaseQuery(
      supabase
        .from('appointments')
        .select('slot_id, patient_name')
        .in('slot_id', slotIds)
        .eq('status', 'scheduled')
    );

    const bookedSlotIds = new Set(appointments?.map(a => a.slot_id) || []);
    const bookedByMap = {};
    appointments?.forEach(a => {
      if (a.slot_id) bookedByMap[a.slot_id] = a.patient_name;
    });

    const slotsWithAvailability = slots.map(slot => ({
      ...slot,
      is_available: slot.is_available && !bookedSlotIds.has(slot.id),
      booked_by: bookedByMap[slot.id] || null
    }));

    res.json(slotsWithAvailability);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get clinic slots grouped by date
app.get('/api/clinics/:id/slots/grouped', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    let query = supabase
      .from('slots')
      .select('*')
      .eq('clinic_id', id);

    if (date) {
      query = query.eq('date', date);
    } else {
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      query = query.gte('date', today).lte('date', nextWeek);
    }

    query = query.order('date', { ascending: true }).order('time', { ascending: true });

    const { data: slots, error: slotsError } = await query;

    if (slotsError) {
      return res.status(500).json({ error: slotsError.message });
    }

    // Check which slots are booked
    const slotIds = slots.map(s => s.id);
    const { data: appointments } = await supabase
      .from('appointments')
      .select('slot_id, patient_name')
      .in('slot_id', slotIds)
      .eq('status', 'scheduled');

    const bookedSlotIds = new Set(appointments?.map(a => a.slot_id) || []);
    const bookedByMap = {};
    appointments?.forEach(a => {
      if (a.slot_id) bookedByMap[a.slot_id] = a.patient_name;
    });

    const slotsWithAvailability = slots.map(slot => ({
      ...slot,
      is_available: slot.is_available && !bookedSlotIds.has(slot.id),
      booked_by: bookedByMap[slot.id] || null
    }));

    // Group by date
    const grouped = {};
    slotsWithAvailability.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create clinic (hospital only)
app.post('/api/clinics', authenticateToken, async (req, res) => {
  if (req.user.role !== 'hospital') {
    return res.status(403).json({ error: 'Only hospitals can create clinics' });
  }

  const { name, address, city, state, zip_code, latitude, longitude, phone, email, specialties, diseases_handled, operating_hours } = req.body;

  if (!name || !address || !city || !state) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase
      .from('clinics')
      .insert({
        hospital_id: req.user.id,
        name,
        address,
        city,
        state,
        zip_code: zip_code || null,
        latitude: latitude || null,
        longitude: longitude || null,
        phone: phone || null,
        email: email || null,
        specialties: specialties || '',
        diseases_handled: diseases_handled || '',
        operating_hours: operating_hours || ''
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ id: data.id, message: 'Clinic created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create slots for clinic (hospital only)
app.post('/api/clinics/:id/slots', authenticateToken, async (req, res) => {
  if (req.user.role !== 'hospital') {
    return res.status(403).json({ error: 'Only hospitals can create slots' });
  }

  const { id } = req.params;
  const { date, time, doctor_name, duration } = req.body;

  // Verify clinic belongs to hospital
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('hospital_id')
    .eq('id', id)
    .single();

  if (clinicError || !clinic || clinic.hospital_id !== req.user.id) {
    return res.status(403).json({ error: 'Clinic not found or access denied' });
  }

  try {
    const { data, error } = await supabase
      .from('slots')
      .insert({
        clinic_id: id,
        date,
        time,
        doctor_name: doctor_name || null,
        duration: duration || 30
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint
        return res.status(400).json({ error: 'Slot already exists' });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ id: data.id, message: 'Slot created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get hospitals clinics
app.get('/api/hospital/clinics', authenticateToken, async (req, res) => {
  if (req.user.role !== 'hospital') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('hospital_id', req.user.id)
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== APPOINTMENT ROUTES ====================

// Create appointment (patient booking)
// Allow without authentication for testing (when auth is disabled)
app.post('/api/appointments', async (req, res) => {
  // Try to get user from token if available, otherwise use request body
  let user = null;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Token invalid, continue without auth
    }
  }

  const { clinic_id, appointment_date, appointment_time, slot_id, reason, disease, doctor_name, patient_name, patient_phone, patient_email } = req.body;
  const patient_id = user && user.role === 'patient' ? user.id : null;
  const finalPatientName = user && user.role === 'patient' ? user.name : (patient_name || req.body.patient_name);
  const finalPatientPhone = user && user.phone ? user.phone : (patient_phone || req.body.patient_phone);
  const finalPatientEmail = user && user.email ? user.email : (patient_email || req.body.patient_email);

  if (!clinic_id || !appointment_date || !appointment_time || !finalPatientName || !finalPatientPhone) {
    return res.status(400).json({ error: 'Missing required fields: clinic_id, appointment_date, appointment_time, patient_name, and patient_phone are required' });
  }

  try {
    // Check if slot is available
    if (slot_id) {
      const { data: slot, error: slotError } = await safeSupabaseQuery(
        supabase
          .from('slots')
          .select('id, is_available')
          .eq('id', slot_id)
          .single()
      );

      if (slotError || !slot) {
        return res.status(400).json({ error: 'Invalid slot' });
      }

      const { data: existingAppointment } = await safeSupabaseQuery(
        supabase
          .from('appointments')
          .select('id')
          .eq('slot_id', slot_id)
          .eq('appointment_date', appointment_date)
          .eq('appointment_time', appointment_time)
          .eq('status', 'scheduled')
          .single()
      );

      if (existingAppointment) {
        return res.status(400).json({ error: 'Slot already booked' });
      }
    }

    const { data, error } = await safeSupabaseQuery(
      supabase
        .from('appointments')
        .insert({
          patient_id,
          clinic_id,
          patient_name: finalPatientName,
          patient_phone: finalPatientPhone,
          patient_email: finalPatientEmail || null,
          appointment_date,
          appointment_time,
          slot_id: slot_id || null,
          reason: reason || '',
          disease: disease || '',
          doctor_name: doctor_name || null,
          status: 'scheduled'
        })
        .select()
        .single()
    );

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Mark slot as unavailable if slot_id provided
    if (slot_id) {
      await safeSupabaseQuery(
        supabase
          .from('slots')
          .update({ is_available: false })
          .eq('id', slot_id)
      ).catch(err => console.error('Error updating slot:', err));
    }

    res.json({ id: data.id, message: 'Appointment booked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient appointments - work without auth for testing
app.get('/api/patient/appointments', async (req, res) => {
  // Set response timeout (5 seconds)
  res.setTimeout(5000);
  
  // Check if Supabase is configured
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }
  
  try {
    // Try to get user from token if available
    let userId = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const user = jwt.verify(token, JWT_SECRET);
        if (user.role === 'patient') {
          userId = user.id;
        }
      } catch (err) {
        // Token invalid, continue without auth
      }
    }

    // Simplified query - select only needed fields, no join
    let query = supabase
      .from('appointments')
      .select('id, patient_name, patient_phone, appointment_date, appointment_time, reason, disease, doctor_name, status, clinic_id')
      .limit(50); // Limit to 50 results for faster response

    // If we have a user ID, filter by it, otherwise return all (for testing)
    if (userId) {
      query = query.eq('patient_id', userId);
    }

    // Use very short timeout (5 seconds)
    const { data, error } = await safeSupabaseQuery(
      query.order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true }),
      5000
    );

    if (error) {
      // Return empty array instead of error for better UX
      console.error('Appointment query error:', error.message);
      return res.json([]);
    }

    // Return appointments directly (without clinic join for speed)
    res.json(data || []);
  } catch (error) {
    // Return empty array on timeout/error instead of failing
    console.error('Appointment fetch error:', error.message);
    res.json([]);
  }
});

// Get hospital appointments
app.get('/api/hospital/appointments', authenticateToken, async (req, res) => {
  if (req.user.role !== 'hospital') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    // First get all clinic IDs for this hospital
    const { data: clinics } = await supabase
      .from('clinics')
      .select('id')
      .eq('hospital_id', req.user.id);

    const clinicIds = clinics?.map(c => c.id) || [];

    if (clinicIds.length === 0) {
      return res.json([]);
    }

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clinics!inner(name)
      `)
      .in('clinic_id', clinicIds)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const appointments = data.map(apt => ({
      ...apt,
      clinic_name: apt.clinics?.name
    }));

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all appointments
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        clinics(name)
      `);

    if (req.user.role === 'patient') {
      query = query.eq('patient_id', req.user.id);
    } else if (req.user.role === 'hospital') {
      // Get clinic IDs for this hospital
      const { data: clinics } = await supabase
        .from('clinics')
        .select('id')
        .eq('hospital_id', req.user.id);
      
      const clinicIds = clinics?.map(c => c.id) || [];
      if (clinicIds.length > 0) {
        query = query.in('clinic_id', clinicIds);
      } else {
        return res.json([]);
      }
    }

    query = query.order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const appointments = data.map(apt => ({
      ...apt,
      clinic_name: apt.clinics?.name
    }));

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointments for today
app.get('/api/appointments/today', authenticateToken, async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    let query = supabase
      .from('appointments')
      .select(`
        *,
        clinics(name)
      `)
      .eq('appointment_date', today);

    if (req.user.role === 'patient') {
      query = query.eq('patient_id', req.user.id);
    } else if (req.user.role === 'hospital') {
      const { data: clinics } = await supabase
        .from('clinics')
        .select('id')
        .eq('hospital_id', req.user.id);
      
      const clinicIds = clinics?.map(c => c.id) || [];
      if (clinicIds.length > 0) {
        query = query.in('clinic_id', clinicIds);
      } else {
        return res.json([]);
      }
    }

    query = query.order('appointment_time', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const appointments = data.map(apt => ({
      ...apt,
      clinic_name: apt.clinics?.name
    }));

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update appointment status
app.patch('/api/appointments/:id', authenticateToken, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  try {
    // Get appointment with clinic info
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        clinics(hospital_id)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const canModify = (req.user.role === 'hospital' && appointment.clinics?.hospital_id === req.user.id) ||
                      (req.user.role === 'patient' && appointment.patient_id === req.user.id);

    if (!canModify) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Appointment updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete appointment
app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        clinics(hospital_id)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const canDelete = (req.user.role === 'hospital' && appointment.clinics?.hospital_id === req.user.id) ||
                      (req.user.role === 'patient' && appointment.patient_id === req.user.id);

    if (!canDelete) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Free up the slot
    if (appointment.slot_id) {
      await supabase
        .from('slots')
        .update({ is_available: true })
        .eq('id', appointment.slot_id);
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    let appointmentsQuery = supabase.from('appointments').select('id', { count: 'exact', head: true });

    if (req.user.role === 'hospital') {
      const { data: clinics } = await supabase
        .from('clinics')
        .select('id')
        .eq('hospital_id', req.user.id);
      
      const clinicIds = clinics?.map(c => c.id) || [];
      if (clinicIds.length > 0) {
        appointmentsQuery = supabase.from('appointments').select('id', { count: 'exact', head: true }).in('clinic_id', clinicIds);
      } else {
        return res.json({ total: 0, today: 0, followups: 0, pending: 0 });
      }
    } else if (req.user.role === 'patient') {
      appointmentsQuery = supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('patient_id', req.user.id);
    }

    const { count: total } = await appointmentsQuery;

    let todayQuery = appointmentsQuery.eq('appointment_date', today);
    const { count: todayCount } = await todayQuery;

    let pendingQuery = appointmentsQuery.eq('status', 'scheduled');
    const { count: pending } = await pendingQuery;

    const { count: followups } = await supabase
      .from('followups')
      .select('id', { count: 'exact', head: true });

    res.json({
      total: total || 0,
      today: todayCount || 0,
      followups: followups || 0,
      pending: pending || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== FOLLOW-UP ROUTES ====================

app.get('/api/followups', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('followups')
      .select('*')
      .order('followup_date', { ascending: true })
      .order('followup_time', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/followups', authenticateToken, async (req, res) => {
  const { appointment_id, patient_name, patient_phone, followup_date, followup_time, reason, doctor_name } = req.body;
  
  if (!patient_name || !patient_phone || !followup_date || !followup_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase
      .from('followups')
      .insert({
        appointment_id: appointment_id || null,
        patient_name,
        patient_phone,
        followup_date,
        followup_time,
        reason: reason || '',
        doctor_name: doctor_name || 'Dr. Smith'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ id: data.id, message: 'Follow-up scheduled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/appointments/:id/followup', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (appointmentError || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointmentDateTime = parseISO(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const followupDate = addDays(appointmentDateTime, 30);
    const followupDateStr = format(followupDate, 'yyyy-MM-dd');
    const followupTimeStr = appointment.appointment_time;

    const { data, error } = await supabase
      .from('followups')
      .insert({
        appointment_id: id,
        patient_name: appointment.patient_name,
        patient_phone: appointment.patient_phone,
        followup_date: followupDateStr,
        followup_time: followupTimeStr,
        reason: 'Follow-up appointment',
        doctor_name: appointment.doctor_name || 'Dr. Smith'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ id: data.id, message: 'Follow-up scheduled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CLINIC SEARCH ====================

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Search clinics with distance
app.get('/api/clinics/search', async (req, res) => {
  try {
    const { disease, city, search, latitude, longitude, maxDistance } = req.query;
    
    let query = supabase
      .from('clinics')
      .select(`
        *,
        users!inner(name)
      `);

    if (disease) {
      query = query.ilike('diseases_handled', `%${disease}%`);
    }

    if (city) {
      query = query.eq('city', city);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,specialties.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    let clinics = data.map(clinic => ({
      ...clinic,
      hospital_name: clinic.users?.name
    }));

    // Calculate distance if coordinates provided
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLon = parseFloat(longitude);
      
      clinics = clinics.map(clinic => {
        if (clinic.latitude && clinic.longitude) {
          const distance = calculateDistance(
            userLat, userLon,
            clinic.latitude, clinic.longitude
          );
          return { ...clinic, distance: parseFloat(distance.toFixed(2)) };
        }
        return clinic;
      });

      // Sort by distance
      clinics.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

      // Filter by max distance if provided
      if (maxDistance) {
        clinics = clinics.filter(clinic => (clinic.distance || Infinity) <= parseFloat(maxDistance));
      }
    }

    res.json(clinics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve React app (only in non-serverless mode)
if (process.env.VERCEL !== '1') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Global error handler - MUST be after all routes
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('timed out')) {
    return res.status(504).json({ error: 'Request timed out. Please try again.' });
  }
  if (err.message && (err.message.includes('Database') || err.message.includes('Supabase'))) {
    return res.status(503).json({ error: 'Database service temporarily unavailable. Please try again.' });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Start server (only in non-Vercel mode)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Supabase connected: ${process.env.SUPABASE_URL ? 'Yes' : 'No'}`);
  });
}

// Export app for Vercel serverless functions
module.exports = app;
