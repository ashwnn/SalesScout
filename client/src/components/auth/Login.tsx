import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import AppConfigContext from '@/context/AppConfigContext';
import { trackAuth, trackButton, trackDemoMode } from '@/utils/umami';

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
      // Handle different error scenarios with user-friendly messages
      let errorMessage = 'An error occurred. Please try again.';
      
      if (err.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please wait a few minutes and try again.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid username or password. Please check your credentials and try again.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.message || 'Please check your input and try again.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (!err.response) {
        errorMessage = 'Unable to connect to the server. Please check your connection and try again.';
      }
      
      setError(errorMessage);
      trackAuth('login', false, { username, error: err.response?.data?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    trackButton('demo-login', { source: 'login-page' });
    trackDemoMode('demo-login-attempt');
    try {
      await login('demo', 'Demo1234!');
      trackAuth('login', true, { username: 'demo', method: 'demo-button' });
      trackDemoMode('demo-login-success');
      navigate('/dashboard');
    } catch (err: any) {
      // Handle different error scenarios for demo login
      let errorMessage = 'Demo account is not available';
      
      if (err.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please wait a few minutes and try again.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Demo account is not configured. Please contact the administrator.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (!err.response) {
        errorMessage = 'Unable to connect to the server. Please check your connection and try again.';
      }
      
      setError(errorMessage);
      trackAuth('login', false, { username: 'demo', error: 'demo-unavailable' });
      trackDemoMode('demo-login-failed', { error: errorMessage });
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

      {/* Fork Me Banner */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          textAlign: 'center'
        }}>
          <a
            href="https://ashwin.lol/socials/github/SalesScout/fork"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--muted-foreground)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              transition: 'color 0.12s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
          >
            <svg 
              height="16" 
              width="16" 
              viewBox="0 0 16 16" 
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
            </svg>
            Fork on GitHub
          </a>
        </div>
    </div>
  );
};

export default Login;