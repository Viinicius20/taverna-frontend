import { useState } from 'react';
import api from '../services/api';
import { notificar } from '../utils/notificar';

const cinzel = { fontFamily: "'Cinzel', serif" };

export default function CofreHandout({ handout, onMudou }) {
  const [aberto, setAberto] = useState(false);
  const [resposta, setResposta] = useState('');
  const [dica, setDica] = useState('');
  const trancado = Array.isArray(handout.cofre_hashes) && handout.cofre_hashes.length > 0;

  async function trancar() {
    if (!resposta.trim()) return;
    try {
      await api.post(`/gallery/${handout.id}/cofre`, { resposta, dica: dica.trim() || null });
      setAberto(false); setResposta(''); setDica('');
      notificar('Documento trancado.', 'sucesso');
      if (onMudou) onMudou();
    } catch { notificar('Erro ao trancar o documento.', 'erro'); }
  }

  async function destrancar() {
    try {
      await api.delete(`/gallery/${handout.id}/cofre`);
      if (onMudou) onMudou();
    } catch { notificar('Erro ao destrancar o documento.', 'erro'); }
  }

  const botao = 'text-xs border px-2 py-0.5 transition-colors';

  return (
    <>
      {trancado ? (
        <button onClick={destrancar} className={`${botao} border-[#8a5030] text-[#8a5030] hover:bg-[#8a503020]`}
          style={{ borderRadius: '2px', ...cinzel }}>🔒 DESTRANCAR</button>
      ) : (
        <button onClick={() => setAberto(true)} className={`${botao} border-[#c8a84b50] text-[#c8a84b] hover:bg-[#c8a84b10]`}
          style={{ borderRadius: '2px', ...cinzel }}>🔐 TRANCAR</button>
      )}

      {aberto && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4"
          onClick={() => setAberto(false)}>
          <div className="bg-[#161410] border border-[#c8a84b50] max-w-sm w-full p-6"
            style={{ borderRadius: '2px' }} onClick={e => e.stopPropagation()}>
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-4">🔐 TRANCAR DOCUMENTO</p>
            <input value={resposta} onChange={e => setResposta(e.target.value)}
              placeholder="Resposta (use | para várias: tempo|o tempo)"
              className="w-full bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm mb-3 focus:outline-none focus:border-[#c8a84b50]"
              style={{ borderRadius: '2px' }} />
            <input value={dica} onChange={e => setDica(e.target.value)}
              placeholder="Dica ou enigma que o jogador vê (opcional)"
              className="w-full bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm mb-4 focus:outline-none focus:border-[#c8a84b50]"
              style={{ borderRadius: '2px' }} />
            <button onClick={trancar} disabled={!resposta.trim()}
              className="w-full bg-[#4a6a8a] text-[#0f0e0c] px-5 py-2 text-xs tracking-widest font-bold disabled:opacity-30"
              style={{ ...cinzel, borderRadius: '2px' }}>TRANCAR</button>
          </div>
        </div>
      )}
    </>
  );
}