import React, { createContext, useContext, useState } from 'react';

const I18nContext = createContext(null);

const STRINGS = {
  en: {
    dashboard: 'Dashboard',
    mapView: 'Map View',
    telemetry: 'Telemetry',
    alerts: 'Alerts',
    notifications: 'Notifications',
    events: 'Events',
    admin: 'Admin',
    alertPreferences: 'Alert Preferences',
    liveStreamActive: 'Live stream active',
    connecting: 'Connecting...',
    offlineCache: 'Offline cache in use',
    noActiveAlerts: 'No active alerts. All lakes are within safe thresholds.',
    notificationCenter: 'Notification Center',
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    mapView: 'मानचित्र',
    telemetry: 'टेलीमेट्री',
    alerts: 'अलर्ट',
    notifications: 'सूचना केंद्र',
    events: 'घटनाएं',
    admin: 'एडमिन',
    alertPreferences: 'अलर्ट सेटिंग्स',
    liveStreamActive: 'लाइव स्ट्रीम सक्रिय',
    connecting: 'कनेक्ट हो रहा है...',
    offlineCache: 'ऑफलाइन कैश उपयोग में है',
    noActiveAlerts: 'कोई सक्रिय अलर्ट नहीं है। सभी झीलें सुरक्षित सीमा में हैं।',
    notificationCenter: 'सूचना केंद्र',
  },
  ne: {
    dashboard: 'ड्यासबोर्ड',
    mapView: 'नक्सा दृश्य',
    telemetry: 'टेलिमेट्री',
    alerts: 'सतर्कता',
    notifications: 'सूचना केन्द्र',
    events: 'घटनाहरू',
    admin: 'प्रशासक',
    alertPreferences: 'सतर्कता सेटिङ',
    liveStreamActive: 'लाइभ स्ट्रिम सक्रिय',
    connecting: 'जडान हुँदैछ...',
    offlineCache: 'अफलाइन क्यास प्रयोगमा छ',
    noActiveAlerts: 'कुनै सक्रिय सतर्कता छैन। सबै तालहरू सुरक्षित दायरामा छन्।',
    notificationCenter: 'सूचना केन्द्र',
  },
};


export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem('glof_lang') || 'en');

  const changeLanguage = (nextLanguage) => {
    localStorage.setItem('glof_lang', nextLanguage);
    setLanguage(nextLanguage);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: changeLanguage, t: STRINGS[language] || STRINGS.en }}>
      {children}
    </I18nContext.Provider>
  );
}


export function useI18n() {
  return useContext(I18nContext);
}
