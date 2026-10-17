import { useState } from 'react';
import { Icon, PageHeader, StatusBadge, Empty } from '../ui.jsx';
import { downloadCsv, formatDateTime, STATUS_LABEL } from '../../util';

const FILTERS = [['', 'Todas'], ['active', 'En curso'], ['completed', 'Completadas'], ['cancelled', 'Canceladas']];

export default function HistoryView({ assignments }) {
  const [filter, setFilter] = useState('');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const visible = [...assignments]
    .filter((a) => !filter || a.status === filter)
    .filter((a) => !q || `${a.driverName} ${a.customerName} ${a.address}`.toLowerCase().includes(q))
    .sort((a, b) => b.id - a.id);

  const km = visible.filter((a) => a.status !== 'cancelled').reduce((s, a) => s + a.distanceKm, 0);

  function exportCsv() {
    downloadCsv(`Esociety-entregas-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Asignación', 'Repartidor', 'Cliente', 'Dirección', 'Distancia (km)', 'Asignada', 'Estado'],
      visible.map((a) => [a.id, a.driverName, a.customerName, a.address, a.distanceKm, formatDateTime(a.assignedAt), STATUS_LABEL[a.status] || a.status]));
  }

  return (
    <>
      <PageHeader title="Historial de entregas" subtitle="Todas las asignaciones realizadas por el sistema.">
        <button className="btn-ghost" onClick={exportCsv} disabled={!visible.length}><Icon name="download" size={16} /> Exportar CSV</button>
      </PageHeader>

      <div className="panel flush">
        <div className="toolbar">
          <div className="search">
            <Icon name="search" size={16} />
            <input placeholder="Buscar por repartidor, cliente o dirección" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {FILTERS.map(([value, label]) => (
            <button key={value || 'all'} className={`btn-ghost small ${filter === value ? 'active' : ''}`} onClick={() => setFilter(value)}>{label}</button>
          ))}
          <span className="dim" style={{ marginLeft: 'auto' }}>{visible.length} registros · {km.toFixed(1)} km</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>N.º</th><th>Repartidor</th><th>Cliente</th><th>Dirección</th><th className="num">Distancia</th><th>Asignada</th><th>Estado</th></tr></thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a.id}>
                  <td className="code">{a.id}</td>
                  <td>{a.driverName}</td>
                  <td>{a.customerName}</td>
                  <td>{a.address}</td>
                  <td className="num">{a.distanceKm} km</td>
                  <td className="dim">{formatDateTime(a.assignedAt)}</td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
              {visible.length === 0 && <tr><td colSpan={7}><Empty>No hay entregas registradas con ese filtro.</Empty></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
