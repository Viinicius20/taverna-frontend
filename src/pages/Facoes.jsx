import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };
const CAMPANHA_ID = '00000000-0000-0000-0000-000000000001';

const REPUTACAO_COR = {
  aliada: '#4a8a4a',
  neutra: '#8a8070',
  hostil: '#8a2020',
};

export default function Facoes() {
  const navigate = useNavigate();
  const [faccoes, setFaccoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [descricaoFaccao, setDescricaoFaccao] = useState('');
  const [gerando, setGerando] = useState(false);
  const [faccaoExpandida, setFaccaoExpandida] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    buscarFaccoes();
  }, []);

  async function buscarFaccoes() {
    try {
      const res = await api.get(`/factions/${CAMPANHA_ID}`);
      setFaccoes(res.data.data || []);
    } catch {
      setFaccoes([]);
    }
    setCarregando(false);
  }

  async function gerarFaccao() {
    if (!descricaoFaccao.trim()) return;
    setGerando(true);
    setErro('');
    try {
      await api.post('/factions/generate', {
        campaign_id: CAMPANHA_ID,
        description: descricaoFaccao,
      });
      setDescricaoFaccao('');
      setMostrarForm(false);
      buscarFaccoes();
    } catch {
      setErro('Erro ao gerar facção.');
    }
    setGerando(false);
  }

  async function atualizarReputacao(id, novaReputacao) {
    try {
      await api.patch(`/factions/${id}`, { reputation: novaReputacao });
      setFaccoes(prev => prev.map(f => f.id === id ? { ...f, reputation: novaReputacao } : f));
    } catch {
      alert('Erro ao atualizar reputação.');
    }
  }

  async function deletarFaccao(id) {
    if (!window.confirm('Tem certeza que deseja deletar esta facção?')) return;
    try {
      await api.delete(`/factions/${id}`);
      setFaccoes(prev => prev.filter(f => f.id !== id));
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
            <h1 style={cinzel} className="text-2xl text-[#f0e8d8] font-semibold">Facções</h1>
          </div>
          <button onClick={() => setMostrarForm(!mostrarForm)}
            className="bg-[#c8a84b] text-[#0f0e0c] px-5 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors"
            style={{ ...cinzel, borderRadius: '2px' }}>
            + Nova Facção
          </button>
        </div>

        {mostrarForm && (
          <div className="border border-[#c8a84b30] bg-[#161410] mb-8 p-6">
            <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] block mb-2">DESCRIÇÃO</label>
            <textarea value={descricaoFaccao} onChange={e => setDescricaoFaccao(e.target.value)}
              placeholder="Ex: uma guilda de mercadores corrupta que controla o comércio da cidade..."
              rows={3}
              className="bg-[#0f0e0c] border border-[#c8a84b30] text-[#e8e0d0] px-4 py-3 w-full focus:outline-none focus:border-[#c8a84b60] resize-none mb-4"
              style={{ borderRadius: '2px' }} />
            {erro && <p className="text-red-400 text-sm mb-3">{erro}</p>}
            <button onClick={gerarFaccao} disabled={!descricaoFaccao.trim() || gerando}
              className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30"
              style={{ ...cinzel, borderRadius: '2px' }}>
              {gerando ? 'Gerando...' : 'Gerar Facção com IA →'}
            </button>
          </div>
        )}

        {carregando ? (
          <div className="flex items-center gap-3 justify-center py-16">
            <div className="w-6 h-6 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
            <p style={cinzel} className="text-[#4a4030] text-xs tracking-widest">CARREGANDO...</p>
          </div>
        ) : faccoes.length === 0 ? (
          <p style={cinzel} className="text-[#3a3020] text-sm text-center py-16">NENHUMA FACÇÃO REGISTRADA</p>
        ) : (
          <div className="space-y-2">
            {faccoes.map(f => (
              <div key={f.id} className="border border-[#c8a84b15] bg-[#161410]" style={{ borderRadius: '2px' }}>
                <div className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-[#1c1a16] transition-colors"
                  onClick={() => setFaccaoExpandida(faccaoExpandida === f.id ? null : f.id)}>
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: REPUTACAO_COR[f.reputation] || '#8a8070' }} />
                    <span style={cinzel} className="text-[#e8e0d0] text-sm font-bold">{f.name}</span>
                    <span className="text-[#4a4030] text-xs">{f.type}</span>
                  </div>
                  <span className="text-[#4a4030] text-xs">{faccaoExpandida === f.id ? '▲' : '▼'}</span>
                </div>
                {faccaoExpandida === f.id && (
                  <div className="px-6 pb-5 border-t border-[#c8a84b10] pt-4 flex flex-col gap-3">
                    {f.description && <p className="text-[#8a8070] text-sm leading-relaxed">{f.description}</p>}
                    {f.goals && (
                      <div>
                        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-1">OBJETIVOS</p>
                        <p className="text-[#6a6050] text-sm">{f.goals}</p>
                      </div>
                    )}
                    <div>
                      <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-2">REPUTAÇÃO</p>
                      <div className="flex gap-2">
                        {['aliada', 'neutra', 'hostil'].map(rep => (
                          <button key={rep} onClick={() => atualizarReputacao(f.id, rep)}
                            className="px-3 py-1 text-xs border transition-all"
                            style={{
                              borderRadius: '2px', ...cinzel,
                              borderColor: f.reputation === rep ? REPUTACAO_COR[rep] : '#c8a84b15',
                              backgroundColor: f.reputation === rep ? `${REPUTACAO_COR[rep]}25` : 'transparent',
                              color: f.reputation === rep ? REPUTACAO_COR[rep] : '#4a4030',
                            }}>
                            {rep.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => deletarFaccao(f.id)}
                      className="text-red-900 hover:text-red-600 text-xs border border-red-900 hover:border-red-600 px-3 py-1.5 transition-colors self-end"
                      style={{ ...cinzel, borderRadius: '2px' }}>
                      Deletar
                    </button>
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