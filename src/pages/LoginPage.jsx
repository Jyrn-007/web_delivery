import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { errorMessage } from '../api';

export default function LoginPage() {
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
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <h1>Centro de <span>Despacho</span></h1>
        <div className="subtitle">
          {isRegister ? 'Crea tu cuenta de cliente para pedir un envío' : 'Inicia sesión para continuar'}
        </div>

        {sessionNotice && !isRegister && <div className="notice">{sessionNotice}</div>}

        {isRegister && (
          <label>Nombre completo
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
          </label>
        )}

        <label>Correo
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
        </label>

        {isRegister && (
          <label>Teléfono (opcional)
            <input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </label>
        )}

        <label>Contraseña {isRegister && <span className="dim">(mínimo 8 caracteres)</span>}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
        </label>

        {error && <div className="error" role="alert">{error}</div>}

        <button className="btn-primary wide" disabled={loading}>
          {loading ? 'Un momento…' : isRegister ? 'Crear cuenta' : 'Entrar'}
        </button>

        <div className="login-switch">
          {isRegister ? (
            <>¿Ya tienes cuenta? <button type="button" className="link" onClick={() => switchMode('login')}>Inicia sesión</button></>
          ) : (
            <>¿Eres cliente nuevo? <button type="button" className="link" onClick={() => switchMode('register')}>Crea tu cuenta</button></>
          )}
        </div>
        {!isRegister && (
          <div className="dim small-note">
            Los repartidores y administradores reciben su cuenta de parte de un administrador.
          </div>
        )}
      </form>
    </div>
  );
}
