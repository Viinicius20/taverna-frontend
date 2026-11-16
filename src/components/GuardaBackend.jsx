import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import TelaCarregamento from './TelaCarregamento';
import { DICAS } from '../utils/dicas';

const ROTA = '/health';
const MOSTRAR_APOS_MS = 1200;
const TIMEOUT_MS = 70000;
const REVALIDAR_APOS_MS = 10 * 60 * 1000;

export default function GuardaBackend({ children }) {
  const [esperando, setEsperando] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const [indice, setIndice] = useState(() => Math.floor(Math.random() * DICAS.length));
  const ultimoOk = useRef(0);
  const emAndamento = useRef(false);

  const acordar = useCallback(async () => {
    if (emAndamento.current) return;
    emAndamento.current = true;
    setFalhou(false);
    const aparecer = setTimeout(() => setEsperando(true), MOSTRAR_APOS_MS);
    const ctrl = new AbortController();
    const desistir = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      // no-cors: qualquer resposta do servidor (até 404) significa "acordou";
      // só erro de rede ou timeout cai no catch
      await fetch(`${api.defaults.baseURL}${ROTA}`, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal });
      ultimoOk.current = Date.now();
      setEsperando(false);
    } catch {
      setFalhou(true);
    } finally {
      clearTimeout(aparecer);
      clearTimeout(desistir);
      emAndamento.current = false;
    }
  }, []);

  useEffect(() => { acordar(); }, [acordar]);

  useEffect(() => {
    function aoVoltar() {
      if (document.visibilityState === 'visible' && Date.now() - ultimoOk.current > REVALIDAR_APOS_MS) {
        acordar();
      }
    }
    document.addEventListener('visibilitychange', aoVoltar);
    return () => document.removeEventListener('visibilitychange', aoVoltar);
  }, [acordar]);

  useEffect(() => {
    if (!esperando) return;
    const t = setInterval(() => setIndice(i => (i + 1) % DICAS.length), 6000);
    return () => clearInterval(t);
  }, [esperando]);

  return (
    <>
      {children}
      {esperando && createPortal(
        <TelaCarregamento
          dica={DICAS[indice]}
          falhou={falhou}
          onTentar={acordar}
          onContinuar={() => { setEsperando(false); setFalhou(false); }} />,
        document.body
      )}
    </>
  );
}