import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };
const CAMPANHA_ID = '00000000-0000-0000-0000-000000000001';

const STATUS_COR = {
  ativo: '#c8a84b',
  concluido: '#4a8a4a',
  congelado: '#4a6a8a',
  cancelado: '#6a6050',
};

export default function MundoVivo() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [novoEvento, setNovoEvento] = useState({ name: '', description: '', deadline: '', consequences: '' });
  const [criando, setCriando] = useState(false);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    buscarEventos();
  }, []);

  async function buscarEventos() {
    try {
      const res = await api.get(`/world-events/${CAMPANHA_ID}`);
      setEventos(res.data.data || []);
    } catch {
      setEventos([]);
    }
    setCarregando(false);
  }

  async function criarEvento() {
    if (!novoEvento.name.trim()) return;
    setCriando(true);
    try {
      await api.post('/world-events', { campaign_id: CAMPANHA_ID, ...novoEvento });
      setNovoEvento({ name: '', description: '', deadline: '', consequences: '' });
      setMostrarForm(false);
      buscarEventos();
    } catch {
      alert('Erro ao criar evento.');
    }
    setCriando(false);
  }

  async function atualizarProgresso(id, novoProgresso) {
    const progresso = Math.max(0, Math.min(100, novoProgresso));
    try {
      await api.patch(`/world-events/${id}`, {
        progress: progresso,
        status: progresso >= 100 ? 'concluido' : 'ativo'
      });
      setEventos(prev => prev.map(e => e.id === id ? { ...e, progress: progresso, status: progresso >= 100 ? 'concluido' : 'ativo' } : e));
    } catch {
      alert('Erro ao atualizar progresso.');
    }
  }

  async function toggleTrava(id, atual) {
    try {
      await api.patch(`/world-events/${id}`, { locked_by_master: !atual });
      setEventos(prev => prev.map(e => e.id === id ? { ...e, locked_by_master: !atual } : e));
    } catch {
      alert('Erro ao travar evento.');
    }
  }

  async function deletarEvento(id) {
    if (!window.confirm('Tem certeza que deseja deletar este evento?')) return;
    try {
      await api.delete(`/world-events/${id}`);
      setEventos(prev => prev.filter(e => e.id !== id));
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
            <h1 style={cinzel} className="text-2xl text-[#f0e8d8] font-semibold">Mundo Vivo</h1>
          </div>
          <button onClick={() => setMostrarForm(!mostrarForm)}
            className="bg-[#c8a84b] text-[#0f0e0c] px-5 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors"
            style={{ ...cinzel, borderRadius: '2px' }}>
            + Novo Evento
          </button>
        </div>

        {mostrarForm && (
          <div className="border border-[#c8a84b30] bg-[#161410] mb-8 p-6 flex flex-col gap-3">
            <input value={novoEvento.name} onChange={e => setNovoEvento(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome do evento (ex: Golpe em Valdris)"
              className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
              style={{ borderRadius: '2px' }} />
            <textarea value={novoEvento.description} onChange={e => setNovoEvento(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição do que está acontecendo..."
              rows={2}
              className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50] resize-none"
              style={{ borderRadius: '2px' }} />
            <input value={novoEvento.deadline} onChange={e => setNovoEvento(prev => ({ ...prev, deadline: e.target.value }))}
              placeholder="Prazo (opcional, ex: próxima lua cheia, 4 dias)"
              className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
              style={{ borderRadius: '2px' }} />
            <textarea value={novoEvento.consequences} onChange={e => setNovoEvento(prev => ({ ...prev, consequences: e.target.value }))}
              placeholder="O que acontece quando chegar a 100%..."
              rows={2}
              className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50] resize-none"
              style={{ borderRadius: '2px' }} />
            <button onClick={criarEvento} disabled={!novoEvento.name.trim() || criando}
              className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30"
              style={{ ...cinzel, borderRadius: '2px' }}>
              {criando ? 'Criando...' : 'Criar Evento →'}
            </button>
          </div>
        )}

        {carregando ? (
          <div className="flex items-center gap-3 justify-center py-16">
            <div className="w-6 h-6 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
            <p style={cinzel} className="text-[#4a4030] text-xs tracking-widest">CARREGANDO...</p>
          </div>
        ) : eventos.length === 0 ? (
          <p style={cinzel} className="text-[#3a3020] text-sm text-center py-16">NENHUM EVENTO REGISTRADO</p>
        ) : (
          <div className="space-y-2">
            {eventos.map(ev => (
              <div key={ev.id} className="border border-[#c8a84b15] bg-[#161410]" style={{ borderRadius: '2px' }}>
                <div className="px-6 py-4 cursor-pointer hover:bg-[#1c1a16] transition-colors"
                  onClick={() => setExpandido(expandido === ev.id ? null : ev.id)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {ev.locked_by_master && <span title="Travado pelo mestre">🔒</span>}
                      <span style={cinzel} className="text-[#e8e0d0] text-sm font-bold">{ev.name}</span>
                      {ev.deadline && <span className="text-[#4a4030] text-xs">· {ev.deadline}</span>}
                    </div>
                    <span style={{ ...cinzel, color: STATUS_COR[ev.status] }} className="text-xs">
                        {ev.status?.toUpperCase()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#0f0e0c] rounded-full overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${ev.progress}%`, backgroundColor: STATUS_COR[ev.status] || '#c8a84b' }} />
                  </div>
                  <p className="text-[#4a4030] text-xs mt-1">{ev.progress}%</p>
                </div>

                {expandido === ev.id && (
                  <div className="px-6 pb-5 border-t border-[#c8a84b10] pt-4 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                    {ev.description && <p className="text-[#8a8070] text-sm leading-relaxed">{ev.description}</p>}
                    {ev.consequences && (
                      <div>
                        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-1">CONSEQUÊNCIAS AO CONCLUIR</p>
                        <p className="text-[#6a6050] text-sm">{ev.consequences}</p>
                      </div>
                    )}

                    <div>
                      <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-2">AVANÇAR PROGRESSO</p>
                      <div className="flex gap-2">
                        {[-20, -10, 10, 20].map(delta => (
                          <button key={delta} onClick={() => atualizarProgresso(ev.id, ev.progress + delta)}
                            disabled={ev.locked_by_master}
                            className="border border-[#c8a84b30] text-[#c8a84b] px-3 py-1 text-xs hover:bg-[#c8a84b10] transition-colors disabled:opacity-30"
                            style={{ ...cinzel, borderRadius: '2px' }}>
                            {delta > 0 ? '+' : ''}{delta}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button onClick={() => toggleTrava(ev.id, ev.locked_by_master)}
                        className="border border-[#4a6a8a40] text-[#4a6a8a] px-3 py-1.5 text-xs hover:bg-[#4a6a8a10] transition-colors"
                        style={{ ...cinzel, borderRadius: '2px' }}>
                        {ev.locked_by_master ? '🔓 Destravar' : '🔒 Travar'}
                      </button>
                      <button onClick={() => deletarEvento(ev.id)}
                        className="text-red-900 hover:text-red-600 text-xs border border-red-900 hover:border-red-600 px-3 py-1.5 transition-colors"
                        style={{ ...cinzel, borderRadius: '2px' }}>
                        Deletar
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