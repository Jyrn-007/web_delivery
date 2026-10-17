import { useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import DriverPage from './pages/DriverPage.jsx';
import ClientPage from './pages/ClientPage.jsx';
import ChangePasswordModal from './components/ChangePasswordModal.jsx';
import { Icon, Logo } from './components/ui.jsx';
import { BRAND, ROLE_LABEL } from './util';

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

function Shell() {
  const { user, checking, logout, sessionNotice } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [screen, setScreen] = useState('landing'); // landing | login (solo sin sesión)

  if (checking) return <div className="boot dim">Cargando…</div>;

  if (!user) {
    // Si la sesión terminó, se muestra el login directamente con su aviso.
    if (screen === 'landing' && !sessionNotice) {
      return <LandingPage onStart={() => setScreen('login')} />;
    }
    return <LoginPage onBack={() => setScreen('landing')} />;
  }

  const topbar = (
    <header className="topbar">
      <div className="topbar-left">
        <Logo light />
        <span className="topbar-sub">{BRAND.tagline}</span>
      </div>
      <div className="userbox">
        <div className="who">
          <b>{user.fullName}</b>
          <span>{ROLE_LABEL[user.role] || user.role}</span>
        </div>
        <div className="avatar" aria-hidden="true">{initials(user.fullName)}</div>
        <button className="btn-dark small" onClick={() => setShowPassword(true)} title="Cambiar contraseña">
          <Icon name="key" size={15} /><span className="lbl">Contraseña</span>
        </button>
        <button className="btn-dark small" onClick={() => logout()} title="Cerrar sesión">
          <Icon name="logout" size={15} /><span className="lbl">Salir</span>
        </button>
      </div>
    </header>
  );

  let page;
  if (user.role === 'admin') page = <AdminPage />;
  else if (user.role === 'driver') page = <DriverPage />;
  else if (user.role === 'client') page = <ClientPage />;
  else page = <div className="page-narrow error">Rol desconocido: {user.role}</div>;

  return (
    <div className="app">
      {topbar}
      {page}
      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
