import { useState, useEffect } from 'react';
import api from '../services/api';
import { cinzel } from '../estilos';

const radius = { borderRadius: '2px' };

export default function SegredosFaccao({ faccaoId }) {
  const [lista, setLista] = useState([]);
  const [texto, setTexto] = useState('');
  const [libera, setLibera] = useState('aliada');

  useEffect(() => {
    api.get(`/faccao-segredos/${faccaoId}`).then(r => setLista(r.data.data || [])).catch(() => {});
  }, [faccaoId]);

  async function criar() {
    if (!texto.trim()) return;
    try {
      const r = await api.post('/faccao-segredos', { faccao_id: String(faccaoId), texto, libera_em: libera });
      setLista(l => [...l, r.data.data]);
      setTexto('');
    } catch { alert('Erro ao salvar o segredo.'); }
  }

  async function apagar(id) {
    try {
      await api.delete(`/faccao-segredos/${id}`);
      setLista(l => l.filter(s => s.id !== id));
    } catch { alert('Erro ao apagar.'); }
  }

  return (
    <div className="space-y-2 border-t border-[#c8a84b10] pt-3" onClick={e => e.stopPropagation()}>
      <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px]">🔒 SEGREDOS LIBERADOS POR REPUTAÇÃO</p>
      {lista.map(s => (
        <div key={s.id} className="flex items-start justify-between gap-2 border border-[#c8a84b10] bg-[#0f0e0c] px-3 py-2" style={radius}>
          <div>
            <p className="text-[#9a8e78] text-sm">{s.texto}</p>
            <p className="text-[#8a7e68] text-xs mt-1">libera ao chegar em: {s.libera_em}</p>
          </div>
          <button onClick={() => apagar(s.id)} className="text-red-600 text-sm">×</button>
        </div>
      ))}
      <textarea rows={2} value={texto} onChange={e => setTexto(e.target.value)}
        placeholder="Um segredo da facção..." aria-label="Novo segredo"
        className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full text-sm focus:outline-none focus:border-[#c8a84b50] placeholder-[#3a3020] resize-none"
        style={radius} />
      <div className="flex gap-2">
        <select value={libera} onChange={e => setLibera(e.target.value)} aria-label="Patamar"
          className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#9a8e78] px-2 py-1 text-xs focus:outline-none" style={radius}>
          <option value="aliada">Quando for aliada</option>
          <option value="neutra">Quando for neutra</option>
        </select>
        <button onClick={criar} disabled={!texto.trim()}
          className="border border-[#c8a84b30] text-[#c8a84b] px-3 py-1 text-xs hover:bg-[#c8a84b10] transition-colors disabled:opacity-40"
          style={{ ...cinzel, ...radius }}>＋ Adicionar</button>
      </div>
    </div>
  );
}