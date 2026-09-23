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
  const [novoEvento, setNovoEvento] = useState({ 
  name: '', description: '', deadline: '', consequences: '', 
  next_event_name: '', next_event_description: '',
  affects_faction_id: '', faction_reputation_change: '', sets_flag_key: ''
});
  const [criando, setCriando] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [sugestoes, setSugestoes] = useState({});
  const [gerandoSugestao, setGerandoSugestao] = useState(null);
  const [worldLog, setWorldLog] = useState([]);
  const [flags, setFlags] = useState([]);
  const [novaFlagKey, setNovaFlagKey] = useState('');
  const [novaFlagDesc, setNovaFlagDesc] = useState('');
  const [criandoFlag, setCriandoFlag] = useState(false);
  const [faccoes, setFaccoes] = useState([]);
  const [eventosRegionais, setEventosRegionais] = useState([]);
  const [novoEventoRegional, setNovoEventoRegional] = useState({
  regiao: '', tipo_evento: '', motivo: '',
  modificadores: { comida: 1, armas: 1, viagem: 1, comercio: 1 },
  });
  const [criandoEventoRegional, setCriandoEventoRegional] = useState(false);
 
  const [cidades, setCidades] = useState([]);
  const [viagens, setViagens] = useState([]);
  const [novaViagem, setNovaViagem] = useState({ cidade_origem_id: '', cidade_destino_id: '' });
  const [iniciandoViagem, setIniciandoViagem] = useState(false);
  const [avancandoDia, setAvancandoDia] = useState(null);

  useEffect(() => {
  buscarEventos();
  api.get(`/world-log/${CAMPANHA_ID}`).then(res => setWorldLog(res.data.data || [])).catch(() => setWorldLog([]));
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

async function pedirSugestaoEvento(id) {
  setGerandoSugestao(id);
  try {
    const res = await api.post(`/world-events/${id}/sugerir`);
    setSugestoes(prev => ({ ...prev, [id]: res.data.data }));
  } catch {
    alert('Erro ao gerar sugestão.');
  }
  setGerandoSugestao(null);
}

function ignorarSugestao(id) {
  setSugestoes(prev => {
    const novo = { ...prev };
    delete novo[id];
    return novo;
  });
}

async function aprovarSugestao(evento, sugestao) {
  try {
    await api.post('/world-events', {
      campaign_id: CAMPANHA_ID,
      name: `Desdobramento: ${evento.name}`,
      description: sugestao,
    });
    ignorarSugestao(evento.id);
    buscarEventos();
  } catch {
    alert('Erro ao criar evento a partir da sugestão.');
  }
}

useEffect(() => {
  buscarEventos();
  api.get(`/world-log/${CAMPANHA_ID}`).then(res => setWorldLog(res.data.data || [])).catch(() => setWorldLog([]));
  api.get(`/flags/${CAMPANHA_ID}`).then(res => setFlags(res.data.data || [])).catch(() => setFlags([]));
}, []);

async function criarFlag() {
  if (!novaFlagKey.trim()) return;
  setCriandoFlag(true);
  try {
    const res = await api.post('/flags', {
      campaign_id: CAMPANHA_ID,
      key: novaFlagKey.trim().toLowerCase().replace(/\s+/g, '_'),
      value: false,
      description: novaFlagDesc
    });
    setFlags(prev => [...prev, res.data.data]);
    setNovaFlagKey('');
    setNovaFlagDesc('');
  } catch {
    alert('Erro ao criar flag.');
  }
  setCriandoFlag(false);
}

async function toggleFlag(id, valorAtual) {
  try {
    await api.patch(`/flags/${id}`, { value: !valorAtual });
    setFlags(prev => prev.map(f => f.id === id ? { ...f, value: !valorAtual } : f));
  } catch {
    alert('Erro ao atualizar flag.');
  }
}

async function deletarFlag(id) {
  if (!window.confirm('Deletar esta flag?')) return;
  try {
    await api.delete(`/flags/${id}`);
    setFlags(prev => prev.filter(f => f.id !== id));
  } catch {
    alert('Erro ao deletar.');
  }
}

async function criarEventoRegional() {
  if (!novoEventoRegional.regiao.trim() || !novoEventoRegional.motivo.trim()) return;
  setCriandoEventoRegional(true);
  try {
    const res = await api.post('/economia/eventos', { campaign_id: CAMPANHA_ID, ...novoEventoRegional });
    setEventosRegionais(prev => [res.data, ...prev]);
    setNovoEventoRegional({ regiao: '', tipo_evento: '', motivo: '', modificadores: { comida: 1, armas: 1, viagem: 1, comercio: 1 } });
  } catch {
    alert('Erro ao criar evento regional.');
  }
  setCriandoEventoRegional(false);
}
 
async function encerrarEventoRegional(id) {
  try {
    await api.patch(`/economia/eventos/${id}/encerrar`);
    setEventosRegionais(prev => prev.map(e => e.id === id ? { ...e, ativo: false } : e));
  } catch {
    alert('Erro ao encerrar evento.');
  }
}
 
async function iniciarViagem() {
  if (!novaViagem.cidade_origem_id || !novaViagem.cidade_destino_id) return;
  setIniciandoViagem(true);
  try {
    const res = await api.post('/viagem/iniciar', { campaign_id: CAMPANHA_ID, ...novaViagem });
    setViagens(prev => [res.data, ...prev]);
    setNovaViagem({ cidade_origem_id: '', cidade_destino_id: '' });
  } catch {
    alert('Erro ao iniciar viagem.');
  }
  setIniciandoViagem(false);
}
 
async function avancarDiaViagem(id) {
  setAvancandoDia(id);
  try {
    const res = await api.post(`/viagem/${id}/avancar`);
    setViagens(prev => prev.map(v => v.id === id ? res.data : v));
  } catch {
    alert('Erro ao avançar viagem.');
  }
  setAvancandoDia(null);
}
 

useEffect(() => {
  buscarEventos();
  api.get(`/world-log/${CAMPANHA_ID}`).then(res => setWorldLog(res.data.data || [])).catch(() => setWorldLog([]));
  api.get(`/flags/${CAMPANHA_ID}`).then(res => setFlags(res.data.data || [])).catch(() => setFlags([]));
  api.get(`/factions/${CAMPANHA_ID}`).then(res => setFaccoes(res.data.data || [])).catch(() => setFaccoes([]));
  api.get(`/economia/eventos-campanha/${CAMPANHA_ID}`).then(res => setEventosRegionais(res.data.data || [])).catch(() => setEventosRegionais([]));
  api.get(`/viagem/cidades/${CAMPANHA_ID}`).then(res => setCidades(res.data.data || [])).catch(() => setCidades([]));
  api.get(`/viagem/campanha/${CAMPANHA_ID}`).then(res => setViagens(res.data.data || [])).catch(() => setViagens([]));
}, []);

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

    <input value={novoEvento.next_event_name} onChange={e => setNovoEvento(prev => ({ ...prev, next_event_name: e.target.value }))}
      placeholder="(Opcional) Nome do evento que nasce quando este terminar"
      className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
      style={{ borderRadius: '2px' }} />
    <textarea value={novoEvento.next_event_description} onChange={e => setNovoEvento(prev => ({ ...prev, next_event_description: e.target.value }))}
      placeholder="(Opcional) Descrição desse próximo evento"
      rows={2}
      className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50] resize-none"
      style={{ borderRadius: '2px' }} />

      <select value={novoEvento.affects_faction_id} onChange={e => setNovoEvento(prev => ({ ...prev, affects_faction_id: e.target.value }))}
       className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
        style={{ borderRadius: '2px' }}>
        <option value="">(Opcional) Afeta qual facção?</option>
        {faccoes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>

{novoEvento.affects_faction_id && (
  <select value={novoEvento.faction_reputation_change} onChange={e => setNovoEvento(prev => ({ ...prev, faction_reputation_change: e.target.value }))}
    className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
    style={{ borderRadius: '2px' }}>
    <option value="">Nova reputação ao concluir</option>
    <option value="aliada">Aliada</option>
    <option value="neutra">Neutra</option>
    <option value="hostil">Hostil</option>
  </select>
)}

<input value={novoEvento.sets_flag_key} 
  onChange={e => setNovoEvento(prev => ({ ...prev, sets_flag_key: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
  placeholder="(Opcional) Ativa qual flag ao concluir (ex: rei_morto)"
  className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
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

{worldLog.length > 0 && (
  <div className="mt-12">
    <div className="w-16 h-px bg-[#c8a84b30] mb-8" />
    <p style={cinzel} className="text-[#8a4a8a] text-xs tracking-[4px] mb-2 opacity-70">CRÔNICAS OCULTAS</p>
    <h2 style={cinzel} className="text-xl text-[#f0e8d8] font-semibold mb-6">O Mundo Que Vocês Não Viram</h2>

    <div className="space-y-2">
      {worldLog.map(log => (
        <div key={log.id} className="border border-[#8a4a8a15] bg-[#161410] px-4 py-3" style={{ borderRadius: '2px' }}>
          <div className="flex items-center justify-between mb-1">
            <span style={cinzel} className="text-[#8a4a8a] text-xs">{log.event_name}</span>
            <span className="text-[#3a3020] text-xs">Sessão #{log.session_number}</span>
          </div>
          <p className="text-[#6a6050] text-sm">{log.description}</p>
        </div>
      ))}
    </div>
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
<p className="text-[#4a4030] text-xs mt-1">
  {ev.progress}%
  {ev.next_event_name && (
    <span className="ml-3">
      → {ev.triggered_event_id ? '✓ ' : ''}
      <span style={cinzel} className="text-[#8a4a8a]">{ev.next_event_name}</span>
    </span>
  )}
</p>
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

                    <div>
  <button onClick={() => pedirSugestaoEvento(ev.id)}
    disabled={gerandoSugestao === ev.id}
    className="w-full border border-[#8a4a8a40] text-[#8a4a8a] py-2 text-xs tracking-widest hover:bg-[#8a4a8a10] transition-colors disabled:opacity-50"
    style={{ ...cinzel, borderRadius: '2px' }}>
    {gerandoSugestao === ev.id ? 'Pensando...' : '💭 Sugerir Desdobramento'}
  </button>

  {sugestoes[ev.id] && (
    <div className="mt-3 border border-[#8a4a8a30] bg-[#8a4a8a08] p-4">
      <p className="text-[#e8e0d0] text-sm italic mb-3">{sugestoes[ev.id]}</p>
      <div className="flex gap-2">
        <button onClick={() => aprovarSugestao(ev, sugestoes[ev.id])}
          className="flex-1 bg-[#8a4a8a] text-[#0f0e0c] py-1.5 text-xs font-bold hover:bg-[#a05aa0] transition-colors"
          style={{ ...cinzel, borderRadius: '2px' }}>
          ✓ Aprovar
        </button>
        <button onClick={() => ignorarSugestao(ev.id)}
          className="flex-1 border border-[#c8a84b20] text-[#4a4030] py-1.5 text-xs hover:border-[#c8a84b40] transition-colors"
          style={{ ...cinzel, borderRadius: '2px' }}>
          ✕ Ignorar
        </button>
      </div>
    </div>
  )}
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

        {/* FLAGS DA CAMPANHA */}
<div className="mt-12">
  <div className="w-16 h-px bg-[#c8a84b30] mb-8" />
  <p style={cinzel} className="text-[#4a6a8a] text-xs tracking-[4px] mb-2 opacity-70">ESTADO DO MUNDO</p>
  <h2 style={cinzel} className="text-xl text-[#f0e8d8] font-semibold mb-6">Flags</h2>

  <div className="border border-[#c8a84b20] bg-[#161410] mb-6 p-6 flex flex-col gap-3">
    <input value={novaFlagKey} onChange={e => setNovaFlagKey(e.target.value)}
      placeholder="Nome da flag (ex: rei_morto, portal_aberto)"
      className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
      style={{ borderRadius: '2px' }} />
    <input value={novaFlagDesc} onChange={e => setNovaFlagDesc(e.target.value)}
      placeholder="Descrição (opcional)"
      className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
      style={{ borderRadius: '2px' }} />
    <button onClick={criarFlag} disabled={!novaFlagKey.trim() || criandoFlag}
      className="bg-[#4a6a8a] text-[#0f0e0c] px-5 py-2 text-xs tracking-widest font-bold hover:bg-[#5a7a9a] transition-colors disabled:opacity-30"
      style={{ ...cinzel, borderRadius: '2px' }}>
      {criandoFlag ? 'Criando...' : '+ Nova Flag'}
    </button>
  </div>

  {flags.length === 0 ? (
    <p className="text-[#3a3020] text-sm text-center py-6">Nenhuma flag registrada.</p>
  ) : (
    <div className="grid grid-cols-2 gap-2">
      {flags.map(f => (
        <div key={f.id} className={`border p-3 flex items-center justify-between ${f.value ? 'border-[#4a8a4a30] bg-[#4a8a4a08]' : 'border-[#c8a84b15] bg-[#161410]'}`}
          style={{ borderRadius: '2px' }}>
          <div>
            <p style={cinzel} className={`text-sm ${f.value ? 'text-[#4a8a4a]' : 'text-[#6a6050]'}`}>{f.key}</p>
            {f.description && <p className="text-[#3a3020] text-xs mt-0.5">{f.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleFlag(f.id, f.value)}
              className="text-xs px-2 py-1 border transition-colors"
              style={{ borderRadius: '2px', ...cinzel, borderColor: f.value ? '#4a8a4a' : '#c8a84b30', color: f.value ? '#4a8a4a' : '#4a4030' }}>
              {f.value ? 'TRUE' : 'FALSE'}
            </button>
            <button onClick={() => deletarFlag(f.id)}
              className="text-red-900 hover:text-red-600 text-xs transition-colors">×</button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

{/* ECONOMIA VIVA */}
<div className="mt-12">
  <div className="w-16 h-px bg-[#c8a84b30] mb-8" />
  <p style={cinzel} className="text-[#4a6a8a] text-xs tracking-[4px] mb-2 opacity-70">ESTADO DO MUNDO</p>
  <h2 style={cinzel} className="text-xl text-[#c8a84b] font-semibold mb-6">💰 Economia Viva</h2>
 
  <div className="border border-[#c8a84b20] bg-[#161410] mb-6 p-6 flex flex-col gap-3">
    <input value={novoEventoRegional.regiao}
      onChange={e => setNovoEventoRegional(prev => ({ ...prev, regiao: e.target.value }))}
      placeholder="Região"
      className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
      style={{ borderRadius: '2px' }} />
    <input value={novoEventoRegional.tipo_evento}
      onChange={e => setNovoEventoRegional(prev => ({ ...prev, tipo_evento: e.target.value }))}
      placeholder="Tipo (guerra, peste...)"
      className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
      style={{ borderRadius: '2px' }} />
    <input value={novoEventoRegional.motivo}
      onChange={e => setNovoEventoRegional(prev => ({ ...prev, motivo: e.target.value }))}
      placeholder="Motivo (ex: Guerra regional)"
      className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
      style={{ borderRadius: '2px' }} />
 
    <div className="grid grid-cols-2 gap-3">
      {['comida', 'armas', 'viagem', 'comercio'].map(campo => (
        <label key={campo} className="flex items-center gap-2 text-[#6a6050] text-xs">
          {campo}
          <input type="number" step="0.1" value={novoEventoRegional.modificadores[campo]}
            onChange={e => setNovoEventoRegional(prev => ({
              ...prev, modificadores: { ...prev.modificadores, [campo]: parseFloat(e.target.value) }
            }))}
            className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-2 py-1 text-sm w-full focus:outline-none focus:border-[#c8a84b50]"
            style={{ borderRadius: '2px' }} />
        </label>
      ))}
    </div>
 
    <button onClick={criarEventoRegional} disabled={!novoEventoRegional.regiao.trim() || !novoEventoRegional.motivo.trim() || criandoEventoRegional}
      className="bg-[#4a6a8a] text-[#0f0e0c] px-5 py-2 text-xs tracking-widest font-bold hover:bg-[#5a7a9a] transition-colors disabled:opacity-30"
      style={{ ...cinzel, borderRadius: '2px' }}>
      {criandoEventoRegional ? 'Criando...' : '+ Criar Evento'}
    </button>
  </div>
 
  {eventosRegionais.length === 0 ? (
    <p className="text-[#3a3020] text-sm text-center py-6">Nenhum evento regional registrado.</p>
  ) : (
    <div className="grid grid-cols-2 gap-2">
      {eventosRegionais.map(ev => (
        <div key={ev.id} className={`border p-3 flex items-center justify-between ${ev.ativo ? 'border-[#c8a84b30] bg-[#c8a84b08]' : 'border-[#c8a84b15] bg-[#161410]'}`}
          style={{ borderRadius: '2px' }}>
          <div>
            <p style={cinzel} className={`text-sm ${ev.ativo ? 'text-[#c8a84b]' : 'text-[#6a6050]'}`}>{ev.regiao} — {ev.tipo_evento}</p>
            <p className="text-[#3a3020] text-xs mt-0.5">{ev.motivo}</p>
            <p className="text-[#4a4030] text-xs mt-0.5">
              {Object.entries(ev.modificadores).map(([k, v]) => `${k}: x${v}`).join(' · ')}
            </p>
          </div>
          {ev.ativo && (
            <button onClick={() => encerrarEventoRegional(ev.id)}
              className="text-red-900 hover:text-red-600 text-xs transition-colors">×</button>
          )}
        </div>
      ))}
    </div>
  )}
</div>
 
{/* VIAGEM COMO SISTEMA */}
<div className="mt-12">
  <div className="w-16 h-px bg-[#c8a84b30] mb-8" />
  <p style={cinzel} className="text-[#4a6a8a] text-xs tracking-[4px] mb-2 opacity-70">ESTADO DO MUNDO</p>
  <h2 style={cinzel} className="text-xl text-[#c8a84b] font-semibold mb-6">🧭 Viagem</h2>
 
  <div className="border border-[#c8a84b20] bg-[#161410] mb-6 p-6 flex flex-col gap-3">
    <div className="flex gap-3">
      <select value={novaViagem.cidade_origem_id}
        onChange={e => setNovaViagem(prev => ({ ...prev, cidade_origem_id: e.target.value }))}
        className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm flex-1 focus:outline-none focus:border-[#c8a84b50]"
        style={{ borderRadius: '2px' }}>
        <option value="">Origem</option>
        {cidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
      <select value={novaViagem.cidade_destino_id}
        onChange={e => setNovaViagem(prev => ({ ...prev, cidade_destino_id: e.target.value }))}
        className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm flex-1 focus:outline-none focus:border-[#c8a84b50]"
        style={{ borderRadius: '2px' }}>
        <option value="">Destino</option>
        {cidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
    </div>
    <button onClick={iniciarViagem} disabled={!novaViagem.cidade_origem_id || !novaViagem.cidade_destino_id || iniciandoViagem}
      className="bg-[#4a6a8a] text-[#0f0e0c] px-5 py-2 text-xs tracking-widest font-bold hover:bg-[#5a7a9a] transition-colors disabled:opacity-30"
      style={{ ...cinzel, borderRadius: '2px' }}>
      {iniciandoViagem ? 'Calculando...' : 'Iniciar Viagem'}
    </button>
  </div>
 
  {viagens.length === 0 ? (
    <p className="text-[#3a3020] text-sm text-center py-6">Nenhuma viagem registrada.</p>
  ) : (
    <div className="flex flex-col gap-2">
      {viagens.map(v => (
        <div key={v.id} className="border border-[#c8a84b20] bg-[#161410] p-4"
          style={{ borderRadius: '2px' }}>
          <div className="flex items-center justify-between">
            <p style={cinzel} className="text-[#e8e0d0] text-sm">
              {v.cidade_origem_id?.nome || '?'} → {v.cidade_destino_id?.nome || '?'}
            </p>
            <p style={{ color: STATUS_COR[v.status] || '#6a6050' }} className="text-xs uppercase tracking-wider">
              {v.status}
            </p>
          </div>
          <p className="text-[#6a6050] text-xs mt-1">
            Dia {v.dia_atual}/{v.tempo_estimado_dias} · Clima: {v.clima}
          </p>
 
          {v.eventos?.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              {v.eventos.map((ev, i) => (
                <p key={i} className="text-[#c8a84b] text-xs">⚠️ Dia {ev.dia}: {ev.descricao}</p>
              ))}
            </div>
          )}
 
          {v.status === 'em_andamento' && (
            <button onClick={() => avancarDiaViagem(v.id)} disabled={avancandoDia === v.id}
              className="mt-3 text-xs px-3 py-1 border border-[#c8a84b30] text-[#c8a84b] hover:bg-[#c8a84b10] transition-colors disabled:opacity-30"
              style={{ ...cinzel, borderRadius: '2px' }}>
              {avancandoDia === v.id ? 'Avançando...' : 'Avançar 1 Dia'}
            </button>
          )}
        </div>
      ))}
    </div>
  )}
</div>
      </div>
    </div>
  );
}