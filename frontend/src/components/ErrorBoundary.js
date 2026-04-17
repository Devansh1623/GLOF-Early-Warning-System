import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '60vh', gap: '1rem',
          color: 'var(--color-text-muted, #888)'
        }}>
          <span style={{ fontSize: '2.5rem' }}>⚠️</span>
          <h2 style={{ margin: 0 }}>Something went wrong</h2>
          <p style={{ margin: 0 }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button
            style={{
              padding: '0.5rem 1.5rem', borderRadius: '6px',
              border: '1px solid currentColor', cursor: 'pointer',
              background: 'transparent', color: 'inherit'
            }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
