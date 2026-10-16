import { useCallback, useState } from 'react';
import LiveMap from '../components/LiveMap.jsx';
import { cancelOrder, createOrder, errorMessage, geocodeAddress, getMyOrders, reverseGeocode } from '../api';
import usePolling from '../hooks/usePolling';
import { formatDateTime, STATUS_LABEL } from '../util';

const DEFAULT_CENTER = [14.6349, -90.5069];

export default function ClientPage() {
  const [orders, setOrders] = useState([]);
  const [loadError, setLoadError] = useState('');

  const [address, setAddress] = useState('');
  const [destination, setDestination] = useState(null); // { lat, lng, label }
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');
  const [okMessage, setOkMessage] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setOrders(await getMyOrders());
      setLoadError('');
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  }, []);
  usePolling(load, 10000);

  async function handleSearch() {
    setFormError('');
    setOkMessage('');
    if (address.trim().length < 3) { setFormError('Para buscar, escribe una dirección. O simplemente toca el mapa.'); return; }
    setSearching(true);
    try {
      const found = await geocodeAddress(address.trim());
      setDestination(found);
    } catch (err) {
      setDestination(null);
      setFormError(err.message || 'No se pudo ubicar la dirección.');
    } finally {
      setSearching(false);
    }
  }

  function handleUseMyLocation() {
    setFormError('');
    setOkMessage('');
    if (!navigator.geolocation) { setFormError('Este navegador no soporta ubicación.'); return; }
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDestination({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Tu ubicación actual' });
        setSearching(false);
      },
      () => {
        setFormError('No se pudo obtener tu ubicación. Revisa el permiso del navegador o busca la dirección.');
        setSearching(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  // Tocar el mapa mueve el destino: sirve cuando el buscador cae cerca pero no exacto.
  const handleMapClick = async ([lat, lng]) => {
    setOkMessage('');
    setFormError('');
    setDestination({ lat, lng, label: 'Punto marcado en el mapa' });
    // Intenta poner el nombre de la calle; si falla, queda el texto genérico.
    try {
      const name = await reverseGeocode(lat, lng);
      if (name) setDestination((d) => (d && d.lat === lat && d.lng === lng ? { ...d, label: name } : d));
    } catch { /* opcional */ }
  };

  async function handleSend(e) {
    e.preventDefault();
    setFormError('');
    if (!destination) { setFormError('Toca el mapa para marcar dónde lo entregamos (o usa "Usar mi ubicación").'); return; }
    // La dirección escrita es solo una referencia; si no hay, se usa el nombre del punto marcado.
    const finalAddress = (address.trim() || destination.label || 'Punto marcado en el mapa').slice(0, 250);

    setSending(true);
    try {
      await createOrder({ customerName: 'cliente', address: finalAddress, latitude: destination.lat, longitude: destination.lng });
      setAddress('');
      setDestination(null);
      setOkMessage('¡Pedido enviado! Te avisaremos aquí cuando un repartidor lo tome.');
      await load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  async function handleCancel(order) {
    if (!window.confirm('¿Cancelar este pedido?')) return;
    setBusyId(order.id);
    setFormError('');
    try {
      await cancelOrder(order.id);
      await load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const markers = [];
  const lines = [];
  if (destination) {
    markers.push({ key: 'dest', position: [destination.lat, destination.lng], kind: 'pin', label: destination.label });
  }
  orders
    .filter((o) => o.status === 'pending' || o.status === 'assigned')
    .forEach((o) => {
      markers.push({ key: `o-${o.id}`, position: [o.latitude, o.longitude], kind: 'order', label: o.address });
      if (o.status === 'assigned' && o.driverLatitude != null && !(o.driverLatitude === 0 && o.driverLongitude === 0)) {
        const dp = [o.driverLatitude, o.driverLongitude];
        markers.push({ key: `d-${o.id}`, position: dp, kind: 'driver', label: `${o.driverName} — va hacia ti` });
        lines.push({ key: `l-${o.id}`, positions: [dp, [o.latitude, o.longitude]] });
      }
    });

  return (
    <div className="role-layout">
      <div className="sidebar">
        <form className="panel" onSubmit={handleSend} noValidate>
          <h2>Nuevo pedido</h2>
          <div className="mini-form">
            <input
              placeholder="Referencia (opcional): casa azul, portón negro…"
              value={address}
              onChange={(e) => { setAddress(e.target.value); setOkMessage(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
            />
            <div className="row">
              <button type="button" className="btn-ghost small" onClick={handleSearch} disabled={searching}>
                {searching ? 'Buscando…' : 'Buscar dirección'}
              </button>
              <button type="button" className="btn-ghost small" onClick={handleUseMyLocation} disabled={searching}>
                Usar mi ubicación
              </button>
            </div>
            {destination && (
              <div className="result-box">
                <div>📍 <b>Destino:</b> {destination.label}</div>
                <div className="dim small-note">Toca el mapa para mover el punto.</div>
              </div>
            )}
            <button className="btn-primary" disabled={sending}>{sending ? 'Enviando…' : 'Pedir envío'}</button>
          </div>
          {formError && <div className="error" role="alert">{formError}</div>}
          {okMessage && <div className="notice">{okMessage}</div>}
        </form>

        <div className="panel">
          <h2>Mis pedidos</h2>
          {loadError && <div className="error" role="alert">{loadError}</div>}
          <div className="list tall-list">
            {orders.map((o) => (
              <div key={o.id} className="list-item assignment">
                <div className="between">
                  <b>{o.address}</b>
                  <span className={`badge ${o.status}`}>{STATUS_LABEL[o.status] || o.status}</span>
                </div>
                <div className="dim">{formatDateTime(o.createdAt)}</div>
                {o.status === 'assigned' && o.driverName && (
                  <div>
                    🏍️ <b>{o.driverName}</b>
                    {o.driverPhone ? <> · <a href={`tel:${o.driverPhone}`}>{o.driverPhone}</a></> : null}
                    {o.distanceKm != null ? <span className="dim"> · a {o.distanceKm} km al salir</span> : null}
                  </div>
                )}
                {o.status === 'pending' && (
                  <div className="actions">
                    <span className="dim">Esperando repartidor…</span>
                    <button type="button" className="btn-ghost small danger" disabled={busyId === o.id} onClick={() => handleCancel(o)}>
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
            {orders.length === 0 && <div className="empty">Aún no has hecho pedidos.</div>}
          </div>
        </div>
      </div>

      <div className="map-container tall">
        <LiveMap center={DEFAULT_CENTER} markers={markers} lines={lines} onClick={handleMapClick} />
      </div>
    </div>
  );
}