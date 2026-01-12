import React, { useState } from 'react';
import './Signup.css';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config/api';

// Helper function to safely extract error message (never returns an object)
const getErrorMessage = (err) => {
  if (!err) return 'Sign up failed. Please try again.';
  
  // Check for response data error (string)
  if (err.response?.data?.error) {
    const errorData = err.response.data.error;
    if (typeof errorData === 'string') {
      return errorData;
    }
    if (typeof errorData === 'object' && errorData.message) {
      return String(errorData.message);
    }
  }
  
  // Check for error message
  if (err.message && typeof err.message === 'string') {
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      return 'Request timed out. The server may be slow or unreachable. Please try again.';
    }
    if (err.message === 'Network Error' || err.code === 'ERR_NETWORK' || err.code === 'ERR_INTERNET_DISCONNECTED') {
      return 'Cannot connect to server. Please check your internet connection and try again.';
    }
    return err.message;
  }
  
  // Check for status codes
  if (err.response?.status === 404) {
    return 'API endpoint not found. Please check the server configuration.';
  }
  if (err.response?.status === 500) {
    return 'Server error. Please check if Supabase is configured correctly.';
  }
  if (err.response?.status === 504) {
    return 'Request timed out. Please try again.';
  }
  
  // Fallback
  return 'Sign up failed. Please try again.';
};

// Phone validation regex (10-15 digits)
const PHONE_REGEX = /^\d{10,15}$/;

const Signup = ({ onSignup }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'patient',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    // Phone validation (if provided)
    if (formData.phone && !PHONE_REGEX.test(formData.phone.replace(/\D/g, ''))) {
      setError('Phone number must be 10-15 digits');
      setLoading(false);
      return;
    }

    try {
      // Sanitize and prepare data
      const { confirmPassword, ...signupData } = {
        ...formData,
        email: formData.email.trim().toLowerCase(),
        name: formData.name.trim(),
        phone: formData.phone ? formData.phone.replace(/\D/g, '') : ''
      };
      
      const response = await axios.post(`${API_URL}/auth/register`, signupData, {
        timeout: 60000, // 60 seconds to match Vercel maxDuration
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      onSignup(user);
      
      // Redirect based on role
      if (user.role === 'patient') {
        navigate('/patient');
      } else if (user.role === 'hospital') {
        navigate('/hospital');
      }
    } catch (err) {
      // Use helper function to safely extract error message (never an object)
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-large">
            <span className="logo-icon-large">🏥</span>
            <h1>medcAIr</h1>
          </div>
          <h2>Create Account</h2>
          <p>Sign up to get started</p>
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number (Optional)</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number (10-15 digits)"
              pattern="[0-9]{10,15}"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">I am a</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="patient">Patient</option>
              <option value="hospital">Hospital/Clinic</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter password (min 6 characters)"
                autoComplete="new-password"
                minLength="6"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#666',
                  padding: '5px'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                autoComplete="new-password"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#666',
                  padding: '5px'
                }}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="link-button">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
