import { useCallback, useEffect, useRef, useState } from 'react';
import LiveMap from '../components/LiveMap.jsx';
import {
  completeAssignment, errorMessage, getMyAssignments, getMyDriver,
  updateDriverLocation, updateDriverStatus,
} from '../api';
import usePolling from '../hooks/usePolling';
import { Icon, StatusBadge } from '../components/ui.jsx';
import { distanceMeters, VEHICLE_LABEL } from '../util';

const DEFAULT_CENTER = [14.6349, -90.5069];
const MIN_SEND_INTERVAL_MS = 15000;   // no más de un envío cada 15 s mientras se mueve
const MIN_MOVE_METERS = 25;           // ni por movimientos menores a 25 m
const KEEPALIVE_MS = 60000;           // parado, se reenvía cada 60 s (el servidor descarta GPS de más de 5 min)

function gpsErrorText(err) {
  if (!navigator.geolocation) return 'Este navegador no soporta ubicación.';
  switch (err?.code) {
    case 1: return 'Bloqueaste el permiso de ubicación. Actívalo en el candado de la barra de direcciones y vuelve a intentar.';
    case 2: return 'No se pudo determinar tu ubicación. Revisa que el GPS esté encendido.';
    case 3: return 'Tardó demasiado en obtener tu ubicación. Inténtalo de nuevo.';
    default: return 'No se pudo obtener tu ubicación.';
  }
}

const getPosition = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) { reject(new Error('sin geolocalización')); return; }
  navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 });
});

