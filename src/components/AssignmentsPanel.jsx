import { useState } from 'react';
import { optimizeAssignments, completeAssignment, cancelAssignment, errorMessage } from '../api';

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
    try {
      await completeAssignment(id);
    } catch (err) {
      setError(errorMessage(err));
    }
    onRefresh();
  }

  async function handleCancel(id) {
    setError('');
    try {
      await cancelAssignment(id);
    } catch (err) {
      setError(errorMessage(err));
    }
    onRefresh();
  }

  const active = assignments.filter(a => a.status === 'active');

  return (
    <div className="panel">
      <h2>Asignación óptima (Método Húngaro)</h2>
      <button className="btn-primary wide" onClick={handleOptimize} disabled={loading}>
        {loading ? 'Calculando…' : '▶ Optimizar asignaciones ahora'}
      </button>

      {error && <div className="error" role="alert">{error}</div>}

      {result && (
        <div className="result-box">
          <div>Repartidores considerados: <b>{result.driversConsidered}</b></div>
          <div>Pedidos considerados: <b>{result.ordersConsidered}</b></div>
          <div>Asignaciones creadas: <b>{result.assignmentsCreated}</b></div>
          <div>Distancia total óptima: <b>{result.totalDistanceKm} km</b></div>
          {result.unassignedNotes?.map((n, i) => <div key={i} className="note">⚠ {n}</div>)}
        </div>
      )}

      <div className="list">
        {active.map(a => (
          <div key={a.id} className="list-item assignment">
            <div>
              <b>{a.driverName}</b> → {a.customerName} <span className="dim">({a.distanceKm} km)</span>
            </div>
            <div className="actions">
              <button className="btn-ghost small" onClick={() => handleComplete(a.id)}>Entregado</button>
              <button className="btn-ghost small danger" onClick={() => handleCancel(a.id)}>Cancelar</button>
            </div>
          </div>
        ))}
        {active.length === 0 && <div className="empty">No hay asignaciones activas.</div>}
      </div>
    </div>
  );
}
