import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import axios from 'axios';
import Login from './components/Login';
import Signup from './components/Signup';
import PatientDashboard from './components/PatientDashboard';
import HospitalDashboard from './components/HospitalDashboard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        // Verify token by making a request
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        axios.get(`${API_URL}/auth/me`)
          .then(response => {
            setUser(response.data);
          })
          .catch(() => {
            // Token invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleSignup = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Protected Route Component
  const ProtectedRoute = ({ children, requiredRole }) => {
    if (loading) {
      return <div className="loading-screen">Loading...</div>;
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
      // Redirect to appropriate dashboard based on role
      if (user.role === 'patient') {
        return <Navigate to="/patient" replace />;
      } else if (user.role === 'hospital') {
        return <Navigate to="/hospital" replace />;
      }
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  // Redirect based on role
  const RoleRedirect = () => {
    if (loading) {
      return <div className="loading-screen">Loading...</div>;
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (user.role === 'patient') {
      return <Navigate to="/patient" replace />;
    } else if (user.role === 'hospital') {
      return <Navigate to="/hospital" replace />;
    }

    return <Navigate to="/login" replace />;
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
          {/* Public routes */}
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

          {/* Protected routes */}
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

          {/* Default redirect */}
          <Route path="/" element={<RoleRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
