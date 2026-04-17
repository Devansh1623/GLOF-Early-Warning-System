import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Cursor lighting utility ─────────────────────────────── */
function useCursorLighting(containerRef) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const cards = el.querySelectorAll('.card-lit');
    const handler = (e) => {
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', `${x}%`);
        card.style.setProperty('--my', `${y}%`);
      });
    };
    el.addEventListener('mousemove', handler);
    return () => el.removeEventListener('mousemove', handler);
  }, [containerRef]);
}

export default function LandingPage() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const parallaxRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useCursorLighting(containerRef);

  /* Parallax scroll */
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const parallaxStyle = (factor) => ({
    transform: `translateY(${scrollY * factor}px)`,
  });

  return (
    <div className="landing" ref={containerRef}>
      {/* ── Atmospheric Background ── */}
      <div className="landing-bg">
        <div className="parallax-layer layer-sky" style={parallaxStyle(0.05)} />
        <div className="parallax-layer layer-aurora" style={parallaxStyle(0.08)} />
        <div className="parallax-layer layer-grid" />
        <div className="parallax-layer layer-mountains" style={parallaxStyle(0.12)}>
          <MountainSVG />
        </div>
        <div className="parallax-layer layer-glacier" style={parallaxStyle(0.15)} />
      </div>

      {/* ── Navigation ── */}
      <nav className="landing-nav">
        <div className="nav-brand">
          <BrandMark size={28} />
          GLOFWatch
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#data">Data</a>
          <div className="nav-cta" style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" style={{ padding: '7px 16px', fontSize: '0.8125rem' }} onClick={() => navigate('/login')}>
              Sign in
            </button>
            <button className="btn btn-primary" style={{ padding: '7px 16px', fontSize: '0.8125rem' }} onClick={() => navigate('/login')}>
              Get Access
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="animate-fade">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            12 Lakes Monitored · 5s Refresh · Himalayas
          </div>

          <h1 className="hero-title">
            Glacial Outburst<br />
            <span>Early Warning</span><br />
            Intelligence
          </h1>

          <p className="hero-sub">
            Precision telemetry, ML-driven risk scoring, and operational alert pipelines for the
            Indian Himalayan Region — from basin to command center in under 5 seconds.
          </p>

          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/login')} id="hero-cta-primary" style={{ padding: '12px 26px' }}>
              Open Dashboard
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/login')} id="hero-cta-secondary" style={{ padding: '12px 26px' }}>
              View Map →
            </button>
          </div>

          <div className="hero-meta" style={{ marginTop: 32 }}>
            <div className="hero-meta-item">
              <strong>12</strong>
              <span>Lakes monitored</span>
            </div>
            <div className="hero-meta-item">
              <strong>5s</strong>
              <span>Stream refresh</span>
            </div>
            <div className="hero-meta-item">
              <strong>24h</strong>
              <span>Audit trail</span>
            </div>
          </div>
        </div>

        {/* Ice Stack visual */}
        <div className="hero-visual">
          <div className="ice-stack">
            <div className="orbit-ring">
              <div className="orbit-dot" />
            </div>
            <div className="ice-block one">
              <IceBlockContent label="Water Level" value="4,218 m" delta="+3.2 cm" />
            </div>
            <div className="ice-block two">
              <IceBlockContent label="Risk Score" value="72.4" delta="↑ Elevated" warn />
            </div>
            <div className="ice-block three">
              <IceBlockContent label="Seismic" value="0.14g" delta="within safe" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section" id="features">
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div className="section-label">Capabilities</div>
          <h2 className="section-title">Built for field precision</h2>
          <p className="section-sub" style={{ margin: '12px auto 0', textAlign: 'center' }}>
            Every component is engineered for decision-critical environments where latency and accuracy are non-negotiable.
          </p>
        </div>

        <div className="feature-list" style={{ marginTop: 48 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className={`feature-item card-lit`}
              style={{
                borderRadius:
                  i === 0 ? 'var(--radius-2xl) 0 0 0' :
                  i === 2 ? '0 var(--radius-2xl) 0 0' :
                  i === 3 ? '0 0 0 var(--radius-2xl)' :
                  i === 5 ? '0 0 var(--radius-2xl) 0' : 0,
              }}
            >
              <div className="feature-icon">
                <f.Icon />
              </div>
              <div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section" id="how-it-works" style={{ paddingTop: 0 }}>
        <div style={{ marginBottom: 12 }}>
          <div className="section-label">Workflow</div>
          <h2 className="section-title">From sensor to alert in realtime</h2>
        </div>

        <div className="step-grid">
          {STEPS.map((s, i) => (
            <div key={i} className="step-card card-lit">
              <div className="step-number">0{i + 1}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Metrics ── */}
      <section className="section" id="data" style={{ paddingTop: 0 }}>
        <div style={{ marginBottom: 12 }}>
          <div className="section-label">System Metrics</div>
          <h2 className="section-title">Observatory at a glance</h2>
        </div>
        <div className="metric-row">
          {METRICS.map((m, i) => (
            <div key={i} className="metric"
              style={{
                borderRadius:
                  i === 0 ? 'var(--radius-2xl) 0 0 var(--radius-2xl)' :
                  i === METRICS.length - 1 ? '0 var(--radius-2xl) var(--radius-2xl) 0' : 0,
              }}
            >
              <strong>{m.value}</strong>
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Band ── */}
      <div className="cta-band">
        <div>
          <h3>Activate observatory access</h3>
          <p>Full telemetry, basins, risk engine, and command alerts — for your team.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
          <button className="btn btn-outline" onClick={() => navigate('/login')} id="cta-band-secondary" style={{ padding: '12px 24px' }}>
            Sign in
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/login')} id="cta-band-primary" style={{ padding: '12px 24px' }}>
            Get Access →
          </button>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandMark size={20} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>
            GLOFWatch
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', letterSpacing: '0.08em' }}>
            v1.0 · Early Warning System
          </span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a href="/privacy" style={{ color: 'var(--outline)' }}>Privacy</a>
          <a href="/terms" style={{ color: 'var(--outline)' }}>Terms</a>
          <span>© 2025 GLOFWatch. IHR Basin Monitoring Initiative.</span>
        </div>
      </footer>
    </div>
  );
}

/* ── Data ───────────────────────────────────────────────── */
const FEATURES = [
  {
    title: 'Live Telemetry Stream',
    desc: 'Water level, seismic activity, and temperature readings pushed over SSE every 5 seconds at basin resolution.',
    Icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'ML Risk Engine',
    desc: '5-factor risk scoring model with IsolationForest anomaly detection. Scores 0–100 with configurable thresholds.',
    Icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="3" strokeLinecap="round"/>
        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'Geospatial Basin Map',
    desc: 'Interactive Leaflet map with lake markers, real-time risk tiers, and drilldown basin panels — field-ready.',
    Icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Operational Alerts',
    desc: 'Threshold-triggered alerts with severity tiers, email dispatch for 90+ scores, and full acknowledgement logs.',
    Icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round"/>
        <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'Role-Based Access',
    desc: 'Operator, Analyst, and Admin roles with fine-grained route guards and per-user alert preference controls.',
    Icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="4" strokeLinecap="round"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'Audit Trail',
    desc: '24-hour rolling event log with anomaly detections, alert dispatches, and system health markers timestamped to the second.',
    Icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round"/>
        <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round"/>
        <polyline points="10 9 9 9 8 9" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const STEPS = [
  {
    title: 'Sensor ingestion',
    desc: 'Field sensors push water level, seismic intensity, and temperature readings to our ingestion API every 5 seconds via secured endpoints.',
  },
  {
    title: 'ML risk scoring',
    desc: 'The risk engine runs a weighted 5-factor model augmented with IsolationForest anomaly detection to produce a 0–100 risk index per basin.',
  },
  {
    title: 'Alert dispatch',
    desc: 'Readings breaching configured thresholds (60, 80, 90) trigger real-time SSE notifications, in-app alerts, and email dispatches to assigned operators.',
  },
];

const METRICS = [
  { value: '12',   label: 'Basins monitored' },
  { value: '5s',   label: 'Telemetry cadence' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '24h',  label: 'Historical log window' },
];

/* ── Mountain SVG ─────────────────────────────────────────── */
function MountainSVG() {
  return (
    <svg className="mountain-svg" viewBox="0 0 1440 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="mtn-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#132032" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#061425" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="mtn-highlight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9ECFD1" stopOpacity="0.06" />
          <stop offset="50%" stopColor="#C4F7F9" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#9ECFD1" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {/* Back range */}
      <path d="M0,280 L80,210 L180,255 L260,175 L340,220 L460,130 L540,185 L620,105 L720,90 L800,135 L880,80 L960,120 L1060,70 L1160,110 L1260,88 L1360,130 L1440,95 L1440,400 L0,400 Z"
        fill="url(#mtn-fill)" opacity="0.6" />
      {/* Front range */}
      <path d="M0,350 L120,270 L220,310 L340,220 L420,270 L520,180 L620,230 L720,155 L820,200 L920,140 L1020,190 L1120,125 L1220,170 L1320,140 L1440,180 L1440,400 L0,400 Z"
        fill="url(#mtn-fill)" />
      {/* Snow highlights */}
      <path d="M520,180 L560,205 L580,180 Z" fill="url(#mtn-highlight)" />
      <path d="M720,155 L758,178 L776,155 Z" fill="url(#mtn-highlight)" />
      <path d="M1120,125 L1155,148 L1170,125 Z" fill="url(#mtn-highlight)" />
    </svg>
  );
}

/* ── Ice Block Content ─────────────────────────────────────── */
function IceBlockContent({ label, value, delta, warn }) {
  return (
    <div style={{ padding: '16px 18px' }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
        color: 'var(--outline)', letterSpacing: '0.12em',
        textTransform: 'uppercase', marginBottom: 6,
      }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '1.125rem',
        color: 'var(--on-surface)', fontWeight: 600, letterSpacing: '-0.02em',
      }}>{value}</div>
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: '0.6875rem',
        color: warn ? 'var(--risk-high)' : 'var(--risk-low)', marginTop: 4,
      }}>{delta}</div>
    </div>
  );
}

/* ── Brand Mark ─────────────────────────────────────────── */
function BrandMark({ size = 32 }) {
  const s = size / 48;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 4L6 40h36L24 4z" stroke="#C4F7F9" strokeWidth={1.5 / s} strokeLinejoin="round" />
      <path d="M24 14L12 38h24L24 14z" fill="rgba(19,32,50,0.9)" stroke="#A8DADC" strokeWidth={1.2 / s} strokeLinejoin="round" />
      <path d="M17 30c2.5-4 5-6 7-6s4.5 2 7 6" stroke="#9ECFD1" strokeWidth={1.8 / s} strokeLinecap="round" />
      <circle cx="24" cy="38" r="3" fill="#A8DADC" opacity="0.9" />
    </svg>
  );
}
