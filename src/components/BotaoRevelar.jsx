import { useState } from 'react';
import api from '../services/api';
import { cinzel } from '../estilos';

export default function BotaoRevelar({ tipo, entidadeId, campanhaId, descoberta, onMudou }) {
  const [ocupado, setOcupado] = useState(false);

  async function alternar() {
    setOcupado(true);
    try {
      if (descoberta) await api.delete(`/descobertas/${descoberta.id}`);
      else await api.post('/descobertas', {
        campaign_id: campanhaId, tipo, entidade_id: String(entidadeId),
      });
      onMudou?.();
    } catch {
      alert('Erro ao atualizar a descoberta.');
    }
    setOcupado(false);
  }

  return (
    <button onClick={alternar} disabled={ocupado}
      className="text-xs border px-3 py-1 transition-colors disabled:opacity-50"
      style={{
        ...cinzel, borderRadius: '2px',
        borderColor: descoberta ? '#4a8a4a60' : '#c8a84b30',
        color: descoberta ? '#4a8a4a' : '#c8a84b',
      }}>
      {descoberta ? '✓ REVELADO · esconder' : '👁 REVELAR AO GRUPO'}
    </button>
  );
}