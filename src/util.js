/** La API guarda horas en UTC pero MySQL las devuelve sin "Z": se agrega solo si falta. */
export function parseUtc(value) {
  if (!value) return null;
  const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

export function formatDateTime(value) {
  const d = parseUtc(value);
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleString() : '—';
}

export const STATUS_LABEL = {
  pending: 'pendiente',
  assigned: 'en camino',
  delivered: 'entregado',
  cancelled: 'cancelado',
  available: 'disponible',
  busy: 'ocupado',
  offline: 'desconectado',
};

/** Distancia en metros entre dos coordenadas (Haversine). */
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
