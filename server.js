const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { format, parseISO, addDays, isAfter, isBefore } = require('date-fns');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'medcair-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Simple authentication middleware
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

// Initialize database
const db = new sqlite3.Database('./appointments.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    
    // Create tables
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('patient', 'hospital')),
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS clinics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hospital_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip_code TEXT,
      latitude REAL,
      longitude REAL,
      phone TEXT,
      email TEXT,
      specialties TEXT,
      diseases_handled TEXT,
      operating_hours TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      clinic_id INTEGER,
      patient_name TEXT NOT NULL,
      patient_phone TEXT NOT NULL,
      patient_email TEXT,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      slot_id INTEGER,
      reason TEXT,
      disease TEXT,
      doctor_name TEXT,
      status TEXT DEFAULT 'scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES users(id),
      FOREIGN KEY (clinic_id) REFERENCES clinics(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER,
      patient_name TEXT NOT NULL,
      patient_phone TEXT NOT NULL,
      followup_date TEXT NOT NULL,
      followup_time TEXT NOT NULL,
      reason TEXT,
      doctor_name TEXT,
      status TEXT DEFAULT 'scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clinic_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      doctor_name TEXT,
      is_available INTEGER DEFAULT 1,
      duration INTEGER DEFAULT 30,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id),
      UNIQUE(clinic_id, date, time, doctor_name)
    )`);

    // Create sample clinics for testing
    db.get('SELECT COUNT(*) as count FROM clinics', (err, row) => {
      if (!err && row.count === 0) {
        // Insert sample hospital user
        bcrypt.hash('hospital123', 10, (err, hash) => {
          db.run(`INSERT INTO users (email, password, name, role, phone) VALUES (?, ?, ?, ?, ?)`,
            ['hospital@medcair.com', hash, 'City General Hospital', 'hospital', '555-0100'],
            function() {
              const hospitalId = this.lastID;
              
              // Insert sample clinics
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

              sampleClinics.forEach(clinic => {
                db.run(`INSERT INTO clinics (hospital_id, name, address, city, state, zip_code, latitude, longitude, phone, email, specialties, diseases_handled, operating_hours) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [clinic.hospital_id, clinic.name, clinic.address, clinic.city, clinic.state, clinic.zip_code,
                   clinic.latitude, clinic.longitude, clinic.phone, clinic.email, clinic.specialties,
                   clinic.diseases_handled, clinic.operating_hours],
                  function() {
                    const clinicId = this.lastID;
                    // Create sample slots for this clinic
                    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
                    const doctors = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams'];
                    const today = new Date();
                    
                    for (let day = 0; day < 7; day++) {
                      const slotDate = addDays(today, day);
                      const dateStr = format(slotDate, 'yyyy-MM-dd');
                      
                      doctors.forEach(doctor => {
                        times.forEach(time => {
                          db.run(`INSERT OR IGNORE INTO slots (clinic_id, date, time, doctor_name, is_available) VALUES (?, ?, ?, ?, ?)`,
                            [clinicId, dateStr, time, doctor, 1]);
                        });
                      });
                    }
                  });
              });
            });
        });
      }
    });
  }
});

