import { useEffect, useRef } from 'react';

/**
 * Ejecuta `fn` ahora y luego cada `ms` milisegundos, solo mientras la pestaña esté visible.
 * No encima llamadas: si una sigue en curso, se salta la siguiente.
 */
export default function usePolling(fn, ms) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let stopped = false;
    let running = false;

    const tick = async () => {
      if (stopped || running || document.hidden) return;
      running = true;
      try { await fnRef.current(); } finally { running = false; }
    };

    tick();
    const timer = setInterval(tick, ms);
    const onVisible = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [ms]);
}
