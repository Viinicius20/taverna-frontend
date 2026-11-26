import { useState } from 'react';
import api from '../services/api';

export default function AnotarBoato({ falaId, onAnotado }) {
  const [salvando, setSalvando] = useState(false);
  const [anotado, setAnotado] = useState(false);
  const [erro, setErro] = useState('');

  if (!falaId) return null;

  async function anotar() {
    if (salvando || anotado) return;
    setSalvando(true);
    setErro('');

    try {
      await api.post(`/rumores/mural/${falaId}`);
      setAnotado(true);
      onAnotado?.();
    } catch {
      setErro('Não foi possível anotar o boato.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={anotar}
        disabled={salvando || anotado}
        className="text-[#c8a84b] text-xs underline disabled:opacity-60"
      >
        {anotado ? 'Anotado no quadro' : salvando ? 'Anotando…' : 'Anotar no quadro'}
      </button>
      {erro && <p role="alert" className="text-red-400 text-xs mt-1">{erro}</p>}
    </div>
  );
}