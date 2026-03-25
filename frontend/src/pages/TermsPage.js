import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Link to="/login" style={styles.backLink}>← Back to Login</Link>

        <div style={styles.logoRow}>
          <h1 style={styles.logo}>GLOFWatch</h1>
        </div>

        <h2 style={styles.title}>Terms of Service</h2>
        <p style={styles.updated}>Last updated: March 2026</p>

        <div style={styles.content}>
          <Section title="1. Acceptance of Terms">
            <p>By accessing and using the GLOFWatch Early Warning & Monitoring System, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use the platform.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>GLOFWatch is a web-based early warning system that monitors glacial lakes in the Indian Himalayan Region, analyzes flood risk using environmental telemetry data, and provides real-time alerts to registered users. The system is designed for disaster management, research, and public safety purposes.</p>
          </Section>

          <Section title="3. User Accounts">
            <ul>
              <li>You must provide accurate and complete information during registration</li>
              <li>You are responsible for maintaining the confidentiality of your login credentials</li>
              <li>You must notify us immediately of any unauthorized access to your account</li>
              <li>Admin accounts carry additional responsibilities and must not be shared</li>
            </ul>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree to use the platform only for its intended purposes: monitoring glacial lakes, analyzing risk data, and receiving alerts. You must not:</p>
            <ul>
              <li>Attempt to interfere with or disrupt the system's operation</li>
              <li>Submit false telemetry data or trigger false alerts</li>
              <li>Reverse-engineer the risk prediction algorithms for commercial use</li>
              <li>Use the system to disseminate misleading risk information to the public</li>
              <li>Excessively query the API in a manner that degrades service for other users</li>
            </ul>
          </Section>

          <Section title="5. Disclaimer of Warranties">
            <p>GLOFWatch is provided "as is" and "as available." While we strive for accuracy, we make no guarantees regarding the completeness, reliability, or timeliness of risk predictions. <strong style={{ color: '#fca5a5' }}>This system should not be the sole basis for evacuation decisions.</strong> Always follow official government advisories from NDMA, CWC, and local disaster management authorities.</p>
          </Section>

          <Section title="6. Limitation of Liability">
            <p>GLOFWatch and its operators shall not be held liable for any damages, losses, or injuries resulting from reliance on the system's risk predictions, alerts, or data. Risk scores are computed using rule-based algorithms with inherent limitations and should be used as one of multiple decision-support inputs.</p>
          </Section>

          <Section title="7. Data Accuracy">
            <p>Environmental data is sourced from Open-Meteo and simulated sensors. Historical events are verified against CWC, NDMA, and PIB publications. However, data transmission delays, sensor malfunctions, and API outages may affect the accuracy and timeliness of readings.</p>
          </Section>

          <Section title="8. Intellectual Property">
            <p>All content, designs, algorithms, and documentation within GLOFWatch are the intellectual property of the project team. Lake data and historical events are sourced from publicly available government datasets and are credited accordingly.</p>
          </Section>

          <Section title="9. Termination">
            <p>We reserve the right to suspend or terminate accounts that violate these terms. Users may delete their accounts at any time by contacting the system administrator.</p>
          </Section>

          <Section title="10. Changes to Terms">
            <p>We may update these terms as the system evolves. Continued use of the platform after changes constitutes acceptance of the revised terms.</p>
          </Section>
        </div>

        <div style={styles.footer}>
          <Link to="/login" style={styles.footerLink}>Back to Login</Link>
          <Link to="/privacy" style={styles.footerLink}>Privacy Policy</Link>
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
    fontSize: 12, color: '#4a5f82', textDecoration: 'none', marginBottom: 24,
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
  sectionBody: { fontSize: 13, color: '#6b83a8', lineHeight: 1.7 },
  footer: {
    display: 'flex', justifyContent: 'space-between',
    marginTop: 40, paddingTop: 20,
    borderTop: '1px solid rgba(56, 78, 119, 0.2)',
  },
  footerLink: { fontSize: 12, color: '#4a5f82', textDecoration: 'none' },
};
