import { useState } from 'react';
import { changePassword, errorMessage } from '../api';

export default function ChangePasswordModal({ onClose }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (next.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    if (next !== repeat) { setError('Las contraseñas nuevas no coinciden.'); return; }

    setLoading(true);
    try {
      await changePassword(current, next);
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Cambiar contraseña</h2>
        {done ? (
          <>
            <div className="result-box">Listo, tu contraseña se actualizó.</div>
            <button type="button" className="btn-primary wide" onClick={onClose}>Cerrar</button>
          </>
        ) : (
          <>
            <label className="field">Contraseña actual
              <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" autoFocus />
            </label>
            <label className="field">Nueva contraseña
              <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
            </label>
            <label className="field">Repite la nueva contraseña
              <input type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" />
            </label>
            {error && <div className="error" role="alert">{error}</div>}
            <div className="row">
              <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
              <button className="btn-primary" disabled={loading}>{loading ? 'Guardando…' : 'Guardar'}</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
