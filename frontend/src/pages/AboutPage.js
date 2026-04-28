import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Slide data ─────────────────────────────────────────────────────────── */
const SLIDES = [
  {
    id: 'title',
    tag: 'Mission',
    headline: 'A platform that gives disaster managers\n2–4 hours more warning.',
    sub: 'GLOFWatch is an open, real-time glacial lake outburst flood early warning system for the Indian Himalayan Region — built to close the gap between satellite observation and boots-on-ground response.',
    accent: '#7dd3fc',
    visual: <TitleVisual />,
    stat: null,
  },
  {
    id: 'problem',
    tag: 'The Problem',
    headline: 'The Himalayas are the world\'s Third Pole — and they\'re destabilising.',
    sub: 'Climate change is accelerating glacial melt 65% faster than 20 years ago. New lakes that didn\'t exist in 2000 now hold millions of cubic metres of water behind unstable moraine dams. When a dam fails, communities downstream have minutes — not hours.',
    accent: '#f97316',
    visual: <ProblemVisual />,
    stat: { value: '7,500+', label: 'Glacial lakes in India alone' },
  },
  {
    id: 'cost',
    tag: 'Human Cost',
    headline: 'Three disasters. Thousands of lives. Billions in damage.',
    sub: 'South Lhonak (2023) destroyed a 510 MW dam and killed 42 people. Chamoli (2021) wiped out two hydroelectric projects and took 204 lives. Kedarnath (2013) remains India\'s worst GLOF disaster — 5,700 fatalities in a single day.',
    accent: '#ef4444',
    visual: <CostVisual />,
    stat: { value: '₹50,000 Cr+', label: 'Infrastructure lost to Himalayan GLOFs' },
  },
  {
    id: 'gap',
    tag: 'The Gap',
    headline: 'Existing systems are reactive, siloed, and too slow.',
    sub: 'CWC manually monitors only 6–8 lakes. ISRO satellite images have a 10-day revisit cycle. NDMA SMS alerts are sent after a breach is already confirmed — the flood is already moving. No open, unified, real-time platform exists.',
    accent: '#eab308',
    visual: <GapVisual />,
    stat: null,
  },
  {
    id: 'solution',
    tag: 'Our Solution',
    headline: 'From sensor data to alert in under 5 seconds.',
    sub: 'GLOFWatch fuses water level, temperature, rainfall, seismic activity, and velocity through an XGBoost ML engine blended with the Costa (1988) peak-discharge formula. When risk crosses 61/100, operators get an email, a dashboard alert, and a live SSE update — before any physical breach occurs.',
    accent: '#22c55e',
    visual: <SolutionVisual />,
    stat: { value: '2–4 hrs', label: 'Earlier warning vs. current CWC methods' },
  },
  {
    id: 'how',
    tag: 'How It Works',
    headline: 'Multi-factor risk scoring, not single-threshold alerting.',
    sub: 'Most governmental systems alert only when a single sensor crosses a fixed line. GLOFWatch weighs temperature contribution (35%), rainfall (30%), and water level rise (35%) — then blends formula output with ML inference and anomaly detection to cut false positives by design.',
    accent: '#a78bfa',
    visual: <HowVisual />,
    stat: { value: '60/40', label: 'Formula-to-ML blend ratio' },
  },
  {
    id: 'scale',
    tag: 'Scale & Reach',
    headline: '50 million people live downstream of these lakes.',
    sub: 'The Teesta, Chenab, Alaknanda, Spiti, and Jhelum river basins feed entire states. GLOFWatch\'s architecture is lake-agnostic — any of India\'s 7,500+ glacial lakes can be added with a coordinate and a sensor endpoint. The same stack scales to Nepal, Bhutan, and Pakistan.',
    accent: '#34d399',
    visual: <ScaleVisual />,
    stat: { value: '50M+', label: 'People in glacially-fed river basins' },
  },
  {
    id: 'sdg',
    tag: 'Research & Impact',
    headline: 'Aligned with UN SDGs and India\'s national disaster resilience strategy.',
    sub: 'SDG 13 (Climate Action) · SDG 11 (Resilient Cities) · SDG 3 (Health & Well-being). The system directly supports NDMA\'s mandate for technology-driven early warning. The open sensor API spec allows government agencies and NGOs to plug in real IoT hardware without rearchitecting anything.',
    accent: '#38bdf8',
    visual: <SDGVisual />,
    stat: null,
  },
  {
    id: 'disasters',
    tag: 'Real Events · Video Archive',
    headline: 'Witnessing the scale of GLOF disasters.',
    sub: 'These are not simulations. South Lhonak (2023), Chamoli (2021), and Kedarnath (2013) are the events GLOFWatch was designed to give communities advance warning about. Watch to understand the scale of what early warning can prevent.',
    accent: '#ef4444',
    visual: <VideoVisual />,
    stat: { value: '5,946+', label: 'Lives lost across these three events alone' },
  },
  {
    id: 'cta',
    tag: 'Open Platform',
    headline: 'Built open. Designed for real deployment.',
    sub: 'GLOFWatch is a fully functional, deployed system — not a prototype. Live telemetry, ML risk engine, real-time map, email alert pipeline, and a complete audit trail. The goal: hand this to NDMA, CWC, or state disaster management authorities as a production-ready tool.',
    accent: '#7dd3fc',
    visual: <CTAVisual />,
    stat: { value: '12', label: 'High-risk Himalayan lakes monitored live' },
  },
];

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function AboutPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [animDir, setAnimDir] = useState('next'); // 'next' | 'prev'
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeBounce, setSwipeBounce] = useState(null); // 'left' | 'right' | null
  const autoRef = useRef(null);
  const total = SLIDES.length;

  const go = useCallback((idx, dir = 'next') => {
    if (isAnimating) return;
    setAnimDir(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setIsAnimating(false);
    }, 350);
  }, [isAnimating]);

  const next = useCallback(() => go((current + 1) % total, 'next'), [current, go, total]);
  const prev = useCallback(() => go((current - 1 + total) % total, 'prev'), [current, go, total]);

  // Auto-advance every 8s
  useEffect(() => {
    autoRef.current = setInterval(next, 8000);
    return () => clearInterval(autoRef.current);
  }, [next]);

  const resetAuto = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(next, 8000);
  }, [next]);

  const triggerBounce = (dir) => {
    setSwipeBounce(dir);
    setTimeout(() => setSwipeBounce(null), 420);
  };

  const handleNext = () => { next(); resetAuto(); };
  const handlePrev = () => { prev(); resetAuto(); };
  const handleDot  = (i) => { go(i, i > current ? 'next' : 'prev'); resetAuto(); };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') handleNext();
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   handlePrev();
      if (e.key === 'Escape') navigate('/');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNext, handlePrev, navigate]);

  // Touch swipe with bounce feedback
  const touchX = useRef(null);
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) { triggerBounce('left');  handleNext(); }
      else        { triggerBounce('right'); handlePrev(); }
    } else if (Math.abs(dx) > 8) {
      // Not enough to change slide — bounce back to centre as resistance feedback
      triggerBounce(dx < 0 ? 'resist-left' : 'resist-right');
    }
    touchX.current = null;
  };

  const slide = SLIDES[current];
  const progress = ((current + 1) / total) * 100;

  const bounceClass = swipeBounce ? `swipe-bounce-${swipeBounce}` : '';

  return (
    <div
      className="about-carousel"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ '--slide-accent': slide.accent }}
    >
      {/* ── Background glow ── */}
      <div className="about-glow" style={{ background: `radial-gradient(ellipse 60% 60% at 70% 40%, ${slide.accent}18 0%, transparent 70%)` }} />

      {/* ── Top bar ── */}
      <header className="about-topbar">
        <button className="about-back" onClick={() => navigate('/')}>
          <ArrowLeftIcon /> GLOFWatch
        </button>
        <div className="about-progress-bar">
          <div className="about-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="about-counter">{current + 1} / {total}</span>
      </header>

      {/* ── Slide ── */}
      <div
        key={current}
        className={`about-slide ${isAnimating ? `slide-exit-${animDir}` : 'slide-enter'} ${bounceClass}`}
      >
        {/* Content column */}
        <div className="about-content">
          <div className="about-tag" style={{ color: slide.accent, borderColor: `${slide.accent}40` }}>
            {slide.tag}
          </div>

          <h1 className="about-headline">
            {slide.headline.split('\n').map((line, i) => (
              <span key={i}>{line}{i < slide.headline.split('\n').length - 1 && <br />}</span>
            ))}
          </h1>

          <p className="about-sub">{slide.sub}</p>

          {slide.stat && (
            <div className="about-stat" style={{ borderColor: `${slide.accent}40` }}>
              <div className="about-stat-value" style={{ color: slide.accent }}>{slide.stat.value}</div>
              <div className="about-stat-label">{slide.stat.label}</div>
            </div>
          )}

          {slide.id === 'cta' && (
            <div className="about-cta-btns">
              <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ padding: '11px 24px' }}>
                Open Dashboard →
              </button>
              <a
                href="https://github.com/Devansh1623/GLOF-Early-Warning-System"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ padding: '11px 24px' }}
              >
                View on GitHub
              </a>
            </div>
          )}
        </div>

        {/* Visual column */}
        <div className="about-visual-col">
          {slide.visual}
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="about-nav">
        <button className="about-nav-btn" onClick={handlePrev} aria-label="Previous slide">
          <ArrowLeftIcon />
        </button>

        <div className="about-dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              className={`about-dot ${i === current ? 'active' : ''}`}
              onClick={() => handleDot(i)}
              style={i === current ? { background: slide.accent } : {}}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button className="about-nav-btn" onClick={handleNext} aria-label="Next slide">
          <ArrowRightIcon />
        </button>
      </nav>

      {/* ── Keyboard hint ── */}
      <div className="about-hint">Use ← → keys or swipe to navigate · ESC to exit</div>
    </div>
  );
}

