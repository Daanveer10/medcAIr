import React, { useState } from 'react';
import './FollowUpsList.css';
import { format, parseISO } from 'date-fns';

const FollowUpsList = ({ followups }) => {
  const [filter, setFilter] = useState('all');

  const filteredFollowups = followups.filter(followup => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      const today = new Date();
      const followupDate = parseISO(followup.followup_date);
      return followupDate >= today;
    }
    return followup.status === filter;
  });

  const sortedFollowups = [...filteredFollowups].sort((a, b) => {
    const dateA = parseISO(`${a.followup_date}T${a.followup_time}`);
    const dateB = parseISO(`${b.followup_date}T${b.followup_time}`);
    return dateA - dateB;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'status-scheduled';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-scheduled';
    }
  };

  return (
    <div className="followups-list-container">
      <div className="list-header">
        <h2>Scheduled Follow-ups</h2>
        <div className="list-controls">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Follow-ups</option>
            <option value="upcoming">Upcoming</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {sortedFollowups.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">🔄</div>
          <p>No follow-ups scheduled yet</p>
          <p className="empty-subtitle">Follow-ups will appear here when scheduled from appointments</p>
        </div>
      ) : (
        <div className="followups-grid">
          {sortedFollowups.map((followup) => {
            const followupDate = parseISO(followup.followup_date);
            const isPast = followupDate < new Date() && followup.status === 'scheduled';
            
            return (
              <div key={followup.id} className={`followup-card ${isPast ? 'past' : ''}`}>
                <div className="followup-header">
                  <div className="followup-icon">🔄</div>
                  <span className={`status-badge-followup ${getStatusColor(followup.status)}`}>
                    {followup.status}
                  </span>
                </div>

                <div className="followup-date-time">
                  <div className="followup-date">
                    {format(followupDate, 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="followup-time">
                    {followup.followup_time}
                  </div>
                </div>

                <div className="followup-body">
                  <h3 className="followup-patient-name">{followup.patient_name}</h3>
                  <div className="followup-info">
                    <p>📞 {followup.patient_phone}</p>
                    <p>👨‍⚕️ {followup.doctor_name}</p>
                    {followup.reason && <p>📝 {followup.reason}</p>}
                  </div>
                  {followup.appointment_id && (
                    <div className="followup-reference">
                      <small>Original Appointment ID: #{followup.appointment_id}</small>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FollowUpsList;


