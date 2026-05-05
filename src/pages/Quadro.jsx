import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const navLinks = [
  { label: 'Personagens', rota: '/personagens' },
  { label: 'Dados', rota: '/dados' },
  { label: 'Mestre', rota: '/mestre' },
];


const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };

const CATEGORIAS = [
  { label: 'NPC', cor: '#c8a84b', borda: '#c8a84b40', bg: '#c8a84b08' },
  { label: 'Local', cor: '#7ab8d4', borda: '#7ab8d440', bg: '#7ab8d408' },
  { label: 'Pista', cor: '#a07840', borda: '#a0784040', bg: '#a0784008' },
  { label: 'Missão', cor: '#8a5030', borda: '#8a503040', bg: '#8a503008' },
  { label: 'Outro', cor: '#6a6050', borda: '#6a605040', bg: '#6a605008' },
];

export default function Quadro() {
  const navigate = useNavigate();
  const [postits, setPostits] = useState([]);
  const [novoTexto, setNovoTexto] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('NPC');
  const [modoMestre, setModoMestre] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [countdownDisplay, setCountdownDisplay] = useState('');
  const CAMPANHA_ID = '00000000-0000-0000-0000-000000000001';

  function adicionarPostit() {
    if (!novoTexto.trim()) return;
    setPostits(prev => [...prev, {
      id: Date.now(),
      texto: novoTexto,
      categoria: novaCategoria,
    }]);
    setNovoTexto('');
  }

  function removerPostit(id) {
    setPostits(prev => prev.filter(p => p.id !== id));
  }

  useEffect(() => {
  buscarCountdown();
  const interval = setInterval(buscarCountdown, 5000);
  return () => clearInterval(interval);
}, []);

async function buscarCountdown() {
  try {
    const res = await fetch(`https://taverna-backend-eq3b.onrender.com/session-state/${CAMPANHA_ID}`);
    const json = await res.json();
    if (json.data?.countdown_active) {
      setCountdown(json.data);
    } else {
      setCountdown(null);
      setCountdownDisplay('');
    }
  } catch {}
}

useEffect(() => {
    if (!countdown?.countdown_end) return;
    const interval = setInterval(() => {
        const diff = Math.max(0, Math.floor((new Date(countdown.countdown_end) - new Date()) / 1000));
        const min = Math.floor(diff / 60);
        const seg = diff % 60;
        setCountdownDisplay(`${min}:${seg.toString().padStart(2, '0')}`);
        if (diff === 0) setCountdown(null);
    }, 1000);
    return () => clearInterval(interval);
}, [countdown]);

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0]" style={crimson}>

      <nav className="flex items-center justify-between px-4 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>⚔ TAVERNA</span>
        <div className="flex gap-3 items-center">
          <button onClick={() => setModoMestre(m => !m)}
            className={`px-3 py-1 text-xs border transition-colors ${modoMestre ? 'bg-[#c8a84b] text-[#0f0e0c] border-[#c8a84b]' : 'border-[#c8a84b40] text-[#c8a84b]'}`}
            style={{ ...cinzel, borderRadius: '2px' }}>
            {modoMestre ? '⚔ MESTRE' : '👁 JOGADOR'}
          </button>
          <button onClick={() => navigate('/')}
            className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors" style={cinzel}>
            ← Voltar
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">SESSÃO ATUAL</p>
        <h1 style={cinzel} className="text-2xl text-[#f0e8d8] font-semibold mb-8">Quadro de Rumores</h1>

        {/* Adicionar post-it — só mestre */}
        {modoMestre && (
          <div className="flex flex-col sm:flex-row gap-2 mb-8">
            <select value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)}
              className="bg-[#161410] border border-[#c8a84b20] text-[#6a6050] px-3 py-2 text-xs focus:outline-none"
              style={{ borderRadius: '2px' }}>
              {CATEGORIAS.map(c => (
                <option key={c.label} value={c.label}>{c.label}</option>
              ))}
            </select>
            <input value={novoTexto} onChange={e => setNovoTexto(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && adicionarPostit()}
              placeholder="Ex: Ferreiro Goran, Taverna do Cervo, Chave misteriosa..."
              className="bg-[#161410] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 flex-1 text-sm focus:outline-none focus:border-[#c8a84b50] placeholder-[#3a3020]"
              style={{ borderRadius: '2px' }} />
            <button onClick={adicionarPostit}
              className="bg-[#c8a84b] text-[#0f0e0c] px-4 py-2 text-xs font-bold hover:bg-[#e0c060] transition-colors"
              style={{ ...cinzel, borderRadius: '2px' }}>
              + ADICIONAR
            </button>
          </div>
        )}

        {countdown && countdownDisplay && (
          <div className="border border-red-900 bg-[#1a0808] p-6 text-center mb-8 animate-pulse"
            style={{ borderRadius: '2px' }}>
            <p style={cinzel} className="text-red-600 text-xs tracking-[4px] mb-2">⚠ DECISÃO NECESSÁRIA</p>
            <p style={cinzel} className="text-red-500 text-5xl font-bold tracking-widest">{countdownDisplay}</p>
          </div>
        )}

        {/* Post-its por categoria */}
        {postits.length === 0 ? (
          <div className="text-center py-20">
            <p style={cinzel} className="text-[#3a3020] text-sm tracking-widest">NENHUMA INFORMAÇÃO REGISTRADA</p>
            {!modoMestre && (
              <p className="text-[#2a2018] text-xs mt-2">Aguarde o mestre adicionar informações da sessão.</p>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {CATEGORIAS.filter(cat => postits.some(p => p.categoria === cat.label)).map(cat => (
              <div key={cat.label}>
                <p style={{ ...cinzel, color: cat.cor }} className="text-xs tracking-[3px] mb-3 opacity-80">
                  {cat.label.toUpperCase()}S
                </p>
                <div className="flex flex-wrap gap-3">
                  {postits.filter(p => p.categoria === cat.label).map(postit => (
                    <div key={postit.id}
                      className="relative border px-4 py-3 text-sm"
                      style={{
                        borderRadius: '2px',
                        borderColor: cat.borda,
                        backgroundColor: cat.bg,
                        color: '#e8e0d0',
                        minWidth: '140px',
                        maxWidth: '240px',
                      }}>
                      <p style={cinzel} className="text-xs mb-1" style2={{ color: cat.cor }}>{cat.label}</p>
                      <p className="leading-relaxed">{postit.texto}</p>
                      {modoMestre && (
                        <button onClick={() => removerPostit(postit.id)}
                          className="absolute top-1 right-2 text-red-900 hover:text-red-600 text-sm transition-colors">
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}