/* ─────────────────────────────── Visuals ────────────────────────────────── */

function TitleVisual() {
  return (
    <div className="av-container">
      <div className="av-globe">
        <svg viewBox="0 0 200 200" className="av-globe-svg">
          <defs>
            <radialGradient id="globe-grad" cx="35%" cy="30%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="100%" stopColor="#061425" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="90" fill="url(#globe-grad)" stroke="#7dd3fc22" strokeWidth="1" />
          {/* Latitude lines */}
          {[30,60,90,120,150].map(y => (
            <ellipse key={y} cx="100" cy={y} rx={Math.sqrt(90*90 - (y-100)*(y-100))} ry="6"
              fill="none" stroke="#7dd3fc" strokeWidth="0.4" opacity="0.25" />
          ))}
          {/* Longitude lines */}
          {[0,36,72,108,144].map((a,i) => (
            <ellipse key={i} cx="100" cy="100" rx="14" ry="90"
              fill="none" stroke="#7dd3fc" strokeWidth="0.4" opacity="0.2"
              transform={`rotate(${a} 100 100)`} />
          ))}
          {/* Mountain region highlight */}
          <path d="M70,65 L85,50 L100,60 L115,45 L130,58 L125,80 L75,80 Z"
            fill="#7dd3fc" opacity="0.12" stroke="#7dd3fc" strokeWidth="0.8" />
          {/* Pulse rings */}
          <circle cx="100" cy="65" r="6" fill="#ef4444" opacity="0.9">
            <animate attributeName="r" values="6;18;6" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0;0.9" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="100" cy="65" r="6" fill="#ef4444" opacity="0.7" />
        </svg>
      </div>
      <div className="av-label">Indian Himalayan Region</div>
    </div>
  );
}

