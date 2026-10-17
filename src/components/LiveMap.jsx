import { useEffect } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Marcadores formales: pin de color + glifo blanco (sin emojis).
const GLYPH = {
  driver: '<path d="M7 17V9h8v8M15 12h3l2 2.5V17h-2" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(-0.5 -1.5)"/><circle cx="9" cy="18" r="1.6" fill="#fff" transform="translate(-0.5 -1.5)"/><circle cx="17" cy="18" r="1.6" fill="#fff" transform="translate(-0.5 -1.5)"/>',
  order: '<path d="M6 9l6-3 6 3v7l-6 3-6-3V9zm6 1.5L6.5 8.8M12 10.5l5.5-1.7M12 10.5V18" stroke="#fff" stroke-width="1.6" fill="none" stroke-linejoin="round" stroke-linecap="round" transform="translate(0 -1)"/>',
  pin: '<circle cx="12" cy="11" r="3.2" fill="#fff"/>',
};
const COLOR = { driver: '#1f63c4', order: '#c77a0a', pin: '#0b1f3a' };

const icon = (kind) => new L.DivIcon({
  className: '',
  html: `<svg class="pin" viewBox="0 0 24 30" aria-hidden="true">
    <path d="M12 29C12 29 2 18.5 2 11a10 10 0 0 1 20 0c0 7.5-10 18-10 18z" fill="${COLOR[kind]}" stroke="#fff" stroke-width="1.4"/>
    ${GLYPH[kind]}
  </svg>`,
  iconSize: [30, 38],
  iconAnchor: [15, 36],
  popupAnchor: [0, -32],
});

export const ICONS = {
  driver: icon('driver'),
  order: icon('order'),
  pin: icon('pin'),
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
        <Polyline key={l.key} positions={l.positions} pathOptions={{ color: '#1f63c4', dashArray: '6,6', weight: 3 }} />
      ))}
      {markers.map((m) => (
        <Marker key={m.key} position={m.position} icon={ICONS[m.kind] || ICONS.pin}>
          {m.label && <Popup>{m.label}</Popup>}
        </Marker>
      ))}
    </MapContainer>
  );
}
