import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import api from '@/utils/api';
import { trackAuth } from '@/utils/umami';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationDisabled, setRegistrationDisabled] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  const { register, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Check if registration is enabled
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        // Make a test request to check registration status
        await api.post('/users/register', {
          username: '__CHECK__',
          email: '__CHECK__@test.com',
          password: '__CHECK__'
        });
      } catch (err: any) {
        // If we get a 404, registration is disabled
        if (err.response?.status === 404) {
          setRegistrationDisabled(true);
        }
        // Other errors (400, etc.) mean registration is enabled but validation failed
      } finally {
        setCheckingStatus(false);
      }
    };

    checkRegistrationStatus();
  }, []);
  
  const { username, email, password, confirmPassword } = formData;
  
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };
  
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both password fields are identical.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await register(username, email, password);
      trackAuth('register', true, { username });
      navigate('/dashboard');
    } catch (err: any) {
      // Handle different error scenarios with user-friendly messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.response?.status === 404) {
        setRegistrationDisabled(true);
        errorMessage = 'Registration is currently disabled by the administrator.';
        trackAuth('register', false, { username, error: 'registration-disabled' });
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many registration attempts. Please wait a few minutes and try again.';
      } else if (err.response?.status === 400) {
        // Use the backend validation message if available
        errorMessage = err.response?.data?.message || 'Invalid input. Please check your information and try again.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (!err.response) {
        errorMessage = 'Unable to connect to the server. Please check your connection and try again.';
      }
      
      setError(errorMessage);
      if (err.response?.status !== 404) {
        trackAuth('register', false, { username, error: err.response?.data?.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="auth-page register-page">
        <div className="auth-container">
          <div className="loading-indicator">Checking registration status...</div>
        </div>
      </div>
    );
  }

  if (registrationDisabled) {
    return (
      <div className="auth-page register-page">
        <div className="auth-container">
          <h1>Registration Disabled</h1>
          <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
            Registration is currently disabled by the administrator. Please contact the administrator if you need access.
          </div>
          <div className="auth-redirect" style={{ marginTop: '1.5rem' }}>
            <p>
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page register-page">
      <div className="auth-container">
        <h1>Create Account</h1>
        <p>Sign up for a SalesScout account</p>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={onChange}
              required
              minLength={3}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              required
              minLength={6}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        
        <div className="auth-redirect">
          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;