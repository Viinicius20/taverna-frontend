import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };
const CAMPANHA_ID = '00000000-0000-0000-0000-000000000001';

export default function Locais() {
  const navigate = useNavigate();
  const [locais, setLocais] = useState([]);
  const [faccoes, setFaccoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [gerando, setGerando] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    buscarLocais();
    api.get(`/factions/${CAMPANHA_ID}`).then(res => setFaccoes(res.data.data || [])).catch(() => setFaccoes([]));
  }, []);

  async function buscarLocais() {
    try {
      const res = await api.get(`/locations/${CAMPANHA_ID}`);
      setLocais(res.data.data || []);
    } catch {
      setLocais([]);
    }
    setCarregando(false);
  }

  async function gerarLocal() {
    if (!descricao.trim()) return;
    setGerando(true);
    setErro('');
    try {
      await api.post('/locations/generate', { campaign_id: CAMPANHA_ID, description: descricao });
      setDescricao('');
      setMostrarForm(false);
      buscarLocais();
    } catch {
      setErro('Erro ao gerar local.');
    }
    setGerando(false);
  }

  async function vincularFaccao(locationId, factionId) {
    try {
      await api.patch(`/locations/${locationId}`, { faction_id: factionId || null });
      setLocais(prev => prev.map(l => l.id === locationId ? { ...l, faction_id: factionId } : l));
    } catch {
      alert('Erro ao vincular facção.');
    }
  }

  async function deletarLocal(id) {
    if (!window.confirm('Tem certeza que deseja deletar este local?')) return;
    try {
      await api.delete(`/locations/${id}`);
      setLocais(prev => prev.filter(l => l.id !== id));
    } catch {
      alert('Erro ao deletar.');
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0] page-fade" style={crimson}>
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>⚔ TAVERNA</span>
        <button onClick={() => navigate('/mestre')}
          className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors" style={cinzel}>
          ← Voltar
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">MUNDO</p>
            <h1 style={cinzel} className="text-2xl text-[#f0e8d8] font-semibold">Locais</h1>
          </div>
          <button onClick={() => setMostrarForm(!mostrarForm)}
            className="bg-[#c8a84b] text-[#0f0e0c] px-5 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors"
            style={{ ...cinzel, borderRadius: '2px' }}>
            + Novo Local
          </button>
        </div>

        {mostrarForm && (
          <div className="border border-[#c8a84b30] bg-[#161410] mb-8 p-6">
            <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] block mb-2">DESCRIÇÃO</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder="Ex: uma cidade portuária corrupta controlada por contrabandistas..."
              rows={3}
              className="bg-[#0f0e0c] border border-[#c8a84b30] text-[#e8e0d0] px-4 py-3 w-full focus:outline-none focus:border-[#c8a84b60] resize-none mb-4"
              style={{ borderRadius: '2px' }} />
            {erro && <p className="text-red-400 text-sm mb-3">{erro}</p>}
            <button onClick={gerarLocal} disabled={!descricao.trim() || gerando}
              className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30"
              style={{ ...cinzel, borderRadius: '2px' }}>
              {gerando ? 'Gerando...' : 'Gerar Local com IA →'}
            </button>
          </div>
        )}

        {carregando ? (
          <div className="flex items-center gap-3 justify-center py-16">
            <div className="w-6 h-6 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
            <p style={cinzel} className="text-[#4a4030] text-xs tracking-widest">CARREGANDO...</p>
          </div>
        ) : locais.length === 0 ? (
          <p style={cinzel} className="text-[#3a3020] text-sm text-center py-16">NENHUM LOCAL REGISTRADO</p>
        ) : (
          <div className="space-y-2">
            {locais.map(l => {
              const faccaoVinculada = faccoes.find(f => f.id === l.faction_id);
              return (
                <div key={l.id} className="border border-[#c8a84b15] bg-[#161410]" style={{ borderRadius: '2px' }}>
                  <div className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-[#1c1a16] transition-colors"
                    onClick={() => setExpandido(expandido === l.id ? null : l.id)}>
                    <div className="flex items-center gap-3">
                      <span style={cinzel} className="text-[#e8e0d0] text-sm font-bold">{l.name}</span>
                      <span className="text-[#4a4030] text-xs">{l.type}</span>
                      {faccaoVinculada && (
                        <span className="text-xs border border-[#c8a84b30] text-[#c8a84b] px-2 py-0.5" style={{ borderRadius: '2px' }}>
                          🏛 {faccaoVinculada.name}
                        </span>
                      )}
                    </div>
                    <span className="text-[#4a4030] text-xs">{expandido === l.id ? '▲' : '▼'}</span>
                  </div>
                  {expandido === l.id && (
                    <div className="px-6 pb-5 border-t border-[#c8a84b10] pt-4 flex flex-col gap-3">
                      {l.description && <p className="text-[#8a8070] text-sm leading-relaxed">{l.description}</p>}

                      {[
                        { label: 'REGIÃO', val: l.region_info },
                        { label: 'COMÉRCIO', val: l.commerce },
                        { label: 'MONSTROS/PERIGOS', val: l.monsters },
                        { label: 'IDEIAS DE QUEST', val: l.quests },
                        { label: 'AMEAÇA PRINCIPAL', val: l.boss },
                      ].filter(({ val }) => val).map(({ label, val }) => (
                        <div key={label}>
                          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-1">{label}</p>
                          <p className="text-[#6a6050] text-sm">{val}</p>
                        </div>
                      ))}

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {l.language && <div><span style={cinzel} className="text-[#4a4030]">IDIOMA </span><span className="text-[#a09880]">{l.language}</span></div>}
                        {l.avg_level && <div><span style={cinzel} className="text-[#4a4030]">NÍVEL MÉDIO </span><span className="text-[#a09880]">{l.avg_level}</span></div>}
                      </div>

                      <div>
                        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-2">FACÇÃO CONTROLADORA</p>
                        <select value={l.faction_id || ''} onChange={e => vincularFaccao(l.id, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm w-full focus:outline-none focus:border-[#c8a84b50]"
                          style={{ borderRadius: '2px' }}>
                          <option value="">Nenhuma</option>
                          {faccoes.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>

                      <button onClick={() => deletarLocal(l.id)}
                        className="text-red-900 hover:text-red-600 text-xs border border-red-900 hover:border-red-600 px-3 py-1.5 transition-colors self-end"
                        style={{ ...cinzel, borderRadius: '2px' }}>
                        Deletar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}