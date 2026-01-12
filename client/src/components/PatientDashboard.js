import React, { useState, useEffect, useCallback } from 'react';
import './PatientDashboard.css';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { API_URL } from '../config/api';
import AppointmentForm from './AppointmentForm';

const PatientDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/patient/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/appointments/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchAppointments();
        alert('Appointment cancelled successfully');
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        alert('Failed to cancel appointment');
      }
    }
  };

  return (
    <div className="patient-dashboard">
      <header className="patient-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🏥</span>
            <h1>medcAIr</h1>
            <span className="logo-subtitle">Patient Portal</span>
          </div>
          <div className="header-right">
            <span className="user-name">Welcome, {user?.name}</span>
            <button onClick={onLogout} className="logout-button">Logout</button>
          </div>
        </div>
        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            ➕ Create Appointment
          </button>
          <button
            className={`nav-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            🔍 Search Clinics
          </button>
          <button
            className={`nav-tab ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            📅 My Appointments
          </button>
        </nav>
      </header>

      <main className="patient-main">
        {activeTab === 'create' && (
          <div className="create-appointment-section">
            <h2>Create New Appointment</h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Fill out the form below to create an appointment. This will be saved to Supabase.
            </p>
            <AppointmentForm onAppointmentCreated={fetchAppointments} />
          </div>
        )}
        {activeTab === 'search' && (
          <div className="search-section">
            <h2>Find a Clinic</h2>
            <ClinicSearch user={user} onBookingSuccess={fetchAppointments} />
          </div>
        )}
        {activeTab === 'appointments' && (
          <div className="appointments-section">
            <h2>My Appointments</h2>
            {loading ? (
              <div className="loading">Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="empty-state">
                <p>No appointments scheduled</p>
                <p className="empty-subtitle">Search for clinics to book an appointment</p>
              </div>
            ) : (
              <div className="appointments-list">
                {appointments.map((apt) => {
                  const aptDate = parseISO(apt.appointment_date);
                  return (
                    <div key={apt.id} className="appointment-item">
                      <div className="appointment-header">
                        <div className="appointment-date-time">
                          <div className="date-display">{format(aptDate, 'EEEE, MMMM d, yyyy')}</div>
                          <div className="time-display">{apt.appointment_time}</div>
                        </div>
                        <span className={`status-badge status-${apt.status}`}>
                          {apt.status}
                        </span>
                      </div>
                      <div className="appointment-body">
                        <h3>{apt.clinic_name || 'Clinic'}</h3>
                        <p className="appointment-address">{apt.clinic_address}</p>
                        {apt.reason && <p className="appointment-reason">📝 {apt.reason}</p>}
                        {apt.disease && <p className="appointment-disease">🦠 {apt.disease}</p>}
                        {apt.doctor_name && <p className="appointment-doctor">👨‍⚕️ {apt.doctor_name}</p>}
                      </div>
                      {apt.status === 'scheduled' && (
                        <div className="appointment-actions">
                          <button
                            onClick={() => handleCancelAppointment(apt.id)}
                            className="cancel-button"
                          >
                            Cancel Appointment
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// ClinicSearch component will be imported from separate file
export const ClinicSearch = ({ user, onBookingSuccess }) => {
  const [searchParams, setSearchParams] = useState({
    disease: '',
    city: '',
    search: '',
    latitude: '',
    longitude: '',
    maxDistance: ''
  });
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = { ...searchParams };
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await axios.get(`${API_URL}/clinics/search`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinics(response.data);
    } catch (error) {
      console.error('Error searching clinics:', error);
      alert('Error searching clinics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSearchParams(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
        },
        (error) => {
          alert('Unable to get your location. Please enter it manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="clinic-search">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-row">
          <div className="form-group">
            <label htmlFor="disease">Disease/Condition</label>
            <input
              type="text"
              id="disease"
              value={searchParams.disease}
              onChange={(e) => setSearchParams({ ...searchParams, disease: e.target.value })}
              placeholder="e.g., Diabetes, Heart Disease, Flu"
            />
          </div>
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              value={searchParams.city}
              onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
              placeholder="e.g., New York"
            />
          </div>
        </div>

        <div className="search-row">
          <div className="form-group">
            <label htmlFor="search">Search by name/address</label>
            <input
              type="text"
              id="search"
              value={searchParams.search}
              onChange={(e) => setSearchParams({ ...searchParams, search: e.target.value })}
              placeholder="Clinic name, address, or specialty"
            />
          </div>
          <div className="form-group">
            <label htmlFor="maxDistance">Max Distance (km)</label>
            <input
              type="number"
              id="maxDistance"
              value={searchParams.maxDistance}
              onChange={(e) => setSearchParams({ ...searchParams, maxDistance: e.target.value })}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="location-row">
          <button type="button" onClick={getCurrentLocation} className="location-button">
            📍 Use My Location
          </button>
          <div className="location-inputs">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={searchParams.latitude}
              onChange={(e) => setSearchParams({ ...searchParams, latitude: e.target.value })}
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={searchParams.longitude}
              onChange={(e) => setSearchParams({ ...searchParams, longitude: e.target.value })}
            />
          </div>
        </div>

        <button type="submit" className="search-button" disabled={loading}>
          {loading ? 'Searching...' : '🔍 Search Clinics'}
        </button>
      </form>

      {clinics.length > 0 && (
        <div className="clinics-results">
          <h3>Found {clinics.length} clinic{clinics.length !== 1 ? 's' : ''}</h3>
          <div className="clinics-grid">
            {clinics.map((clinic) => (
              <div key={clinic.id} className="clinic-card">
                <div className="clinic-header">
                  <h3>{clinic.name}</h3>
                  {clinic.distance !== undefined && (
                    <span className="distance-badge">📍 {clinic.distance} km</span>
                  )}
                </div>
                <div className="clinic-body">
                  <p className="clinic-address">📍 {clinic.address}, {clinic.city}, {clinic.state}</p>
                  {clinic.phone && <p className="clinic-phone">📞 {clinic.phone}</p>}
                  {clinic.specialties && (
                    <p className="clinic-specialties"><strong>Specialties:</strong> {clinic.specialties}</p>
                  )}
                  {clinic.diseases_handled && (
                    <p className="clinic-diseases"><strong>Treats:</strong> {clinic.diseases_handled}</p>
                  )}
                  {clinic.operating_hours && (
                    <p className="clinic-hours"><strong>Hours:</strong> {clinic.operating_hours}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedClinic(clinic)}
                  className="view-slots-button"
                >
                  View Available Slots
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedClinic && (
        <ClinicDetail clinic={selectedClinic} onClose={() => setSelectedClinic(null)} onBookingSuccess={onBookingSuccess} />
      )}
    </div>
  );
};

const ClinicDetail = ({ clinic, onClose, onBookingSuccess }) => {
  const [slots, setSlots] = useState({});
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [bookingSlot, setBookingSlot] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    reason: '',
    disease: ''
  });

  const fetchSlots = useCallback(async (date) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/clinics/${clinic.id}/slots/grouped`, {
        params: { date },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlots(response.data);
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  }, [clinic.id]);

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [clinic.id, selectedDate, fetchSlots]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!bookingSlot) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/appointments`,
        {
          clinic_id: clinic.id,
          appointment_date: bookingSlot.date,
          appointment_time: bookingSlot.time,
          slot_id: bookingSlot.id,
          reason: bookingForm.reason,
          disease: bookingForm.disease,
          doctor_name: bookingSlot.doctor_name
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Appointment booked successfully!');
      setBookingSlot(null);
      setBookingForm({ reason: '', disease: '' });
      fetchSlots(selectedDate);
      if (onBookingSuccess) onBookingSuccess();
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert(error.response?.data?.error || 'Failed to book appointment. Please try again.');
    }
  };

  const availableDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    availableDates.push(format(date, 'yyyy-MM-dd'));
  }

  const dateSlots = slots[selectedDate] || [];
  const freeSlots = dateSlots.filter(slot => slot.is_available);
  const bookedSlots = dateSlots.filter(slot => !slot.is_available);

  return (
    <div className="clinic-detail-overlay" onClick={onClose}>
      <div className="clinic-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{clinic.name} - Available Slots</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="modal-body">
          <div className="date-selector">
            <label>Select Date:</label>
            <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
              {availableDates.map(date => (
                <option key={date} value={date}>
                  {format(parseISO(date), 'EEEE, MMM d')}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="loading">Loading slots...</div>
          ) : (
            <>
              <div className="slots-section">
                <h3>Free Slots</h3>
                {freeSlots.length === 0 ? (
                  <p className="no-slots">No free slots available for this date</p>
                ) : (
                  <div className="slots-grid">
                    {freeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        className="slot-button free"
                        onClick={() => setBookingSlot(slot)}
                      >
                        <div className="slot-time">{slot.time}</div>
                        {slot.doctor_name && <div className="slot-doctor">{slot.doctor_name}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="slots-section">
                <h3>Booked Slots</h3>
                {bookedSlots.length === 0 ? (
                  <p className="no-slots">No booked slots for this date</p>
                ) : (
                  <div className="slots-grid">
                    {bookedSlots.map((slot) => (
                      <div key={slot.id} className="slot-button booked" disabled>
                        <div className="slot-time">{slot.time}</div>
                        {slot.doctor_name && <div className="slot-doctor">{slot.doctor_name}</div>}
                        {slot.booked_by && <div className="slot-booked-by">Booked by: {slot.booked_by}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {bookingSlot && (
            <div className="booking-form-overlay">
              <div className="booking-form">
                <h3>Book Appointment</h3>
                <p>Time: {bookingSlot.time} on {format(parseISO(bookingSlot.date), 'MMMM d, yyyy')}</p>
                {bookingSlot.doctor_name && <p>Doctor: {bookingSlot.doctor_name}</p>}
                <form onSubmit={handleBooking}>
                  <div className="form-group">
                    <label>Reason for Visit (Optional)</label>
                    <input
                      type="text"
                      value={bookingForm.reason}
                      onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                      placeholder="General consultation"
                    />
                  </div>
                  <div className="form-group">
                    <label>Disease/Condition (Optional)</label>
                    <input
                      type="text"
                      value={bookingForm.disease}
                      onChange={(e) => setBookingForm({ ...bookingForm, disease: e.target.value })}
                      placeholder="e.g., Diabetes, Flu"
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="confirm-button">Confirm Booking</button>
                    <button type="button" onClick={() => setBookingSlot(null)} className="cancel-button">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;


