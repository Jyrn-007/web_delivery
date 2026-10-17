import { useState } from 'react';

/**
 * Muestra el proceso del método húngaro tal como lo calculó la API en C#
 * (distancias reales en km, pasos de reducción, cobertura de ceros y
 * asignación final). No calcula nada en el navegador — todo viene de
 * GET /api/assignments/preview.
 */
export default function HungarianProcess({ preview, loading, error }) {
  const [open, setOpen] = useState(true);

  const hasData = preview && preview.steps && preview.steps.length > 0;

  return (
    <div className="panel wide-panel">
      <h2 className="clickable" onClick={() => setOpen((o) => !o)}>
        <span>{open ? '▾' : '▸'} Proceso del método húngaro</span>
      </h2>

      {open && (
        <>
          {loading && <div className="dim small-note">Consultando la API…</div>}

          {!loading && error && (
            <div className="error">No se pudo consultar /api/assignments/preview: {error}</div>
          )}

          {!loading && !error && !hasData && (
            <div className="dim small-note" style={{ padding: '10px 0' }}>
              Aquí aparecerá la matriz de distancias y los pasos del método húngaro en cuanto haya al menos
              <b> 1 repartidor disponible</b> y <b>1 pedido pendiente</b>. Se actualiza solo al registrar un
              repartidor o un pedido nuevo.
            </div>
          )}

          {!loading && !error && hasData && (
            <>
              <div className="small-note">
                Filas = repartidores ({preview.driverLabels.join(', ')}) · columnas = pedidos (
                {preview.orderLabels.join(', ')}) · distancias reales en km.
              </div>
              <div className="steps-row">
                {preview.steps.map((s, idx) => (
                  <div key={idx} className="step-block">
                    <div className={`step-title ${s.final ? 'final' : ''}`}>{s.title}</div>
                    <table className="mini-matrix">
                      <thead>
                        <tr>
                          <th></th>
                          {preview.orderLabels.map((_, j) => (
                            <th key={j}>{j + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {s.matrix.map((row, i) => (
                          <tr key={i}>
                            <th>{i + 1}</th>
                            {row.map((v, j) => {
                              const isMatch = s.match && s.match[i] === j;
                              return (
                                <td key={j}>
                                  {isMatch ? <span className="circled">{v.toFixed(1)}</span> : v.toFixed(1)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
              <div className="result-box">
                <div>
                  Distancia total óptima: <b>{preview.totalDistanceKm} km</b>
                </div>
                <div className="assign-list" style={{ marginTop: 8 }}>
                  {preview.assignments.map((a, i) => (
                    <div key={i}>
                      <b>{a.driverName}</b> → {a.customerName} ({a.address}) — {a.distanceKm} km
                    </div>
                  ))}
                </div>
                <div className="dim small-note" style={{ marginTop: 8 }}>
                  Esta es una vista previa de solo lectura (no guarda nada). Para guardarla usa el
                  botón <b>"Asignar pedidos pendientes"</b>.
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
