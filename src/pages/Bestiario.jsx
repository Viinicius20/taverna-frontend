import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };

const TIPOS = ['Aberração', 'Besta', 'Celestial', 'Construto', 'Dragão', 'Elemental', 'Fada', 'Espectro', 'Gigante', 'Humanoide', 'Monstruosidade', 'Gosma', 'Planta', 'Morto-vivo'];
const CRS = ['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'];

export default function Bestiario() {
  const navigate = useNavigate();
  const [monstros, setMonstros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroCR, setFiltroCR] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [monstroDetalhes, setMonstroDetalhes] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoCR, setNovoCR] = useState('');
  const [novoTipo, setNovoTipo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    buscarMonstros();
  }, [busca, filtroCR, filtroTipo]);

  async function buscarMonstros() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.append('name', busca);
      if (filtroCR) params.append('cr', filtroCR);
      if (filtroTipo) params.append('type', filtroTipo);
      const res = await api.get(`/bestiary?${params}`);
      setMonstros(res.data.data || []);
    } catch {
      setErro('Erro ao carregar bestiário.');
    }
    setLoading(false);
  }

  async function gerarMonstro() {
    if (!novoNome.trim()) return;
    setGerando(true);
    setErro('');
    try {
      const params = new URLSearchParams({ nome: novoNome });
      if (novoCR) params.append('cr', novoCR);
      if (novoTipo) params.append('tipo', novoTipo);
      if (novaDescricao) params.append('descricao', novaDescricao);
      const res = await api.post(`/bestiary/generate?${params}`);
      setMonstros(prev => [res.data.data, ...prev]);
      setNovoNome('');
      setNovoCR('');
      setNovoTipo('');
      setNovaDescricao('');
      setShowForm(false);
    } catch {
      setErro('Erro ao gerar monstro.');
    }
    setGerando(false);
  }

  async function deletarMonstro(id) {
    await api.delete(`/bestiary/${id}`);
    setMonstros(prev => prev.filter(m => m.id !== id));
    setMonstroDetalhes(null);
  }

  const attrLabel = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0]" style={crimson}>
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>⚔ TAVERNA</span>
        <button onClick={() => navigate('/mestre')}
          className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors" style={cinzel}>
          ← Área do Mestre
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">
        <p style={cinzel} className="text-[#8a5030] text-xs tracking-[4px] mb-2 opacity-70">MESTRE</p>
        <div className="flex items-center justify-between mb-8">
          <h1 style={cinzel} className="text-3xl text-[#f0e8d8] font-bold">Bestiário</h1>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-[#c8a84b] text-[#0f0e0c] px-4 py-2 text-xs font-bold hover:bg-[#e0c060] transition-colors"
            style={{ ...cinzel, borderRadius: '2px' }}>
            + GERAR COM IA
          </button>
        </div>

        {/* Form gerar */}
        {showForm && (
          <div className="border border-[#c8a84b20] bg-[#161410] p-6 mb-6">
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-4">GERAR MONSTRO COM IA</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input value={novoNome} onChange={e => setNovoNome(e.target.value)}
                placeholder="Nome do monstro *"
                className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
                style={{ borderRadius: '2px' }} />
              <select value={novoCR} onChange={e => setNovoCR(e.target.value)}
                className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#6a6050] px-3 py-2 text-sm focus:outline-none"
                style={{ borderRadius: '2px' }}>
                <option value="">CR (IA decide)</option>
                {CRS.map(cr => <option key={cr} value={cr}>CR {cr}</option>)}
              </select>
              <select value={novoTipo} onChange={e => setNovoTipo(e.target.value)}
                className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#6a6050] px-3 py-2 text-sm focus:outline-none"
                style={{ borderRadius: '2px' }}>
                <option value="">Tipo (IA decide)</option>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)}
                placeholder="Descrição opcional..."
                className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
                style={{ borderRadius: '2px' }} />
            </div>
            <button onClick={gerarMonstro} disabled={gerando || !novoNome.trim()}
              className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-2 text-xs font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-50"
              style={{ ...cinzel, borderRadius: '2px' }}>
              {gerando ? '⟳ GERANDO...' : '✦ GERAR'}
            </button>
            {erro && <p className="text-red-400 text-sm mt-2">{erro}</p>}
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="bg-[#161410] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 flex-1 min-w-48 text-sm focus:outline-none focus:border-[#c8a84b50] placeholder-[#3a3020]"
            style={{ borderRadius: '2px' }} />
          <select value={filtroCR} onChange={e => setFiltroCR(e.target.value)}
            className="bg-[#161410] border border-[#c8a84b20] text-[#6a6050] px-3 py-2 text-sm focus:outline-none"
            style={{ borderRadius: '2px' }}>
            <option value="">Todos os CRs</option>
            {CRS.map(cr => <option key={cr} value={cr}>CR {cr}</option>)}
          </select>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            className="bg-[#161410] border border-[#c8a84b20] text-[#6a6050] px-3 py-2 text-sm focus:outline-none"
            style={{ borderRadius: '2px' }}>
            <option value="">Todos os tipos</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center gap-3 justify-center py-16">
            <div className="w-6 h-6 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
            <p style={cinzel} className="text-[#4a4030] text-xs tracking-widest">CARREGANDO...</p>
          </div>
        ) : monstros.length === 0 ? (
          <div className="text-center py-16">
            <p style={cinzel} className="text-[#4a4030] text-sm">Nenhum monstro encontrado.</p>
            <p className="text-[#3a3020] text-sm mt-2">Gere um com IA ou adicione pelo Supabase.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {monstros.map((m, idx) => (
              <div key={idx}>
                <div className="border border-[#c8a84b15] bg-[#161410] p-4 cursor-pointer hover:border-[#c8a84b30] transition-all"
                  style={{ borderRadius: '2px' }}
                  onClick={() => setMonstroDetalhes(monstroDetalhes?.id === m.id ? null : m)}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span style={cinzel} className="text-[#c8a84b] text-xs w-12">CR {m.cr}</span>
                      <span style={cinzel} className="text-[#e8e0d0] text-sm font-bold">{m.name}</span>
                      <span className="text-[#4a4030] text-xs">{m.size} {m.type}</span>
                      {m.is_homebrew && (
                        <span style={cinzel} className="text-xs border border-[#8a5030] text-[#8a5030] px-1.5 py-0.5">HOMEBREW</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs" style={cinzel}>
                      <span className="text-[#6a6050]">HP <span className="text-[#e8e0d0]">{m.hp}</span></span>
                      <span className="text-[#6a6050]">CA <span className="text-[#e8e0d0]">{m.ac}</span></span>
                      <span className="text-[#4a4030]">{monstroDetalhes?.id === m.id ? '▲' : '▼'}</span>
                    </div>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {monstroDetalhes?.id === m.id && (
                  <div className="border border-[#c8a84b15] border-t-0 bg-[#0f0e0c] p-6 space-y-4">
                    {/* Atributos */}
                    {m.attributes && (
                      <div className="grid grid-cols-6 gap-2 text-center">
                        {Object.entries(m.attributes).map(([attr, val]) => (
                          <div key={attr} className="border border-[#c8a84b15] py-2">
                            <p style={cinzel} className="text-[#c8a84b] text-xs">{attrLabel[attr] || attr.toUpperCase()}</p>
                            <p style={cinzel} className="text-[#e8e0d0] text-lg font-bold">{val}</p>
                            <p className="text-[#4a4030] text-xs">{Math.floor((val-10)/2) >= 0 ? '+' : ''}{Math.floor((val-10)/2)}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Info */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      {m.speed && <div><span style={cinzel} className="text-[#4a4030] text-xs">VELOCIDADE </span><span className="text-[#a09880]">{m.speed}</span></div>}
                      {m.senses && <div><span style={cinzel} className="text-[#4a4030] text-xs">SENTIDOS </span><span className="text-[#a09880]">{m.senses}</span></div>}
                      {m.languages && <div><span style={cinzel} className="text-[#4a4030] text-xs">IDIOMAS </span><span className="text-[#a09880]">{m.languages}</span></div>}
                      {m.damage_resistances && <div><span style={cinzel} className="text-[#4a4030] text-xs">RESISTÊNCIAS </span><span className="text-[#a09880]">{m.damage_resistances}</span></div>}
                      {m.damage_immunities && <div><span style={cinzel} className="text-[#4a4030] text-xs">IMUNIDADES </span><span className="text-[#a09880]">{m.damage_immunities}</span></div>}
                    </div>

                    {/* Features */}
                    {m.features && m.features.length > 0 && (
                      <div>
                        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-2">HABILIDADES</p>
                        <div className="space-y-2">
                          {m.features.map((f, i) => (
                            <div key={i}>
                              <span style={cinzel} className="text-[#e8e0d0] text-sm font-bold">{f.name}. </span>
                              <span className="text-[#6a6050] text-sm">{f.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    {m.actions && m.actions.length > 0 && (
                      <div>
                        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-2">AÇÕES</p>
                        <div className="space-y-2">
                          {m.actions.map((a, i) => (
                            <div key={i}>
                              <span style={cinzel} className="text-[#e8e0d0] text-sm font-bold">{a.name}. </span>
                              <span className="text-[#6a6050] text-sm">{a.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ações Lendárias */}
                    {m.legendary_actions && m.legendary_actions.length > 0 && (
                      <div>
                        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-2">AÇÕES LENDÁRIAS</p>
                        <div className="space-y-2">
                          {m.legendary_actions.map((a, i) => (
                            <div key={i}>
                              <span style={cinzel} className="text-[#e8e0d0] text-sm font-bold">{a.name}. </span>
                              <span className="text-[#6a6050] text-sm">{a.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.description && (
                      <p className="text-[#4a4030] text-sm italic border-t border-[#c8a84b10] pt-3">{m.description}</p>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-[#c8a84b10]">
                      <button onClick={() => deletarMonstro(m.id)}
                        className="text-xs border border-red-900 text-red-900 px-3 py-1 hover:bg-red-900 hover:text-white transition-colors"
                        style={{ ...cinzel, borderRadius: '2px' }}>
                        🗑 DELETAR
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}