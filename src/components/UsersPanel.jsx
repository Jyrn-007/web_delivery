import { useCallback, useState } from 'react';
import { createUser, errorMessage, getUsers, resetUserPassword, setUserActive } from '../api';
import usePolling from '../hooks/usePolling';
import { formatDateTime, STATUS_LABEL, VEHICLE_LABEL } from '../util';

const ROLE_LABEL = { admin: 'Administrador', driver: 'Repartidor', client: 'Cliente' };

// Contraseña aleatoria legible (sin caracteres que se confunden: 0/O, 1/l/I).
function generatePassword(length = 10) {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

const EMPTY_FORM = { fullName: '', email: '', password: '', role: 'driver', phone: '', vehicleType: 'moto' };

export default function UsersPanel({ onChanged }) {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('');
  const [listError, setListError] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM, password: generatePassword() });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [created, setCreated] = useState(null); // credenciales recién creadas, para entregarlas
  const [busyId, setBusyId] = useState(null);
  const [rowMessage, setRowMessage] = useState('');

  const load = useCallback(async () => {
    try {
      setUsers(await getUsers());
      setListError('');
    } catch (err) {
      setListError(errorMessage(err));
    }
  }, []);
  usePolling(load, 20000);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    setCreated(null);
    if (form.fullName.trim().length < 2) { setFormError('Escribe el nombre completo.'); return; }
    if (!form.email.trim()) { setFormError('Escribe el correo.'); return; }
    if (form.password.length < 8) { setFormError('La contraseña debe tener al menos 8 caracteres.'); return; }

    setSaving(true);
    try {
      const user = await createUser({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone || null,
        vehicleType: form.role === 'driver' ? form.vehicleType : null,
      });
      setCreated({ name: user.fullName, email: user.email, password: form.password, role: user.role });
      setForm({ ...EMPTY_FORM, role: form.role, password: generatePassword() });
      await load();
      onChanged?.();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user) {
    const action = user.isActive ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Seguro que quieres ${action} la cuenta de ${user.fullName}?`)) return;
    setBusyId(user.id);
    setRowMessage('');
    try {
      await setUserActive(user.id, !user.isActive);
      await load();
    } catch (err) {
      setRowMessage(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReset(user) {
    const suggested = generatePassword();
    const next = window.prompt(`Nueva contraseña para ${user.fullName} (mínimo 8 caracteres):`, suggested);
    if (next === null) return;
    setBusyId(user.id);
    setRowMessage('');
    try {
      await resetUserPassword(user.id, next);
      setCreated({ name: user.fullName, email: user.email, password: next, role: user.role, reset: true });
    } catch (err) {
      setRowMessage(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const visible = filter ? users.filter((u) => u.role === filter) : users;

  return (
    <div className="layout-form">
      <div className="panel">
        <h2>Nueva cuenta</h2>
        <form className="mini-form" onSubmit={handleCreate} noValidate>
          <label className="field">Rol
            <select value={form.role} onChange={set('role')}>
              <option value="driver">Repartidor</option>
              <option value="client">Cliente</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <label className="field">Nombre completo
            <input value={form.fullName} onChange={set('fullName')} />
          </label>
          <label className="field">Correo electrónico (será su usuario)
            <input type="email" value={form.email} onChange={set('email')} />
          </label>
          <label className="field">Teléfono
            <input value={form.phone} onChange={set('phone')} />
          </label>
          {form.role === 'driver' && (
            <label className="field">Vehículo
              <select value={form.vehicleType} onChange={set('vehicleType')}>
                <option value="moto">Moto</option>
                <option value="bicicleta">Bicicleta</option>
                <option value="auto">Automóvil</option>
              </select>
            </label>
          )}
          <label className="field">Contraseña inicial
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <input className="grow" value={form.password} onChange={set('password')} autoComplete="off" />
              <button type="button" className="btn-ghost" onClick={() => setForm((f) => ({ ...f, password: generatePassword() }))}>Generar</button>
            </div>
          </label>
          <button className="btn-primary" disabled={saving}>{saving ? 'Creando…' : 'Crear cuenta'}</button>
        </form>
        {formError && <div className="error" role="alert">{formError}</div>}

        {created && (
          <div className="result-box">
            <div><b>{created.reset ? 'Contraseña restablecida' : 'Cuenta creada'}</b> — {ROLE_LABEL[created.role]}</div>
            <div>Nombre: <b>{created.name}</b></div>
            <div>Usuario: <b>{created.email}</b></div>
            <div>Contraseña: <b className="mono">{created.password}</b></div>
            <div className="note">Anótala ahora y entrégasela por un medio seguro: no se vuelve a mostrar. La persona puede cambiarla al entrar.</div>
          </div>
        )}
      </div>

      <div className="panel flush">
        <h2>Cuentas <span className="hint">{visible.length} {visible.length === 1 ? "cuenta" : "cuentas"}</span></h2>
        <div className="toolbar">
          {[['', 'Todas'], ['driver', 'Repartidores'], ['client', 'Clientes'], ['admin', 'Admins']].map(([value, label]) => (
            <button
              key={value || 'all'}
              type="button"
              className={`btn-ghost small ${filter === value ? 'active' : ''}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {listError && <div className="error" role="alert" style={{ margin: 12 }}>{listError}</div>}
        {rowMessage && <div className="error" role="alert" style={{ margin: 12 }}>{rowMessage}</div>}

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th /></tr>
            </thead>
            <tbody>
              {visible.map((u) => (
                <tr key={u.id} className={u.isActive ? '' : 'inactive'}>
                  <td>{u.fullName}{u.role === 'driver' && u.vehicleType ? <span className="dim"> · {VEHICLE_LABEL[u.vehicleType] || u.vehicleType}</span> : null}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge role-${u.role}`}>{ROLE_LABEL[u.role]}</span></td>
                  <td>
                    {u.isActive ? <span className="badge available">Activa</span> : <span className="badge offline">Desactivada</span>}
                    {u.role === 'driver' && u.driverStatus && <span className={`badge ${u.driverStatus}`}>{STATUS_LABEL[u.driverStatus] || u.driverStatus}</span>}
                  </td>
                  <td className="dim">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Nunca'}</td>
                  <td className="actions-cell">
                    <button className="btn-ghost small" disabled={busyId === u.id} onClick={() => handleReset(u)}>Contraseña</button>
                    <button className="btn-ghost small danger" disabled={busyId === u.id} onClick={() => toggleActive(u)}>
                      {u.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={6} className="empty">No hay cuentas para mostrar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
