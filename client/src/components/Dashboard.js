import React from 'react';
import './Dashboard.css';
import { format } from 'date-fns';

const Dashboard = ({ stats, todayAppointments }) => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard Overview</h2>
        <p className="dashboard-date">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Appointments</p>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.today}</h3>
            <p>Today's Appointments</p>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending Appointments</p>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>{stats.followups}</h3>
            <p>Scheduled Follow-ups</p>
          </div>
        </div>
      </div>

      <div className="today-appointments">
        <h3>Today's Appointments</h3>
        {todayAppointments.length === 0 ? (
          <div className="empty-state">
            <p>No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="appointments-grid">
            {todayAppointments.map((apt) => (
              <div key={apt.id} className="appointment-card">
                <div className="appointment-time">{apt.appointment_time}</div>
                <div className="appointment-details">
                  <h4>{apt.patient_name}</h4>
                  <p className="appointment-phone">📞 {apt.patient_phone}</p>
                  <p className="appointment-reason">{apt.reason || 'General consultation'}</p>
                  <p className="appointment-doctor">👨‍⚕️ {apt.doctor_name}</p>
                  <span className={`status-badge status-${apt.status}`}>
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;


