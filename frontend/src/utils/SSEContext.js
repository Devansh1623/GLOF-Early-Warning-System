import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { buildApiUrl, getApiCandidates, rememberActiveApi } from './api';
import { readFreshCache, writeCache } from './helpers';

const SSEContext = createContext(null);

function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}


function fireNativeNotification(data) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const notification = new Notification(`GLOFWatch - ${data.risk_level} Alert`, {
      body: `${data.lake_name || data.lake_id}: Risk score ${data.risk_score?.toFixed(1)}`,
      icon: '/favicon.ico',
      tag: `glof-${data.lake_id}-${data.risk_level}`,
      requireInteraction: data.risk_level === 'Critical',
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (_) {}
}


function buildNotification(data) {
  const alertInfo = data.alert || {};
  return {
    id: `${data.lake_id}-${data.timestamp}-${alertInfo.type || data.risk_level}`,
    lake_id: data.lake_id,
    lake_name: data.lake_name || data.lake_id,
    risk_score: data.risk_score,
    risk_level: data.risk_level,
    type: alertInfo.type || data.risk_level,
    severity: alertInfo.severity || (data.risk_level === 'Critical' ? 'critical' : 'high'),
    message: alertInfo.message || `Risk score reached ${data.risk_score?.toFixed(1)} for ${data.lake_name || data.lake_id}`,
    is_test: alertInfo.is_test || false,
    timestamp: data.timestamp,
    status: 'OPEN',
  };
}


export function SSEProvider({ children }) {
  const cachedHistory = readFreshCache('history', 30) || {};
  const cachedLakeMap = readFreshCache('lakeMap', 30) || {};
  const cachedNotifications = readFreshCache('notifications', 30) || [];

  const [latestData, setLatestData] = useState(null);
  const [lakeMap, setLakeMap] = useState(cachedLakeMap);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState(cachedHistory);
  const [notifications, setNotifications] = useState(cachedNotifications);
  const [offlineMode, setOfflineMode] = useState(Boolean(Object.keys(cachedLakeMap).length));
  const esRef = useRef(null);
  const alertedRef = useRef(new Set());
  const apiIndexRef = useRef(0);

  useEffect(() => { requestNotifPermission(); }, []);

  useEffect(() => { writeCache('lakeMap', lakeMap); }, [lakeMap]);
  useEffect(() => { writeCache('history', history); }, [history]);
  useEffect(() => { writeCache('notifications', notifications); }, [notifications]);

  useEffect(() => {
    let reconnectTimer = null;
    const candidates = getApiCandidates();

    const connect = () => {
      const baseUrl = candidates[apiIndexRef.current % candidates.length];
      rememberActiveApi(baseUrl);
      const eventSource = new EventSource(buildApiUrl(baseUrl, '/api/stream'));
      esRef.current = eventSource;

      eventSource.onopen = () => {
        setConnected(true);
        setOfflineMode(false);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') return;

          setLatestData(data);
          setLakeMap((prev) => ({ ...prev, [data.lake_id]: data }));
          setHistory((prev) => {
            const existing = prev[data.lake_id] || [];
            const point = {
              t: new Date(data.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              score: +data.risk_score.toFixed(1),
              temperature: +data.temperature.toFixed(1),
              rainfall: +data.rainfall.toFixed(1),
              water_level: +data.water_level_rise.toFixed(1),
            };
            return {
              ...prev,
              [data.lake_id]: [...existing, point].slice(-360),
            };
          });

          const hasAlert = data.alert?.alert === true;
          const isHighRisk = data.risk_level === 'Critical' || data.risk_level === 'High';
          if (hasAlert || isHighRisk) {
            const key = `${data.lake_id}_${data.risk_level}`;
            if (!alertedRef.current.has(key)) {
              alertedRef.current.add(key);
              fireNativeNotification(data);
              const notification = buildNotification(data);
              setNotifications((prev) => [notification, ...prev].slice(0, 200));
              window.dispatchEvent(new CustomEvent('glof-alert', { detail: notification }));
              setTimeout(() => alertedRef.current.delete(key), 60000);
            }
          }
        } catch (_) {}
      };

      eventSource.onerror = () => {
        setConnected(false);
        setOfflineMode(true);
        eventSource.close();
        apiIndexRef.current += 1;
        reconnectTimer = window.setTimeout(connect, 4000);
      };
    };

    connect();
    return () => {
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (esRef.current) esRef.current.close();
    };
  }, []);

  return (
    <SSEContext.Provider value={{ latestData, lakeMap, connected, history, notifications, offlineMode }}>
      {children}
    </SSEContext.Provider>
  );
}


export const useSSE = () => useContext(SSEContext);
