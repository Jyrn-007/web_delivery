import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { errorMessage } from '../api';

// Roles que se pueden elegir al registrarse. "admin" NO está aquí a propósito.
// Los valores coinciden con las constantes de Roles en el backend ("client" y "driver").
const SELF_SIGNUP_ROLES = [
  { value: 'client', label: 'Cliente', hint: 'Pide envíos' },
  { value: 'driver', label: 'Repartidor', hint: 'Entrega pedidos' },
];

// Vehículos disponibles para repartidores (el valor por defecto del backend es "moto").
const VEHICLE_TYPES = [
  { value: 'moto', label: 'Moto' },
  { value: 'bicicleta', label: 'Bicicleta' },
  { value: 'carro', label: 'Carro' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'camion', label: 'Camión' },
];

export default function LoginPage() {
  const { signIn, signUp, sessionNotice } = useAuth();
  const [mode, setMode] = useState('login'); // login | register
  const [role, setRole] = useState(SELF_SIGNUP_ROLES[0].value);
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0].value);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegister = mode === 'register';
  const isDriver = role === 'driver';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Escribe tu correo y tu contraseña.'); return; }
    if (isRegister && fullName.trim().length < 2) { setError('Escribe tu nombre completo.'); return; }
    if (isRegister && isDriver && !phone.trim()) { setError('Los repartidores deben indicar un teléfono.'); return; }
    if (isRegister && isDriver && !VEHICLE_TYPES.some((v) => v.value === vehicleType)) {
      setError('Elige el vehículo con el que vas a repartir.'); return;
    }
    // Defensa extra en el cliente: nunca se envía un rol que no esté en la lista.
    if (isRegister && !SELF_SIGNUP_ROLES.some((r) => r.value === role)) { setError('Rol no permitido.'); return; }

    setLoading(true);
    try {
      if (isRegister) {
        const payload = { fullName, email, password, phone, role };
        // Solo los repartidores envían vehículo.
        if (isDriver) payload.vehicleType = vehicleType;
        await signUp(payload);
      } else {
        await signIn(email, password);
      }
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
    // "login-bg" aplica la imagen de fondo (ver App.css). Solo existe en esta pantalla.
    <div className="login-wrap login-bg">
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <h1>Centro de <span>Despacho</span></h1>
        <div className="subtitle">
          {isRegister
            ? (isDriver ? 'Crea tu cuenta de repartidor para recibir entregas' : 'Crea tu cuenta de cliente para pedir un envío')
            : 'Inicia sesión para continuar'}
        </div>

        {sessionNotice && !isRegister && <div className="notice">{sessionNotice}</div>}

        {isRegister && (
          <div className="role-picker" role="radiogroup" aria-label="Tipo de cuenta">
            {SELF_SIGNUP_ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={role === r.value}
                className={`role-option${role === r.value ? ' active' : ''}`}
                onClick={() => setRole(r.value)}
              >
                <strong>{r.label}</strong>
                <span className="dim">{r.hint}</span>
              </button>
            ))}
          </div>
        )}

        {isRegister && (
          <label>Nombre completo
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
          </label>
        )}

        <label>Correo
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
        </label>

        {isRegister && (
          <label>Teléfono {isDriver ? '' : <span className="dim">(opcional)</span>}
            <input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </label>
        )}

        {isRegister && isDriver && (
          <label>Vehículo
            <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
              {VEHICLE_TYPES.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
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
            <>¿Eres nuevo? <button type="button" className="link" onClick={() => switchMode('register')}>Crea tu cuenta</button></>
          )}
        </div>
        {!isRegister && (
          <div className="dim small-note">
            Las cuentas de administrador las crea otro administrador.
          </div>
        )}
      </form>
    </div>
  );
}