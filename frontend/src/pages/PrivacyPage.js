import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="legal-card">
        <Link to="/login" style={{ color: '#7bd5e6', fontSize: 12 }}>Back to login</Link>
        <h1>GLOFWatch</h1>
        <h2>Privacy Policy</h2>
        <div className="legal-updated">Last updated: March 2026</div>

        <Section title="1. Information we collect">
          <p>We collect information you provide during registration, including your name and email address. We also collect usage data such as pages visited and session duration to improve the system.</p>
          <p>Telemetry data relates to environmental measurements like temperature, precipitation, and water level. This data does not contain personal information.</p>
        </Section>

        <Section title="2. How we use your information">
          <ul>
            <li>Provide access to the early warning dashboard and monitoring tools.</li>
            <li>Send real time alerts when risk thresholds are crossed.</li>
            <li>Maintain account security and manage authentication.</li>
            <li>Improve risk modeling and system performance.</li>
            <li>Comply with disaster management requirements.</li>
          </ul>
        </Section>

        <Section title="3. Alert notifications">
          <p>Users can control warning level notifications in dashboard preferences. Emergency level alerts may still be displayed for public safety.</p>
        </Section>

        <Section title="4. Data storage and security">
          <p>Passwords are hashed using bcrypt. API access is secured with JWT tokens. All communication between client and server is encrypted.</p>
        </Section>

        <Section title="5. Data sharing">
          <p>We do not sell or share personal data. Aggregated environmental data may be shared with public agencies for research and safety.</p>
        </Section>

        <Section title="6. Data sources">
          <p>Environmental data is sourced from Open Meteo, the CWC and NRSC lake inventory, and NDMA reports.</p>
        </Section>

        <Section title="7. Your rights">
          <ul>
            <li>Request access to your data.</li>
            <li>Request correction or deletion of your account.</li>
            <li>Opt out of non emergency alert notifications.</li>
            <li>Export your data in a machine readable format.</li>
          </ul>
        </Section>

        <Section title="8. Contact">
          <p>For privacy related inquiries, contact the system administrator at admin@glof.in.</p>
        </Section>

        <div style={{ marginTop: 20, fontSize: 12 }}>
          <Link to="/terms" style={{ color: '#7bd5e6', marginRight: 12 }}>Terms of service</Link>
          <Link to="/login" style={{ color: '#7bd5e6' }}>Back to login</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="legal-section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
