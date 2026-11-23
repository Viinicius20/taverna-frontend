import { useState } from 'react';
import api from '../services/api';
import { cinzel } from '../estilos';
import { getCampanhaId } from '../utils/campanha';
import SeletorGaleria from './SeletorGaleria';

const radius = { borderRadius: '2px' };

export default function FotoCriatura({ criatura, onMudou }) {
  const [galeria, setGaleria] = useState(false);

  async function salvar(url) {
    try {
      await api.patch(`/bestiary/${criatura.id}/arte`, { url });
      onMudou?.(url || null);
    } catch { alert('Não foi possível salvar a foto.'); }
    setGaleria(false);
  }

  return (
    <div className="space-y-2" onClick={e => e.stopPropagation()}>
      {criatura.art_url && (
        <img src={criatura.art_url} alt={criatura.name} loading="lazy"
          className="w-full max-h-52 object-cover border border-[#c8a84b20]" style={radius} />
      )}
      <div className="flex gap-2">
        <button onClick={() => setGaleria(true)}
          className="text-xs border border-[#c8a84b30] text-[#c8a84b] px-3 py-1 hover:bg-[#c8a84b10] transition-colors"
          style={{ ...cinzel, ...radius }}>
          🖼 {criatura.art_url ? 'Trocar foto' : 'Foto da Galeria'}
        </button>
        {criatura.art_url && (
          <button onClick={() => salvar('')}
            className="text-xs border border-[#c8a84b20] text-[#9a8e78] px-3 py-1" style={{ ...cinzel, ...radius }}>
            Remover
          </button>
        )}
      </div>
      {galeria && (
        <SeletorGaleria campanhaId={getCampanhaId()} soMapasInicial={false}
          onEscolher={salvar} onFechar={() => setGaleria(false)} />
      )}
    </div>
  );
}