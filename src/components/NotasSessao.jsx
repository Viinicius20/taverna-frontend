import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

const cinzel = { fontFamily: "'Cinzel', serif" };  

const CORES = { amarelo: '#e8d27a', rosa: '#e8a0a8', azul: '#8ec5e0', verde: '#a6d48a' };

function PostIt({ nota, indice, onFeito, onApagar }) {
  const vencida = nota.sessions_left === 0;
  const inclinacao = [-1.8, 1.2, -0.8, 1.6][indice % 4];
  const faltam = nota.sessions_left === 1 ? 'FALTA 1 SESSÃO' : `FALTAM ${nota.sessions_left} SESSÕES`;
  return (
    <div className="relative p-3 pt-4 min-h-[110px] flex flex-col justify-between"
      style={{
        backgroundColor: CORES[nota.color] || CORES.amarelo, color: '#2a2418',
        transform: `rotate(${inclinacao}deg)`, boxShadow: '2px 4px 10px rgba(0,0,0,0.5)', borderRadius: '2px',
      }}>
      {/* tachinha */}
      <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#8a2020] shadow" />
      <p className="text-sm leading-snug italic break-words">{nota.text}</p>
      <div className="flex items-end justify-between gap-2 mt-3">
        {nota.sessions_left !== null ? (
          <span style={cinzel} className={`text-[10px] tracking-wide font-bold ${vencida ? 'text-[#8a1010]' : 'text-[#5a4a20]'}`}>
            {vencida ? 'VENCE AGORA' : faltam}
          </span>
        ) : <span />}
        <span className="flex gap-1">
          <button onClick={() => onFeito(nota.id)} title="Marcar como feito" aria-label="Marcar como feito"
            className="text-sm px-1 hover:scale-125 transition-transform">✓</button>
          <button onClick={() => onApagar(nota.id)} title="Apagar" aria-label="Apagar"
            className="text-sm px-1 hover:scale-125 transition-transform">×</button>
        </span>
      </div>
    </div>
  );
}

export default function NotasSessao() {
  const [notas, setNotas] = useState([]);
  const [texto, setTexto] = useState('');
  const [cor, setCor] = useState('amarelo');
  const [sessoes, setSessoes] = useState('');
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/notas-sessao');
      setNotas(res.data.data || []);
    } catch { /* mantém as notas atuais */ }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function fixar() {
    if (!texto.trim()) return;
    try {
      await api.post('/notas-sessao', {
        text: texto, color: cor, sessions_left: sessoes === '' ? null : Number(sessoes),
      });
      setTexto(''); setSessoes(''); setErro('');
      carregar();
    } catch { setErro('Erro ao fixar a anotação.'); }
  }

  async function marcarFeito(id) {
    try { await api.patch(`/notas-sessao/${id}`, { done: true }); carregar(); }
    catch { setErro('Erro ao atualizar.'); }
  }

  async function apagar(id) {
    try { await api.delete(`/notas-sessao/${id}`); carregar(); }
    catch { setErro('Erro ao apagar.'); }
  }

  async function encerrarSessao() {
    if (!window.confirm('Encerrar a sessão? Os lembretes com prazo perdem 1 sessão.')) return;
    try { await api.post('/notas-sessao/encerrar-sessao'); carregar(); }
    catch { setErro('Erro ao encerrar a sessão.'); }
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">ANOTAÇÕES DA SESSÃO</p>
        <button onClick={encerrarSessao} style={{ ...cinzel, borderRadius: '2px' }}
          className="border border-[#c8a84b30] text-[#8a7e68] px-3 py-1 text-xs hover:border-[#c8a84b60] transition-colors">
          Encerrar sessão
        </button>
      </div>

      {notas.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5 px-1 pt-3">
          {notas.map((n, i) => (
            <PostIt key={n.id} nota={n} indice={i} onFeito={marcarFeito} onApagar={apagar} />
          ))}
        </div>
      ) : (
        <p className="text-[#7a6e58] text-sm italic mb-4">Nada fixado. O mestre confia na memória, o que é corajoso.</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input value={texto} onChange={e => setTexto(e.target.value)} maxLength={300}
          onKeyDown={e => { if (e.key === 'Enter') fixar(); }}
          placeholder="Ex: O mercador ainda não foi encontrado"
          className="flex-1 min-w-48 bg-[#161410] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
          style={{ borderRadius: '2px' }} />
        <div className="flex gap-1">
          {Object.entries(CORES).map(([id, hex]) => (
            <button key={id} onClick={() => setCor(id)} title={id} aria-label={`Cor ${id}`}
              className="w-6 h-6 border-2"
              style={{ backgroundColor: hex, borderColor: cor === id ? '#f0e8d8' : 'transparent', borderRadius: '2px' }} />
          ))}
        </div>
        <input type="number" min={0} max={99} value={sessoes} onChange={e => setSessoes(e.target.value)}
          placeholder="Sessões"
          title="Prazo em sessões (vazio = sem prazo)"
          className="w-24 bg-[#161410] border border-[#c8a84b20] text-[#c8a84b] px-2 py-2 text-sm text-center focus:outline-none"
          style={{ borderRadius: '2px' }} />
        <button onClick={fixar} disabled={!texto.trim()}
          className="bg-[#c8a84b] text-[#0f0e0c] px-4 py-2 text-xs font-bold disabled:opacity-30"
          style={{ ...cinzel, borderRadius: '2px' }}>
          Fixar
        </button>
      </div>
      {erro && <p className="text-red-400 text-xs mt-2">{erro}</p>}
    </div>
  );
}