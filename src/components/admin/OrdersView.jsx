import { useState } from 'react';
import { cancelOrder, createOrder, errorMessage, geocodeAddress } from '../../api';
import { Icon, PageHeader, StatusBadge, Empty } from '../ui.jsx';
import { downloadCsv, formatDateTime, orderCode, STATUS_LABEL } from '../../util';

const FILTERS = [['', 'Todos'], ['pending', 'Pendientes'], ['assigned', 'En camino'], ['delivered', 'Entregados'], ['cancelled', 'Cancelados']];

export default function OrdersView({ orders, onRefresh }) {
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!customerName.trim() || !address.trim()) { setError('Cliente y dirección son obligatorios.'); return; }
    setLoading(true);
    try {
      const { lat, lng, label } = await geocodeAddress(address.trim());
      await createOrder({ customerName: customerName.trim(), address: address.trim() || label, latitude: lat, longitude: lng });
      setCustomerName(''); setAddress('');
      onRefresh();
    } catch (err) {
      setError(err.response ? errorMessage(err) : (err.message || 'No se pudo ubicar la dirección.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(o) {
    if (!window.confirm(`¿Cancelar el pedido ${orderCode(o.id)}?`)) return;
    setBusyId(o.id);
    setError('');
    try { await cancelOrder(o.id); onRefresh(); } catch (err) { setError(errorMessage(err)); } finally { setBusyId(null); }
  }

  const q = query.trim().toLowerCase();
  const visible = orders
    .filter((o) => !filter || o.status === filter)
    .filter((o) => !q || `${orderCode(o.id)} ${o.customerName} ${o.address}`.toLowerCase().includes(q))
    .sort((a, b) => b.id - a.id);

  function exportCsv() {
    downloadCsv(`Esociety-pedidos-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Orden', 'Cliente', 'Dirección', 'Latitud', 'Longitud', 'Estado', 'Creado'],
      visible.map((o) => [orderCode(o.id), o.customerName, o.address, o.latitude, o.longitude, STATUS_LABEL[o.status] || o.status, formatDateTime(o.createdAt)]));
  }

  return (
    <>
      <PageHeader title="Pedidos" subtitle="Registro, búsqueda y seguimiento de todas las órdenes.">
        <button className="btn-ghost" onClick={exportCsv} disabled={!visible.length}><Icon name="download" size={16} /> Exportar CSV</button>
      </PageHeader>

      <div className="layout-form">
        <form className="panel" onSubmit={handleSubmit}>
          <h2>Nuevo pedido</h2>
          <div className="mini-form">
            <label className="field">Cliente
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </label>
            <label className="field">Dirección de entrega
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle, zona, colonia, ciudad" />
            </label>
            <button className="btn-primary" disabled={loading}><Icon name="plus" size={16} />{loading ? 'Ubicando…' : 'Registrar pedido'}</button>
          </div>
          {error && <div className="error" role="alert">{error}</div>}
          <div className="small-note">Los clientes con cuenta crean sus propios pedidos desde su portal.</div>
        </form>

        <div className="panel flush">
          <div className="toolbar">
            <div className="search">
              <Icon name="search" size={16} />
              <input placeholder="Buscar por orden, cliente o dirección" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            {FILTERS.map(([value, label]) => (
              <button key={value || 'all'} className={`btn-ghost small ${filter === value ? 'active' : ''}`} onClick={() => setFilter(value)}>{label}</button>
            ))}
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Orden</th><th>Cliente</th><th>Dirección</th><th>Creado</th><th>Estado</th><th /></tr></thead>
              <tbody>
                {visible.map((o) => (
                  <tr key={o.id}>
                    <td className="code">{orderCode(o.id)}</td>
                    <td>{o.customerName}</td>
                    <td>{o.address}</td>
                    <td className="dim">{formatDateTime(o.createdAt)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="actions-cell">
                      {o.status === 'pending' && (
                        <button className="btn-ghost small danger" disabled={busyId === o.id} onClick={() => handleCancel(o)}>Cancelar</button>
                      )}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && <tr><td colSpan={6}><Empty>No hay pedidos con ese filtro.</Empty></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
