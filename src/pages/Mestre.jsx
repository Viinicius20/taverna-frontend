import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Dados from '../components/Dados';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };

const CAMPANHA_ID = '00000000-0000-0000-0000-000000000001';
const attrLabel = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };

export default function Mestre() {
  const navigate = useNavigate();
  const [npcs, setNpcs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');
  const [npcExpandido, setNpcExpandido] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [abaForm, setAbaForm] = useState('ia');
  const [descNpc, setDescNpc] = useState('');
  const [sistema, setSistema] = useState('D&D 5e');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfNome, setPdfNome] = useState('');
  const sistemas = ['D&D 5e', 'Tormenta20', 'Pathfinder 2e', 'Call of Cthulhu', 'Outro'];
  const [notasLocais, setNotasLocais] = useState({});
  const [attrsLocais, setAttrsLocais] = useState({});

  useEffect(() => {
    buscarNpcs();
    const notas = localStorage.getItem('taverna-notas-npcs');
    if (notas) setNotasLocais(JSON.parse(notas));
    const attrs = localStorage.getItem('taverna-attrs-npcs');
    if (attrs) setAttrsLocais(JSON.parse(attrs));
  }, []);

  async function buscarNpcs() {
    setCarregando(true);
    try {
      const res = await api.get(`/npcs/${CAMPANHA_ID}`);
      setNpcs(res.data.data || []);
    } catch {
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
        params: { campaign_id: CAMPANHA_ID, description: descNpc, system: sistema }
      });
      setNpcs(prev => [{
        id: res.data.id || res.data.saved_id,
        name: res.data.data?.name || 'NPC',
        data: res.data.data
      }, ...prev]);
      setDescNpc('');
      setMostrarForm(false);
      setNpcExpandido(res.data.id || res.data.saved_id);
    } catch {
      setErro('Erro ao gerar NPC. Verifique se o backend está rodando.');
    }
    setGerando(false);
  }

  async function importarPdfNpc() {
    if (!pdfFile) return;
    setGerando(true);
    setErro('');
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);

      // Usa o endpoint dedicado que salva direto como NPC
      const res = await api.post(
        `/upload-pdf-npc?system=${encodeURIComponent(sistema)}&campaign_id=${CAMPANHA_ID}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // Monta objeto NPC com id para exibição
      const novoNpc = {
        id: res.data.saved_id,
        name: res.data.data?.name || 'NPC importado',
        data: res.data.data,
      };

      setNpcs(prev => [novoNpc, ...prev]);
      setPdfFile(null);
      setPdfNome('');
      setMostrarForm(false);
      setNpcExpandido(res.data.saved_id);
    } catch {
      setErro('Erro ao importar PDF. Verifique se é uma ficha de RPG válida.');
    }
    setGerando(false);
  }

  function selecionarPdf(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPdfFile(file);
    setPdfNome(file.name);
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

  function editarAttrLocal(npcId, attr, valor) {
    const novos = { ...attrsLocais, [`${npcId}_${attr}`]: Number(valor) };
    setAttrsLocais(novos);
    localStorage.setItem('taverna-attrs-npcs', JSON.stringify(novos));
  }

  function getAttr(npcId, attr, fallback) {
    return attrsLocais[`${npcId}_${attr}`] !== undefined ? attrsLocais[`${npcId}_${attr}`] : fallback;
  }

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0]" style={crimson}>

      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>⚔ TAVERNA</span>
        <div className="flex gap-6 items-center">
          <button onClick={() => navigate('/')}
            className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors" style={cinzel}>
            ← Voltar
          </button>
          <button onClick={() => { setMostrarForm(f => !f); setErro(''); }}
            className="bg-[#c8a84b] text-[#0f0e0c] px-5 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors"
            style={{ ...cinzel, borderRadius: '2px' }}>
            + Novo NPC
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">

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
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">NOVO NPC</p>
              <button onClick={() => setMostrarForm(false)}
                className="text-[#4a4030] hover:text-[#c8a84b] text-xl transition-colors">×</button>
            </div>

            <div className="flex gap-px border-b border-[#c8a84b15]">
              {[{ id: 'ia', label: '✦ Gerar com IA' }, { id: 'pdf', label: '◈ Importar PDF' }].map(({ id, label }) => (
                <button key={id} onClick={() => { setAbaForm(id); setErro(''); }}
                  className="px-6 py-3 text-xs tracking-widest transition-colors"
                  style={{ ...cinzel, background: abaForm === id ? '#c8a84b' : 'transparent', color: abaForm === id ? '#0f0e0c' : '#6a6050' }}>
                  {label}
                </button>
              ))}
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

              {abaForm === 'ia' && (
                <>
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
                </>
              )}

              {abaForm === 'pdf' && (
                <>
                  <div>
                    <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] block mb-2">ARQUIVO PDF</label>
                    <label className="flex flex-col items-center justify-center border border-dashed border-[#c8a84b30] bg-[#0f0e0c] py-10 cursor-pointer hover:border-[#c8a84b60] hover:bg-[#161410] transition-all"
                      style={{ borderRadius: '2px' }}>
                      <input type="file" accept=".pdf" onChange={selecionarPdf} className="hidden" />
                      <span className="text-2xl mb-2" style={{ color: '#c8a84b' }}>◈</span>
                      {pdfNome ? (
                        <>
                          <p style={cinzel} className="text-[#c8a84b] text-sm tracking-widest mb-1">{pdfNome}</p>
                          <p className="text-[#4a4030] text-xs">Clique para trocar</p>
                        </>
                      ) : (
                        <>
                          <p style={cinzel} className="text-[#6a6050] text-sm tracking-widest mb-1">Clique para selecionar o PDF</p>
                          <p className="text-[#3a3528] text-xs">Ficha de qualquer sistema</p>
                        </>
                      )}
                    </label>
                  </div>
                  {pdfNome && (
                    <div className="border border-[#c8a84b15] bg-[#c8a84b05] px-4 py-3">
                      <p className="text-[#6a6050] text-sm font-light">
                        ✦ A IA vai ler a ficha e criar o NPC diretamente — sem criar personagem.
                      </p>
                    </div>
                  )}
                  {erro && <p className="text-red-400 text-sm">{erro}</p>}
                  <div className="flex gap-3">
                    <button onClick={importarPdfNpc} disabled={!pdfFile || gerando}
                      className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30"
                      style={{ ...cinzel, borderRadius: '2px' }}>
                      {gerando ? 'Importando...' : 'Importar PDF →'}
                    </button>
                    <button onClick={() => setMostrarForm(false)}
                      className="border border-[#c8a84b30] text-[#6a6050] px-6 py-2 text-xs tracking-widest hover:border-[#c8a84b60] transition-colors"
                      style={{ ...cinzel, borderRadius: '2px' }}>
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {carregando && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-10 h-10 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
            <p style={cinzel} className="text-[#c8a84b] text-sm tracking-widest">CARREGANDO...</p>
          </div>
        )}

        {gerando && (
          <div className="flex items-center gap-4 border border-[#c8a84b15] bg-[#161410] px-6 py-4 mb-6">
            <div className="w-5 h-5 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin flex-shrink-0" />
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-widest">
              {abaForm === 'pdf' ? 'LENDO O PDF...' : 'FORJANDO O NPC...'}
            </p>
          </div>
        )}

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

        {!carregando && npcs.length > 0 && (
          <div className="flex flex-col gap-px bg-[#c8a84b15] border border-[#c8a84b15]">
            {npcs.map(npc => {
              const d = npc.data || {};
              const expandido = npcExpandido === npc.id;
              const attrs = d.attributes || {};

              return (
                <div key={npc.id} className="bg-[#161410]">
                  <div className="p-6 flex items-start justify-between gap-4 cursor-pointer hover:bg-[#1c1a16] transition-colors"
                    onClick={() => setNpcExpandido(expandido ? null : npc.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h2 style={cinzel} className="text-[#f0e8d8] text-lg font-semibold">{d.name || npc.name}</h2>
                        {d.race && <span className="text-[#4a4030] text-xs" style={cinzel}>{d.race}</span>}
                        {d.level && <span className="text-[#4a4030] text-xs" style={cinzel}>Nível {d.level}</span>}
                      </div>
                      <p className="text-[#6a6050] text-sm">
                        {[d.occupation || d.class, d.alignment].filter(Boolean).join(' · ')}
                      </p>
                      {getNota(npc.id, 'secret') && !expandido && (
                        <p className="text-[#4a3020] text-xs mt-1 font-light">🔒 Segredo registrado</p>
                      )}
                    </div>
                    <span style={cinzel} className="text-[#4a4030] text-lg">{expandido ? '∧' : '∨'}</span>
                  </div>

                  {expandido && (
                    <div className="border-t border-[#c8a84b10] px-6 pb-6 flex flex-col gap-6 pt-6">

                    {/* STATS DE COMBATE */}
                      {d.combat && (
                        <div className="border border-[#c8a84b15] bg-[#c8a84b05] p-4">
                          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-4">STATS DE COMBATE</p>
                          
                          {/* HP */}
                          <div className="flex gap-6 mb-4 pb-4 border-b border-[#c8a84b10]">
                            <div className="flex-1">
                              <label style={cinzel} className="text-[#c8a84b] text-xs tracking-widest block mb-1">HP ATUAL</label>
                              <input type="number" min={0} value={getAttr(npc.id, 'combat_hp', d.combat.hp || 0)}
                                onChange={e => editarAttrLocal(npc.id, 'combat_hp', e.target.value)}
                                onClick={e => e.stopPropagation()}
                                className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#c8a84b] text-center text-lg w-full py-2 focus:outline-none focus:border-[#c8a84b50]"
                                style={{ borderRadius: '2px' }} />
                            </div>
                            <div className="flex-1">
                              <label style={cinzel} className="text-[#c8a84b] text-xs tracking-widest block mb-1">HP MÁXIMO</label>
                              <input type="number" min={1} value={getAttr(npc.id, 'combat_hp_max', d.combat.hp_max || 0)}
                                onChange={e => editarAttrLocal(npc.id, 'combat_hp_max', e.target.value)}
                                onClick={e => e.stopPropagation()}
                                className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#c8a84b] text-center text-lg w-full py-2 focus:outline-none focus:border-[#c8a84b50]"
                                style={{ borderRadius: '2px' }} />
                            </div>
                          </div>

                          {/* CA, Iniciativa, Velocidade */}
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            {[
                              { label: 'CA', attr: 'combat_ac', val: d.combat.ac },
                              { label: 'INICIATIVA', attr: 'combat_initiative', val: d.combat.initiative },
                              { label: 'VELOCIDADE', attr: 'combat_speed', val: d.combat.speed },
                            ].map(({ label, attr, val }) => (
                              <div key={attr}>
                                <label style={cinzel} className="text-[#c8a84b] text-xs tracking-widest block mb-1">{label}</label>
                                <input type="number" value={getAttr(npc.id, attr, val || 0)}
                                  onChange={e => editarAttrLocal(npc.id, attr, e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#c8a84b] text-center text-lg w-full py-2 focus:outline-none focus:border-[#c8a84b50]"
                                  style={{ borderRadius: '2px' }} />
                              </div>
                            ))}
                          </div>

                          {/* Bônus Prof, Perc Passiva, Dado de Vida */}
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label: 'BÔNUS PROF.', attr: 'combat_proficiency_bonus', val: d.combat.proficiency_bonus },
                              { label: 'PERC. PASSIVA', attr: 'combat_passive_perception', val: d.combat.passive_perception },
                              { label: 'DADO DE VIDA', attr: 'combat_hit_dice', val: d.combat.hit_dice, tipo: 'text' },
                            ].map(({ label, attr, val, tipo }) => (
                              <div key={attr}>
                                <label style={cinzel} className="text-[#c8a84b] text-xs tracking-widest block mb-1">{label}</label>
                                <input type={tipo || "number"} value={getAttr(npc.id, attr, val || 0)}
                                  onChange={e => editarAttrLocal(npc.id, attr, e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#c8a84b] text-center text-lg w-full py-2 focus:outline-none focus:border-[#c8a84b50]"
                                  style={{ borderRadius: '2px' }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SPELLCASTING */}
                      {d.spellcasting && (
                        <div className="border border-[#c8a84b15] bg-[#c8a84b05] p-4">
                          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-4">LANÇAMENTO DE FEITIÇOS</p>
                          
                          <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-[#c8a84b10]">
                            <div>
                              <label style={cinzel} className="text-[#c8a84b] text-xs tracking-widest block mb-1">HABILIDADE</label>
                              <select value={getNota(npc.id, 'spellcasting_ability', d.spellcasting.ability || 'int')}
                                onChange={e => editarNotaLocal(npc.id, 'spellcasting_ability', e.target.value)}
                                onClick={e => e.stopPropagation()}
                                className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-2 py-1 w-full focus:outline-none focus:border-[#c8a84b50] text-xs"
                                style={{ borderRadius: '2px' }}>
                                {Object.entries(attrLabel).map(([key, val]) => (
                                  <option key={key} value={key}>{val}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={cinzel} className="text-[#c8a84b] text-xs tracking-widest block mb-1">DC</label>
                              <input type="number" value={getNota(npc.id, 'spellcasting_dc', d.spellcasting.dc || 0)}
                                onChange={e => editarNotaLocal(npc.id, 'spellcasting_dc', e.target.value)}
                                onClick={e => e.stopPropagation()}
                                className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#c8a84b] text-center text-lg w-full py-1 focus:outline-none focus:border-[#c8a84b50]"
                                style={{ borderRadius: '2px' }} />
                            </div>
                          </div>

                          {d.spellcasting.spells && d.spellcasting.spells.length > 0 ? (
                            <div className="space-y-2">
                              {d.spellcasting.spells.map((spell, idx) => (
                                <div key={idx} className="bg-[#0f0e0c] border border-[#c8a84b10] p-2 flex items-center gap-2 text-xs">
                                  <span className="flex-1 text-[#6a6050]">{spell.name || 'Sem nome'}</span>
                                  <span style={cinzel} className="text-[#4a4030] text-xs">N{spell.level || 0}</span>
                                  <span style={cinzel} className="text-[#4a4030] text-xs">{spell.slots_used || 0}/{spell.slots || 0}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[#4a4030] text-xs text-center py-2">Sem feitiços</p>
                          )}
                        </div>
                      )}
                      
                      {/* ATRIBUTOS EDITÁVEIS */}
                      {Object.keys(attrs).length > 0 && (
                        <div>
                          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-3">ATRIBUTOS</p>
                          <div className="grid grid-cols-6 gap-3">
                            {Object.entries(attrs).map(([attr, val]) => {
                              const valor = getAttr(npc.id, attr, val);
                              return (
                                <div key={attr} className="flex flex-col items-center gap-1">
                                  <label style={cinzel} className="text-[#c8a84b] text-xs tracking-widest">
                                    {attrLabel[attr] || attr.toUpperCase()}
                                  </label>
                                  <input type="number" min={1} max={30} value={valor}
                                    onChange={e => editarAttrLocal(npc.id, attr, e.target.value)}
                                    onClick={e => e.stopPropagation()}
                                    className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#c8a84b] text-center text-lg w-full py-2 focus:outline-none focus:border-[#c8a84b50]"
                                    style={{ borderRadius: '2px' }} />
                                  <span style={cinzel} className="text-[#3a3020] text-xs">
                                    {Math.floor((valor - 10) / 2) >= 0 ? '+' : ''}{Math.floor((valor - 10) / 2)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

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

                      {/* CAMPOS EDITÁVEIS DO MESTRE */}
                      {[
                        { label: '🔒 SEGREDO', campo: 'secret', placeholder: 'O que este NPC esconde dos aventureiros...', cor: '#8a5030', rows: 3 },
                        { label: 'NOTAS DO MESTRE', campo: 'notes', placeholder: 'Anotações privadas sobre este NPC...', cor: '#8a5030', rows: 4 },
                      ].map(({ label, campo, placeholder, cor, rows }) => (
                        <div key={campo}>
                          <label style={{ ...cinzel, color: cor }} className="text-xs tracking-[2px] block mb-2">{label}</label>
                          <textarea
                            value={getNota(npc.id, campo)}
                            onChange={e => editarNotaLocal(npc.id, campo, e.target.value)}
                            onClick={e => e.stopPropagation()}
                            placeholder={placeholder}
                            rows={rows}
                            className="bg-[#0f0e0c] text-[#a09880] px-4 py-3 w-full focus:outline-none placeholder-[#2a2520] text-sm"
                            style={{ borderRadius: '2px', lineHeight: '1.7', border: 'none', borderLeft: '2px solid rgba(180,80,40,0.3)', resize: 'vertical' }} />
                        </div>
                      ))}

                      {d.inventory && d.inventory.length > 0 && (
                        <div>
                          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-3">INVENTÁRIO</p>
                          <div className="flex flex-wrap gap-2">
                            {d.inventory.map((item, i) => (
                              <span key={i} className="border border-[#c8a84b15] text-[#6a6050] px-2 py-0.5 text-xs"
                                style={{ borderRadius: '2px' }}>{item}</span>
                            ))}
                          </div>
                        </div>
                      )}

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

        {/* DADOS SECRETOS */}
        <div className="mt-12">
          <div className="w-16 h-px bg-[#c8a84b30] mb-8" />
          <p style={cinzel} className="text-[#8a5030] text-xs tracking-[4px] mb-2 opacity-70">EXCLUSIVO DO MESTRE</p>
          <h2 style={cinzel} className="text-xl text-[#f0e8d8] font-semibold mb-2">Rolagens Secretas</h2>
          <p className="text-[#7a7060] mb-6 font-light text-sm">Resultados visíveis apenas para você.</p>
          <Dados secreto={true} />
        </div>
      </div>
    </div>
  );
}