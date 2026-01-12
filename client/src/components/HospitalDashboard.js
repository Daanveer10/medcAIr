import React, { useState, useEffect, useCallback } from 'react';
import './HospitalDashboard.css';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import Dashboard from './Dashboard';
import AppointmentForm from './AppointmentForm';
import AppointmentsList from './AppointmentsList';
import FollowUpsList from './FollowUpsList';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const HospitalDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appointments, setAppointments] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, followups: 0, pending: 0 });
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const [apptsRes, followupsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/hospital/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/followups`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setAppointments(apptsRes.data);
      setFollowups(followupsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);

  const fetchClinics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/hospital/clinics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinics(response.data);
      if (response.data.length > 0 && !selectedClinic) {
        setSelectedClinic(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  }, [selectedClinic]);

  useEffect(() => {
    if (user?.id) {
      fetchData();
      fetchClinics();
    }
  }, [user, fetchData, fetchClinics]);


  const handleAppointmentCreated = () => {
    fetchData();
  };

  const handleAppointmentUpdate = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/appointments/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment');
    }
  };

  const handleAppointmentDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/appointments/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchData();
      } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('Failed to delete appointment');
      }
    }
  };

  const handleScheduleFollowup = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/appointments/${appointmentId}/followup`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Follow-up scheduled successfully!');
      fetchData();
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      alert('Failed to schedule follow-up');
    }
  };

  return (
    <div className="hospital-dashboard">
      <header className="hospital-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🏥</span>
            <h1>medcAIr</h1>
            <span className="logo-subtitle">Hospital Portal</span>
          </div>
          <div className="header-right">
            <span className="user-name">Welcome, {user?.name}</span>
            <button onClick={onLogout} className="logout-button">Logout</button>
          </div>
        </div>
        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-tab ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            New Appointment
          </button>
          <button
            className={`nav-tab ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments
          </button>
          <button
            className={`nav-tab ${activeTab === 'followups' ? 'active' : ''}`}
            onClick={() => setActiveTab('followups')}
          >
            Follow-ups
          </button>
          <button
            className={`nav-tab ${activeTab === 'slots' ? 'active' : ''}`}
            onClick={() => setActiveTab('slots')}
          >
            Manage Slots
          </button>
        </nav>
      </header>

      <main className="hospital-main">
        {activeTab === 'dashboard' && (
          <Dashboard 
            stats={stats} 
            todayAppointments={appointments.filter(apt => {
              const today = new Date().toISOString().split('T')[0];
              return apt.appointment_date === today;
            })} 
          />
        )}
        {activeTab === 'new' && (
          <AppointmentForm onAppointmentCreated={handleAppointmentCreated} />
        )}
        {activeTab === 'appointments' && (
          <AppointmentsList
            appointments={appointments}
            onUpdate={handleAppointmentUpdate}
            onDelete={handleAppointmentDelete}
            onScheduleFollowup={handleScheduleFollowup}
          />
        )}
        {activeTab === 'followups' && (
          <FollowUpsList followups={followups} />
        )}
        {activeTab === 'slots' && (
          <SlotManagement 
            clinics={clinics} 
            selectedClinic={selectedClinic}
            onSelectClinic={setSelectedClinic}
          />
        )}
      </main>
    </div>
  );
};

const SlotManagement = ({ clinics, selectedClinic, onSelectClinic }) => {
  const [slots, setSlots] = useState({});
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [showCreateSlot, setShowCreateSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    doctor_name: '',
    duration: 30
  });

  const fetchSlots = useCallback(async () => {
    if (!selectedClinic?.id) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/clinics/${selectedClinic.id}/slots/grouped`,
        {
          params: { date: selectedDate },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSlots(response.data);
    } catch (error) {
      console.error('Error fetching slots:', error);
      alert('Failed to fetch slots');
    } finally {
      setLoading(false);
    }
  }, [selectedClinic?.id, selectedDate]);

  useEffect(() => {
    if (selectedClinic?.id) {
      fetchSlots();
    }
  }, [selectedClinic, selectedDate, fetchSlots]);

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!selectedClinic?.id) {
      alert('Please select a clinic first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/clinics/${selectedClinic.id}/slots`,
        {
          date: newSlot.date,
          time: newSlot.time,
          doctor_name: newSlot.doctor_name || null,
          duration: newSlot.duration
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Slot created successfully!');
      setShowCreateSlot(false);
      setNewSlot({
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        doctor_name: '',
        duration: 30
      });
      fetchSlots();
    } catch (error) {
      console.error('Error creating slot:', error);
      alert(error.response?.data?.error || 'Failed to create slot');
    }
  };

  const availableDates = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    availableDates.push(format(date, 'yyyy-MM-dd'));
  }

  const dateSlots = slots[selectedDate] || [];
  const freeSlots = dateSlots.filter(slot => slot.is_available);
  const bookedSlots = dateSlots.filter(slot => !slot.is_available);

  return (
    <div className="slot-management">
      <div className="slot-management-header">
        <h2>Manage Slots</h2>
        {clinics.length > 0 && (
          <div className="clinic-selector">
            <label>Select Clinic:</label>
            <select
              value={selectedClinic?.id || ''}
              onChange={(e) => {
                const clinic = clinics.find(c => c.id === parseInt(e.target.value));
                onSelectClinic(clinic);
              }}
            >
              {clinics.map(clinic => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!selectedClinic ? (
        <div className="empty-state-card">
          <p>No clinics found. Please contact support to add clinics.</p>
        </div>
      ) : (
        <>
          <div className="slot-controls">
            <div className="date-selector">
              <label>View Date:</label>
              <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
                {availableDates.map(date => (
                  <option key={date} value={date}>
                    {format(parseISO(date), 'EEEE, MMM d, yyyy')}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowCreateSlot(!showCreateSlot)}
              className="create-slot-button"
            >
              {showCreateSlot ? 'Cancel' : '+ Create New Slot'}
            </button>
          </div>

          {showCreateSlot && (
            <div className="create-slot-form">
              <h3>Create New Slot</h3>
              <form onSubmit={handleCreateSlot}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={newSlot.date}
                      onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Time</label>
                    <input
                      type="time"
                      value={newSlot.time}
                      onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Doctor Name (Optional)</label>
                    <input
                      type="text"
                      value={newSlot.doctor_name}
                      onChange={(e) => setNewSlot({ ...newSlot, doctor_name: e.target.value })}
                      placeholder="e.g., Dr. Smith"
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration (minutes)</label>
                    <input
                      type="number"
                      value={newSlot.duration}
                      onChange={(e) => setNewSlot({ ...newSlot, duration: parseInt(e.target.value) })}
                      min="15"
                      step="15"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="submit-button">Create Slot</button>
              </form>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading slots...</div>
          ) : (
            <>
              <div className="slots-section">
                <h3>Free Slots ({freeSlots.length})</h3>
                {freeSlots.length === 0 ? (
                  <p className="no-slots">No free slots available for this date</p>
                ) : (
                  <div className="slots-grid">
                    {freeSlots.map((slot) => (
                      <div key={slot.id} className="slot-card free">
                        <div className="slot-time">{slot.time}</div>
                        {slot.doctor_name && <div className="slot-doctor">{slot.doctor_name}</div>}
                        <div className="slot-duration">{slot.duration} min</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="slots-section">
                <h3>Booked Slots ({bookedSlots.length})</h3>
                {bookedSlots.length === 0 ? (
                  <p className="no-slots">No booked slots for this date</p>
                ) : (
                  <div className="slots-grid">
                    {bookedSlots.map((slot) => (
                      <div key={slot.id} className="slot-card booked">
                        <div className="slot-time">{slot.time}</div>
                        {slot.doctor_name && <div className="slot-doctor">{slot.doctor_name}</div>}
                        {slot.booked_by && (
                          <div className="slot-booked-by">Booked by: {slot.booked_by}</div>
                        )}
                        <div className="slot-duration">{slot.duration} min</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default HospitalDashboard;