// Authentication Routes

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role, phone } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!['patient', 'hospital'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be patient or hospital' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (email, password, name, role, phone) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, name, role, phone || null],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Email already registered' });
          }
          return res.status(500).json({ error: err.message });
        }

        const token = jwt.sign(
          { id: this.lastID, email, role, name },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.json({
          token,
          user: { id: this.lastID, email, name, role, phone }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    try {
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
          phone: user.phone
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Error during login' });
    }
  });
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get('SELECT id, email, name, role, phone FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Clinic Routes

// Get all clinics (for patients)
app.get('/api/clinics', (req, res) => {
  const { disease, city, search } = req.query;
  let query = 'SELECT c.*, u.name as hospital_name FROM clinics c JOIN users u ON c.hospital_id = u.id WHERE 1=1';
  const params = [];

  if (disease) {
    query += ' AND c.diseases_handled LIKE ?';
    params.push(`%${disease}%`);
  }

  if (city) {
    query += ' AND c.city = ?';
    params.push(city);
  }

  if (search) {
    query += ' AND (c.name LIKE ? OR c.address LIKE ? OR c.specialties LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get clinic by ID
app.get('/api/clinics/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT c.*, u.name as hospital_name FROM clinics c JOIN users u ON c.hospital_id = u.id WHERE c.id = ?',
    [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Clinic not found' });
      }
      res.json(row);
    });
});

// Get slots for a clinic
app.get('/api/clinics/:id/slots', (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  
  let query = `
    SELECT s.*, 
           CASE WHEN a.id IS NOT NULL THEN 0 ELSE 1 END as is_available,
           a.id as appointment_id,
           a.patient_name as booked_by
    FROM slots s
    LEFT JOIN appointments a ON s.id = a.slot_id AND s.date = a.appointment_date AND s.time = a.appointment_time AND a.status = 'scheduled'
    WHERE s.clinic_id = ?
  `;
  const params = [id];

  if (date) {
    query += ' AND s.date = ?';
    params.push(date);
  } else {
    // Default to next 7 days
    const today = format(new Date(), 'yyyy-MM-dd');
    const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    query += ' AND s.date >= ? AND s.date <= ?';
    params.push(today, nextWeek);
  }

  query += ' ORDER BY s.date, s.time';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get clinic slots grouped by date
app.get('/api/clinics/:id/slots/grouped', (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  
  let query = `
    SELECT s.*, 
           CASE WHEN a.id IS NOT NULL THEN 0 ELSE 1 END as is_available,
           a.id as appointment_id,
           a.patient_name as booked_by
    FROM slots s
    LEFT JOIN appointments a ON s.id = a.slot_id AND s.date = a.appointment_date AND s.time = a.appointment_time AND a.status = 'scheduled'
    WHERE s.clinic_id = ?
  `;
  const params = [id];

  if (date) {
    query += ' AND s.date = ?';
    params.push(date);
  } else {
    const today = format(new Date(), 'yyyy-MM-dd');
    const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    query += ' AND s.date >= ? AND s.date <= ?';
    params.push(today, nextWeek);
  }

  query += ' ORDER BY s.date, s.time';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Group by date
    const grouped = {};
    rows.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });

    res.json(grouped);
  });
});

// Create clinic (hospital only)
app.post('/api/clinics', authenticateToken, (req, res) => {
  if (req.user.role !== 'hospital') {
    return res.status(403).json({ error: 'Only hospitals can create clinics' });
  }

  const { name, address, city, state, zip_code, latitude, longitude, phone, email, specialties, diseases_handled, operating_hours } = req.body;

  if (!name || !address || !city || !state) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    'INSERT INTO clinics (hospital_id, name, address, city, state, zip_code, latitude, longitude, phone, email, specialties, diseases_handled, operating_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, name, address, city, state, zip_code || null, latitude || null, longitude || null, phone || null, email || null, specialties || '', diseases_handled || '', operating_hours || ''],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Clinic created successfully' });
    }
  );
});

// Create slots for clinic (hospital only)
app.post('/api/clinics/:id/slots', authenticateToken, (req, res) => {
  if (req.user.role !== 'hospital') {
    return res.status(403).json({ error: 'Only hospitals can create slots' });
  }

  const { id } = req.params;
  const { date, time, doctor_name, duration } = req.body;

  // Verify clinic belongs to hospital
  db.get('SELECT hospital_id FROM clinics WHERE id = ?', [id], (err, clinic) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!clinic || clinic.hospital_id !== req.user.id) {
      return res.status(403).json({ error: 'Clinic not found or access denied' });
    }

    db.run(
      'INSERT OR IGNORE INTO slots (clinic_id, date, time, doctor_name, duration) VALUES (?, ?, ?, ?, ?)',
      [id, date, time, doctor_name || null, duration || 30],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, message: 'Slot created successfully' });
      }
    );
  });
});

