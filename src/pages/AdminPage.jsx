import { useCallback, useState } from 'react';
import MapView from '../components/MapView.jsx';
import AssignmentsPanel from '../components/AssignmentsPanel.jsx';
import HungarianProcess from '../components/HungarianProcess.jsx';
import UsersPanel from '../components/UsersPanel.jsx';
import OverviewView from '../components/admin/OverviewView.jsx';
import OrdersView from '../components/admin/OrdersView.jsx';
import DriversView from '../components/admin/DriversView.jsx';
import HistoryView from '../components/admin/HistoryView.jsx';
import { Icon, PageHeader } from '../components/ui.jsx';
import { errorMessage, getAssignments, getDrivers, getOrders, previewAssignments } from '../api';
import usePolling from '../hooks/usePolling';

const DEFAULT_CENTER = [14.6349, -90.5069]; // Ciudad de Guatemala — ajustar a tu ciudad

const NAV = [
  ['overview', 'Resumen', 'overview'],
  ['dispatch', 'Despacho', 'dispatch'],
  ['orders', 'Pedidos', 'orders'],
  ['drivers', 'Repartidores', 'drivers'],
  ['history', 'Historial', 'history'],
  ['users', 'Usuarios', 'users'],
];

export default function AdminPage() {
  const [view, setView] = useState('overview');
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

  const pending = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="workspace">
      <nav className="sidenav" aria-label="Secciones">
        <div className="group">Operación</div>
        {NAV.slice(0, 5).map(([key, label, icon]) => (
          <button key={key} className={`navitem ${view === key ? 'active' : ''}`} onClick={() => setView(key)}>
            <Icon name={icon} />
            {label}
            {key === 'dispatch' && pending > 0 && <span className="count">{pending}</span>}
          </button>
        ))}
        <div className="group">Administración</div>
        {NAV.slice(5).map(([key, label, icon]) => (
          <button key={key} className={`navitem ${view === key ? 'active' : ''}`} onClick={() => setView(key)}>
            <Icon name={icon} />
            {label}
          </button>
        ))}
      </nav>

      <main className="content">
        {loadError && <div className="error banner" role="alert">{loadError}</div>}

        {view === 'overview' && <OverviewView drivers={drivers} orders={orders} assignments={assignments} onGo={setView} />}

        {view === 'dispatch' && (
          <>
            <PageHeader title="Despacho" subtitle="Asigna los pedidos pendientes al repartidor más cercano." />
            <div className="layout">
              <div className="map-container">
                <MapView drivers={drivers} orders={orders} assignments={assignments} center={DEFAULT_CENTER} />
              </div>
              <AssignmentsPanel assignments={assignments} onRefresh={refresh} />
            </div>
            <HungarianProcess preview={preview} loading={previewLoading} error={previewError} />
          </>
        )}

        {view === 'orders' && <OrdersView orders={orders} onRefresh={refresh} />}
        {view === 'drivers' && <DriversView drivers={drivers} onRefresh={refresh} onGo={setView} />}
        {view === 'history' && <HistoryView assignments={assignments} />}
        {view === 'users' && (
          <>
            <PageHeader title="Usuarios" subtitle="Cuentas de administradores, repartidores y clientes." />
            <UsersPanel onChanged={refresh} />
          </>
        )}
      </main>
    </div>
  );
}
