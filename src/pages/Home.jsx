import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [boato, setBoato] = useState(null);
  const [gerandoBoato, setGerandoBoato] = useState(false);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [monstro, setMonstro] = useState(null);
  const [imagemRevelada, setImagemRevelada] = useState(null);
  const isMestre = user?.role === 'mestre';

  useEffect(() => {
    buscarMonstroAleatorio();
    buscarImagemRevelada();
  }, []);

  async function buscarMonstroAleatorio() {
    try {
      const res = await fetch('https://taverna-backend-eq3b.onrender.com/bestiary/random-description');
      const json = await res.json();
      setMonstro(json.data);
    } catch {
      setMonstro(null);
    }
  }

  async function buscarImagemRevelada() {
    try {
      const res = await fetch('https://taverna-backend-eq3b.onrender.com/gallery?campaign_id=00000000-0000-0000-0000-000000000001');
      const json = await res.json();
      const revelada = (json.data || []).find(i => i.revealed);
      setImagemRevelada(revelada || null);
    } catch {
      setImagemRevelada(null);
    }
  }

  async function gerarBoato() {
    setGerandoBoato(true);
    setBoato(null);
    try {
      const res = await fetch('https://taverna-backend-eq3b.onrender.com/boato');
      const json = await res.json();
      setBoato(json.data);
    } catch {
      setBoato(null);
    }
    setGerandoBoato(false);
  }

  const menuItems = [
    { label: 'Personagens', rota: '/personagens' },
    { label: 'Galeria', rota: '/galeria' },
    { label: 'Quadro de Rumores', rota: '/quadro' },
    { label: 'Histórico', rota: '/historico' },
    { label: 'Rolar Dados', rota: '/dados' },
    { label: 'Campanhas', rota: '/campanhas' },
    ...(isMestre ? [
      { label: 'Mestre', rota: '/mestre', destaque: true },
      { label: 'Bestiário', rota: '/mestre/bestiario', destaque: true },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0] page-fade" style={crimson}>

      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>
          ⚔ TAVERNA
        </span>
        <button onClick={() => setDrawerAberto(true)}
          className="text-[#a09880] hover:text-[#c8a84b] transition-colors p-2">
          <div className="flex flex-col gap-1.5">
            <span className="block w-5 h-px bg-current" />
            <span className="block w-5 h-px bg-current" />
            <span className="block w-5 h-px bg-current" />
          </div>
        </button>
      </nav>

      {/* DRAWER */}
      {drawerAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black bg-opacity-60"
            onClick={() => setDrawerAberto(false)} />
          <div className="relative w-72 bg-[#0f0e0c] border-l border-[#c8a84b20] h-full flex flex-col"
            style={{ animation: 'slideIn 0.2s ease' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#c8a84b20]">
              <span style={cinzel} className="text-[#c8a84b] text-sm tracking-widest">⚔ TAVERNA</span>
              <button onClick={() => setDrawerAberto(false)}
                className="text-[#4a4030] hover:text-[#c8a84b] text-xl transition-colors">✕</button>
            </div>

            {user && (
              <div className="px-6 py-4 border-b border-[#c8a84b15]">
                <p style={cinzel} className="text-[#4a4030] text-xs tracking-[2px] mb-1">LOGADO COMO</p>
                <p style={cinzel} className="text-[#c8a84b] text-sm">{user.username}</p>
                {isMestre && <span style={cinzel} className="text-[#3a3020] text-xs">Mestre</span>}
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-4">
              {user ? (
                menuItems.map(({ label, rota, destaque }) => (
                  <button key={label}
                    onClick={() => { navigate(rota); setDrawerAberto(false); }}
                    className="w-full text-left px-6 py-3 text-sm hover:bg-[#161410] transition-colors flex items-center justify-between group"
                    style={cinzel}>
                    <span className={destaque ? 'text-[#c8a84b]' : 'text-[#a09880] group-hover:text-[#c8a84b] transition-colors'}>
                      {label}
                    </span>
                    <span className="text-[#4a4030] group-hover:text-[#c8a84b] transition-colors text-xs">→</span>
                  </button>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <p style={cinzel} className="text-[#4a4030] text-xs mb-4">Entre na mesa para acessar todas as ferramentas.</p>
                  <button onClick={() => { navigate('/login'); setDrawerAberto(false); }}
                    className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-2 text-xs font-bold w-full hover:bg-[#e0c060] transition-colors btn-shimmer"
                    style={{ ...cinzel, borderRadius: '2px' }}>
                    → Entrar na Mesa
                  </button>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#c8a84b15]">
              {user ? (
                <button onClick={() => { logout(); setDrawerAberto(false); }}
                  className="w-full text-left text-xs tracking-widest text-[#4a4030] hover:text-red-700 transition-colors"
                  style={cinzel}>
                  Sair
                </button>
              ) : (
                <button onClick={() => { navigate('/login'); setDrawerAberto(false); }}
                  className="w-full text-left text-xs tracking-widest text-[#c8a84b] hover:text-[#e0c060] transition-colors btn-shimmer"
                  style={cinzel}>
                  → Entrar na Mesa
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <div className="text-center px-8 py-24 relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(200,168,75,0.07) 0%, transparent 70%)' }} />
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-6 opacity-80">RPG</p>
        <h1 style={cinzel} className="text-3xl sm:text-5xl font-bold text-[#f0e8d8] leading-tight mb-4">
          Sua aventura<br />começa <span className="text-[#c8a84b]">aqui</span>
        </h1>
        <p className="text-[#8a8070] text-xl max-w-md mx-auto mb-10 font-light leading-relaxed">
          Crie personagens, gerencie campanhas e dê vida ao seu mundo com o poder da IA.
        </p>
        <button onClick={() => navigate(user ? '/personagens' : '/login')}
          className="bg-[#c8a84b] text-[#0f0e0c] px-8 py-3 text-sm tracking-widest font-bold hover:bg-[#e0c060] transition-colors"
          style={{ ...cinzel, borderRadius: '2px' }}>
          {user ? 'Minha Ficha' : 'Entrar na Mesa'}
        </button>
      </div>

      <div className="w-16 h-px bg-[#c8a84b60] mx-auto mb-16" />

      {/* CONTEÚDO VISUAL */}
      <div className="max-w-5xl mx-auto px-8 mb-20 grid grid-cols-1 sm:grid-cols-2 gap-8">

        {/* MONSTRO ALEATÓRIO */}
        <div className="border border-[#c8a84b20] bg-[#161410] p-8" style={{ borderRadius: '2px' }}>
          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-4 opacity-70">AMEAÇA DO DIA</p>
          {monstro ? (
            <>
              <h3 style={cinzel} className="text-[#f0e8d8] text-xl font-bold mb-1">{monstro.nome}</h3>
              <p style={cinzel} className="text-[#4a4030] text-xs mb-4">{monstro.tipo} · CR {monstro.cr}</p>
              <p className="text-[#8a8070] text-sm leading-relaxed font-light italic">{monstro.descricao}</p>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
              <p style={cinzel} className="text-[#4a4030] text-xs">INVOCANDO...</p>
            </div>
          )}
          <button onClick={buscarMonstroAleatorio}
            className="mt-6 text-xs text-[#4a4030] hover:text-[#c8a84b] transition-colors"
            style={cinzel}>
            ↻ Outro monstro
          </button>
        </div>

        {/* IMAGEM REVELADA */}
        <div className="border border-[#c8a84b20] bg-[#161410] p-8" style={{ borderRadius: '2px' }}>
          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-4 opacity-70">CENA ATUAL</p>
          {imagemRevelada ? (
            <img src={imagemRevelada.url} alt={imagemRevelada.name}
              className="w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              style={{ borderRadius: '2px', maxHeight: '220px' }}
              onClick={() => navigate('/galeria')} />
          ) : (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <span className="text-3xl opacity-10">🗺</span>
              <p style={cinzel} className="text-[#3a3020] text-xs">NENHUMA CENA REVELADA</p>
            </div>
          )}
        </div>
      </div>

      {/* BOATOS */}
      <div className="max-w-5xl mx-auto px-8 mb-20">
        <div className="w-16 h-px bg-[#c8a84b60] mx-auto mb-16" />
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">TAVERNA</p>
        <h2 style={cinzel} className="text-2xl text-[#f0e8d8] mb-6 font-semibold">Boatos da Noite</h2>
        <button onClick={gerarBoato} disabled={gerandoBoato}
          className="border border-[#c8a84b40] text-[#c8a84b] px-6 py-3 text-xs tracking-widest hover:bg-[#c8a84b10] transition-colors disabled:opacity-50 mb-6"
          style={{ ...cinzel, borderRadius: '2px' }}>
          {gerandoBoato ? '⟳ OUVINDO...' : '🍺 OUVIR BOATOS'}
        </button>
        {boato && (
          <div className="border border-[#c8a84b20] bg-[#161410] p-6" style={{ borderRadius: '2px' }}>
            <p className="text-[#a09880] text-base leading-relaxed mb-4 font-light italic">"{boato.boato}"</p>
            <p style={cinzel} className="text-[#4a4030] text-xs">— {boato.fonte}</p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#c8a84b15] py-8 text-center">
        <p style={cinzel} className="text-[#403830] text-xs tracking-[3px]">TAVERNA</p>
      </footer>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}