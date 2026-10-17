import LiveMap from './LiveMap.jsx';
import { STATUS_LABEL, orderCode } from '../util';

/** Mapa del administrador: repartidores, pedidos abiertos y la línea de cada asignación activa. */
export default function MapView({ drivers, orders, assignments, center }) {
  const markers = [];
  drivers
    .filter((d) => !(d.latitude === 0 && d.longitude === 0))
    .forEach((d) => markers.push({
      key: `d-${d.id}`, position: [d.latitude, d.longitude], kind: 'driver',
      label: `${d.name} — ${STATUS_LABEL[d.status] || d.status}`,
    }));
  orders
    .filter((o) => o.status === 'pending' || o.status === 'assigned')
    .forEach((o) => markers.push({
      key: `o-${o.id}`, position: [o.latitude, o.longitude], kind: 'order',
      label: `${orderCode(o.id)} · ${o.customerName} — ${o.address}`,
    }));

  const lines = assignments
    .filter((a) => a.status === 'active')
    .map((a) => {
      const driver = drivers.find((d) => d.id === a.driverId);
      const order = orders.find((o) => o.id === a.orderId) || orders.find((o) => o.address === a.address);
      if (!driver || !order || (driver.latitude === 0 && driver.longitude === 0)) return null;
      return { key: `l-${a.id}`, positions: [[driver.latitude, driver.longitude], [order.latitude, order.longitude]] };
    })
    .filter(Boolean);

  return <LiveMap center={center} markers={markers} lines={lines} />;
}
