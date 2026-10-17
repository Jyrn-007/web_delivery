import { STATUS_LABEL } from '../util';

/** Marca: isotipo + nombre. `light` = para fondos oscuros. */
export function Logo({ light = false, size = 30 }) {
  return (
    <span className={`logo ${light ? 'logo-light' : ''}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={light ? '#ffffff' : '#0b1f3a'} />
        <path d="M20 10H10v12h10M10 16h8" stroke={light ? '#0b1f3a' : '#ffffff'} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="22.5" cy="21.5" r="3.2" fill="#2f7de1" />
      </svg>
      <span className="logo-word">Esocity</span>
    </span>
  );
}

const ICON_PATHS = {
  overview: 'M4 13h6V4H4v9zm0 7h6v-5H4v5zm9 0h7V11h-7v9zm0-16v5h7V4h-7z',
  dispatch: 'M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z',
  orders: 'M3 7l9-4 9 4v10l-9 4-9-4V7zm9 2.2L5.5 6.3M12 9.2l6.5-2.9M12 9.2V20',
  drivers: 'M3 16V8h11v8M14 11h4l3 3v2h-3M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  history: 'M12 8v5l3 2M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3 4v4h4',
  users: 'M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM20 19v-1.5a3.5 3.5 0 0 0-2.5-3.3M15.5 4.8a3.2 3.2 0 0 1 0 6',
  key: 'M14 10a4 4 0 1 0-3.9 4L21 14v3h-3v3h-3v-3l-4.9-.1',
  logout: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l4-4-4-4M14 12H4',
  download: 'M12 4v11m0 0l-4-4m4 4l4-4M5 20h14',
  plus: 'M12 5v14M5 12h14',
  refresh: 'M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5',
  play: 'M7 5l12 7-12 7V5z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6L6 18',
  pin: 'M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 3l-4.5-4.5',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
};

export function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON_PATHS[name] || ''} />
    </svg>
  );
}

export function StatusBadge({ status, children }) {
  return <span className={`badge ${status}`}>{children || STATUS_LABEL[status] || status}</span>;
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}

export function KpiCard({ label, value, hint, tone = 'neutral' }) {
  return (
    <div className={`kpi kpi-${tone}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  );
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}
