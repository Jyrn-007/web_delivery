import { useState } from 'react';
import { createDriver, errorMessage, geocodeAddress } from '../../api';
import { Icon, PageHeader, StatusBadge, Empty } from '../ui.jsx';
import { downloadCsv, formatDateTime, STATUS_LABEL, VEHICLE_LABEL } from '../../util';

export default function DriversView({ drivers, onRefresh, onGo }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('moto');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim() || !address.trim()) { setError('Nombre y ubicación actual son obligatorios.'); return; }
    setLoading(true);
    try {
      const { lat, lng } = await geocodeAddress(address.trim());
      await createDriver({ name: name.trim(), phone: phone.trim(), vehicleType: vehicle, latitude: lat, longitude: lng });
      setName(''); setPhone(''); setAddress('');
      onRefresh();
    } catch (err) {
      setError(err.response ? errorMessage(err) : (err.message || 'No se pudo ubicar la dirección.'));
    } finally {
      setLoading(false);
    }
  }

  const hasPos = (d) => !(d.latitude === 0 && d.longitude === 0);

  function exportCsv() {
    downloadCsv(`esocity-repartidores-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Nombre', 'Teléfono', 'Vehículo', 'Estado', 'Última actualización'],
      drivers.map((d) => [d.name, d.phone, VEHICLE_LABEL[d.vehicleType] || d.vehicleType, STATUS_LABEL[d.status] || d.status, formatDateTime(d.updatedAt)]));
  }

  return (
    <>
      <PageHeader title="Repartidores" subtitle="Flota registrada y su disponibilidad.">
        <button className="btn-ghost" onClick={exportCsv} disabled={!drivers.length}><Icon name="download" size={16} /> Exportar CSV</button>
        <button className="btn-primary" onClick={() => onGo('users')}><Icon name="plus" size={16} /> Crear repartidor con cuenta</button>
      </PageHeader>

      <div className="layout-form">
        <form className="panel" onSubmit={handleSubmit}>
          <h2>Repartidor sin cuenta</h2>
          <p className="small-note" style={{ marginTop: 0, marginBottom: 12 }}>
            Para que el repartidor ingrese a su propio portal, créalo con cuenta en Usuarios. Este formulario registra solo la ficha.
          </p>
          <div className="mini-form">
            <label className="field">Nombre<input value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label className="field">Teléfono<input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
            <label className="field">Vehículo
              <select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
                <option value="moto">Moto</option>
                <option value="bicicleta">Bicicleta</option>
                <option value="auto">Automóvil</option>
              </select>
            </label>
            <label className="field">Ubicación actual<input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección real" /></label>
            <button className="btn-ghost" disabled={loading}><Icon name="plus" size={16} />{loading ? 'Ubicando…' : 'Agregar ficha'}</button>
          </div>
          {error && <div className="error" role="alert">{error}</div>}
        </form>

        <div className="panel flush">
          <h2>Flota <span className="hint">{drivers.length} registrados</span></h2>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Nombre</th><th>Vehículo</th><th>Teléfono</th><th>Estado</th><th>Ubicación</th><th>Actualizado</th></tr></thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.id}>
                    <td><b>{d.name}</b></td>
                    <td>{VEHICLE_LABEL[d.vehicleType] || d.vehicleType}</td>
                    <td className="dim">{d.phone || '—'}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td className="dim">{hasPos(d) ? `${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}` : 'Sin ubicación'}</td>
                    <td className="dim">{formatDateTime(d.updatedAt)}</td>
                  </tr>
                ))}
                {drivers.length === 0 && <tr><td colSpan={6}><Empty>Sin repartidores registrados.</Empty></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
