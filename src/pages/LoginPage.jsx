import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { errorMessage } from '../api';
import { Logo } from '../components/ui.jsx';

export default function LoginPage({ onBack }) {
  const { signIn, signUp, sessionNotice } = useAuth();
  const [mode, setMode] = useState('login'); // login | register
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegister = mode === 'register';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Escribe tu correo y tu contraseña.'); return; }
    if (isRegister && fullName.trim().length < 2) { setError('Escribe tu nombre completo.'); return; }

    setLoading(true);
    try {
      if (isRegister) await signUp({ fullName, email, password, phone });
      else await signIn(email, password);
      // Al iniciar sesión, App cambia de pantalla según el rol.
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setError('');
  }

  return (
    <div className="login-shell">
      <aside className="login-aside">
        <Logo light size={34} />
        <div>
          <h2>Cada entrega, con el repartidor más cercano.</h2>
          <p>Plataforma de despacho de Esocity: pedidos, repartidores y asignación óptima en un solo lugar.</p>
          <ul>
            <li>Asignación por kilómetros reales (método húngaro)</li>
            <li>Seguimiento del pedido en tiempo real</li>
            <li>Acceso por rol: cliente, repartidor y administrador</li>
          </ul>
        </div>
        <div className="foot">© {new Date().getFullYear()} Esocity. Todos los derechos reservados.</div>
      </aside>

      <main className="login-main">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          {onBack && <button type="button" className="link back-link" onClick={onBack}>← Volver al inicio</button>}
          <div>
            <h1>{isRegister ? 'Crear cuenta de cliente' : 'Iniciar sesión'}</h1>
            <p className="dim" style={{ marginTop: 4 }}>
              {isRegister ? 'Regístrate para solicitar tus envíos.' : 'Ingresa con tu cuenta de Esocity.'}
            </p>
          </div>

          {sessionNotice && !isRegister && <div className="notice">{sessionNotice}</div>}

          {isRegister && (
            <label className="field">Nombre completo
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            </label>
          )}

          <label className="field">Correo electrónico
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
          </label>

          {isRegister && (
            <label className="field">Teléfono (opcional)
              <input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </label>
          )}

          <label className="field">Contraseña {isRegister && <span className="dim">(mínimo 8 caracteres)</span>}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </label>

          {error && <div className="error" role="alert" style={{ marginTop: 0 }}>{error}</div>}

          <button className="btn-primary wide" disabled={loading}>
            {loading ? 'Un momento…' : isRegister ? 'Crear cuenta' : 'Ingresar'}
          </button>

          <div className="login-switch">
            {isRegister ? (
              <>¿Ya tienes cuenta? <button type="button" className="link" onClick={() => switchMode('login')}>Inicia sesión</button></>
            ) : (
              <>¿Eres cliente nuevo? <button type="button" className="link" onClick={() => switchMode('register')}>Crea tu cuenta</button></>
            )}
          </div>
          {!isRegister && (
            <div className="small-note" style={{ textAlign: 'center' }}>
              Las cuentas de repartidor y administrador las crea un administrador de Esocity.
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
