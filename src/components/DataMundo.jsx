import { useState } from 'react';
import api from '../services/api';
import usePolling from '../utils/usePolling';

const cinzel = { fontFamily: "'Cinzel', serif" };

export default function DataMundo({ campanhaId, className }) {
  const [texto, setTexto] = useState('');

  usePolling(async () => {
    try {
      const res = await api.get(`/calendario/${campanhaId}`);
      setTexto(res.data.data.texto);
    } catch {}
  }, 60000);

  if (!texto) return null;
  return <p style={cinzel} className={className || 'text-[#c8a84b] text-xs tracking-[2px]'}>📅 {texto}</p>;
}