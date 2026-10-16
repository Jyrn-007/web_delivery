import { useState } from 'react';
import { createDriver, geocodeAddress } from '../api';

export default function DriversPanel({ drivers, onRefresh }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('moto');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name || !address) { setError('Nombre y ubicación actual son obligatorios.'); return; }
    setLoading(true);
    try {
      const { lat, lng } = await geocodeAddress(address);
      await createDriver({ name, phone, vehicleType: vehicle, latitude: lat, longitude: lng });
      setName(''); setPhone(''); setAddress('');
      onRefresh();
    } catch (err) {
      setError(err.message || 'No se pudo geolocalizar la dirección.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <h2>Repartidores</h2>
      <div className="dim small-note">Para que un repartidor entre con su propio usuario, créalo en la pestaña Usuarios.</div>
      <form className="mini-form" onSubmit={handleSubmit}>
        <input placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} />
        <select value={vehicle} onChange={e => setVehicle(e.target.value)}>
          <option value="moto">Moto</option>
          <option value="bicicleta">Bicicleta</option>
          <option value="auto">Auto</option>
        </select>
        <input placeholder="Ubicación actual (dirección real)" value={address} onChange={e => setAddress(e.target.value)} />
        <button className="btn-primary" disabled={loading}>{loading ? 'Ubicando…' : '+ Agregar repartidor (sin cuenta)'}</button>
      </form>
      {error && <div className="error">{error}</div>}
      <div className="list">
        {drivers.map(d => (
          <div key={d.id} className="list-item">
            <span>🏍️ {d.name}</span>
            <span className={`badge ${d.status}`}>{d.status}</span>
          </div>
        ))}
        {drivers.length === 0 && <div className="empty">Sin repartidores registrados.</div>}
      </div>
    </div>
  );
}
