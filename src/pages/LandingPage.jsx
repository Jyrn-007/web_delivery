import './LandingPage.css';
import { Logo } from '../components/ui.jsx';

// Pantalla de bienvenida: explica el sistema y lleva al login con el botón "Iniciar".
// Recibe `onStart` (lo define App.jsx) para cambiar a la pantalla de login.

// Rutas del mapa de ejemplo (todas siguen las calles de la cuadrícula de 60 px).
// Cada repartidor va hacia el pedido que le tocó en la asignación del ejemplo.
const ROUTES = [
  { id: 'carlos', d: 'M40,280 H100 V220 H220 V100', start: [40, 280], rest: [160, 220], order: [220, 100], n: '1', dur: '8s', begin: '0s' },
  { id: 'maria', d: 'M460,280 V220 H400 V160', start: [460, 280], rest: [430, 220], order: [400, 160], n: '2', dur: '6s', begin: '0s' },
  { id: 'juan', d: 'M160,400 V340 H340', start: [160, 400], rest: [160, 340], order: [340, 340], n: '3', dur: '7s', begin: '0s' },
];

const GRID_X = [40, 100, 160, 220, 280, 340, 400, 460];
const GRID_Y = [40, 100, 160, 220, 280, 340, 400];

// Ejemplo de la matriz de distancias (km). La combinación de menor total se resalta.
const DRIVERS = ['Carlos', 'María', 'Juan'];
const KM = [
  [1.2, 4.8, 3.1],
  [3.9, 0.8, 5.2],
  [2.7, 3.3, 1.5],
];
const PICKS = [0, 1, 2]; // columna elegida para cada fila

const FEATURES = [
  { title: 'Mapa en tiempo real', text: 'Repartidores y pedidos en un solo mapa, con la ubicación que cada repartidor comparte.' },
  { title: 'Direcciones sin complicarse', text: 'Escribe la dirección o márcala en el mapa: el sistema encuentra las coordenadas.' },
  { title: 'Pedidos con estado claro', text: 'Pendiente, asignado, entregado o cancelado. Cada persona ve solo lo suyo.' },
  { title: 'Repartidores con su vehículo', text: 'Moto, bicicleta, carro y más. Cada repartidor se conecta cuando puede recibir entregas.' },
  { title: 'Cada rol, su pantalla', text: 'Cliente, repartidor y administrador ven solo lo que necesitan. Una cuenta desactivada pierde el acceso al instante.' },
  { title: 'Reportes descargables', text: 'Exporta pedidos y entregas a CSV para abrirlos en Excel.' },
];

const STEPS = [
  { n: '1', title: 'El cliente pide', text: 'Escribe la dirección de entrega y el sistema la ubica en el mapa.' },
  { n: '2', title: 'Se asigna', text: 'El administrador ejecuta la asignación y cada pedido recibe su repartidor.' },
  { n: '3', title: 'Se entrega', text: 'El repartidor ve su entrega, comparte su ubicación y la marca como completada.' },
];

const ROLES = [
  { name: 'Cliente', items: ['Crea pedidos con su dirección', 'Consulta el estado de cada pedido', 'Cancela un pedido que aún está pendiente'] },
  { name: 'Repartidor', items: ['Se conecta y comparte su ubicación', 'Ve las entregas que le asignaron', 'Marca cada entrega como completada'] },
  { name: 'Administrador', items: ['Ve el mapa y todos los pedidos', 'Ejecuta la asignación óptima', 'Gestiona usuarios y repartidores'] },
];

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function DispatchMap({ reduce }) {
  return (
    <div className="lp-map">
      <svg viewBox="0 0 500 440" role="img" aria-label="Ejemplo: tres repartidores en camino a tres pedidos por las calles de una ciudad">
        {/* calles */}
        <g className="lp-streets">
          {GRID_X.map((x) => <line key={`x${x}`} x1={x} y1="20" x2={x} y2="420" />)}
          {GRID_Y.map((y) => <line key={`y${y}`} x1="20" y1={y} x2="480" y2={y} />)}
          <line className="lp-avenue" x1="40" y1="400" x2="460" y2="40" />
        </g>

        {/* rutas, pedidos y repartidores */}
        {ROUTES.map((r) => (
          <g key={r.id}>
            <path className="lp-route" d={r.d} fill="none" />
            <circle className="lp-home" cx={r.start[0]} cy={r.start[1]} r="4" />

            <g transform={`translate(${r.order[0]} ${r.order[1]})`}>
              {!reduce && <circle className="lp-ping" r="8" />}
              <circle className="lp-pin" r="7" />
              <text className="lp-pin-n" x="14" y="-10">{r.n}</text>
            </g>

            {reduce ? (
              <g transform={`translate(${r.rest[0]} ${r.rest[1]})`}>
                <circle className="lp-halo" r="13" />
                <circle className="lp-driver" r="6" />
              </g>
            ) : (
              <g>
                <circle className="lp-halo" r="13" />
                <circle className="lp-driver" r="6" />
                <animateMotion path={r.d} dur={r.dur} begin={r.begin} repeatCount="indefinite" />
              </g>
            )}
          </g>
        ))}
      </svg>

      <ul className="lp-legend" aria-label="Asignación de ejemplo">
        <li><span className="lp-dot lp-dot-driver" />Carlos, moto<b>pedido 1 · 1.2 km</b></li>
        <li><span className="lp-dot lp-dot-driver" />María, bicicleta<b>pedido 2 · 0.8 km</b></li>
        <li><span className="lp-dot lp-dot-driver" />Juan, moto<b>pedido 3 · 1.5 km</b></li>
      </ul>
    </div>
  );
}

