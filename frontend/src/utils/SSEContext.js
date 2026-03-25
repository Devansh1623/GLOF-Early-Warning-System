import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const SSEContext = createContext(null);
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/* ── helpers ── */
function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function fireNativeNotification(data) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(`GLOFWatch — ${data.risk_level} Alert`, {
      body: `${data.lake_name || data.lake_id}: Risk score ${data.risk_score?.toFixed(1)}`,
      icon: '/favicon.ico',
      tag: `glof-${data.lake_id}`,       // de-duplicate per lake
      requireInteraction: data.risk_level === 'Critical',
    });
    n.onclick = () => { window.focus(); n.close(); };
  } catch (_) {}
}

function fireToastEvent(data) {
  const alertInfo = data.alert || {};
  window.dispatchEvent(new CustomEvent('glof-alert', {
    detail: {
      lake_id:    data.lake_id,
      lake_name:  data.lake_name || data.lake_id,
      risk_score: data.risk_score,
      risk_level: data.risk_level,
      type:       alertInfo.type  || data.risk_level,
      severity:   alertInfo.severity || (data.risk_level === 'Critical' ? 'critical' : 'high'),
      message:    alertInfo.message || `Risk score reached ${data.risk_score?.toFixed(1)} for ${data.lake_name || data.lake_id}`,
      is_test:    alertInfo.is_test || false,
    },
  }));
}

/* ── Provider ── */
export function SSEProvider({ children }) {
  const [latestData, setLatestData]   = useState(null);
  const [lakeMap, setLakeMap]         = useState({});
  const [connected, setConnected]     = useState(false);
  const [history, setHistory]         = useState({});
  const esRef                         = useRef(null);
  const alertedRef                    = useRef(new Set());  // avoid re-alerting same lake within window

  // Ask for notification permission once
  useEffect(() => { requestNotifPermission(); }, []);

  useEffect(() => {
    let es;

    const connect = () => {
      es = new EventSource(`${API}/api/stream`);
      esRef.current = es;

      es.onopen = () => setConnected(true);

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'connected') return;

          setLatestData(data);
          setLakeMap(prev => ({ ...prev, [data.lake_id]: data }));

          setHistory(prev => {
            const existing = prev[data.lake_id] || [];
            const point = {
              t:           new Date(data.timestamp).toLocaleTimeString('en-IN',
                            { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              score:       +data.risk_score.toFixed(1),
              temperature: +data.temperature.toFixed(1),
              rainfall:    +data.rainfall.toFixed(1),
              water_level: +data.water_level_rise.toFixed(1),
            };
            return {
              ...prev,
              [data.lake_id]: [...existing, point].slice(-60),
            };
          });

          // ── Alert detection ──
          const hasExplicitAlert = data.alert?.alert === true;
          const isHighRisk = data.risk_level === 'Critical' || data.risk_level === 'High';

          if (hasExplicitAlert || isHighRisk) {
            const key = `${data.lake_id}_${data.risk_level}`;
            if (!alertedRef.current.has(key)) {
              alertedRef.current.add(key);
              fireNativeNotification(data);
              fireToastEvent(data);
              // Allow re-alerting same lake after 60 seconds
              setTimeout(() => alertedRef.current.delete(key), 60000);
            }
          }
        } catch (_) {}
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        setTimeout(connect, 6000);
      };
    };

    connect();
    return () => es?.close();
  }, []);

  return (
    <SSEContext.Provider value={{ latestData, lakeMap, connected, history }}>
      {children}
    </SSEContext.Provider>
  );
}

export const useSSE = () => useContext(SSEContext);
