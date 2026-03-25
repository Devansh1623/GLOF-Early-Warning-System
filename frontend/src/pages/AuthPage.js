import React, { useState, useMemo } from 'react';
import { useAuth } from '../utils/AuthContext';
import { Link } from 'react-router-dom';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  // Generate stable random particles once
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      left: `${8 + Math.random() * 84}%`,
      top: `${5 + Math.random() * 90}%`,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 5,
      dur: 4 + Math.random() * 6,
    }))
  , []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      {/* Ambient background effects */}
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <div style={styles.bgOrb3} />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: p.left, top: p.top,
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: 'rgba(96, 165, 250, 0.35)',
          animation: `float ${p.dur}s ease-in-out ${p.delay}s infinite`,
          pointerEvents: 'none', zIndex: 0,
        }} />
      ))}

      <div style={styles.container}>
        {/* Left panel — branding */}
        <div style={styles.leftPanel}>
          <div style={styles.brandContent}>
            <div style={styles.logoMark}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 4L4 36h32L20 4z" stroke="url(#g1)" strokeWidth="2.5" fill="none"/>
                <path d="M20 12L10 32h20L20 12z" stroke="url(#g1)" strokeWidth="1.5" fill="url(#g1)" fillOpacity="0.08"/>
                <path d="M14 28c2-4 4-6 6-6s4 2 6 6" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="20" cy="19" r="2" fill="#60a5fa" fillOpacity="0.6"/>
                <defs><linearGradient id="g1" x1="20" y1="4" x2="20" y2="36"><stop stopColor="#60a5fa"/><stop offset="1" stopColor="#818cf8"/></linearGradient></defs>
              </svg>
            </div>
            <h1 style={styles.brandTitle}>GLOFWatch</h1>
            <p style={styles.brandTagline}>Glacial Lake Outburst Flood<br/>Early Warning System</p>
            <div style={styles.divider} />
            <div style={styles.features}>
              <Feature icon="🛰️" text="12 CWC/NRSC monitored Himalayan lakes" />
              <Feature icon="📡" text="Real-time SSE telemetry streaming" />
              <Feature icon="⚠️" text="Automated risk scoring & emergency alerts" />
              <Feature icon="🗺️" text="Interactive Leaflet map with live risk overlay" />
            </div>
            <div style={styles.brandFooter}>
              <span style={styles.brandFooterText}>Powered by Open-Meteo · CWC · NRSC</span>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div style={styles.rightPanel}>
          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>{isLogin ? 'Welcome back' : 'Create account'}</h2>
              <p style={styles.formSub}>
                {isLogin ? 'Sign in to access the monitoring dashboard' : 'Register to start monitoring glacial lakes'}
              </p>
            </div>

            {!isLogin && (
              <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="name">Full Name</label>
                <input id="name" className="input" type="text" placeholder="Dr. Anil Sharma"
                  value={name} onChange={e => setName(e.target.value)}
                  style={styles.input} />
              </div>
            )}

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="email">Email Address</label>
              <input id="email" className="input" type="email" placeholder="name@organization.in"
                value={email} onChange={e => setEmail(e.target.value)} required
                style={styles.input} />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="password">Password</label>
              <div style={{position:'relative'}}>
                <input id="password" className="input" type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required
                  style={{...styles.input, paddingRight:40}} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={styles.eyeBtn}
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={styles.submitBtn}>
              {loading ? (
                <span style={styles.spinner} />
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>

            <div style={styles.toggle}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <a onClick={() => { setIsLogin(!isLogin); setError(''); }}
                style={styles.toggleLink}>
                {isLogin ? 'Register' : 'Sign In'}
              </a>
            </div>

            {/* Demo credentials */}
            <div style={styles.demoBox}>
              <div style={styles.demoTitle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Demo Credentials
              </div>
              <div style={styles.demoGrid}>
                <DemoAccount role="Admin" email="admin@glof.in" pass="admin123" />
                <DemoAccount role="User" email="user@glof.in" pass="user123" />
              </div>
            </div>

            {/* Legal links */}
            <div style={styles.legalRow}>
              <Link to="/privacy" style={styles.legalLink}>Privacy Policy</Link>
              <span style={styles.legalDot}>·</span>
              <Link to="/terms" style={styles.legalLink}>Terms of Service</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function Feature({ icon, text }) {
  return (
    <div style={styles.feature}>
      <span style={styles.featureIcon}>{icon}</span>
      <span style={styles.featureText}>{text}</span>
    </div>
  );
}

function DemoAccount({ role, email, pass }) {
  return (
    <div style={styles.demoAccount}>
      <span style={styles.demoRole}>{role}</span>
      <span style={styles.demoEmail}>{email}</span>
      <span style={styles.demoPass}>{pass}</span>
    </div>
  );
}

/* ── Styles ── */
const styles = {
  page: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: '#060a14', position: 'relative', overflow: 'hidden',
  },
  bgOrb1: {
    position: 'absolute', width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
    top: '-15%', left: '-10%', pointerEvents: 'none',
  },
  bgOrb2: {
    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)',
    bottom: '-10%', right: '-5%', pointerEvents: 'none',
  },
  bgOrb3: {
    position: 'absolute', width: 300, height: 300, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 70%)',
    top: '40%', left: '50%', pointerEvents: 'none',
  },
  container: {
    display: 'flex', width: 880, maxWidth: '95vw',
    background: 'rgba(10, 14, 26, 0.9)',
    border: '1px solid rgba(56, 78, 119, 0.25)',
    borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.05)',
    backdropFilter: 'blur(20px)', position: 'relative', zIndex: 1,
  },
  leftPanel: {
    width: 360, background: 'linear-gradient(160deg, #0a1628 0%, #0d1b2a 50%, #0a1220 100%)',
    borderRight: '1px solid rgba(56, 78, 119, 0.2)',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    padding: '48px 36px', position: 'relative',
  },
  brandContent: { position: 'relative', zIndex: 1 },
  logoMark: { marginBottom: 16 },
  brandTitle: {
    fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em',
    background: 'linear-gradient(135deg, #60a5fa, #818cf8)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    marginBottom: 6,
  },
  brandTagline: {
    fontSize: 14, color: '#6b83a8', lineHeight: 1.5, fontWeight: 400,
  },
  divider: {
    width: 40, height: 2, background: 'linear-gradient(90deg, #3b82f6, transparent)',
    margin: '24px 0', borderRadius: 1,
  },
  features: { display: 'flex', flexDirection: 'column', gap: 14 },
  feature: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  featureIcon: { fontSize: 15, lineHeight: 1.4, flexShrink: 0 },
  featureText: { fontSize: 12, color: '#7b94b8', lineHeight: 1.5 },
  brandFooter: { marginTop: 32 },
  brandFooterText: {
    fontSize: 10, color: '#3d5a80', textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  rightPanel: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '48px 40px',
  },
  form: { width: '100%', maxWidth: 360 },
  formHeader: { marginBottom: 28 },
  formTitle: {
    fontSize: 22, fontWeight: 700, color: '#e8edf5',
    letterSpacing: '-0.02em', marginBottom: 6,
  },
  formSub: { fontSize: 13, color: '#6b83a8' },
  fieldGroup: { marginBottom: 18 },
  label: {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: '#8b9dc3', marginBottom: 7, letterSpacing: '0.02em',
  },
  input: { width: '100%' },
  eyeBtn: {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
    padding: 4, lineHeight: 1, display: 'flex', alignItems: 'center',
  },
  submitBtn: {
    width: '100%', padding: '12px 20px', marginTop: 6, fontSize: 14,
    fontWeight: 600, borderRadius: 8,
  },
  spinner: {
    display: 'inline-block', width: 18, height: 18,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  },
  toggle: {
    textAlign: 'center', marginTop: 18, fontSize: 13, color: '#4a5f82',
  },
  toggleLink: {
    color: '#60a5fa', cursor: 'pointer', fontWeight: 600,
    textDecoration: 'none',
  },
  demoBox: {
    marginTop: 24, padding: '14px 16px',
    background: 'rgba(15, 22, 41, 0.6)',
    border: '1px solid rgba(56, 78, 119, 0.2)',
    borderRadius: 10,
  },
  demoTitle: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 11, fontWeight: 600, color: '#6b83a8',
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
  },
  demoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  demoAccount: {
    display: 'flex', flexDirection: 'column', gap: 2,
    padding: '8px 10px', background: 'rgba(10, 14, 26, 0.5)',
    borderRadius: 6, border: '1px solid rgba(56, 78, 119, 0.15)',
  },
  demoRole: {
    fontSize: 10, fontWeight: 700, color: '#60a5fa',
    textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  demoEmail: {
    fontSize: 11, color: '#8b9dc3', fontFamily: "'JetBrains Mono', monospace",
  },
  demoPass: {
    fontSize: 11, color: '#4a5f82', fontFamily: "'JetBrains Mono', monospace",
  },
  legalRow: {
    display: 'flex', justifyContent: 'center', gap: 8,
    marginTop: 20, fontSize: 11,
  },
  legalLink: {
    color: '#4a5f82', textDecoration: 'none', transition: 'color 0.15s',
  },
  legalDot: { color: '#2a3a54' },
};
