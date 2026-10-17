import { useState } from 'react';
import { optimizeAssignments, completeAssignment, cancelAssignment, errorMessage } from '../api';
import { Icon } from './ui.jsx';

export default function AssignmentsPanel({ assignments, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleOptimize() {
    setLoading(true);
    setError('');
    try {
      const res = await optimizeAssignments();
      setResult(res);
      onRefresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(id) {
    setError('');
    try { await completeAssignment(id); } catch (err) { setError(errorMessage(err)); }
    onRefresh();
  }

  async function handleCancel(id) {
    if (!window.confirm('¿Cancelar esta asignación? El pedido volverá a quedar pendiente.')) return;
    setError('');
    try { await cancelAssignment(id); } catch (err) { setError(errorMessage(err)); }
    onRefresh();
  }

  const active = assignments.filter((a) => a.status === 'active');

  return (
    <div className="panel">
      <h2>Asignación óptima <span className="hint">Método húngaro</span></h2>
      <button className="btn-primary wide" onClick={handleOptimize} disabled={loading}>
        <Icon name="play" size={15} /> {loading ? 'Calculando…' : 'Asignar pedidos pendientes'}
      </button>

      {error && <div className="error" role="alert">{error}</div>}

      {result && (
        <div className="result-box">
          <div>Repartidores considerados: <b>{result.driversConsidered}</b></div>
          <div>Pedidos considerados: <b>{result.ordersConsidered}</b></div>
          <div>Asignaciones creadas: <b>{result.assignmentsCreated}</b></div>
          <div>Distancia total óptima: <b>{result.totalDistanceKm} km</b></div>
          {result.unassignedNotes?.map((n, i) => <div key={i} className="note">{n}</div>)}
        </div>
      )}

      <div className="small-note" style={{ margin: '14px 0 8px', fontWeight: 600, color: 'var(--navy-900)' }}>
        Entregas en curso ({active.length})
      </div>
      <div className="list">
        {active.map((a) => (
          <div key={a.id} className="list-item">
            <div><span className="title">{a.driverName}</span> → {a.customerName} <span className="dim">· {a.distanceKm} km</span></div>
            <div className="dim">{a.address}</div>
            <div className="actions">
              <button className="btn-ghost small" onClick={() => handleComplete(a.id)}><Icon name="check" size={14} /> Entregado</button>
              <button className="btn-ghost small danger" onClick={() => handleCancel(a.id)}>Cancelar</button>
            </div>
          </div>
        ))}
        {active.length === 0 && <div className="empty">No hay entregas en curso.</div>}
      </div>
    </div>
  );
}
