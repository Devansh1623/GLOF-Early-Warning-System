import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-card">
        <Link to="/login" style={{ color: '#7bd5e6', fontSize: 12 }}>Back to login</Link>
        <h1>GLOFWatch</h1>
        <h2>Terms of Service</h2>
        <div className="legal-updated">Last updated: March 2026</div>

        <Section title="1. Acceptance of terms">
          <p>By accessing the GLOFWatch platform, you agree to these terms and to use the system responsibly.</p>
        </Section>

        <Section title="2. Permitted use">
          <p>The platform is intended for monitoring glacial lake risks and supporting emergency preparedness. You must not misuse the system or attempt to disrupt operations.</p>
        </Section>

        <Section title="3. Accounts and access">
          <p>You are responsible for keeping your credentials secure. Administrative access is limited to authorized personnel.</p>
        </Section>

        <Section title="4. Data accuracy">
          <p>The platform aggregates data from multiple sources. While we aim for accuracy, all alerts should be validated with local protocols and official guidance.</p>
        </Section>

        <Section title="5. Availability">
          <p>The system is provided on a best effort basis. Planned maintenance and network disruptions may occur.</p>
        </Section>

        <Section title="6. Limitation of liability">
          <p>GLOFWatch is an early warning tool and should not be the sole basis for evacuation or safety decisions.</p>
        </Section>

        <Section title="7. Contact">
          <p>Questions about these terms can be directed to admin@glof.in.</p>
        </Section>

        <div style={{ marginTop: 20, fontSize: 12 }}>
          <Link to="/privacy" style={{ color: '#7bd5e6', marginRight: 12 }}>Privacy policy</Link>
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
