import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import { notificar } from '../utils/notificar';

const cinzel = { fontFamily: "'Cinzel', serif" };

function mesclar(atuais, novas) {
  const ids = new Set(atuais.map(l => l.id));
  const unicas = novas.filter(l => !ids.has(l.id));
  return [...unicas, ...atuais]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 50);
}

function Linha({ l }) {
  const d = l.dados || {};
  const rolls = d.rolls || [];
  const d20 = d.qtd === 1 && d.lados === 20;
  const cor = d20 && rolls[0] === 20 ? '#c8a84b' : d20 && rolls[0] === 1 ? '#c84b4b' : '#e8e0d0';
  const mod = l.modificador ? ` ${l.modificador > 0 ? '+' : '−'} ${Math.abs(l.modificador)}` : '';
  const descartados = d.descartados?.length ? ` (descartou ${d.descartados.join(', ')})` : '';
  const hora = new Date(l.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="border border-[#c8a84b15] bg-[#0f0e0c] px-3 py-2" style={{ borderRadius: '2px' }}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[#9a8e78] text-xs truncate">
          {l.autor}{l.rotulo ? ` · ${l.rotulo}` : ''}
        </span>
        <span className="text-[#8a7e68] text-xs shrink-0">
          {l.oculta ? '🔒 ' : ''}{hora}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span style={{ ...cinzel, color: cor }} className="text-xl font-bold">{l.total}</span>
        <span className="text-[#8a7e68] text-xs">
          {l.expressao} [{rolls.join(' + ')}]{mod}{descartados}
        </span>
      </div>
    </div>
  );
}

export default function MesaFeed({ flutuante = false }) {
  const { user } = useUser();
  const isMestre = user?.role === 'mestre';
  const [linhas, setLinhas] = useState([]);
  const [aberto, setAberto] = useState(!flutuante);
  const [confirmando, setConfirmando] = useState(false);
  const [limpando, setLimpando] = useState(false);
  const ultimo = useRef('');
  const ciclo = useRef(0);

  useEffect(() => {
    if (!aberto) return;
    let ativo = true;
    ciclo.current = 0;

    async function buscar() {
      if (document.visibilityState === 'hidden') return;
      ciclo.current += 1;
      // a cada 5 ciclos (ou sem referência) refaz a busca completa e substitui a lista,
      // assim rolagens apagadas pelo mestre somem para todo mundo
      const completa = !ultimo.current || ciclo.current % 5 === 0;
      try {
        const params = completa ? { limite: 30 } : { depois: ultimo.current };
        const res = await api.get('/rolagens', { params });
        if (!ativo) return;
        const novas = res.data.data || [];
        if (completa) {
          setLinhas(novas);
          ultimo.current = novas[0]?.created_at || '';
        } else if (novas.length > 0) {
          ultimo.current = novas[0].created_at;   // a API devolve da mais nova pra mais velha
          setLinhas(prev => mesclar(prev, novas));
        }
      } catch { /* tenta de novo no próximo ciclo */ }
    }

    function aoRolar(e) {
      setLinhas(prev => mesclar(prev, [e.detail]));
    }

    buscar();
    const timer = setInterval(buscar, 3000);
    window.addEventListener('taverna:rolagem', aoRolar);
    return () => {
      ativo = false;
      clearInterval(timer);
      window.removeEventListener('taverna:rolagem', aoRolar);
    };
  }, [aberto]);

  async function limpar() {
    setLimpando(true);
    try {
      await api.delete('/rolagens');
      setLinhas([]);
      ultimo.current = '';
    } catch {
      notificar('Não foi possível limpar o log.', 'erro');
    }
    setLimpando(false);
    setConfirmando(false);
  }

  const painel = (
    <div className="border border-[#c8a84b20] bg-[#161410] p-4" style={{ borderRadius: '2px' }}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">MESA</p>

        {isMestre && linhas.length > 0 && (
          confirmando ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-[#9a8e78]">Apagar tudo?</span>
              <button onClick={limpar} disabled={limpando}
                className="text-red-400 hover:text-red-300 disabled:opacity-40">
                {limpando ? '...' : 'Sim'}
              </button>
              <button onClick={() => setConfirmando(false)} disabled={limpando}
                className="text-[#8a7e68] hover:text-[#c8a84b]">
                Não
              </button>
            </span>
          ) : (
            <button onClick={() => setConfirmando(true)}
              className="text-xs text-[#8a7e68] hover:text-red-400 transition-colors" style={cinzel}>
              LIMPAR
            </button>
          )
        )}
      </div>

      {linhas.length === 0 ? (
        <p className="text-[#8a7e68] text-sm">Nenhuma rolagem ainda.</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
          {linhas.map(l => <Linha key={l.id} l={l} />)}
        </div>
      )}
    </div>
  );

  if (!flutuante) return painel;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)]">
      {aberto && <div className="mb-2">{painel}</div>}
      <button onClick={() => setAberto(a => !a)} style={{ ...cinzel, borderRadius: '2px' }}
        className="ml-auto block bg-[#161410] border border-[#c8a84b40] text-[#c8a84b] px-4 py-2 text-xs tracking-widest hover:bg-[#c8a84b15] transition-colors">
        🎲 MESA
      </button>
    </div>
  );
}