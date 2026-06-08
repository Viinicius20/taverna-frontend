import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../services/api';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };

export default function Campanhas() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [campanhas, setCampanhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [novaCampanha, setNovaCampanha] = useState({ name: '', description: '' });
  const [codigo, setCodigo] = useState('');
  const [aba, setAba] = useState('minhas');
  const [erro, setErro] = useState('');

  const isMestre = user?.role === 'mestre';

  useEffect(() => {
    buscarCampanhas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buscarCampanhas() {
    setLoading(true);
    try {
      if (isMestre) {
        const res = await api.get(`/campaigns/by-owner/${user.id}`);
        setCampanhas(res.data.data || []);
      }
    } catch {
      setCampanhas([]);
    }
    setLoading(false);
  }

  async function criarCampanha() {
    if (!novaCampanha.name.trim()) return;
    setCriando(true);
    setErro('');
    try {
      const res = await api.post('/campaigns', {
        name: novaCampanha.name,
        description: novaCampanha.description,
        owner_id: user.id
      });
      setCampanhas(prev => [res.data.data, ...prev]);
      setNovaCampanha({ name: '', description: '' });
    } catch {
      setErro('Erro ao criar campanha.');
    }
    setCriando(false);
  }

  async function entrarCampanha() {
    if (!codigo.trim()) return;
    setEntrando(true);
    setErro('');
    try {
      await api.post('/campaigns/join', {
        code: codigo.toUpperCase(),
        user_id: user.id
      });
      setCodigo('');
      alert('✅ Entrou na campanha com sucesso!');
    } catch {
      setErro('Código inválido ou campanha não encontrada.');
    }
    setEntrando(false);
  }

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0]" style={crimson}>
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>⚔ TAVERNA</span>
        <button onClick={() => navigate(-1)}
          className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors" style={cinzel}>
          ← Voltar
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">CAMPANHAS</p>
        <h1 style={cinzel} className="text-3xl text-[#f0e8d8] font-bold mb-8">Suas Campanhas</h1>

        {/* Abas */}
        <div className="flex gap-px mb-8 border-b border-[#c8a84b15]">
          {isMestre ? (
            <>
              <button onClick={() => setAba('minhas')}
                className="px-6 py-3 text-xs tracking-widest transition-colors"
                style={{ ...cinzel, borderBottom: aba === 'minhas' ? '2px solid #c8a84b' : '2px solid transparent', color: aba === 'minhas' ? '#c8a84b' : '#4a4030' }}>
                MINHAS CAMPANHAS
              </button>
              <button onClick={() => setAba('criar')}
                className="px-6 py-3 text-xs tracking-widest transition-colors"
                style={{ ...cinzel, borderBottom: aba === 'criar' ? '2px solid #c8a84b' : '2px solid transparent', color: aba === 'criar' ? '#c8a84b' : '#4a4030' }}>
                + CRIAR
              </button>
            </>
          ) : (
            <button onClick={() => setAba('entrar')}
              className="px-6 py-3 text-xs tracking-widest transition-colors"
              style={{ ...cinzel, borderBottom: '2px solid #c8a84b', color: '#c8a84b' }}>
              ENTRAR COM CÓDIGO
            </button>
          )}
        </div>

        {/* Criar campanha (mestre) */}
        {aba === 'criar' && isMestre && (
          <div className="border border-[#c8a84b20] bg-[#161410] p-6 mb-6">
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-4">NOVA CAMPANHA</p>
            <div className="flex flex-col gap-3">
              <input value={novaCampanha.name}
                onChange={e => setNovaCampanha(p => ({ ...p, name: e.target.value }))}
                placeholder="Nome da campanha..."
                className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
                style={{ borderRadius: '2px' }} />
              <textarea value={novaCampanha.description}
                onChange={e => setNovaCampanha(p => ({ ...p, description: e.target.value }))}
                placeholder="Descrição opcional..."
                rows={3}
                className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50] resize-none"
                style={{ borderRadius: '2px' }} />
              {erro && <p className="text-red-400 text-sm">{erro}</p>}
              <button onClick={criarCampanha} disabled={criando || !novaCampanha.name.trim()}
                className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-2 text-xs font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-50 self-start"
                style={{ ...cinzel, borderRadius: '2px' }}>
                {criando ? '⟳ CRIANDO...' : '✦ CRIAR CAMPANHA'}
              </button>
            </div>
          </div>
        )}

        {/* Lista campanhas (mestre) */}
        {aba === 'minhas' && isMestre && (
          loading ? (
            <div className="flex items-center gap-3 justify-center py-16">
              <div className="w-6 h-6 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
            </div>
          ) : campanhas.length === 0 ? (
            <div className="text-center py-16 border border-[#c8a84b15] bg-[#161410]">
              <p style={cinzel} className="text-[#4a4030] text-sm">Nenhuma campanha criada.</p>
              <button onClick={() => setAba('criar')}
                className="mt-4 bg-[#c8a84b] text-[#0f0e0c] px-6 py-2 text-xs font-bold hover:bg-[#e0c060] transition-colors"
                style={{ ...cinzel, borderRadius: '2px' }}>
                Criar primeira campanha
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {campanhas.map(c => (
                <div key={c.id} className="border border-[#c8a84b20] bg-[#161410] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 style={cinzel} className="text-[#f0e8d8] text-lg font-semibold">{c.name}</h3>
                      {c.description && <p className="text-[#6a6050] text-sm mt-1">{c.description}</p>}
                    </div>
                    <div className="text-right">
                      <p style={cinzel} className="text-[#4a4030] text-xs tracking-[2px] mb-1">CÓDIGO</p>
                      <p style={cinzel} className="text-[#c8a84b] text-2xl font-bold tracking-widest">{c.code}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Entrar com código (jogador) */}
        {!isMestre && (
          <div className="border border-[#c8a84b20] bg-[#161410] p-6">
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-4">CÓDIGO DA CAMPANHA</p>
            <div className="flex gap-3">
              <input value={codigo}
                onChange={e => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ex: TVRN42"
                maxLength={6}
                className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#c8a84b] px-4 py-3 flex-1 text-center text-xl tracking-widest font-bold focus:outline-none focus:border-[#c8a84b50]"
                style={{ ...cinzel, borderRadius: '2px' }} />
              <button onClick={entrarCampanha} disabled={entrando || codigo.length !== 6}
                className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-3 text-xs font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-50"
                style={{ ...cinzel, borderRadius: '2px' }}>
                {entrando ? '⟳' : 'ENTRAR →'}
              </button>
            </div>
            {erro && <p className="text-red-400 text-sm mt-3">{erro}</p>}
          </div>
        )}
      </div>
    </div>
  );
}