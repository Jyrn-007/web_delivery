/** La API guarda horas en UTC pero MySQL las devuelve sin "Z": se agrega solo si falta. */
export function parseUtc(value) {
  if (!value) return null;
  const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

export function formatDateTime(value) {
  const d = parseUtc(value);
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' })
    : '—';
}

export const BRAND = {
  name: 'Esocity',
  tagline: 'Logística de última milla',
};

export const STATUS_LABEL = {
  pending: 'Pendiente',
  assigned: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  available: 'Disponible',
  busy: 'Ocupado',
  offline: 'Desconectado',
  // asignaciones
  active: 'En curso',
  completed: 'Completada',
};

export const ROLE_LABEL = { admin: 'Administrador', driver: 'Repartidor', client: 'Cliente' };

export const VEHICLE_LABEL = { moto: 'Moto', bicicleta: 'Bicicleta', auto: 'Automóvil' };

/** Código de seguimiento legible: ES-000123 */
export const orderCode = (id) => `ES-${String(id).padStart(6, '0')}`;

/** Distancia en metros entre dos coordenadas (Haversine). */
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Descarga un CSV (con BOM para que Excel respete los acentos). */
export function downloadCsv(filename, headers, rows) {
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const text = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
