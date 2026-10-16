import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';

const driverIcon = new L.DivIcon({
  className: '',
  html: '<div class="marker driver-marker">🏍️</div>',
  iconSize: [30, 30],
});

const orderIcon = new L.DivIcon({
  className: '',
  html: '<div class="marker order-marker">📦</div>',
  iconSize: [30, 30],
});

export default function MapView({ drivers, orders, assignments, center }) {
  const findDriver = (id) => drivers.find(d => d.id === id);
  const findOrderByAddress = (address) => orders.find(o => o.address === address);

  return (
    <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {drivers.map(d => (
        <Marker key={`d-${d.id}`} position={[d.latitude, d.longitude]} icon={driverIcon}>
          <Popup>🏍️ {d.name} — {d.status}</Popup>
        </Marker>
      ))}
      {orders.map(o => (
        <Marker key={`o-${o.id}`} position={[o.latitude, o.longitude]} icon={orderIcon}>
          <Popup>📦 {o.customerName} — {o.address} ({o.status})</Popup>
        </Marker>
      ))}
      {assignments.filter(a => a.status === 'active').map(a => {
        const driver = findDriver(a.driverId);
        const order = findOrderByAddress(a.address);
        if (!driver || !order) return null;
        return (
          <Polyline
            key={`line-${a.id}`}
            positions={[[driver.latitude, driver.longitude], [order.latitude, order.longitude]]}
            pathOptions={{ color: '#3ddc84', dashArray: '6,6', weight: 3 }}
          />
        );
      })}
    </MapContainer>
  );
}
