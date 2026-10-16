import { useEffect } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const icon = (emoji) => new L.DivIcon({
  className: '',
  html: `<div class="marker">${emoji}</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

export const ICONS = {
  driver: icon('🏍️'),
  order: icon('📦'),
  pin: icon('📍'),
};

// Ajusta el encuadre para que se vean todos los puntos (y solo cuando cambian).
function FitBounds({ points }) {
  const map = useMap();
  const key = points.map((p) => p.join(',')).join('|');

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0], Math.max(map.getZoom(), 15));
    else map.fitBounds(points, { padding: [40, 40], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);

  return null;
}

function ClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick?.([e.latlng.lat, e.latlng.lng]) });
  return null;
}

/**
 * Mapa genérico. markers: [{ key, position:[lat,lng], kind:'driver'|'order'|'pin', label }]
 * lines: [{ key, positions:[[lat,lng],[lat,lng]] }]
 */
export default function LiveMap({ center, markers = [], lines = [], onClick, fit = true }) {
  const points = markers.map((m) => m.position);

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {fit && <FitBounds points={points} />}
      {onClick && <ClickHandler onClick={onClick} />}
      {lines.map((l) => (
        <Polyline key={l.key} positions={l.positions} pathOptions={{ color: '#3ddc84', dashArray: '6,6', weight: 3 }} />
      ))}
      {markers.map((m) => (
        <Marker key={m.key} position={m.position} icon={ICONS[m.kind] || ICONS.pin}>
          {m.label && <Popup>{m.label}</Popup>}
        </Marker>
      ))}
    </MapContainer>
  );
}