export default function LandingPage({ onStart }) {
  const reduce = prefersReducedMotion();
  const total = PICKS.reduce((sum, col, row) => sum + KM[row][col], 0);

  return (
    <div className="lp">
      {/* ------------------------------------------------ barra superior */}
      <header className="lp-nav">
        <a className="lp-brand" href="#inicio" aria-label="Esocity, inicio">
          <Logo size={32} />
        </a>
        <nav className="lp-links" aria-label="Secciones">
          <a href="#incluye">Qué incluye</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#roles">Quién lo usa</a>
        </nav>
        <button type="button" className="lp-btn lp-btn-small" onClick={onStart}>Ingresar</button>
      </header>

      {/* ------------------------------------------------ portada */}
      <section className="lp-hero" id="inicio">
        <div className="lp-hero-text">
          <p className="lp-eyebrow">Esocity · Logística de última milla</p>
          <h1>Cada pedido, con el repartidor más cercano</h1>
          <p className="lp-lead">
            Esocity asigna cada entrega al repartidor que menos kilómetros recorre. Los clientes
            piden, los repartidores entregan y la operación se controla desde un solo panel.
          </p>
          <div className="lp-cta">
            <button type="button" className="lp-btn" onClick={onStart}>Ingresar a la plataforma</button>
            <a className="lp-link" href="#como-funciona">Ver cómo funciona</a>
          </div>
        </div>
        <DispatchMap reduce={reduce} />
      </section>

      {/* ------------------------------------------------ qué incluye */}
      <section className="lp-section" id="incluye">
        <h2>Qué incluye</h2>
        <p className="lp-sub">Lo necesario para despachar sin hojas de cálculo ni llamadas.</p>

        <div className="lp-feat">
          <div className="lp-feat-main">
            <h3>Asignación óptima</h3>
            <p>
              No se asigna al primero que esté libre. El sistema compara la distancia de cada
              repartidor con cada pedido y elige la combinación con menos kilómetros en total
              (algoritmo húngaro).
            </p>

            <table className="lp-matrix">
              <caption>Distancias en km: se elige la combinación más corta de las 6 posibles</caption>
              <thead>
                <tr>
                  <td />
                  <th scope="col">Pedido 1</th>
                  <th scope="col">Pedido 2</th>
                  <th scope="col">Pedido 3</th>
                </tr>
              </thead>
              <tbody>
                {KM.map((row, i) => (
                  <tr key={DRIVERS[i]}>
                    <th scope="row">{DRIVERS[i]}</th>
                    {row.map((km, j) => (
                      <td key={j} className={PICKS[i] === j ? 'lp-pick' : undefined}>{km.toFixed(1)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="lp-total">Total elegido: {total.toFixed(1)} km</p>
          </div>

          <ul className="lp-feat-list">
            {FEATURES.map((f) => (
              <li key={f.title}>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------ cómo funciona */}
      <section className="lp-section lp-band" id="como-funciona">
        <div className="lp-inner">
          <h2>Cómo funciona</h2>
          <p className="lp-sub">De pedido a entrega en tres pasos.</p>
          <ol className="lp-steps">
            {STEPS.map((s) => (
              <li key={s.n}>
                <span className="lp-step-n" aria-hidden="true">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------ roles */}
      <section className="lp-section" id="roles">
        <h2>Quién lo usa</h2>
        <p className="lp-sub">Cada cuenta ve solo las herramientas que necesita.</p>
        <div className="lp-roles">
          {ROLES.map((r) => (
            <div className="lp-role" key={r.name}>
              <h3>{r.name}</h3>
              <ul>
                {r.items.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ cierre */}
      <section className="lp-final">
        <div className="lp-inner">
          <h2>Gestiona tus entregas con Esocity</h2>
          <p>Ingresa con tu cuenta, o crea tu cuenta de cliente para solicitar un envío.</p>
          <button type="button" className="lp-btn" onClick={onStart}>Ingresar a la plataforma</button>
        </div>
      </section>

      <footer className="lp-footer">
        <span>© {new Date().getFullYear()} Esocity. Todos los derechos reservados.</span>
        <span>Pedidos, repartidores y asignación en un solo lugar</span>
      </footer>
    </div>
  );
}