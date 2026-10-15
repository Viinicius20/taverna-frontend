import { useEffect, useRef } from 'react';

export default function usePolling(fn, ms, ativo = true) {
  const ref = useRef(fn);
  useEffect(() => { ref.current = fn; });   // sempre a versão mais recente da função

  useEffect(() => {
    if (!ativo) return;
    let timer = null;
    const rodar = () => ref.current();
    const iniciar = () => { if (!timer) timer = setInterval(rodar, ms); };
    const parar = () => { if (timer) { clearInterval(timer); timer = null; } };
    const aoMudarVisibilidade = () => {
      if (document.hidden) parar();
      else { rodar(); iniciar(); }
    };

    rodar();
    if (!document.hidden) iniciar();
    document.addEventListener('visibilitychange', aoMudarVisibilidade);
    return () => {
      parar();
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
    };
  }, [ms, ativo]);
}