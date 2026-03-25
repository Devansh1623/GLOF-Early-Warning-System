import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Link to="/login" style={styles.backLink}>← Back to Login</Link>

        <div style={styles.logoRow}>
          <h1 style={styles.logo}>GLOFWatch</h1>
        </div>

        <h2 style={styles.title}>Privacy Policy</h2>
        <p style={styles.updated}>Last updated: March 2026</p>

        <div style={styles.content}>
          <Section title="1. Information We Collect">
            <p>We collect information you provide during registration, including your name, email address, and role/affiliation. When you use the dashboard, we collect usage data such as pages visited, features used, and session duration to improve the system.</p>
            <p>Our telemetry system collects environmental sensor data (temperature, precipitation, water level) from glacial lake monitoring stations. This data is environmental in nature and does not contain personal information.</p>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul>
              <li>To provide access to the GLOF early warning dashboard and monitoring tools</li>
              <li>To send real-time alerts and emergency notifications when risk thresholds are crossed</li>
              <li>To maintain account security and manage user authentication</li>
              <li>To improve our risk prediction algorithms and system performance</li>
              <li>To comply with disaster management regulatory requirements</li>
            </ul>
          </Section>

          <Section title="3. Alert Notifications">
            <p>Users may opt in or opt out of alert notifications through their dashboard settings. Emergency-level alerts (Critical risk, score ≥80) may still be displayed on the dashboard regardless of notification preferences, as these are essential for public safety.</p>
          </Section>

          <Section title="4. Data Storage & Security">
            <p>All data is stored in encrypted MongoDB databases. User passwords are hashed using bcrypt. API access is secured via JWT (JSON Web Tokens) with 24-hour expiration. All communication between the client and server is encrypted.</p>
          </Section>

          <Section title="5. Data Sharing">
            <p>We do not sell or share personal user data with third parties. Aggregated, anonymized environmental data may be shared with government agencies (CWC, NDMA, NRSC) for disaster management and research purposes as mandated by national disaster risk reduction policies.</p>
          </Section>

          <Section title="6. Data Sources">
            <p>Environmental data is sourced from Open-Meteo (weather data), CWC/NRSC Glacial Lake Inventory (lake metadata), and NDMA reports (historical events). All sources are publicly available and require no API keys.</p>
          </Section>

          <Section title="7. Your Rights">
            <ul>
              <li>Request access to your personal data</li>
              <li>Request correction or deletion of your account</li>
              <li>Opt out of non-emergency alert notifications</li>
              <li>Export your data in a machine-readable format</li>
            </ul>
          </Section>

          <Section title="8. Contact">
            <p>For privacy-related inquiries, contact the system administrator at <span style={styles.highlight}>admin@glof.in</span>.</p>
          </Section>
        </div>

        <div style={styles.footer}>
          <Link to="/login" style={styles.footerLink}>Back to Login</Link>
          <Link to="/terms" style={styles.footerLink}>Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', background: '#060a14',
    display: 'flex', justifyContent: 'center', padding: '40px 20px',
    overflowY: 'auto',
  },
  container: {
    maxWidth: 720, width: '100%',
    background: 'rgba(10, 14, 26, 0.9)',
    border: '1px solid rgba(56, 78, 119, 0.25)',
    borderRadius: 16, padding: '40px 48px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
    height: 'fit-content',
  },
  backLink: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 12, color: '#4a5f82', textDecoration: 'none',
    marginBottom: 24, transition: 'color 0.15s',
  },
  logoRow: { marginBottom: 8 },
  logo: {
    fontSize: 20, fontWeight: 800,
    background: 'linear-gradient(135deg, #60a5fa, #818cf8)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  title: {
    fontSize: 24, fontWeight: 700, color: '#e8edf5',
    letterSpacing: '-0.02em', marginBottom: 4,
  },
  updated: { fontSize: 12, color: '#4a5f82', marginBottom: 32 },
  content: { display: 'flex', flexDirection: 'column', gap: 28 },
  section: {},
  sectionTitle: {
    fontSize: 14, fontWeight: 700, color: '#8b9dc3',
    marginBottom: 10, letterSpacing: '-0.01em',
  },
  sectionBody: {
    fontSize: 13, color: '#6b83a8', lineHeight: 1.7,
  },
  highlight: {
    color: '#60a5fa', fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
  },
  footer: {
    display: 'flex', justifyContent: 'space-between',
    marginTop: 40, paddingTop: 20,
    borderTop: '1px solid rgba(56, 78, 119, 0.2)',
  },
  footerLink: {
    fontSize: 12, color: '#4a5f82', textDecoration: 'none',
  },
};
