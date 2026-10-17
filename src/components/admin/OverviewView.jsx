import { KpiCard, PageHeader, StatusBadge, Empty } from '../ui.jsx';
import { formatDateTime, orderCode, VEHICLE_LABEL } from '../../util';

export default function OverviewView({ drivers, orders, assignments, onGo }) {
  const count = (s) => orders.filter((o) => o.status === s).length;
  const pending = count('pending');
  const assigned = count('assigned');
  const delivered = count('delivered');
  const cancelled = count('cancelled');
  const total = orders.length || 1;

  const online = drivers.filter((d) => d.status !== 'offline').length;
  const free = drivers.filter((d) => d.status === 'available').length;
  const doneKm = assignments.filter((a) => a.status === 'completed').reduce((s, a) => s + a.distanceKm, 0);
  const activeKm = assignments.filter((a) => a.status === 'active').reduce((s, a) => s + a.distanceKm, 0);

  const recent = [...orders].sort((a, b) => b.id - a.id).slice(0, 6);
  const pct = (n) => `${(n / total) * 100}%`;

  return (
    <>
      <PageHeader title="Resumen de operación" subtitle="Estado actual de pedidos, flota y entregas." />

      <div className="kpis">
        <KpiCard label="Pedidos pendientes" value={pending} hint="Esperan asignación" tone={pending ? 'warn' : 'neutral'} />
        <KpiCard label="En camino" value={assigned} hint={`${activeKm.toFixed(1)} km en ruta`} tone="info" />
        <KpiCard label="Entregados" value={delivered} hint={`${doneKm.toFixed(1)} km recorridos`} tone="ok" />
        <KpiCard label="Repartidores en línea" value={`${online} / ${drivers.length}`} hint={`${free} disponibles ahora`} />
      </div>

      <div className="grid-2">
        <div className="panel">
          <h2>Distribución de pedidos <span className="hint">{orders.length} en total</span></h2>
          <div className="statusbar" role="img" aria-label="Distribución de pedidos por estado">
            <span className="seg-pending" style={{ width: pct(pending) }} />
            <span className="seg-assigned" style={{ width: pct(assigned) }} />
            <span className="seg-delivered" style={{ width: pct(delivered) }} />
            <span className="seg-cancelled" style={{ width: pct(cancelled) }} />
          </div>
          <div className="legend">
            <span><i className="seg-pending" />Pendientes {pending}</span>
            <span><i className="seg-assigned" />En camino {assigned}</span>
            <span><i className="seg-delivered" />Entregados {delivered}</span>
            <span><i className="seg-cancelled" />Cancelados {cancelled}</span>
          </div>
          {pending > 0 && (
            <div className="result-box block" style={{ marginTop: 16 }}>
              Hay <b>{pending}</b> {pending === 1 ? 'pedido' : 'pedidos'} sin asignar.
              <div className="actions"><button className="btn-primary small" onClick={() => onGo('dispatch')}>Ir a despacho</button></div>
            </div>
          )}
        </div>

        <div className="panel">
          <h2>Flota <span className="hint">{drivers.length} repartidores</span></h2>
          <div className="list">
            {drivers.map((d) => (
              <div key={d.id} className="list-item" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><span className="title">{d.name}</span> <span className="dim">· {VEHICLE_LABEL[d.vehicleType] || d.vehicleType}</span></span>
                <StatusBadge status={d.status} />
              </div>
            ))}
            {drivers.length === 0 && <Empty>Aún no hay repartidores. Créalos en la sección Usuarios.</Empty>}
          </div>
        </div>
      </div>

      <div className="panel flush" style={{ marginTop: 16 }}>
        <h2>Pedidos recientes <button className="btn-ghost small" onClick={() => onGo('orders')}>Ver todos</button></h2>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Orden</th><th>Cliente</th><th>Dirección</th><th>Creado</th><th>Estado</th></tr></thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td className="code">{orderCode(o.id)}</td>
                  <td>{o.customerName}</td>
                  <td>{o.address}</td>
                  <td className="dim">{formatDateTime(o.createdAt)}</td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan={5}><Empty>Todavía no hay pedidos.</Empty></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
