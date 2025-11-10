import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import AppConfigContext from '@/context/AppConfigContext';
import { trackAuth } from '@/utils/umami';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated } = useContext(AuthContext);
  const { config } = useContext(AppConfigContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  const { username, password } = formData;
  
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };
  
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(username, password);
      trackAuth('login', true, { username, method: 'form' });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
      trackAuth('login', false, { username, error: err.response?.data?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await login('demo', 'Demo1234!');
      trackAuth('login', true, { username: 'demo', method: 'demo-button' });
      navigate('/dashboard');
    } catch (err: any) {
      setError('Demo account is not available');
      trackAuth('login', false, { username: 'demo', error: 'demo-unavailable' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page login-page">
      <div className="auth-container">
        <h1>Log In</h1>
        <p>Sign in to your SalesScout account</p>
        
        {/* Demo Account Info */}
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#1e40af', fontSize: '0.875rem' }}>
            Try Demo Account
          </p>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8125rem', color: '#1e3a8a' }}>
            Test the application without creating an account (read-only mode)
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="btn btn-secondary"
            style={{ width: '100%' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login as Demo User'}
          </button>
        </div>
        
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
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {!config.demoMode && (
          <div className="auth-redirect">
            <p>
              Don't have an account? <Link to="/register">Register</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;