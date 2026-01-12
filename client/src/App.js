import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
// Login and Signup are disabled - commented out
// import Login from './components/Login';
// import Signup from './components/Signup';
import PatientDashboard from './components/PatientDashboard';
import HospitalDashboard from './components/HospitalDashboard';

function App() {
  // Create a mock user to bypass authentication
  const [user] = useState({
    id: 'mock-user-id',
    email: 'demo@medcair.com',
    name: 'Demo User',
    role: 'patient', // Change to 'hospital' if you want hospital dashboard
    phone: '1234567890'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Skip authentication check - set loading to false immediately
    setLoading(false);
  }, []);

  const handleLogout = () => {
    // Since we're bypassing auth, logout just refreshes
    window.location.reload();
  };

  // Protected Route Component - now allows access without authentication
  const ProtectedRoute = ({ children, requiredRole }) => {
    if (loading) {
      return <div className="loading-screen">Loading...</div>;
    }

    // Allow access even without user (for now)
    if (!user) {
      // Redirect to patient dashboard as default
      return <Navigate to="/patient" replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
      // Redirect to appropriate dashboard based on role
      if (user.role === 'patient') {
        return <Navigate to="/patient" replace />;
      } else if (user.role === 'hospital') {
        return <Navigate to="/hospital" replace />;
      }
      return <Navigate to="/patient" replace />;
    }

    return children;
  };


  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading medcAIr...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Login and Signup routes are disabled */}
          {/* 
          <Route
            path="/login"
            element={
              user ? (
                <RoleRedirect />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/signup"
            element={
              user ? (
                <RoleRedirect />
              ) : (
                <Signup onSignup={handleSignup} />
              )
            }
          />
          */}

          {/* Dashboard routes - now accessible without authentication */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute requiredRole="patient">
                <PatientDashboard user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital"
            element={
              <ProtectedRoute requiredRole="hospital">
                <HospitalDashboard user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          {/* Default redirect - goes directly to patient dashboard */}
          <Route path="/" element={<Navigate to="/patient" replace />} />
          <Route path="*" element={<Navigate to="/patient" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
