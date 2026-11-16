import { useState } from 'react';
import api from '../services/api';
import { notificar } from '../utils/notificar';
import BalaoFala from './BalaoFala';

const cinzel = { fontFamily: "'Cinzel', serif" };

export default function FalaNpcModal({ npc, personagens, campanhaId, onClose }) {
  const [fala, setFala] = useState('');
  const [destino, setDestino] = useState('todos');
  const [enviando, setEnviando] = useState(false);

  const nome = npc.name || npc.data?.name || 'NPC';
  const avatar = npc.data?.art_url || null;

  async function enviar() {
    if (!fala.trim() || enviando) return;
    const alvos = destino === 'todos' ? personagens : personagens.filter(p => p.id === destino);
    setEnviando(true);
    try {
      await Promise.all(alvos.map(p => api.post('/secret-messages', {
        campaign_id: campanhaId,
        character_id: p.id,
        message: fala.trim(),
        npc_nome: nome,
        npc_avatar_url: avatar,
      })));
      alert('Fala enviada!');
      onClose();
    } catch {
      notificar('Não foi possível enviar a fala.', 'erro');
    }
    setEnviando(false);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-[#161410] border border-[#c8a84b30] max-w-md w-full max-h-[90vh] overflow-y-auto p-6"
        style={{ borderRadius: '2px' }} onClick={e => e.stopPropagation()}>
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-4">FALA DE {nome.toUpperCase()}</p>

        <textarea value={fala} onChange={e => setFala(e.target.value)} maxLength={300} rows={3}
          placeholder="O que o NPC diz..." aria-label="O que o NPC diz..."
          className="w-full bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50] resize-none mb-3"
          style={{ borderRadius: '2px' }} />

        <select value={destino} onChange={e => setDestino(e.target.value)} aria-label="Destinatário"
          className="w-full bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm mb-4"
          style={{ borderRadius: '2px' }}>
          <option value="todos">Todos os jogadores</option>
          {personagens.map(p => (
            <option key={p.id} value={p.id}>{p.data?.name || p.name}</option>
          ))}
        </select>

        {fala.trim() && (
          <div className="mb-4">
            <p className="text-[#8a7e68] text-xs mb-2">Como o jogador vai ver:</p>
            <BalaoFala nome={nome} avatar={avatar} fala={fala.trim()} />
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} style={{ ...cinzel, borderRadius: '2px' }}
            className="flex-1 border border-[#c8a84b30] text-[#9a8e78] px-4 py-2 text-xs tracking-widest hover:text-[#c8a84b] transition-colors">
            CANCELAR
          </button>
          <button onClick={enviar} disabled={!fala.trim() || enviando} style={{ ...cinzel, borderRadius: '2px' }}
            className="flex-1 bg-[#c8a84b] text-[#0f0e0c] px-4 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-40">
            {enviando ? 'ENVIANDO...' : 'ENVIAR'}
          </button>
        </div>
      </div>
    </div>
  );
}