import React, { useState, useEffect } from 'react';
import './AppointmentForm.css';
import axios from 'axios';
import { format } from 'date-fns';
import { API_URL } from '../config/api';

const AppointmentForm = ({ onAppointmentCreated }) => {
  const [formData, setFormData] = useState({
    clinic_id: '',
    patient_name: '',
    patient_phone: '',
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    appointment_time: '09:00',
    reason: '',
    disease: '',
    doctor_name: 'Dr. Smith'
  });
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch clinics on component mount
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await axios.get(`${API_URL}/clinics`, {
          timeout: 8000
        });
        setClinics(response.data || []);
      } catch (error) {
        // Extract error message safely (never pass object to setMessage)
        let errorText = 'Could not load clinics. You can still enter a clinic ID manually.';
        
        if (error.response?.data?.error) {
          const errorData = error.response.data.error;
          if (typeof errorData === 'string') {
            errorText = errorData;
          } else if (typeof errorData === 'object' && errorData.message) {
            errorText = String(errorData.message);
          }
        } else if (error.message && typeof error.message === 'string') {
          if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            errorText = 'Request timed out. Clinics may take a moment to load.';
          } else if (error.response?.status === 504) {
            errorText = 'Request timed out. Please try again.';
          } else {
            errorText = error.message;
          }
        } else if (error.response?.status) {
          if (error.response.status === 504) {
            errorText = 'Request timed out. Please try again.';
          } else if (error.response.status === 500) {
            errorText = 'Server error. Please check if Supabase is configured.';
          }
        }
        
        setMessage({ 
          type: 'error', 
          text: errorText
        });
      } finally {
        setLoadingClinics(false);
      }
    };
    fetchClinics();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post(`${API_URL}/appointments`, formData);
      setMessage({ type: 'success', text: 'Appointment created successfully! Data saved to Supabase.' });
      setFormData({
        clinic_id: '',
        patient_name: '',
        patient_phone: '',
        appointment_date: format(new Date(), 'yyyy-MM-dd'),
        appointment_time: '09:00',
        reason: '',
        disease: '',
        doctor_name: 'Dr. Smith'
      });
      onAppointmentCreated();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      // Safely extract error message (always a string)
      const errorText = error.response?.data?.error || 
                       error.message || 
                       'Failed to create appointment';
      setMessage({ 
        type: 'error', 
        text: typeof errorText === 'string' ? errorText : 'Failed to create appointment'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="appointment-form-container">
      <div className="form-card">
        <div className="form-header">
          <h2>📞 Schedule New Appointment</h2>
          <p>Create a new appointment from a call or walk-in</p>
        </div>

        {message.text && (
          <div className={`message message-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="appointment-form">
          <div className="form-group">
            <label htmlFor="clinic_id">Select Clinic *</label>
            {loadingClinics ? (
              <div>Loading clinics...</div>
            ) : clinics.length > 0 ? (
              <select
                id="clinic_id"
                name="clinic_id"
                value={formData.clinic_id}
                onChange={handleChange}
                required
              >
                <option value="">-- Select a Clinic --</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name} - {clinic.city}, {clinic.state}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  type="text"
                  id="clinic_id"
                  name="clinic_id"
                  value={formData.clinic_id}
                  onChange={handleChange}
                  required
                  placeholder="Enter clinic ID (UUID)"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  No clinics found. Enter a clinic ID manually (UUID format)
                </small>
              </>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="patient_name">Patient Name *</label>
            <input
              type="text"
              id="patient_name"
              name="patient_name"
              value={formData.patient_name}
              onChange={handleChange}
              required
              placeholder="Enter patient's full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="patient_phone">Phone Number *</label>
            <input
              type="tel"
              id="patient_phone"
              name="patient_phone"
              value={formData.patient_phone}
              onChange={handleChange}
              required
              placeholder="Enter phone number"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="appointment_date">Appointment Date *</label>
              <input
                type="date"
                id="appointment_date"
                name="appointment_date"
                value={formData.appointment_date}
                onChange={handleChange}
                required
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="appointment_time">Appointment Time *</label>
              <input
                type="time"
                id="appointment_time"
                name="appointment_time"
                value={formData.appointment_time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="doctor_name">Doctor Name</label>
            <select
              id="doctor_name"
              name="doctor_name"
              value={formData.doctor_name}
              onChange={handleChange}
            >
              <option value="Dr. Smith">Dr. Smith</option>
              <option value="Dr. Johnson">Dr. Johnson</option>
              <option value="Dr. Williams">Dr. Williams</option>
              <option value="Dr. Brown">Dr. Brown</option>
              <option value="Dr. Davis">Dr. Davis</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reason">Reason for Visit</label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows="3"
              placeholder="Enter reason for visit (optional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="disease">Disease/Condition (Optional)</label>
            <input
              type="text"
              id="disease"
              name="disease"
              value={formData.disease}
              onChange={handleChange}
              placeholder="e.g., Diabetes, Flu, Heart Disease"
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Creating...' : '📅 Create Appointment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;


