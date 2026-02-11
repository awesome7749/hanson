import React, { useState, useEffect } from 'react';
import './PasswordProtection.css';

interface PasswordProtectionProps {
  children: React.ReactNode;
}

const PasswordProtection: React.FC<PasswordProtectionProps> = ({ children }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // Password stored in .env - change this before deploying
  const SITE_PASSWORD = process.env.REACT_APP_SITE_PASSWORD || 'hanson2026';

  useEffect(() => {
    // Check if already authenticated in session
    const auth = sessionStorage.getItem('hanson_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === SITE_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('hanson_auth', 'true');
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="password-protection">
      <div className="password-container">
        <div className="lock-icon">🔒</div>
        <h1>Protected Access</h1>
        <p className="password-subtitle">Please enter the password to continue</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="password-input"
            autoFocus
          />
          <button type="submit" className="password-button">
            Enter
          </button>
        </form>

        {error && (
          <div className="password-error">
            {error}
          </div>
        )}

        <p className="password-hint">
          Contact the administrator if you need access.
        </p>
      </div>
    </div>
  );
};

export default PasswordProtection;
