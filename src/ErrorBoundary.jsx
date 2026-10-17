import { Component } from 'react';

/** Evita la pantalla en blanco: si algo falla al dibujar, muestra el error y cómo reportarlo. */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Error de la aplicación:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ maxWidth: 640, margin: '12vh auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 22, color: '#0b1f3a' }}>Algo salió mal al mostrar la página</h1>
        <p style={{ color: '#5a6679' }}>Recarga la página. Si el problema continúa, envía este mensaje a soporte:</p>
        <pre style={{ background: '#fcebea', color: '#b3261e', padding: 14, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
          {String(this.state.error?.stack || this.state.error)}
        </pre>
        <button onClick={() => window.location.reload()} style={{ padding: '9px 16px', borderRadius: 6, border: 0, background: '#1f63c4', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
          Recargar
        </button>
      </div>
    );
  }
}
