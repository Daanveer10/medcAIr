import React, { useState } from 'react';
import './AppointmentsList.css';
import { format, parseISO } from 'date-fns';

const AppointmentsList = ({ appointments, onUpdate, onDelete, onScheduleFollowup }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    if (filter === 'today') {
      const today = format(new Date(), 'yyyy-MM-dd');
      return apt.appointment_date === today;
    }
    if (filter === 'upcoming') {
      const today = new Date();
      const aptDate = parseISO(apt.appointment_date);
      return aptDate >= today;
    }
    return apt.status === filter;
  });

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = parseISO(`${a.appointment_date}T${a.appointment_time}`);
      const dateB = parseISO(`${b.appointment_date}T${b.appointment_time}`);
      return dateA - dateB;
    }
    if (sortBy === 'name') {
      return a.patient_name.localeCompare(b.patient_name);
    }
    return 0;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'status-scheduled';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-scheduled';
    }
  };

  const handleStatusChange = (id, currentStatus) => {
    const newStatus = currentStatus === 'scheduled' ? 'completed' : 
                     currentStatus === 'completed' ? 'cancelled' : 'scheduled';
    onUpdate(id, newStatus);
  };

  return (
    <div className="appointments-list-container">
      <div className="list-header">
        <h2>All Appointments</h2>
        <div className="list-controls">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Appointments</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {sortedAppointments.length === 0 ? (
        <div className="empty-state-card">
          <p>No appointments found</p>
        </div>
      ) : (
        <div className="appointments-grid-list">
          {sortedAppointments.map((apt) => {
            const aptDate = parseISO(apt.appointment_date);
            const isPast = aptDate < new Date() && apt.status === 'scheduled';
            
            return (
              <div key={apt.id} className={`appointment-card-list ${isPast ? 'past' : ''}`}>
                <div className="card-header">
                  <div className="card-date-time">
                    <div className="date-display">
                      {format(aptDate, 'MMM d, yyyy')}
                    </div>
                    <div className="time-display">
                      {apt.appointment_time}
                    </div>
                  </div>
                  <span className={`status-badge-list ${getStatusColor(apt.status)}`}>
                    {apt.status}
                  </span>
                </div>

                <div className="card-body">
                  <h3 className="patient-name">{apt.patient_name}</h3>
                  <div className="patient-info">
                    <p>📞 {apt.patient_phone}</p>
                    <p>👨‍⚕️ {apt.doctor_name}</p>
                    {apt.reason && <p>📝 {apt.reason}</p>}
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    onClick={() => handleStatusChange(apt.id, apt.status)}
                    className="action-button action-update"
                  >
                    {apt.status === 'scheduled' ? '✓ Complete' : 
                     apt.status === 'completed' ? '✗ Cancel' : '↻ Reschedule'}
                  </button>
                  <button
                    onClick={() => onScheduleFollowup(apt.id)}
                    className="action-button action-followup"
                    disabled={apt.status !== 'completed'}
                  >
                    🔄 Follow-up
                  </button>
                  <button
                    onClick={() => onDelete(apt.id)}
                    className="action-button action-delete"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AppointmentsList;


