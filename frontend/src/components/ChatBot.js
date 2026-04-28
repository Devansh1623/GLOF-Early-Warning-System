import React, { useEffect, useRef, useState, useCallback } from 'react';
import { authFetch } from '../utils/helpers';

const QUICK_CHIPS = [
  'Which lake has the highest risk?',
  'How many active alerts?',
  'Evacuation plan for my location?',
  'Emergency numbers near me?',
  'What to do in a GLOF emergency?',
  'Is it safe right now?',
];

function parseMarkdownBold(text) {
  // Replace **text** with <strong>
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: 'rgba(196,247,249,0.95)' }}>{part}</strong>
      : part
  );
}

export default function ChatBot() {
  const [open,     setOpen]     = useState(false);
  const [input,    setInput]    = useState('');
  const [history,  setHistory]  = useState([
    {
      role: 'model',
      text: "Hello! I'm **GLOF-Bot** 🏔️ — your AI assistant for the GLOFWatch Early Warning System.\n\nAsk me about lake risk levels, active alerts, **evacuation plans**, or **emergency numbers** for your location.",
    },
  ]);
  const [loading,  setLoading]  = useState(false);
  const [hasNew,   setHasNew]   = useState(false);
  const [userLoc,  setUserLoc]  = useState(null);   // { lat, lon, state, city }
  const [locLabel, setLocLabel] = useState('');
  const bodyRef = useRef(null);

  // ── Grab user location once on mount ──────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const loc = { lat, lon };
        // Reverse geocode using Nominatim (free, no key needed)
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const d = await r.json();
          const addr = d.address || {};
          loc.state = addr.state || addr.state_district || '';
          loc.city  = addr.city || addr.town || addr.village || addr.county || '';
          setLocLabel(loc.city ? `${loc.city}, ${loc.state}` : loc.state);
        } catch {
          setLocLabel(`${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`);
        }
        setUserLoc(loc);
      },
      () => {}, // silently ignore if denied
      { timeout: 5000 }
    );
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [history, loading, open]);

  // Clear new-message indicator when chat opens
  useEffect(() => {
    if (open) setHasNew(false);
  }, [open]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');

    const userEntry = { role: 'user', text: msg };
    setHistory(prev => [...prev, userEntry]);
    setLoading(true);

    try {
      const res = await authFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: msg,
          history: history.slice(-10).map(h => ({ role: h.role, text: h.text })),
          user_location: userLoc || undefined,
        }),
      });
      const data = await res.json();
      const reply = data.reply || 'Sorry, I could not process that.';
      setHistory(prev => [...prev, { role: 'model', text: reply }]);
      if (!open) setHasNew(true);
    } catch {
      setHistory(prev => [...prev, {
        role: 'model',
        text: "I'm having trouble connecting to the server. Please check your connection.",
      }]);
    }
    setLoading(false);
  }, [input, history, userLoc, open]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };


  return (
    <>
      {/* ── Floating bubble ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="GLOF-Bot AI Assistant"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9000,
          width: 54, height: 54, borderRadius: '50%',
          background: open
            ? 'rgba(196,247,249,0.15)'
            : 'linear-gradient(135deg, #0B4F6C 0%, #1A3C5E 100%)',
          border: '1.5px solid rgba(196,247,249,0.25)',
          backdropFilter: 'blur(12px)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: open ? 20 : 24,
          boxShadow: open ? 'none' : '0 4px 24px rgba(0,0,0,0.4)',
          transition: 'all 0.25s ease',
          color: 'white',
        }}
      >
        {open ? '✕' : '🏔️'}
        {/* Notification badge */}
        {hasNew && !open && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 10, height: 10, borderRadius: '50%',
            background: '#FF2020',
            boxShadow: '0 0 6px #FF2020',
          }} />
        )}
      </button>

      {/* ── Chat panel ──────────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 96, right: 28, zIndex: 8999,
        width: 360, maxWidth: 'calc(100vw - 48px)',
        background: 'rgba(8,16,28,0.96)',
        backdropFilter: 'blur(20px)',
        borderRadius: 18,
        border: '1px solid rgba(196,247,249,0.12)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        transition: 'opacity 0.2s ease, transform 0.25s ease',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
        pointerEvents: open ? 'auto' : 'none',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px',
          borderBottom: '1px solid rgba(196,247,249,0.08)',
          background: 'rgba(26,60,94,0.6)',
        }}>
          <span style={{ fontSize: 20 }}>🏔️</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: '0.9375rem', color: 'rgba(196,247,249,0.95)',
            }}>
              GLOF-Bot
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
              color: 'rgba(196,247,249,0.4)', letterSpacing: '0.08em',
            }}>
              {locLabel ? `📍 ${locLabel}` : 'AI · EARLY WARNING ASSISTANT'}
            </div>
          </div>
          {/* Online indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#22C55E', boxShadow: '0 0 6px #22C55E',
              display: 'inline-block',
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
              color: 'rgba(196,247,249,0.4)',
            }}>ONLINE</span>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={bodyRef}
          style={{
            flex: 1, overflowY: 'auto',
            padding: '14px 14px 8px',
            display: 'flex', flexDirection: 'column', gap: 10,
            maxHeight: 360,
            minHeight: 200,
          }}
        >
          {history.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
              }}>
                {!isUser && (
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(26,60,94,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, flexShrink: 0, marginRight: 7, marginTop: 2,
                  }}>🏔️</span>
                )}
                <div style={{
                  maxWidth: '80%',
                  background: isUser
                    ? 'rgba(196,247,249,0.1)'
                    : 'rgba(26,60,94,0.5)',
                  border: isUser
                    ? '1px solid rgba(196,247,249,0.18)'
                    : '1px solid rgba(196,247,249,0.06)',
                  borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  padding: '9px 13px',
                  fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
                  color: isUser ? 'rgba(196,247,249,0.85)' : 'rgba(196,247,249,0.75)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {parseMarkdownBold(msg.text)}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'rgba(26,60,94,0.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, flexShrink: 0,
              }}>🏔️</span>
              <div style={{
                background: 'rgba(26,60,94,0.5)',
                border: '1px solid rgba(196,247,249,0.06)',
                borderRadius: '14px 14px 14px 4px',
                padding: '10px 14px',
                display: 'flex', gap: 4, alignItems: 'center',
              }}>
                {[0, 1, 2].map(d => (
                  <span key={d} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'rgba(196,247,249,0.4)',
                    display: 'inline-block',
                    animation: `bounce 1.2s ease-in-out ${d * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick chips */}
        <div style={{
          padding: '6px 14px',
          display: 'flex', gap: 6, flexWrap: 'wrap',
          borderTop: '1px solid rgba(196,247,249,0.05)',
        }}>
          {QUICK_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => sendMessage(chip)}
              disabled={loading}
              style={{
                background: 'rgba(196,247,249,0.06)',
                border: '1px solid rgba(196,247,249,0.12)',
                borderRadius: 20, padding: '4px 11px',
                fontFamily: 'var(--font-body)', fontSize: '0.625rem',
                color: 'rgba(196,247,249,0.65)', cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,247,249,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(196,247,249,0.06)'}
            >
              {chip}
            </button>
          ))}
          {/* Location status pill */}
          {locLabel && (
            <span style={{
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 20, padding: '4px 10px',
              fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
              color: 'rgba(34,197,94,0.8)',
              whiteSpace: 'nowrap',
            }}>
              📍 {locLabel}
            </span>
          )}
        </div>

        {/* Input */}
        <div style={{
          display: 'flex', gap: 8, padding: '10px 14px',
          borderTop: '1px solid rgba(196,247,249,0.08)',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={locLabel ? `Ask about ${locLabel} evacuation...` : 'Ask about lake risk levels...'}
            disabled={loading}
            style={{
              flex: 1,
              background: 'rgba(196,247,249,0.06)',
              border: '1px solid rgba(196,247,249,0.12)',
              borderRadius: 12, padding: '9px 13px',
              fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
              color: 'rgba(196,247,249,0.85)',
              outline: 'none',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #0B4F6C, #1A3C5E)'
                : 'rgba(196,247,249,0.05)',
              border: '1px solid rgba(196,247,249,0.15)',
              borderRadius: 12, padding: '9px 14px',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              color: 'rgba(196,247,249,0.7)',
              fontSize: 16, transition: 'background 0.2s',
            }}
          >
            ➤
          </button>
        </div>

        {/* Footer disclaimer */}
        <div style={{
          padding: '6px 14px 10px',
          fontFamily: 'var(--font-mono)', fontSize: '0.5rem',
          color: 'rgba(196,247,249,0.25)', letterSpacing: '0.05em',
          textAlign: 'center',
        }}>
          GLOF-Bot · Gemini AI · {locLabel ? `📍 Location detected` : 'Location not shared'}
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
