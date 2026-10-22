import { useState } from "react";
import api from "../services/api";

const cinzel = { fontFamily: "'Cinzel', serif" };

export default function EnviarHandout({ handoutId, personagens = [], onEnviado }) {
  const [aberto, setAberto] = useState(false);
  const [sel, setSel] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState('');

  const alternar = id => setSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  async function enviar(todos) {
    if (!todos && sel.length === 0) return;
    setEnviando(true);
    try {
      const res = await api.post(`/gallery/${handoutId}/enviar`, { todos, character_ids: todos ? [] : sel });
      setMsg(`Enviado para ${res.data.enviados} personagem(ns).`);
      setSel([]);
      if (onEnviado) onEnviado();
    } catch { setMsg('Erro ao enviar.'); }
    setEnviando(false);
  }

  return (
    <div className="mt-3">
      <button onClick={() => { setAberto(a => !a); setMsg(''); }}
        className="text-xs border border-[#b07050] text-[#b07050] px-3 py-1 hover:bg-[#b0705020] transition-colors"
        style={{ ...cinzel, borderRadius: '2px' }}>
        {aberto ? 'FECHAR' : 'ENVIAR PARA...'}
      </button>

      {aberto && (
        <div className="mt-3 border border-[#c8a84b20] bg-[#0f0e0c] p-3 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {personagens.map(p => {
              const ativo = sel.includes(p.id);
              return (
                <button key={p.id} onClick={() => alternar(p.id)}
                  className={`px-3 py-1 text-xs border transition-colors ${
                    ativo ? 'border-[#c8a84b] text-[#c8a84b] bg-[#c8a84b10]' : 'border-[#c8a84b20] text-[#8a7e68] hover:border-[#c8a84b50]'
                  }`}
                  style={{ ...cinzel, borderRadius: '2px' }}>
                  {p.data?.name || p.name}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => enviar(false)} disabled={sel.length === 0 || enviando}
              className="bg-[#c8a84b] text-[#0f0e0c] px-4 py-2 text-xs font-bold disabled:opacity-30"
              style={{ ...cinzel, borderRadius: '2px' }}>
              {enviando ? 'Enviando...' : `Enviar aos selecionados (${sel.length})`}
            </button>
            <button onClick={() => enviar(true)} disabled={enviando}
              className="border border-[#c8a84b40] text-[#c8a84b] px-4 py-2 text-xs hover:bg-[#c8a84b10] disabled:opacity-30"
              style={{ ...cinzel, borderRadius: '2px' }}>
              Todos os jogadores
            </button>
            {msg && <span className="text-xs text-[#8a7e68]">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}