// Get hospitals clinics
app.get('/api/hospital/clinics', authenticateToken, (req, res) => {
  if (req.user.role !== 'hospital') {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.all('SELECT * FROM clinics WHERE hospital_id = ? ORDER BY name', [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Appointments Routes (updated)

// Create appointment (patient booking)
app.post('/api/appointments', authenticateToken, (req, res) => {
  const { clinic_id, appointment_date, appointment_time, slot_id, reason, disease, doctor_name } = req.body;
  const patient_id = req.user.role === 'patient' ? req.user.id : null;
  const patient_name = req.user.role === 'patient' ? req.user.name : req.body.patient_name;
  const patient_phone = req.user.phone || req.body.patient_phone;
  const patient_email = req.user.email;

  if (!clinic_id || !appointment_date || !appointment_time || !patient_name || !patient_phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if slot is available
  if (slot_id) {
    db.get('SELECT is_available, id FROM slots WHERE id = ?', [slot_id], (err, slot) => {
      if (err || !slot) {
        return res.status(400).json({ error: 'Invalid slot' });
      }

      db.get('SELECT id FROM appointments WHERE slot_id = ? AND appointment_date = ? AND appointment_time = ? AND status = ?',
        [slot_id, appointment_date, appointment_time, 'scheduled'],
        (err, existing) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          if (existing) {
            return res.status(400).json({ error: 'Slot already booked' });
          }

          createAppointment();
        });
    });
  } else {
    createAppointment();
  }

  function createAppointment() {
    db.run(
      'INSERT INTO appointments (patient_id, clinic_id, patient_name, patient_phone, patient_email, appointment_date, appointment_time, slot_id, reason, disease, doctor_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [patient_id, clinic_id, patient_name, patient_phone, patient_email || null, appointment_date, appointment_time, slot_id || null, reason || '', disease || '', doctor_name || null],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Mark slot as booked if slot_id provided
        if (slot_id) {
          db.run('UPDATE slots SET is_available = 0 WHERE id = ?', [slot_id]);
        }

        res.json({ id: this.lastID, message: 'Appointment booked successfully' });
      }
    );
  }
});

// Get patient appointments
app.get('/api/patient/appointments', authenticateToken, (req, res) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.all(
    `SELECT a.*, c.name as clinic_name, c.address as clinic_address 
     FROM appointments a 
     JOIN clinics c ON a.clinic_id = c.id 
     WHERE a.patient_id = ? 
     ORDER BY a.appointment_date, a.appointment_time`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get hospital appointments
app.get('/api/hospital/appointments', authenticateToken, (req, res) => {
  if (req.user.role !== 'hospital') {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.all(
    `SELECT a.*, c.name as clinic_name 
     FROM appointments a 
     JOIN clinics c ON a.clinic_id = c.id 
     WHERE c.hospital_id = ? 
     ORDER BY a.appointment_date, a.appointment_time`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get all appointments (legacy support)
app.get('/api/appointments', authenticateToken, (req, res) => {
  let query = 'SELECT a.*, c.name as clinic_name FROM appointments a LEFT JOIN clinics c ON a.clinic_id = c.id WHERE 1=1';
  const params = [];

  if (req.user.role === 'patient') {
    query += ' AND a.patient_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'hospital') {
    query += ' AND c.hospital_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY a.appointment_date, a.appointment_time';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get appointments for today
app.get('/api/appointments/today', authenticateToken, (req, res) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  let query = `SELECT a.*, c.name as clinic_name 
               FROM appointments a 
               LEFT JOIN clinics c ON a.clinic_id = c.id 
               WHERE a.appointment_date = ?`;
  const params = [today];

  if (req.user.role === 'patient') {
    query += ' AND a.patient_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'hospital') {
    query += ' AND c.hospital_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY a.appointment_time';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Update appointment status
app.patch('/api/appointments/:id', authenticateToken, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  // Verify ownership
  db.get('SELECT a.*, c.hospital_id FROM appointments a LEFT JOIN clinics c ON a.clinic_id = c.id WHERE a.id = ?',
    [id], (err, appointment) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      const canModify = req.user.role === 'hospital' && appointment.hospital_id === req.user.id ||
                       req.user.role === 'patient' && appointment.patient_id === req.user.id ||
                       req.user.role === 'admin';

      if (!canModify) {
        return res.status(403).json({ error: 'Access denied' });
      }

      db.run('UPDATE appointments SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Appointment updated successfully' });
      });
    });
});

// Delete appointment
app.delete('/api/appointments/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT a.*, c.hospital_id FROM appointments a LEFT JOIN clinics c ON a.clinic_id = c.id WHERE a.id = ?',
    [id], (err, appointment) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      const canDelete = req.user.role === 'hospital' && appointment.hospital_id === req.user.id ||
                       req.user.role === 'patient' && appointment.patient_id === req.user.id;

      if (!canDelete) {
        return res.status(403).json({ error: 'Access denied' });
      }

      db.run('DELETE FROM appointments WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Free up the slot
        if (appointment.slot_id) {
          db.run('UPDATE slots SET is_available = 1 WHERE id = ?', [appointment.slot_id]);
        }

        res.json({ message: 'Appointment deleted successfully' });
      });
    });
});

// Get dashboard stats (hospital)
app.get('/api/stats', authenticateToken, (req, res) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  let appointmentsQuery = 'SELECT COUNT(*) as total FROM appointments a';
  let appointmentsParams = [];
  let appointmentsJoin = '';

  if (req.user.role === 'hospital') {
    appointmentsJoin = ' JOIN clinics c ON a.clinic_id = c.id WHERE c.hospital_id = ?';
    appointmentsParams = [req.user.id];
  } else if (req.user.role === 'patient') {
    appointmentsJoin = ' WHERE a.patient_id = ?';
    appointmentsParams = [req.user.id];
  }

  db.get(`${appointmentsQuery}${appointmentsJoin}`, appointmentsParams, (err, totalRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const todayParams = [...appointmentsParams, today];
    db.get(`${appointmentsQuery}${appointmentsJoin} AND a.appointment_date = ?`, todayParams, (err, todayRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get(`${appointmentsQuery}${appointmentsJoin} AND a.status = "scheduled"`, appointmentsParams, (err, pendingRow) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        db.get('SELECT COUNT(*) as followups FROM followups', [], (err, followupRow) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({
            total: totalRow.total,
            today: todayRow.today,
            followups: followupRow.followups,
            pending: pendingRow.pending
          });
        });
      });
    });
  });
});

// Follow-ups routes (keeping existing)
app.get('/api/followups', authenticateToken, (req, res) => {
  db.all('SELECT * FROM followups ORDER BY followup_date, followup_time', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/followups', authenticateToken, (req, res) => {
  const { appointment_id, patient_name, patient_phone, followup_date, followup_time, reason, doctor_name } = req.body;
  
  if (!patient_name || !patient_phone || !followup_date || !followup_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    'INSERT INTO followups (appointment_id, patient_name, patient_phone, followup_date, followup_time, reason, doctor_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [appointment_id || null, patient_name, patient_phone, followup_date, followup_time, reason || '', doctor_name || 'Dr. Smith'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Follow-up scheduled successfully' });
    }
  );
});

app.post('/api/appointments/:id/followup', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM appointments WHERE id = ?', [id], (err, appointment) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointmentDateTime = parseISO(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const followupDate = addDays(appointmentDateTime, 30);
    const followupDateStr = format(followupDate, 'yyyy-MM-dd');
    const followupTimeStr = appointment.appointment_time;

    db.run(
      'INSERT INTO followups (appointment_id, patient_name, patient_phone, followup_date, followup_time, reason, doctor_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, appointment.patient_name, appointment.patient_phone, followupDateStr, followupTimeStr, 'Follow-up appointment', appointment.doctor_name],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, message: 'Follow-up scheduled successfully' });
      }
    );
  });
});

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
app.get('/api/clinics/search', (req, res) => {
  const { disease, city, search, latitude, longitude, maxDistance } = req.query;
  let query = 'SELECT c.*, u.name as hospital_name FROM clinics c JOIN users u ON c.hospital_id = u.id WHERE 1=1';
  const params = [];

  if (disease) {
    query += ' AND c.diseases_handled LIKE ?';
    params.push(`%${disease}%`);
  }

  if (city) {
    query += ' AND c.city = ?';
    params.push(city);
  }

  if (search) {
    query += ' AND (c.name LIKE ? OR c.address LIKE ? OR c.specialties LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Calculate distance if coordinates provided
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLon = parseFloat(longitude);
      
      rows = rows.map(clinic => {
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
      rows.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

      // Filter by max distance if provided
      if (maxDistance) {
        rows = rows.filter(clinic => (clinic.distance || Infinity) <= parseFloat(maxDistance));
      }
    }

    res.json(rows);
  });
});

// Serve React app (only in non-serverless mode)
if (process.env.VERCEL !== '1') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export app for Vercel serverless functions
module.exports = app;
