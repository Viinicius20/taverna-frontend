import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };

// ID fixo de campanha local enquanto não tem login
const CAMPANHA_ID = '00000000-0000-0000-0000-000000000001';

export default function Mestre() {
  const navigate = useNavigate();
  const [npcs, setNpcs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');
  const [npcExpandido, setNpcExpandido] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [descNpc, setDescNpc] = useState('');
  const [sistema, setSistema] = useState('D&D 5e');
  const sistemas = ['D&D 5e', 'Tormenta20', 'Pathfinder 2e', 'Call of Cthulhu', 'Outro'];

  // Campos editáveis locais (salvos no localStorage)
  const [notasLocais, setNotasLocais] = useState({});

  useEffect(() => {
    buscarNpcs();
    const notas = localStorage.getItem('taverna-notas-npcs');
    if (notas) setNotasLocais(JSON.parse(notas));
  }, []);

  async function buscarNpcs() {
    setCarregando(true);
    try {
      // Primeiro garante que a campanha existe no Supabase
      const res = await api.get(`/npcs/${CAMPANHA_ID}`);
      setNpcs(res.data.data || []);
    } catch {
      // Se a campanha não existir ainda, começa vazio
      setNpcs([]);
    }
    setCarregando(false);
  }

  async function gerarNpc() {
    if (!descNpc.trim()) return;
    setGerando(true);
    setErro('');
    try {
      const res = await api.post('/npcs', null, {
        params: {
          campaign_id: CAMPANHA_ID,
          description: descNpc,
          system: sistema,
        }
      });
      const novoNpc = res.data;
      setNpcs(prev => [novoNpc, ...prev]);
      setDescNpc('');
      setMostrarForm(false);
      setNpcExpandido(novoNpc.saved_id || novoNpc.id);
    } catch (e) {
      setErro('Erro ao gerar NPC. Verifique se o backend está rodando.');
    }
    setGerando(false);
  }

  async function deletarNpc(id) {
    if (!window.confirm('Deletar este NPC?')) return;
    try {
      await api.delete(`/npcs/${id}`);
      setNpcs(prev => prev.filter(n => n.id !== id));
      if (npcExpandido === id) setNpcExpandido(null);
    } catch {
      setErro('Erro ao deletar NPC.');
    }
  }

  function editarNotaLocal(id, campo, valor) {
    const novas = { ...notasLocais, [`${id}_${campo}`]: valor };
    setNotasLocais(novas);
    localStorage.setItem('taverna-notas-npcs', JSON.stringify(novas));
  }

  function getNota(id, campo, fallback = '') {
    return notasLocais[`${id}_${campo}`] ?? fallback;
  }

  const attrLabel = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0]" style={crimson}>

      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>
          ⚔ TAVERNA
        </span>
        <div className="flex gap-6 items-center">
          <button onClick={() => navigate('/')}
            className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors" style={cinzel}>
            ← Voltar
          </button>
          <button onClick={() => setMostrarForm(f => !f)}
            className="bg-[#c8a84b] text-[#0f0e0c] px-5 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors"
            style={{ ...cinzel, borderRadius: '2px' }}>
            + Novo NPC
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">

        {/* HEADER */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">ÁREA RESTRITA</p>
            <h1 style={cinzel} className="text-3xl text-[#f0e8d8] font-bold mb-2">Área do Mestre</h1>
            <p className="text-[#7a7060] font-light">Informações secretas visíveis apenas para você.</p>
          </div>
          <div className="border border-[#c8a84b20] bg-[#c8a84b08] px-4 py-2 text-right">
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-widest">🔒 PRIVADO</p>
            <p className="text-[#4a4030] text-xs mt-0.5 font-light">Jogadores não veem esta área</p>
          </div>
        </div>

        <div className="w-16 h-px bg-[#c8a84b30] mb-10" />

        {/* FORM NOVO NPC */}
        {mostrarForm && (
          <div className="border border-[#c8a84b30] bg-[#161410] mb-8">
            <div className="px-6 py-4 border-b border-[#c8a84b15] flex items-center justify-between">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">GERAR NOVO NPC</p>
              <button onClick={() => setMostrarForm(false)}
                className="text-[#4a4030] hover:text-[#c8a84b] text-xl transition-colors">×</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] block mb-2">SISTEMA</label>
                <select value={sistema} onChange={e => setSistema(e.target.value)}
                  className="bg-[#0f0e0c] border border-[#c8a84b30] text-[#e8e0d0] px-4 py-3 w-full focus:outline-none focus:border-[#c8a84b60]"
                  style={{ ...cinzel, fontSize: '0.85rem', borderRadius: '2px' }}>
                  {sistemas.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] block mb-2">DESCRIÇÃO DO NPC</label>
                <textarea value={descNpc} onChange={e => setDescNpc(e.target.value)}
                  placeholder="Ex: taberneiro anão idoso que esconde um passado como assassino, desconfiado de estranhos..."
                  rows={3}
                  className="bg-[#0f0e0c] border border-[#c8a84b30] text-[#e8e0d0] px-4 py-3 w-full focus:outline-none focus:border-[#c8a84b60] resize-none placeholder-[#3a3528]"
                  style={{ fontSize: '1rem', borderRadius: '2px', lineHeight: '1.7' }} />
              </div>
              {erro && <p className="text-red-400 text-sm">{erro}</p>}
              <div className="flex gap-3">
                <button onClick={gerarNpc} disabled={!descNpc.trim() || gerando}
                  className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30"
                  style={{ ...cinzel, borderRadius: '2px' }}>
                  {gerando ? 'Gerando...' : 'Gerar NPC com IA →'}
                </button>
                <button onClick={() => setMostrarForm(false)}
                  className="border border-[#c8a84b30] text-[#6a6050] px-6 py-2 text-xs tracking-widest hover:border-[#c8a84b60] transition-colors"
                  style={{ ...cinzel, borderRadius: '2px' }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CARREGANDO */}
        {carregando && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-10 h-10 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
            <p style={cinzel} className="text-[#c8a84b] text-sm tracking-widest">CARREGANDO...</p>
          </div>
        )}

        {/* GERANDO */}
        {gerando && (
          <div className="flex items-center gap-4 border border-[#c8a84b15] bg-[#161410] px-6 py-4 mb-6">
            <div className="w-5 h-5 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin flex-shrink-0" />
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-widest">FORJANDO O NPC...</p>
          </div>
        )}

        {/* VAZIO */}
        {!carregando && npcs.length === 0 && !mostrarForm && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 border border-[#c8a84b15] bg-[#161410]">
            <span className="text-4xl opacity-20">◈</span>
            <p style={cinzel} className="text-[#4a4030] text-sm tracking-widest">NENHUM NPC AINDA</p>
            <button onClick={() => setMostrarForm(true)}
              className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors mt-2"
              style={{ ...cinzel, borderRadius: '2px' }}>
              Gerar Primeiro NPC
            </button>
          </div>
        )}

        {/* LISTA */}
        {!carregando && npcs.length > 0 && (
          <div className="flex flex-col gap-px bg-[#c8a84b15] border border-[#c8a84b15]">
            {npcs.map(npc => {
              const d = npc.data || {};
              const expandido = npcExpandido === npc.id;
              const attrs = d.attributes || {};

              return (
                <div key={npc.id} className="bg-[#161410]">
                  {/* CABEÇALHO */}
                  <div className="p-6 flex items-start justify-between gap-4 cursor-pointer hover:bg-[#1c1a16] transition-colors"
                    onClick={() => setNpcExpandido(expandido ? null : npc.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h2 style={cinzel} className="text-[#f0e8d8] text-lg font-semibold">
                          {d.name || npc.name}
                        </h2>
                        {d.race && (
                          <span className="text-[#4a4030] text-xs" style={cinzel}>{d.race}</span>
                        )}
                      </div>
                      <p className="text-[#6a6050] text-sm">
                        {[d.occupation, d.alignment].filter(Boolean).join(' · ')}
                      </p>
                      {getNota(npc.id, 'secret') && !expandido && (
                        <p className="text-[#4a3020] text-xs mt-1 font-light">🔒 Segredo registrado</p>
                      )}
                    </div>
                    <span style={cinzel} className="text-[#4a4030] text-lg">{expandido ? '∧' : '∨'}</span>
                  </div>

                  {/* DETALHES */}
                  {expandido && (
                    <div className="border-t border-[#c8a84b10] px-6 pb-6 flex flex-col gap-6 pt-6">

                      {/* Atributos */}
                      {Object.keys(attrs).length > 0 && (
                        <div>
                          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-3">ATRIBUTOS</p>
                          <div className="flex gap-4 flex-wrap">
                            {Object.entries(attrs).map(([attr, val]) => (
                              <div key={attr} className="flex flex-col items-center gap-0.5 border border-[#c8a84b15] px-3 py-2 bg-[#0f0e0c]">
                                <span style={cinzel} className="text-[#4a4030] text-xs">{attrLabel[attr] || attr.toUpperCase()}</span>
                                <span className="text-[#c8a84b] text-base">{val}</span>
                                <span style={cinzel} className="text-[#3a3020] text-xs">
                                  {Math.floor((val - 10) / 2) >= 0 ? '+' : ''}{Math.floor((val - 10) / 2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dados gerados pela IA */}
                      {[
                        { label: 'PERSONALIDADE', campo: 'personality' },
                        { label: 'MOTIVAÇÃO', campo: 'motivation' },
                        { label: 'APARÊNCIA', campo: 'appearance' },
                      ].map(({ label, campo }) => d[campo] ? (
                        <div key={campo}>
                          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-1">{label}</p>
                          <p className="text-[#6a6050] text-sm leading-relaxed font-light">{d[campo]}</p>
                        </div>
                      ) : null)}

                      {/* Campos editáveis pelo mestre (salvos local) */}
                      {[
                        { label: '🔒 SEGREDO', campo: 'secret', placeholder: 'O que este NPC esconde dos aventureiros...', cor: '#8a5030' },
                        { label: 'NOTAS DO MESTRE', campo: 'notes', placeholder: 'Anotações privadas...', cor: '#8a5030' },
                      ].map(({ label, campo, placeholder, cor }) => (
                        <div key={campo}>
                          <label style={{ ...cinzel, color: cor }} className="text-xs tracking-[2px] block mb-2">{label}</label>
                          <textarea
                            value={getNota(npc.id, campo)}
                            onChange={e => editarNotaLocal(npc.id, campo, e.target.value)}
                            placeholder={placeholder}
                            rows={2}
                            className="bg-[#0f0e0c] text-[#a09880] px-4 py-3 w-full focus:outline-none resize-none placeholder-[#2a2520] text-sm"
                            style={{ borderRadius: '2px', lineHeight: '1.7', border: 'none', borderLeft: `2px solid rgba(180,80,40,0.3)` }} />
                        </div>
                      ))}

                      {/* Features */}
                      {d.features && d.features.length > 0 && (
                        <div>
                          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-3">HABILIDADES</p>
                          <div className="flex flex-wrap gap-2">
                            {d.features.map((f, i) => (
                              <span key={i} className="border border-[#c8a84b20] text-[#6a6050] px-2 py-0.5 text-xs"
                                style={{ borderRadius: '2px' }}>{f}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* História */}
                      {d.background_story && (
                        <div>
                          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-2">HISTÓRIA</p>
                          <p className="text-[#5a5040] text-sm leading-relaxed font-light">{d.background_story}</p>
                        </div>
                      )}

                      <div className="flex justify-end pt-2 border-t border-[#c8a84b10]">
                        <button onClick={() => deletarNpc(npc.id)}
                          className="text-red-900 hover:text-red-600 text-xs border border-red-900 hover:border-red-600 px-4 py-1.5 transition-colors"
                          style={{ ...cinzel, borderRadius: '2px', letterSpacing: '1px' }}>
                          Deletar NPC
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!carregando && npcs.length > 0 && (
          <p style={cinzel} className="text-[#3a3020] text-xs tracking-widest text-center mt-6">
            {npcs.length} {npcs.length === 1 ? 'NPC' : 'NPCs'} REGISTRADOS
          </p>
        )}
      </div>
    </div>
  );
}