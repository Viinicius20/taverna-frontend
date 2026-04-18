import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };
const attrLabel = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };
const tipoColor = {
  'magia': '#7ab8d4',
  'feature racial': '#a8c87a',
  'feature de classe': '#c8a84b',
  'perícia': '#c87ab8',
};

export default function Ficha() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [personagem, setPersonagem] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Level up
  const [modalLevelUp, setModalLevelUp] = useState(false);
  const [nivelAlvo, setNivelAlvo] = useState(2);
  const [upando, setUpando] = useState(false);

  // Modal habilidade
  const [modal, setModal] = useState(null);
  const [descricaoSkill, setDescricaoSkill] = useState(null);
  const [carregandoSkill, setCarregandoSkill] = useState(false);

  useEffect(() => {
  buscarPersonagem();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [id]);

  async function buscarPersonagem() {
    setCarregando(true);
    try {
      const res = await api.get(`/characters/${id}`);
      setPersonagem(res.data.data);
      setFicha(res.data.data.data);
      setNivelAlvo((res.data.data.data?.level || 1) + 1);
    } catch {
      setErro('Personagem não encontrado.');
    }
    setCarregando(false);
  }

  function editarCampo(campo, valor) {
    setFicha(prev => ({ ...prev, [campo]: valor }));
  }

  function editarAtributo(attr, valor) {
    setFicha(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [attr]: Number(valor) }
    }));
  }

  async function salvarFicha() {
    setSalvando(true);
    setErro('');
    setSucesso('');
    try {
      await api.put(`/characters/${id}`, {
        data: ficha,
        name: ficha.name,
        system: personagem.system,
      });
      setSucesso('Ficha salva com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
    } catch {
      setErro('Erro ao salvar. Tente novamente.');
    }
    setSalvando(false);
  }

  async function fazerLevelUp() {
    setUpando(true);
    setErro('');
    try {
      const res = await api.post('/level-up', {
        character_id: id,
        ficha_atual: ficha,
        system: personagem.system || 'D&D 5e',
        nivel_alvo: nivelAlvo,
      });
      setFicha(res.data.data);
      setModalLevelUp(false);
      setSucesso(`Personagem subiu para o nível ${nivelAlvo}!`);
      setTimeout(() => setSucesso(''), 4000);
    } catch {
      setErro('Erro ao subir de nível. Tente novamente.');
    }
    setUpando(false);
  }

  async function abrirSkill(skillName) {
    setModal({ skill: skillName });
    setDescricaoSkill(null);
    setCarregandoSkill(true);
    try {
      const context = `${ficha?.race || ''} ${ficha?.class || ''} nível ${ficha?.level || 1}`;
      const res = await api.get(`/skill-description/${encodeURIComponent(skillName)}`, {
        params: { system: personagem?.system || 'D&D 5e', character_context: context }
      });
      setDescricaoSkill(res.data.data);
    } catch {
      setDescricaoSkill({ error: 'Não foi possível carregar a descrição.' });
    }
    setCarregandoSkill(false);
  }

  if (carregando) return (
    <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center" style={crimson}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
        <p style={cinzel} className="text-[#c8a84b] text-sm tracking-widest">CARREGANDO...</p>
      </div>
    </div>
  );

  if (!ficha) return (
    <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center" style={crimson}>
      <p className="text-red-400">{erro || 'Personagem não encontrado.'}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0]" style={crimson}>

      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>⚔ TAVERNA</span>
        <button onClick={() => navigate('/personagens')}
          className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors" style={cinzel}>
          ← Meus Personagens
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">

        {/* HEADER */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">FICHA DO PERSONAGEM</p>
            <h1 style={cinzel} className="text-3xl text-[#f0e8d8] font-bold">{ficha.name}</h1>
            <p className="text-[#6a6050] mt-1">{[ficha.race, ficha.class, ficha.background].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setModalLevelUp(true)}
              className="border border-[#c8a84b40] text-[#c8a84b] px-5 py-2 text-xs tracking-widest hover:bg-[#c8a84b10] transition-colors"
              style={{ ...cinzel, borderRadius: '2px' }}>
              ↑ Subir de Nível
            </button>
            <button onClick={salvarFicha} disabled={salvando}
              className="bg-[#c8a84b] text-[#0f0e0c] px-5 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-50"
              style={{ ...cinzel, borderRadius: '2px' }}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

        {sucesso && (
          <div className="border border-[#4a8a4b] bg-[#1a3a1b] px-4 py-3 mb-6">
            <p className="text-[#8ac88b] text-sm">{sucesso}</p>
          </div>
        )}
        {erro && (
          <div className="border border-red-900 bg-red-950 bg-opacity-30 px-4 py-3 mb-6">
            <p className="text-red-400 text-sm">{erro}</p>
          </div>
        )}

        {/* INFOS BÁSICAS */}
        <div className="border border-[#c8a84b20] bg-[#161410] mb-6">
          <div className="px-6 py-4 border-b border-[#c8a84b15]">
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">INFORMAÇÕES BÁSICAS</p>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            {[
              { label: 'NOME', campo: 'name' },
              { label: 'RAÇA', campo: 'race' },
              { label: 'CLASSE', campo: 'class' },
              { label: 'ANTECEDENTE', campo: 'background' },
              { label: 'ALINHAMENTO', campo: 'alignment' },
            ].map(({ label, campo }) => (
              <div key={campo}>
                <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">{label}</label>
                <input value={ficha[campo] || ''} onChange={e => editarCampo(campo, e.target.value)}
                  className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full focus:outline-none focus:border-[#c8a84b50] text-sm"
                  style={{ borderRadius: '2px' }} />
              </div>
            ))}
            <div>
              <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">NÍVEL</label>
              <input type="number" min={1} max={20} value={ficha.level || 1}
                onChange={e => editarCampo('level', Number(e.target.value))}
                className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full focus:outline-none focus:border-[#c8a84b50] text-sm"
                style={{ borderRadius: '2px' }} />
            </div>
          </div>
        </div>

        {/* ATRIBUTOS */}
        {ficha.attributes && (
          <div className="border border-[#c8a84b20] bg-[#161410] mb-6">
            <div className="px-6 py-4 border-b border-[#c8a84b15]">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">ATRIBUTOS</p>
            </div>
            <div className="p-6 grid grid-cols-6 gap-3">
              {Object.entries(ficha.attributes).map(([attr, val]) => (
                <div key={attr} className="flex flex-col items-center gap-2">
                  <label style={cinzel} className="text-[#c8a84b] text-xs tracking-widest">
                    {attrLabel[attr] || attr.toUpperCase()}
                  </label>
                  <input type="number" min={1} max={30} value={val}
                    onChange={e => editarAtributo(attr, e.target.value)}
                    className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] text-center text-xl font-light w-full py-3 focus:outline-none focus:border-[#c8a84b50]"
                    style={{ borderRadius: '2px' }} />
                  <span className="text-[#4a4030] text-xs" style={cinzel}>
                    {Math.floor((val - 10) / 2) >= 0 ? '+' : ''}{Math.floor((val - 10) / 2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PERÍCIAS */}
        {ficha.skills && Object.keys(ficha.skills).length > 0 && (
          <div className="border border-[#c8a84b20] bg-[#161410] mb-6">
            <div className="px-6 py-4 border-b border-[#c8a84b15]">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">PERÍCIAS</p>
            </div>
            <div className="p-6 grid grid-cols-2 gap-2">
              {Object.entries(ficha.skills).map(([skill, val]) => (
                <div key={skill} className="flex items-center justify-between py-1 border-b border-[#c8a84b08]">
                  <span className="text-[#8a8070] text-sm capitalize">{skill}</span>
                  <span style={cinzel} className="text-[#c8a84b] text-sm">{val >= 0 ? '+' : ''}{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HABILIDADES */}
        {ficha.features && ficha.features.length > 0 && (
          <div className="border border-[#c8a84b20] bg-[#161410] mb-6">
            <div className="px-6 py-4 border-b border-[#c8a84b15]">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">HABILIDADES & FEATURES</p>
              <p className="text-[#4a4030] text-xs mt-1">Clique para ver descrição</p>
            </div>
            <div className="p-6 flex flex-wrap gap-2">
              {ficha.features.map((f, i) => (
                <button key={i} onClick={() => abrirSkill(f)}
                  className="border border-[#c8a84b25] bg-[#c8a84b08] text-[#c8a84b] px-3 py-1 text-xs hover:bg-[#c8a84b18] hover:border-[#c8a84b50] transition-all"
                  style={{ ...cinzel, borderRadius: '2px', letterSpacing: '0.5px' }}>
                  {f} ↗
                </button>
              ))}
            </div>
          </div>
        )}

        {/* INVENTÁRIO */}
        {ficha.inventory && ficha.inventory.length > 0 && (
          <div className="border border-[#c8a84b20] bg-[#161410] mb-6">
            <div className="px-6 py-4 border-b border-[#c8a84b15]">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">INVENTÁRIO</p>
            </div>
            <div className="p-6 flex flex-wrap gap-2">
              {ficha.inventory.map((item, i) => (
                <span key={i} className="border border-[#c8a84b15] text-[#6a6050] px-3 py-1 text-sm"
                  style={{ borderRadius: '2px' }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* HISTÓRIA */}
        {ficha.background_story && (
          <div className="border border-[#c8a84b20] bg-[#161410] mb-6">
            <div className="px-6 py-4 border-b border-[#c8a84b15]">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">HISTÓRIA</p>
            </div>
            <div className="p-6">
              <textarea value={ficha.background_story} onChange={e => editarCampo('background_story', e.target.value)}
                rows={4}
                className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#a09880] px-4 py-3 w-full focus:outline-none focus:border-[#c8a84b50] resize-none"
                style={{ fontSize: '1rem', borderRadius: '2px', lineHeight: '1.7' }} />
            </div>
          </div>
        )}

        {/* BOTÃO SALVAR FINAL */}
        <div className="flex gap-4">
          <button onClick={salvarFicha} disabled={salvando}
            className="bg-[#c8a84b] text-[#0f0e0c] px-8 py-3 text-sm tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-50"
            style={{ ...cinzel, borderRadius: '2px' }}>
            {salvando ? 'Salvando...' : 'Salvar Ficha'}
          </button>
          <button onClick={() => setModalLevelUp(true)}
            className="border border-[#c8a84b40] text-[#c8a84b] px-8 py-3 text-sm tracking-widest hover:bg-[#c8a84b10] transition-colors"
            style={{ ...cinzel, borderRadius: '2px' }}>
            ↑ Subir de Nível
          </button>
        </div>
      </div>

      {/* MODAL LEVEL UP */}
      {modalLevelUp && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 px-4"
          onClick={() => !upando && setModalLevelUp(false)}>
          <div className="bg-[#161410] border border-[#c8a84b30] max-w-md w-full"
            style={{ borderRadius: '2px' }}
            onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#c8a84b15] flex items-center justify-between">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">SUBIR DE NÍVEL</p>
              {!upando && (
                <button onClick={() => setModalLevelUp(false)}
                  className="text-[#4a4030] hover:text-[#c8a84b] text-xl transition-colors">×</button>
              )}
            </div>

            <div className="px-6 py-6 flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p style={cinzel} className="text-[#4a4030] text-xs tracking-widest mb-1">ATUAL</p>
                  <p style={cinzel} className="text-[#c8a84b] text-3xl font-bold">{ficha.level}</p>
                </div>
                <div className="text-[#4a4030] text-2xl flex-1 text-center">→</div>
                <div className="text-center">
                  <p style={cinzel} className="text-[#4a4030] text-xs tracking-widest mb-1">NOVO NÍVEL</p>
                  <input type="number" min={ficha.level + 1} max={20} value={nivelAlvo}
                    onChange={e => setNivelAlvo(Number(e.target.value))}
                    className="bg-[#0f0e0c] border border-[#c8a84b30] text-[#c8a84b] text-center text-3xl font-bold w-20 py-2 focus:outline-none focus:border-[#c8a84b60]"
                    style={{ ...cinzel, borderRadius: '2px' }} />
                </div>
              </div>

              <div className="border border-[#c8a84b15] bg-[#0f0e0c] px-4 py-3">
                <p className="text-[#6a6050] text-sm font-light">
                  ✦ A IA vai adicionar automaticamente todas as features, melhorias de atributos e benefícios do nível {ficha.level + 1} até o nível {nivelAlvo}. Você poderá editar depois.
                </p>
              </div>

              {upando && (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin flex-shrink-0" />
                  <p style={cinzel} className="text-[#c8a84b] text-xs tracking-widest">SUBINDO DE NÍVEL...</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={fazerLevelUp} disabled={upando || nivelAlvo <= ficha.level || nivelAlvo > 20}
                  className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30 flex-1"
                  style={{ ...cinzel, borderRadius: '2px' }}>
                  {upando ? 'Aguarde...' : `Subir para Nível ${nivelAlvo} com IA →`}
                </button>
              </div>
              <button onClick={() => !upando && setModalLevelUp(false)}
                className="text-[#4a4030] text-xs tracking-widest hover:text-[#6a6050] transition-colors text-center"
                style={cinzel}>
                Cancelar — prefiro editar manualmente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HABILIDADE */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 px-4"
          onClick={() => { setModal(null); setDescricaoSkill(null); }}>
          <div className="bg-[#161410] border border-[#c8a84b30] max-w-lg w-full max-h-[80vh] overflow-y-auto"
            style={{ borderRadius: '2px' }}
            onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#c8a84b15] flex items-center justify-between">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">HABILIDADE</p>
              <button onClick={() => { setModal(null); setDescricaoSkill(null); }}
                className="text-[#4a4030] hover:text-[#c8a84b] text-xl transition-colors">×</button>
            </div>
            <div className="px-6 py-6">
              {carregandoSkill && (
                <div className="flex flex-col items-center py-10 gap-4">
                  <div className="w-8 h-8 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
                  <p style={cinzel} className="text-[#4a4030] text-xs tracking-widest">CONSULTANDO A IA...</p>
                </div>
              )}
              {!carregandoSkill && descricaoSkill && !descricaoSkill.error && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 style={cinzel} className="text-[#f0e8d8] text-xl font-semibold mb-2">
                      {descricaoSkill.name || modal.skill}
                    </h2>
                    {descricaoSkill.type && (
                      <span className="text-xs px-3 py-1 border"
                        style={{
                          ...cinzel, borderRadius: '2px', letterSpacing: '1px',
                          color: tipoColor[descricaoSkill.type] || '#c8a84b',
                          borderColor: `${tipoColor[descricaoSkill.type] || '#c8a84b'}40`,
                          background: `${tipoColor[descricaoSkill.type] || '#c8a84b'}10`,
                        }}>
                        {descricaoSkill.type.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {descricaoSkill.source && (
                    <div>
                      <p style={cinzel} className="text-[#4a4030] text-xs tracking-[2px] mb-1">ORIGEM</p>
                      <p className="text-[#6a6050] text-sm font-light">{descricaoSkill.source}</p>
                    </div>
                  )}
                  {descricaoSkill.description && (
                    <div>
                      <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-2">DESCRIÇÃO</p>
                      <p className="text-[#a09880] text-base leading-relaxed font-light">{descricaoSkill.description}</p>
                    </div>
                  )}
                  {descricaoSkill.mechanics && (
                    <div className="border border-[#c8a84b15] bg-[#0f0e0c] px-4 py-4">
                      <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-2">EM JOGO</p>
                      <p className="text-[#8a8070] text-sm leading-relaxed font-light">{descricaoSkill.mechanics}</p>
                    </div>
                  )}
                </div>
              )}
              {!carregandoSkill && descricaoSkill?.error && (
                <p className="text-red-400 text-sm text-center py-8">{descricaoSkill.error}</p>
              )}
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => { setModal(null); setDescricaoSkill(null); }}
                className="border border-[#c8a84b30] text-[#6a6050] px-6 py-2 text-xs tracking-widest hover:border-[#c8a84b60] hover:text-[#c8a84b] transition-colors w-full"
                style={{ ...cinzel, borderRadius: '2px' }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}