export default function DriverPage() {
  const [driver, setDriver] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [gpsWarning, setGpsWarning] = useState('');
  const [working, setWorking] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  const [picked, setPicked] = useState(null);   // punto marcado en el mapa { lat, lng }
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('delivery.driverMode') === 'gps' ? 'gps' : 'manual'; } catch { return 'manual'; }
  });
  const changeMode = (m) => {
    setMode(m);
    try { localStorage.setItem('delivery.driverMode', m); } catch { /* sin persistencia */ }
  };

  const watchId = useRef(null);
  const lastSent = useRef({ t: 0, lat: null, lng: null });
  const lastPos = useRef(null);
  const driverRef = useRef(null);
  driverRef.current = driver;

  const load = useCallback(async () => {
    try {
      const [d, a] = await Promise.all([getMyDriver(), getMyAssignments()]);
      setDriver(d);
      setDeliveries(a);
      setLoadError('');
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  }, []);
  usePolling(load, 10000);

  const sendLocation = useCallback(async (lat, lng, force = false) => {
    const d = driverRef.current;
    if (!d) return;
    const prev = lastSent.current;
    const elapsed = Date.now() - prev.t;
    const moved = prev.lat === null ? Infinity : distanceMeters(prev.lat, prev.lng, lat, lng);
    if (!force && (elapsed < MIN_SEND_INTERVAL_MS || moved < MIN_MOVE_METERS)) return;

    lastSent.current = { t: Date.now(), lat, lng };
    try {
      await updateDriverLocation(d.id, { latitude: lat, longitude: lng });
      setDriver((cur) => (cur ? { ...cur, latitude: lat, longitude: lng } : cur));
    } catch {
      // Un envío perdido no es grave: el siguiente lo corrige.
      lastSent.current = { ...lastSent.current, t: 0 };
    }
  }, []);

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchId.current !== null) return;
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsWarning('');
        setAccuracy(Math.round(pos.coords.accuracy));
        lastPos.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        sendLocation(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => setGpsWarning(gpsErrorText(err)),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
  }, [sendLocation]);

  const connected = driver && driver.status !== 'offline';

  // Si ya estaba conectado al abrir la página (o tras recargar), se retoma el GPS.
  useEffect(() => {
    if (connected && mode === 'gps') startWatching();
    else stopWatching();
  }, [connected, mode, startWatching, stopWatching]);

  // Parado en un lugar, el GPS no dispara eventos: se reenvía la última posición cada minuto.
  useEffect(() => {
    if (!connected) return undefined;
    const timer = setInterval(() => {
      const d = driverRef.current;
      const p = lastPos.current || (d && !(d.latitude === 0 && d.longitude === 0) ? { lat: d.latitude, lng: d.longitude } : null);
      if (p) sendLocation(p.lat, p.lng, true);
    }, KEEPALIVE_MS);
    return () => clearInterval(timer);
  }, [connected, sendLocation]);

  useEffect(() => stopWatching, [stopWatching]);

  // Conectarse en el punto marcado en el mapa (sin usar GPS).
  async function handleConnectHere() {
    setActionError('');
    const p = picked || (!(driver.latitude === 0 && driver.longitude === 0) ? { lat: driver.latitude, lng: driver.longitude } : null);
    if (!p) { setActionError('Toca el mapa para marcar dónde estás.'); return; }
    setWorking(true);
    try {
      changeMode('manual');
      lastPos.current = p;
      await updateDriverLocation(driver.id, { latitude: p.lat, longitude: p.lng });
      lastSent.current = { t: Date.now(), lat: p.lat, lng: p.lng };
      await updateDriverStatus(driver.id, 'available');
      setPicked(null);
      await load();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  // Ya conectado: tocar el mapa mueve mi posición.
  async function handleMapClick([lat, lng]) {
    if (!driver) return;
    setActionError('');
    if (driver.status === 'offline') { setPicked({ lat, lng }); return; }
    changeMode('manual');
    lastPos.current = { lat, lng };
    await sendLocation(lat, lng, true);
  }

  async function handleConnect() {
    setActionError('');
    setGpsWarning('');
    setWorking(true);
    try {
      changeMode('gps');
      const pos = await getPosition();
      lastPos.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setAccuracy(Math.round(pos.coords.accuracy));
      await updateDriverLocation(driver.id, { latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      lastSent.current = { t: Date.now(), lat: pos.coords.latitude, lng: pos.coords.longitude };
      await updateDriverStatus(driver.id, 'available');
      await load();
    } catch (err) {
      setActionError(err?.response ? errorMessage(err) : gpsErrorText(err));
    } finally {
      setWorking(false);
    }
  }

  async function handleDisconnect() {
    setActionError('');
    setWorking(true);
    try {
      await updateDriverStatus(driver.id, 'offline');
      stopWatching();
      await load();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  async function handleComplete(delivery) {
    if (!window.confirm(`¿Confirmas que entregaste el pedido de ${delivery.customerName}?`)) return;
    setActionError('');
    setWorking(true);
    try {
      await completeAssignment(delivery.id);
      await load();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  if (!driver) {
    return (
      <div className="page-narrow">
        {loadError
          ? <div className="error banner" role="alert">{loadError}</div>
          : <div className="dim">Cargando tu información…</div>}
      </div>
    );
  }

  const hasPosition = !(driver.latitude === 0 && driver.longitude === 0);
  const myPos = hasPosition ? [driver.latitude, driver.longitude] : null;

  const markers = [];
  const lines = [];
  if (picked) markers.push({ key: 'picked', position: [picked.lat, picked.lng], kind: 'pin', label: 'Aquí estoy' });
  if (myPos) markers.push({ key: 'me', position: myPos, kind: 'driver', label: 'Tú estás aquí' });
  deliveries.forEach((d, i) => {
    markers.push({ key: `o-${d.id}`, position: [d.latitude, d.longitude], kind: 'order', label: `${d.customerName} — ${d.address}` });
    if (i === 0 && myPos) lines.push({ key: `l-${d.id}`, positions: [myPos, [d.latitude, d.longitude]] });
  });

  return (
    <div className="role-layout">
      <div className="sidebar">
        <div className="panel">
          <h2>Mi disponibilidad</h2>
          <div className="status-line">
            <span className="badge-wrap"><StatusBadge status={driver.status} /></span>
            <span className="dim">{VEHICLE_LABEL[driver.vehicleType] || driver.vehicleType}</span>
          </div>

          {driver.status === 'offline' && (
            <>
              <p className="dim small-note">
                Toca el mapa para marcar dónde estás y conéctate para empezar a recibir pedidos.
              </p>
              {picked && <div className="result-box"><b>Ubicación marcada</b><span className="dim">Punto seleccionado en el mapa</span></div>}
              <button className="btn-primary wide" onClick={handleConnectHere} disabled={working || !picked}>
                {working ? 'Conectando…' : picked ? 'Conectarme aquí' : 'Marca tu ubicación en el mapa'}
              </button>
              <button className="btn-ghost wide" style={{ marginTop: 8 }} onClick={handleConnect} disabled={working}>
                Usar el GPS de mi dispositivo
              </button>
            </>
          )}

          {driver.status === 'available' && (
            <>
              <p className="dim small-note">
                Estás disponible. Cuando el administrador asigne pedidos, te aparecerán aquí.
                Si te mueves, toca el mapa para actualizar dónde estás.
              </p>
              <button className="btn-ghost wide" onClick={handleDisconnect} disabled={working}>Desconectarme</button>
            </>
          )}

          {driver.status === 'busy' && (
            <p className="dim small-note">Tienes entregas en curso. Podrás desconectarte al completarlas.</p>
          )}

          {connected && (
            <div className="dim small-note">
              {mode === 'gps'
                ? <>GPS: {gpsWarning ? '⚠ sin señal' : accuracy !== null ? `activo (±${accuracy} m)` : 'buscando…'}</>
                : 'Ubicación: marcada por ti en el mapa'}
            </div>
          )}
          {gpsWarning && <div className="error" role="alert">{gpsWarning}</div>}
          {actionError && <div className="error" role="alert">{actionError}</div>}
          {loadError && <div className="error" role="alert">{loadError}</div>}
        </div>

        <div className="panel">
          <h2>Mis entregas <span className="hint">{deliveries.length} {deliveries.length === 1 ? 'pendiente' : 'pendientes'}</span></h2>
          <div className="list">
            {deliveries.map((d) => (
              <div key={d.id} className="list-item">
                <div className="between"><span className="title">{d.customerName}</span><StatusBadge status="assigned" /></div>
                <div>{d.address}</div>
                <div className="dim">Distancia al asignarlo: {d.distanceKm} km</div>
                <div className="actions">
                  <a
                    className="btn-ghost small as-link"
                    href={`https://www.google.com/maps/dir/?api=1&destination=${d.latitude},${d.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Cómo llegar
                  </a>
                  <button className="btn-primary small" onClick={() => handleComplete(d)} disabled={working}><Icon name="check" size={14} /> Entregado</button>
                </div>
              </div>
            ))}
            {deliveries.length === 0 && <div className="empty">No tienes entregas asignadas por ahora.</div>}
          </div>
        </div>
      </div>

      <div className="map-container tall">
        <LiveMap center={myPos || DEFAULT_CENTER} markers={markers} lines={lines} onClick={handleMapClick} />
      </div>
    </div>
  );
}
