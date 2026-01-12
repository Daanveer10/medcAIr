import React, { useState } from 'react';
import './AppointmentForm.css';
import axios from 'axios';
import { format } from 'date-fns';
import { API_URL } from '../config/api';

const AppointmentForm = ({ onAppointmentCreated }) => {
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_phone: '',
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    appointment_time: '09:00',
    reason: '',
    doctor_name: 'Dr. Smith'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
      setMessage({ type: 'success', text: 'Appointment created successfully!' });
      setFormData({
        patient_name: '',
        patient_phone: '',
        appointment_date: format(new Date(), 'yyyy-MM-dd'),
        appointment_time: '09:00',
        reason: '',
        doctor_name: 'Dr. Smith'
      });
      onAppointmentCreated();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to create appointment' 
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


