import { useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import DriverPage from './pages/DriverPage.jsx';
import ClientPage from './pages/ClientPage.jsx';
import ChangePasswordModal from './components/ChangePasswordModal.jsx';

const ROLE_LABEL = { admin: 'Administrador', driver: 'Repartidor', client: 'Cliente' };

function Shell() {
  const { user, checking, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  if (checking) return <div className="boot dim">Cargando…</div>;
  if (!user) return <LoginPage />;

  let page;
  if (user.role === 'admin') page = <AdminPage />;
  else if (user.role === 'driver') page = <DriverPage />;
  else if (user.role === 'client') page = <ClientPage />;
  else page = <div className="page-narrow error">Rol desconocido: {user.role}</div>;

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Centro de <span>Despacho</span></h1>
          <div className="subtitle">Repartidores, pedidos y asignación óptima en tiempo real — API en C#, MySQL</div>
        </div>
        <div className="userbox">
          <div><b>{user.fullName}</b></div>
          <div className="dim">{ROLE_LABEL[user.role] || user.role}</div>
          <div className="row end">
            <button className="btn-ghost small" onClick={() => setShowPassword(true)}>Contraseña</button>
            <button className="btn-ghost small" onClick={() => logout()}>Salir</button>
          </div>
        </div>
      </header>

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