function ProblemVisual() {
  return (
    <div className="av-container">
      <div className="av-lake-diagram">
        {/* Lake */}
        <div className="av-lake">
          <div className="av-lake-water" />
          <div className="av-lake-ripple" />
          <div className="av-moraine">Moraine Dam</div>
        </div>
        {/* Stats around */}
        <div className="av-fact-chip" style={{ top: '10%', right: '5%' }}>
          <span className="av-chip-num" style={{ color: '#f97316' }}>+40×</span>
          <span className="av-chip-txt">South Lhonak growth (1990→2023)</span>
        </div>
        <div className="av-fact-chip" style={{ bottom: '20%', left: '0%' }}>
          <span className="av-chip-num" style={{ color: '#ef4444' }}>65%</span>
          <span className="av-chip-txt">faster glacial melt vs. 2000</span>
        </div>
      </div>
    </div>
  );
}

function CostVisual() {
  const events = [
    {
      year: '2013',
      name: 'Kedarnath Flood',
      location: 'Uttarakhand',
      deaths: '5,700',
      detail: 'Chorabari Glacier lake burst — single deadliest GLOF in Indian history',
      color: '#ef4444',
      r: 26,
    },
    {
      year: '2021',
      name: 'Chamoli Disaster',
      location: 'Chamoli, UK',
      deaths: '204',
      detail: 'Ronti Glacier collapse wiped out two hydroelectric dams in minutes',
      color: '#f97316',
      r: 16,
    },
    {
      year: '2023',
      name: 'South Lhonak',
      location: 'Sikkim',
      deaths: '42+',
      detail: '510 MW Teesta-III dam destroyed · 100,000 displaced · ₹8,000 Cr loss',
      color: '#eab308',
      r: 11,
    },
  ];

  // SVG layout constants
  const W = 340, H = 310;
  const lineX = 60;
  const ys = [55, 150, 245];

  return (
    <div className="av-container" style={{ minHeight: 300 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ overflow: 'visible' }}>
        <defs>
          {events.map((ev) => (
            <radialGradient key={ev.year} id={`rg-${ev.year}`} cx="40%" cy="35%">
              <stop offset="0%" stopColor={ev.color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={ev.color} stopOpacity="0.3" />
            </radialGradient>
          ))}
          <linearGradient id="timeline-line" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#eab308" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Vertical spine */}
        <line
          x1={lineX} y1={ys[0]} x2={lineX} y2={ys[2]}
          stroke="url(#timeline-line)" strokeWidth="2" strokeDasharray="4 3"
        />

        {events.map((ev, i) => {
          const y = ys[i];
          const delay = `${i * 0.28}s`;
          return (
            <g key={ev.year}>
              {/* Pulse ring */}
              <circle cx={lineX} cy={y} r={ev.r + 12} fill={ev.color} opacity="0">
                <animate attributeName="r" values={`${ev.r};${ev.r + 22};${ev.r}`}
                  dur="2.8s" begin={delay} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.25;0;0.25"
                  dur="2.8s" begin={delay} repeatCount="indefinite" />
              </circle>

              {/* Event node */}
              <circle cx={lineX} cy={y} r={ev.r}
                fill={`url(#rg-${ev.year})`}
                stroke={ev.color} strokeWidth="1.5" opacity="0.95"
              >
                <animate attributeName="r" values={`${ev.r - 2};${ev.r + 1};${ev.r - 2}`}
                  dur="3.5s" begin={delay} repeatCount="indefinite" />
              </circle>

              {/* Year label inside node */}
              <text x={lineX} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                fill={ev.color === '#eab308' ? '#1a1200' : '#fff'}
                fontSize="9" fontFamily="IBM Plex Mono, monospace" fontWeight="700"
                letterSpacing="0.5"
              >
                {ev.year}
              </text>

              {/* Connector to label */}
              <line
                x1={lineX + ev.r} y1={y}
                x2={lineX + ev.r + 14} y2={y}
                stroke={ev.color} strokeWidth="1" opacity="0.5"
              />

              {/* Event name */}
              <text x={lineX + ev.r + 18} y={y - 14}
                fill={ev.color} fontSize="11"
                fontFamily="Space Grotesk, sans-serif" fontWeight="700"
              >
                {ev.name}
              </text>

              {/* Deaths badge */}
              <rect
                x={lineX + ev.r + 18} y={y - 6}
                width={`${ev.deaths.length * 7.5 + 28}px`} height="16"
                rx="4" fill={ev.color} opacity="0.15"
              />
              <text x={lineX + ev.r + 24} y={y + 7}
                fill={ev.color} fontSize="10"
                fontFamily="IBM Plex Mono, monospace" fontWeight="700"
              >
                {ev.deaths} lives
              </text>

              {/* Detail text */}
              <text x={lineX + ev.r + 18} y={y + 22}
                fill="#8A9292" fontSize="8.5"
                fontFamily="Inter, sans-serif"
              >
                {ev.detail.length > 46 ? ev.detail.slice(0, 46) + '…' : ev.detail}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function GapVisual() {
  const rows = [
    { org: 'CWC Manual', coverage: '6–8 lakes', realtime: false, openData: false, ml: false },
    { org: 'ISRO Satellite', coverage: '7,500+ lakes', realtime: false, openData: false, ml: false },
    { org: 'NDMA SMS', coverage: 'Post-breach only', realtime: false, openData: false, ml: false },
    { org: 'GLOFWatch', coverage: '12+ lakes (growing)', realtime: true, openData: true, ml: true },
  ];
  const Tick = ({ ok }) => (
    <span style={{ color: ok ? '#22c55e' : '#ef444488', fontSize: 16 }}>{ok ? '✓' : '✗'}</span>
  );
  return (
    <div className="av-container" style={{ width: '100%' }}>
      <div className="av-table">
        <div className="av-table-head">
          <span>System</span>
          <span>Real-time</span>
          <span>Open</span>
          <span>ML</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className={`av-table-row ${r.org === 'GLOFWatch' ? 'av-highlighted' : ''}`}>
            <span style={{ fontSize: 11 }}>{r.org}</span>
            <Tick ok={r.realtime} />
            <Tick ok={r.openData} />
            <Tick ok={r.ml} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SolutionVisual() {
  const steps = [
    { icon: '📡', label: 'Sensor', color: '#7dd3fc' },
    { icon: '⚙️', label: 'ML Engine', color: '#a78bfa' },
    { icon: '📊', label: 'Risk Score', color: '#34d399' },
    { icon: '🔔', label: 'Alert', color: '#ef4444' },
  ];
  return (
    <div className="av-container">
      <div className="av-pipeline">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="av-pipe-node" style={{ borderColor: s.color }}>
              <span className="av-pipe-icon">{s.icon}</span>
              <span className="av-pipe-label">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className="av-pipe-arrow">→</div>}
          </React.Fragment>
        ))}
      </div>
      <div className="av-timing">
        <span style={{ color: '#64748b' }}>Latency: </span>
        <strong style={{ color: '#22c55e' }}>&lt; 5 seconds</strong>
      </div>
    </div>
  );
}

function HowVisual() {
  const factors = [
    { label: 'Temperature', pct: 35, color: '#7dd3fc' },
    { label: 'Rainfall',    pct: 30, color: '#a78bfa' },
    { label: 'Water Level', pct: 35, color: '#f97316' },
  ];
  return (
    <div className="av-container" style={{ gap: 12 }}>
      <div className="av-formula-box">
        <div className="av-formula">
          Risk = 0.35·T + 0.30·R + 0.35·WL
        </div>
        <div className="av-formula-sub">Costa (1988) formula — blended 60% weight</div>
      </div>
      {factors.map(f => (
        <div key={f.label} className="av-factor-bar">
          <span className="av-factor-label">{f.label}</span>
          <div className="av-factor-track">
            <div className="av-factor-fill" style={{ width: `${f.pct * 2.5}%`, background: f.color }} />
          </div>
          <span className="av-factor-pct" style={{ color: f.color }}>{f.pct}%</span>
        </div>
      ))}
      <div className="av-plus-ml">
        <span style={{ color: '#64748b' }}>+ XGBoost ML inference (40% weight)</span>
      </div>
    </div>
  );
}

function ScaleVisual() {
  const rivers = [
    { name: 'Teesta',      states: 'Sikkim, WB',    color: '#7dd3fc' },
    { name: 'Chenab',      states: 'HP, J&K',        color: '#a78bfa' },
    { name: 'Alaknanda',   states: 'Uttarakhand',    color: '#34d399' },
    { name: 'Spiti',       states: 'HP',             color: '#f97316' },
    { name: 'Jhelum',      states: 'J&K',            color: '#fbbf24' },
  ];
  return (
    <div className="av-container" style={{ gap: 8 }}>
      <div className="av-label" style={{ marginBottom: 8 }}>Primary monitored river basins</div>
      {rivers.map(r => (
        <div key={r.name} className="av-river-row">
          <div className="av-river-dot" style={{ background: r.color }} />
          <div>
            <div className="av-river-name" style={{ color: r.color }}>{r.name}</div>
            <div className="av-river-states">{r.states}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SDGVisual() {
  const sdgs = [
    { num: '13', title: 'Climate Action',    icon: '🌍', color: '#22c55e' },
    { num: '11', title: 'Resilient Cities',  icon: '🏙️', color: '#3b82f6' },
    { num: '3',  title: 'Health & Wellbeing',icon: '❤️', color: '#ef4444' },
  ];
  return (
    <div className="av-container" style={{ gap: 16 }}>
      {sdgs.map(s => (
        <div key={s.num} className="av-sdg-card" style={{ borderColor: `${s.color}40` }}>
          <span className="av-sdg-icon">{s.icon}</span>
          <div>
            <div className="av-sdg-num" style={{ color: s.color }}>SDG {s.num}</div>
            <div className="av-sdg-title">{s.title}</div>
          </div>
        </div>
      ))}
      <div className="av-sdg-note">Aligned with NDMA's Technology-Led Disaster Risk Reduction mandate</div>
    </div>
  );
}

/* ── GLOF Disaster Video archive slide ──────────────────────────────────── */
function VideoVisual() {
  const EVENTS = [
    {
      id:    'south-lhonak',
      label: 'South Lhonak Lake',
      year:  '2023',
      state: 'Sikkim',
      color: '#ef4444',
      deaths: 42,
      loss:   '₹8,000 Cr',
      desc:   'Teesta-III dam swept away. Downstream communities had minutes to respond. 4 km of NH-10 destroyed.',
      // Direct search URL — always resolves to available videos
      watchUrl: 'https://www.youtube.com/results?search_query=South+Lhonak+GLOF+Sikkim+2023+flood',
      tags: ['Moraine-dammed', 'Teesta basin', 'NH-10 destroyed'],
    },
    {
      id:    'chamoli',
      label: 'Chamoli Disaster',
      year:  '2021',
      state: 'Uttarakhand',
      color: '#f97316',
      deaths: 204,
      loss:   '₹1,500 Cr+',
      desc:   'Glacier collapse triggered a flash flood in the Rishiganga and Dhauliganga rivers, destroying two hydropower projects.',
      watchUrl: 'https://www.youtube.com/results?search_query=Chamoli+glacier+flood+2021+Uttarakhand',
      tags: ['Glacier collapse', 'Rishiganga', 'Hydropower impact'],
    },
    {
      id:    'kedarnath',
      label: 'Kedarnath Floods',
      year:  '2013',
      state: 'Uttarakhand',
      color: '#eab308',
      deaths: 5700,
      loss:   '₹4,200 Cr',
      desc:   'Chorabari glacial lake burst after extreme rainfall. Kedarnath town was buried under debris; rescue operations took weeks.',
      watchUrl: 'https://www.youtube.com/results?search_query=Kedarnath+flood+2013+GLOF+glacier',
      tags: ['Chorabari lake', 'Mandakini river', 'Largest GLOF on record'],
    },
  ];

  const [active, setActive] = useState(0);
  const ev = EVENTS[active];

  return (
    <div className="av-container" style={{ gap: 12, width: '100%' }}>
      {/* Tab selectors */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {EVENTS.map((v, i) => (
          <button
            key={v.id}
            onClick={() => setActive(i)}
            style={{
              border: `1.5px solid ${i === active ? v.color : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 8,
              padding: '5px 12px',
              background: i === active ? `${v.color}1A` : 'rgba(255,255,255,0.04)',
              color: i === active ? v.color : 'rgba(255,255,255,0.55)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              cursor: 'pointer',
              fontWeight: i === active ? 700 : 400,
              letterSpacing: '0.04em',
              transition: 'all 0.2s ease',
            }}
          >
            {v.label} '{v.year.slice(2)}
          </button>
        ))}
      </div>

      {/* Event detail card */}
      <div style={{
        borderRadius: 12, overflow: 'hidden',
        border: `1.5px solid ${ev.color}44`,
        boxShadow: `0 0 20px ${ev.color}18`,
        background: 'rgba(0,0,0,0.25)',
      }}>
        {/* Header bar */}
        <div style={{
          background: `linear-gradient(135deg, ${ev.color}22, ${ev.color}08)`,
          borderBottom: `1px solid ${ev.color}33`,
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: '1rem', color: ev.color,
            }}>{ev.label} · {ev.year}</div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
              color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', marginTop: 2,
            }}>{ev.state.toUpperCase()} · GLACIAL LAKE OUTBURST FLOOD</div>
          </div>
          {/* Deaths badge */}
          <div style={{
            textAlign: 'right',
            background: `${ev.color}22`, borderRadius: 8,
            padding: '6px 12px',
            border: `1px solid ${ev.color}44`,
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontWeight: 800,
              fontSize: '1.1rem', color: ev.color, lineHeight: 1,
            }}>{ev.deaths.toLocaleString()}</div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.5rem',
              color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em',
            }}>LIVES LOST</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 18px' }}>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
            color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, margin: '0 0 12px',
          }}>{ev.desc}</p>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {ev.tags.map(tag => (
              <span key={tag} style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
                color: ev.color, background: `${ev.color}18`,
                borderRadius: 5, padding: '3px 8px',
                border: `1px solid ${ev.color}33`,
                letterSpacing: '0.04em',
              }}>{tag}</span>
            ))}
          </div>

          {/* Economic loss + Watch button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
                color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em',
              }}>ECONOMIC LOSS</div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontWeight: 700,
                fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)',
              }}>{ev.loss}</div>
            </div>
            <a
              href={ev.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: ev.color, color: '#000',
                borderRadius: 8, padding: '9px 16px',
                fontFamily: 'var(--font-mono)', fontWeight: 700,
                fontSize: '0.7rem', letterSpacing: '0.06em',
                textDecoration: 'none',
                boxShadow: `0 4px 14px ${ev.color}55`,
                transition: 'opacity 0.2s',
              }}
            >
              ▶ Watch on YouTube
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}


function CTAVisual() {
  const stack = [
    { layer: 'Frontend', tech: 'React · Leaflet · Recharts',   color: '#7dd3fc' },
    { layer: 'API',      tech: 'Flask · SSE · JWT Auth',        color: '#a78bfa' },
    { layer: 'ML',       tech: 'XGBoost · Isolation Forest',    color: '#34d399' },
    { layer: 'Storage',  tech: 'MongoDB · Redis Pub/Sub',        color: '#f97316' },
    { layer: 'Alerts',   tech: 'Celery · Resend Email',          color: '#ef4444' },
  ];
  return (
    <div className="av-container" style={{ gap: 6 }}>
      {stack.map((s, i) => (
        <div key={i} className="av-stack-row">
          <span className="av-stack-layer" style={{ color: s.color }}>{s.layer}</span>
          <span className="av-stack-tech">{s.tech}</span>
        </div>
      ))}
      <div className="av-deployed-badge">
        <span className="dot-live" style={{ width: 7, height: 7 }} />
        Live on Render · Auto-deploy from GitHub
      </div>
    </div>
  );
}

/* ─── Icons ──────────────────────────────────────────────────────────────── */
function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
