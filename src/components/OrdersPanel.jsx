import { useState } from 'react';
import { createOrder, geocodeAddress } from '../api';

export default function OrdersPanel({ orders, onRefresh }) {
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!customerName || !address) { setError('Cliente y dirección son obligatorios.'); return; }
    setLoading(true);
    try {
      const { lat, lng } = await geocodeAddress(address);
      await createOrder({ customerName, address, latitude: lat, longitude: lng });
      setCustomerName(''); setAddress('');
      onRefresh();
    } catch (err) {
      setError(err.message || 'No se pudo geolocalizar la dirección.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <h2>Pedidos</h2>
      <form className="mini-form" onSubmit={handleSubmit}>
        <input placeholder="Cliente" value={customerName} onChange={e => setCustomerName(e.target.value)} />
        <input placeholder="Dirección de entrega real" value={address} onChange={e => setAddress(e.target.value)} />
        <button className="btn-primary" disabled={loading}>{loading ? 'Ubicando…' : '+ Nuevo pedido'}</button>
      </form>
      {error && <div className="error">{error}</div>}
      <div className="list">
        {orders.map(o => (
          <div key={o.id} className="list-item">
            <span>📦 {o.customerName} — {o.address}</span>
            <span className={`badge ${o.status}`}>{o.status}</span>
          </div>
        ))}
        {orders.length === 0 && <div className="empty">Sin pedidos registrados.</div>}
      </div>
    </div>
  );
}
