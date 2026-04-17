import React, { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const { login, register, forgotPassword, resetPassword } = useAuth();
  
  // step can be 'login', 'register', 'forgot', 'reset'
  const [step, setStep] = useState('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      if (step === 'login') {
        await login(email, password);
        navigate('/dashboard', { replace: true });
      } else if (step === 'register') {
        await register(email, password, name);
        await login(email, password);
        navigate('/dashboard', { replace: true });
      } else if (step === 'forgot') {
        await forgotPassword(email);
        setSuccess('If the email is valid, a reset code was sent.');
        setStep('reset');
      } else if (step === 'reset') {
        await resetPassword(email, code, password);
        setSuccess('Password reset successfully. You can now log in.');
        setStep('login');
        setPassword('');
        setCode('');
      }
    } catch (err) {
      // In JS, errors from server returns string or nested structure
      let errMsg = err.message;
      if (typeof errMsg === 'object') {
        errMsg = JSON.stringify(errMsg);
      }
      setError(errMsg || 'An error occurred');
    }
    setLoading(false);
  };

  return (
    <div className="auth-shell">
      {/* ── Visual panel ── */}
      <div className="auth-visual">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <BrandMark />
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: '1.125rem', color: 'var(--on-surface)',
              letterSpacing: '-0.02em',
            }}>GLOFWatch</div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
              color: 'var(--outline)', letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>Operations</div>
          </div>
        </div>

        <h1>Glacial Observatory<br />Command Center</h1>
        <p>
          Centralize glacial lake telemetry, ML risk scoring, and response alerts
          in one command-ready workspace for the Indian Himalayan Region.
        </p>

        <div className="mini-metric">
          <div><strong>12</strong> lakes monitored</div>
          <div><strong>5s</strong> stream refresh</div>
          <div><strong>24h</strong> audit trail</div>
        </div>

        {/* Atmospheric scan lines on the visual */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'linear-gradient(rgba(196,247,249,0.012) 1px, transparent 1px)',
          backgroundSize: '100% 48px',
        }} />
      </div>

      {/* ── Auth panel (glassmorphism) ── */}
      <div className="auth-panel">
        <h2>
          {step === 'login' ? 'Secure sign in' : 
           step === 'register' ? 'Create an account' :
           step === 'forgot' ? 'Reset password' :
           'Enter reset code'}
        </h2>
        <div className="auth-sub">
          {step === 'login' ? 'Access the early warning dashboard' : 
           step === 'register' ? 'Register to start monitoring basins' :
           step === 'forgot' ? 'We will send a 6-digit code to your email' :
           'Enter the code from your email to set a new password'}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {step === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                className="input"
                type="text"
                placeholder="Anil Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="name@organization.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={step === 'reset'}
            />
          </div>

          {step === 'reset' && (
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="code">6-Digit Reset Code</label>
              <input
                id="code"
                className="input"
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
          )}

          {step !== 'forgot' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password">{step === 'reset' ? 'New Password' : 'Password'}</label>
                {step === 'login' && (
                   <a onClick={() => { setStep('forgot'); setError(''); setSuccess(''); }} 
                      style={{ cursor: 'pointer', fontSize: '0.6875rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                     Forgot?
                   </a>
                )}
              </div>
              
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 52 }}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    border: 'none', background: 'transparent',
                    color: 'var(--primary)', fontFamily: 'var(--font-mono)',
                    fontSize: '0.5625rem', letterSpacing: '0.08em', textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          )}

          {error && <div className="auth-error" style={{ marginBottom: 14 }}>{error}</div>}
          {success && <div style={{ color: 'var(--risk-low)', fontSize: '0.8125rem', marginBottom: 14, background: 'rgba(74, 222, 128, 0.1)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>{success}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: 4 }}
            disabled={loading}
            id="auth-submit-btn"
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <span className="dot-live" style={{ width: 6, height: 6 }} />
                {step === 'login' ? 'Signing in…' : 
                 step === 'register' ? 'Creating account…' :
                 step === 'forgot' ? 'Sending code…' : 'Resetting…'}
              </span>
            ) : (
              step === 'login' ? 'Sign in' : 
              step === 'register' ? 'Create account' :
              step === 'forgot' ? 'Send Reset Code' : 'Update Password'
            )}
          </button>
        </form>

        <div className="auth-toggle">
          {step === 'login' && (
             <span>Need access? <a onClick={() => { setStep('register'); setError(''); setSuccess(''); }} style={{ cursor: 'pointer' }}>Register</a></span>
          )}
          {step === 'register' && (
             <span>Already have access? <a onClick={() => { setStep('login'); setError(''); setSuccess(''); }} style={{ cursor: 'pointer' }}>Sign in</a></span>
          )}
          {(step === 'forgot' || step === 'reset') && (
             <span>Remembered it? <a onClick={() => { setStep('login'); setError(''); setSuccess(''); }} style={{ cursor: 'pointer' }}>Back to Sign in</a></span>
          )}
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--outline)', letterSpacing: '0.06em' }}>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </div>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 4L6 40h36L24 4z" stroke="#C4F7F9" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M24 14L12 38h24L24 14z" fill="rgba(19,32,50,0.9)" stroke="#A8DADC" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M17 30c2.5-4 5-6 7-6s4.5 2 7 6" stroke="#9ECFD1" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="24" cy="38" r="3" fill="#A8DADC" opacity="0.9"/>
    </svg>
  );
}
