import { useCallback, useState } from 'react';
import MapView from '../components/MapView.jsx';
import DriversPanel from '../components/DriversPanel.jsx';
import OrdersPanel from '../components/OrdersPanel.jsx';
import AssignmentsPanel from '../components/AssignmentsPanel.jsx';
import HungarianProcess from '../components/HungarianProcess.jsx';
import UsersPanel from '../components/UsersPanel.jsx';
import { errorMessage, getAssignments, getDrivers, getOrders, previewAssignments } from '../api';
import usePolling from '../hooks/usePolling';

const DEFAULT_CENTER = [14.6349, -90.5069]; // Ciudad de Guatemala — ajustar a tu ciudad

export default function AdminPage() {
  const [tab, setTab] = useState('dispatch'); // dispatch | users
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState('');
  const [loadError, setLoadError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [d, o, a] = await Promise.all([getDrivers(), getOrders(), getAssignments()]);
      setDrivers(d);
      setOrders(o);
      setAssignments(a);
      setLoadError('');
    } catch (err) {
      setLoadError(errorMessage(err));
    }

    setPreviewLoading(true);
    setPreviewError('');
    try {
      setPreview(await previewAssignments());
    } catch (err) {
      setPreviewError(errorMessage(err));
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  // Se refresca solo cada 15 s: los repartidores se mueven y los clientes piden en vivo.
  usePolling(refresh, 15000);

  return (
    <>
      <nav className="tabs">
        <button className={tab === 'dispatch' ? 'tab active' : 'tab'} onClick={() => setTab('dispatch')}>Despacho</button>
        <button className={tab === 'users' ? 'tab active' : 'tab'} onClick={() => setTab('users')}>Usuarios</button>
      </nav>

      {tab === 'dispatch' && (
        <>
          {loadError && <div className="error banner" role="alert">{loadError}</div>}
          <div className="layout">
            <div className="sidebar">
              <DriversPanel drivers={drivers} onRefresh={refresh} />
              <OrdersPanel orders={orders} onRefresh={refresh} />
            </div>

            <div className="map-container">
              <MapView drivers={drivers} orders={orders} assignments={assignments} center={DEFAULT_CENTER} />
            </div>

            <div className="sidebar">
              <AssignmentsPanel assignments={assignments} onRefresh={refresh} />
            </div>
          </div>

          <div className="bottom-section">
            <HungarianProcess preview={preview} loading={previewLoading} error={previewError} />
          </div>
        </>
      )}

      {tab === 'users' && <UsersPanel />}
    </>
  );
}
