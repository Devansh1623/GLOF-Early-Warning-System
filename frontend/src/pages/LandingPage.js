import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Public-facing landing page for GLOFWatch.
 * Styled inline to keep everything self-contained.
 */
export default function LandingPage() {
  return (
    <div className="landing-page" style={s.page}>

      {/* ▸ Ambient glows */}
      <div style={s.glow1} />
      <div style={s.glow2} />

      {/* ════════ Navbar ════════ */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.navBrand}>
            <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
              <path d="M20 4L4 36h32L20 4z" stroke="url(#nG)" strokeWidth="2.5" fill="none"/>
              <path d="M20 12L10 32h20L20 12z" stroke="url(#nG)" strokeWidth="1.5" fill="url(#nG)" fillOpacity="0.08"/>
              <path d="M14 28c2-4 4-6 6-6s4 2 6 6" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/>
              <defs><linearGradient id="nG" x1="20" y1="4" x2="20" y2="36"><stop stopColor="#60a5fa"/><stop offset="1" stopColor="#818cf8"/></linearGradient></defs>
            </svg>
            <span style={s.navTitle}>GLOFWatch</span>
          </div>
          <div style={s.navLinks}>
            <a href="#features" style={s.navLink}>Features</a>
            <a href="#how-it-works" style={s.navLink}>How It Works</a>
            <a href="#stats" style={s.navLink}>Impact</a>
            <Link to="/login" style={s.navCTA}>Sign In →</Link>
          </div>
        </div>
      </nav>

      {/* ════════ Hero ════════ */}
      <section style={s.hero}>
        <div style={{ animation: 'fadeSlideUp 0.8s ease-out forwards', opacity: 0 }}>
          <div style={s.heroBadge}>
            <span style={s.heroBadgeDot} />
            Live Monitoring · 12 Glacial Lakes
          </div>
          <h1 className="landing-hero" style={s.heroTitle}>
            Predict Glacial Lake<br />
            <span style={s.heroGradient}>Outburst Floods</span>
            <br />Before They Strike
          </h1>
          <p style={s.heroSub}>
            Real-time satellite telemetry, automated risk scoring, and emergency
            alerts for Himalayan glacial lakes. Protecting millions of downstream
            communities.
          </p>
          <div style={s.heroCTAs}>
            <Link to="/login" style={s.btnPrimary}>
              Launch Dashboard →
            </Link>
            <a href="#features" style={s.btnOutline}>
              Learn More ↓
            </a>
          </div>
        </div>

        {/* Animated status display */}
        <div style={{ animation: 'fadeSlideUp 1s ease-out 0.3s forwards', opacity: 0 }}>
          <div style={s.heroPreview}>
            <div style={s.previewHeader}>
              <span style={s.previewDot('#22c55e')} />
              <span style={{fontSize:11,color:'#22c55e',fontWeight:600}}>SYSTEM ACTIVE</span>
              <span style={{fontSize:11,color:'#4a5f82',marginLeft:'auto'}}>12 lakes monitored</span>
            </div>
            <div style={s.previewGrid}>
              <PreviewStat label="Risk Alerts (24h)" value="3" color="#ef4444" />
              <PreviewStat label="Avg Risk Score"     value="42.1" color="#f59e0b" />
              <PreviewStat label="Temperature"        value="6.8°C" color="#60a5fa" />
              <PreviewStat label="Uptime"             value="99.9%" color="#22c55e" />
            </div>
          </div>
        </div>
      </section>

      {/* ════════ Features ════════ */}
      <section id="features" style={s.section}>
        <h2 style={s.sectionTitle}>Comprehensive Monitoring Platform</h2>
        <p style={s.sectionSub}>
          End-to-end early warning system built for India's most critical glacial lakes
        </p>
        <div className="landing-features" style={s.featureGrid}>
          <FeatureCard icon="🛰️" title="Satellite Tracking"
            desc="CWC & NRSC verified data for 12 high-risk Himalayan lakes with real-time parameter feeds." />
          <FeatureCard icon="📡" title="Live SSE Telemetry"
            desc="Server-Sent Events stream temperature, precipitation, water level and seismic data every 5 seconds." />
          <FeatureCard icon="⚡" title="Instant Alerts"
            desc="Browser push notifications and in-app toasts the moment risk thresholds are breached." />
          <FeatureCard icon="🗺️" title="Interactive Map"
            desc="Leaflet map with colour-coded risk overlays, pop-up details, and one-click lake navigation." />
          <FeatureCard icon="📊" title="Analytics Dashboard"
            desc="Recharts-powered time-series, histograms, risk correlation and historical event analysis." />
          <FeatureCard icon="🔐" title="Role-Based Access"
            desc="JWT authentication with admin and user roles, session management, and audit logging." />
        </div>
      </section>

      {/* ════════ How it Works ════════ */}
      <section id="how-it-works" style={{ ...s.section, background: 'rgba(8, 12, 22, 0.6)' }}>
        <h2 style={s.sectionTitle}>How It Works</h2>
        <p style={s.sectionSub}>From satellite to emergency alert in seconds</p>
        <div style={s.stepsRow}>
          <Step num="01" title="Data Ingestion"
            desc="Open-Meteo API feeds weather & hydrological data for each glacial lake basin." />
          <StepArrow />
          <Step num="02" title="Risk Scoring"
            desc="Weighted algorithm (temperature 35%, rainfall 30%, water level 25%, seismicity 10%) computes a 0–100 score." />
          <StepArrow />
          <Step num="03" title="Alert Broadcast"
            desc="SSE stream pushes updates; browser notifications + in-app toasts fire when thresholds are crossed." />
        </div>
      </section>

      {/* ════════ Stats ════════ */}
      <section id="stats" style={s.section}>
        <div className="landing-stats" style={s.statsRow}>
          <Stat num="12" label="Glacial Lakes Monitored" />
          <Stat num="5s" label="Data Refresh Interval" />
          <Stat num="4" label="Risk Parameters Tracked" />
          <Stat num="100%" label="Open-Source Stack" />
        </div>
      </section>

      {/* ════════ CTA ════════ */}
      <section style={s.ctaSection}>
        <h2 style={s.ctaTitle}>Start Monitoring Today</h2>
        <p style={s.ctaSub}>
          Create a free account and access the full real-time dashboard.
        </p>
        <Link to="/login" style={s.btnPrimary}>
          Get Started — Free →
        </Link>
      </section>

      {/* ════════ Footer ════════ */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div>
            <span style={{fontSize:14,fontWeight:700,color:'#8b9dc3'}}>GLOFWatch</span>
            <span style={{fontSize:11,color:'#4a5f82',marginLeft:8}}>
              © {new Date().getFullYear()}
            </span>
          </div>
          <div style={{display:'flex',gap:20}}>
            <Link to="/privacy" style={s.footLink}>Privacy</Link>
            <Link to="/terms" style={s.footLink}>Terms</Link>
            <span style={s.footLink}>Powered by Open-Meteo · CWC · NRSC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */
function PreviewStat({ label, value, color }) {
  return (
    <div style={s.previewStat}>
      <div style={{fontSize:10,color:'#4a5f82',textTransform:'uppercase',letterSpacing:'0.08em'}}>{label}</div>
      <div style={{fontSize:22,fontWeight:700,color,fontFamily:"'JetBrains Mono',monospace",marginTop:4}}>{value}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div style={s.featureCard}>
      <div style={s.featureIcon}>{icon}</div>
      <h3 style={s.featureTitle}>{title}</h3>
      <p style={s.featureDesc}>{desc}</p>
    </div>
  );
}

function Step({ num, title, desc }) {
  return (
    <div style={s.step}>
      <div style={s.stepNum}>{num}</div>
      <h4 style={s.stepTitle}>{title}</h4>
      <p style={s.stepDesc}>{desc}</p>
    </div>
  );
}

function StepArrow() {
  return (
    <div style={{color:'#3b82f6',fontSize:20,display:'flex',alignItems:'center',padding:'0 8px'}}>→</div>
  );
}

function Stat({ num, label }) {
  return (
    <div style={{textAlign:'center'}}>
      <div style={{fontSize:40,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",
        background:'linear-gradient(135deg,#60a5fa,#818cf8)',WebkitBackgroundClip:'text',
        WebkitTextFillColor:'transparent',backgroundClip:'text'}}>{num}</div>
      <div style={{fontSize:12,color:'#6b83a8',marginTop:6}}>{label}</div>
    </div>
  );
}

/* ── Styles ── */
const s = {
  page: {
    background: '#060a14', color: '#e8edf5', position: 'relative',
    minHeight: '100vh',
  },
  glow1: {
    position: 'fixed', width: 700, height: 700, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
    top: '-10%', left: '-10%', pointerEvents: 'none', zIndex: 0,
  },
  glow2: {
    position: 'fixed', width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(129,140,248,0.05) 0%, transparent 70%)',
    bottom: '-10%', right: '-10%', pointerEvents: 'none', zIndex: 0,
  },

  /* Nav */
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(6, 10, 20, 0.85)',
    backdropFilter: 'blur(14px)',
    borderBottom: '1px solid rgba(56, 78, 119, 0.2)',
  },
  navInner: {
    maxWidth: 1100, margin: '0 auto', padding: '14px 32px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  navBrand: { display: 'flex', alignItems: 'center', gap: 10 },
  navTitle: {
    fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em',
    background: 'linear-gradient(135deg, #60a5fa, #818cf8)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  navLinks: { display: 'flex', alignItems: 'center', gap: 24 },
  navLink: {
    fontSize: 13, color: '#6b83a8', textDecoration: 'none', fontWeight: 500,
    transition: 'color 0.15s',
  },
  navCTA: {
    fontSize: 13, fontWeight: 600, color: '#fff',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    padding: '8px 18px', borderRadius: 8, textDecoration: 'none',
    boxShadow: '0 2px 12px rgba(59,130,246,0.25)',
    transition: 'box-shadow 0.2s',
  },

  /* Hero */
  hero: {
    maxWidth: 1100, margin: '0 auto', padding: '100px 32px 60px',
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center',
    position: 'relative', zIndex: 1,
  },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontSize: 11, fontWeight: 600, color: '#60a5fa', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: 20,
    background: 'rgba(59,130,246,0.08)', padding: '6px 14px', borderRadius: 20,
    border: '1px solid rgba(59,130,246,0.15)',
  },
  heroBadgeDot: {
    width: 6, height: 6, borderRadius: '50%', background: '#22c55e',
    animation: 'pulse 2s ease-in-out infinite',
  },
  heroTitle: {
    fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em',
    lineHeight: 1.15, marginBottom: 20,
  },
  heroGradient: {
    background: 'linear-gradient(135deg, #60a5fa, #818cf8, #a78bfa)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSub: {
    fontSize: 15, color: '#7b94b8', lineHeight: 1.7, maxWidth: 480, marginBottom: 32,
  },
  heroCTAs: { display: 'flex', gap: 14 },

  btnPrimary: {
    display: 'inline-flex', alignItems: 'center',
    padding: '13px 26px', borderRadius: 10, fontSize: 14, fontWeight: 700,
    color: '#fff', background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    textDecoration: 'none',
    boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
    transition: 'box-shadow 0.2s, transform 0.15s',
  },
  btnOutline: {
    display: 'inline-flex', alignItems: 'center',
    padding: '13px 26px', borderRadius: 10, fontSize: 14, fontWeight: 600,
    color: '#8b9dc3', background: 'transparent',
    border: '1px solid rgba(56, 78, 119, 0.35)', textDecoration: 'none',
    transition: 'border-color 0.2s, color 0.15s',
  },

  /* Preview card */
  heroPreview: {
    background: 'rgba(10, 14, 26, 0.9)',
    border: '1px solid rgba(56, 78, 119, 0.25)',
    borderRadius: 16, padding: 24,
    boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
    backdropFilter: 'blur(20px)',
  },
  previewHeader: {
    display: 'flex', alignItems: 'center', gap: 8,
    paddingBottom: 16, borderBottom: '1px solid rgba(56,78,119,0.2)',
    marginBottom: 16,
  },
  previewDot: (c) => ({
    width: 8, height: 8, borderRadius: '50%', background: c,
    animation: 'pulse 2s ease-in-out infinite',
  }),
  previewGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
  },
  previewStat: {
    padding: 14, background: 'rgba(15, 22, 41, 0.6)',
    borderRadius: 10, border: '1px solid rgba(56,78,119,0.15)',
  },

  /* Section */
  section: {
    maxWidth: 1100, margin: '0 auto', padding: '80px 32px',
    position: 'relative', zIndex: 1,
  },
  sectionTitle: {
    fontSize: 28, fontWeight: 800, textAlign: 'center',
    letterSpacing: '-0.02em', marginBottom: 10,
  },
  sectionSub: {
    fontSize: 14, color: '#6b83a8', textAlign: 'center', marginBottom: 48,
  },

  /* Features */
  featureGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20,
  },
  featureCard: {
    padding: 24, background: 'rgba(15, 22, 41, 0.7)',
    border: '1px solid rgba(56,78,119,0.2)',
    borderRadius: 14, transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  featureIcon: { fontSize: 26, marginBottom: 14 },
  featureTitle: {
    fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#e8edf5',
  },
  featureDesc: { fontSize: 13, color: '#7b94b8', lineHeight: 1.6 },

  /* Steps */
  stepsRow: {
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 12,
    flexWrap: 'wrap',
  },
  step: {
    maxWidth: 260, padding: 24, background: 'rgba(15, 22, 41, 0.6)',
    border: '1px solid rgba(56,78,119,0.15)', borderRadius: 14, textAlign: 'center',
  },
  stepNum: {
    fontSize: 32, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace",
    background: 'linear-gradient(135deg, #3b82f6, #818cf8)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text', marginBottom: 12,
  },
  stepTitle: { fontSize: 15, fontWeight: 700, marginBottom: 8 },
  stepDesc: { fontSize: 13, color: '#7b94b8', lineHeight: 1.6 },

  /* Stats */
  statsRow: {
    display: 'flex', justifyContent: 'center', gap: 64, flexWrap: 'wrap',
  },

  /* CTA */
  ctaSection: {
    textAlign: 'center', padding: '80px 32px',
    background: 'linear-gradient(180deg, transparent, rgba(59,130,246,0.04))',
    position: 'relative', zIndex: 1,
  },
  ctaTitle: { fontSize: 28, fontWeight: 800, marginBottom: 12 },
  ctaSub: { fontSize: 14, color: '#6b83a8', marginBottom: 28 },

  /* Footer */
  footer: {
    borderTop: '1px solid rgba(56, 78, 119, 0.2)',
    padding: '20px 32px', position: 'relative', zIndex: 1,
  },
  footerInner: {
    maxWidth: 1100, margin: '0 auto',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: 12,
  },
  footLink: { fontSize: 12, color: '#4a5f82', textDecoration: 'none' },
};
