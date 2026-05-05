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

const combatFields = [
  { label: 'HP ATUAL', campo: 'hp', tipo: 'number' },
  { label: 'HP MÁXIMO', campo: 'hp_max', tipo: 'number' },
  { label: 'CA', campo: 'ac', tipo: 'number' },
  { label: 'INICIATIVA', campo: 'initiative', tipo: 'number' },
  { label: 'VELOCIDADE', campo: 'speed', tipo: 'number' },
  { label: 'BÔNUS PROF.', campo: 'proficiency_bonus', tipo: 'number' },
  { label: 'PERC. PASSIVA', campo: 'passive_perception', tipo: 'number' },
  { label: 'DADO DE VIDA', campo: 'hit_dice', tipo: 'text' },
];

const saveLabel = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };

export default function Ficha() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [personagem, setPersonagem] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [modalLevelUp, setModalLevelUp] = useState(false);
  const [nivelAlvo, setNivelAlvo] = useState(2);
  const [upando, setUpando] = useState(false);

  const [showClassLevelUpModal, setShowClassLevelUpModal] = useState(false);

  const [modal, setModal] = useState(null);
  const [descricaoSkill, setDescricaoSkill] = useState(null);
  const [carregandoSkill, setCarregandoSkill] = useState(false);

  const [modalAddSpell, setModalAddSpell] = useState(false);
  const [availableSpells, setAvailableSpells] = useState([]);
  const [loadingSpells, setLoadingSpells] = useState(false);

  const [tab, setTab] = useState('procurar'); 
  const [homebrewInput, setHomebrewInput] = useState('');
  const [criandoHomebrew, setCriandoHomebrew] = useState(false);

  const [spellDetalhes, setSpellDetalhes] = useState(null);

  const [abaInventario, setAbaInventario] = useState('todos');

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

  function editarCombat(campo, valor) {
    setFicha(prev => {
      const combatAtual = prev.combat || {};
      return {
        ...prev,
        combat: {
          ...combatAtual,
          [campo]: campo === 'hit_dice' ? valor : Number(valor) || 0
        }
      };
    });
  }

  function editarSavingThrow(attr, valor) {
    setFicha(prev => {
      const combatAtual = prev.combat || {};
      const savingAtual = combatAtual.saving_throws || {};
      return {
        ...prev,
        combat: {
          ...combatAtual,
          saving_throws: {
            ...savingAtual,
            [attr]: Number(valor) || 0
          }
        }
      };
    });
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

  async function abrirModalAddSpell() {
    setModalAddSpell(true);
    setLoadingSpells(true);
    try {
      const className = (ficha.classes && ficha.classes.length > 0) 
        ? ficha.classes[0].name 
        : 'Wizard';
      const res = await api.get(`/spells?class_name=${className}`);
      setAvailableSpells(res.data.data);
    } catch {
      setAvailableSpells([]);
    }
    setLoadingSpells(false);
  }

  function adicionarFeiticoDoDropdown(spell) {
    setFicha(prev => ({
      ...prev,
      spellcasting: {
        ...prev.spellcasting,
        spells: [...(prev.spellcasting.spells || []), 
          { 
            name: spell.name, 
            level: spell.level, 
            slots: 0, 
            slots_used: 0,
            description: spell.description || '',
            mechanics: spell.mechanics || '',
            range: spell.range || '',
            duration: spell.duration || '',
            components: spell.components || '',
            school: spell.school || ''
          }]
      }
    }));
    setModalAddSpell(false);
  }

  async function criarMagiaHomebrew() {
  if (!homebrewInput.trim()) {
    alert("Digite o nome da magia");
    return;
  }

  setCriandoHomebrew(true);
  try {
    const className = ficha.class 
      ? (Array.isArray(ficha.class) 
          ? JSON.parse(ficha.class)[0]?.name 
          : ficha.class)
      : 'Wizard';

    const res = await api.post('/spells/homebrew', {
      name: homebrewInput,
      class_name: className
    });

    adicionarFeiticoDoDropdown(res.data.data);
    setHomebrewInput('');
    
    setSucesso(`Magia "${res.data.data.name}" criada com IA!`);
    setTimeout(() => setSucesso(''), 3000);
  } catch (error) {
    setErro('Erro ao criar magia: ' + error.message);
  }
  setCriandoHomebrew(false);
}

  // ===== FUNÇÕES DE LEVEL UP COM MULTICLASSING =====
  async function handleLevelUp() {
    if (!ficha) return;

    const totalLevelAtual = ficha.level || ficha.total_level || 1;
    
    if (totalLevelAtual >= 20) {
      alert("Nível máximo atingido (20)");
      return;
    }

    const temMultiplasClasses = 
      Array.isArray(ficha.classes) && ficha.classes.length > 1;

    if (temMultiplasClasses) {
      setShowClassLevelUpModal(true);
      return;
    }

    // Se tem só 1 classe, faz level up direto
    const proximoNivel = totalLevelAtual + 1;
    await fazerLevelUpComClasse(proximoNivel, null);
  }

  async function fazerLevelUpComClasse(novoNivel, classNameAlvo) {
    console.log("=== LEVEL UP DEBUG ===");
    console.log("id:", id);
    console.log("ficha:", ficha);
    console.log("novoNivel:", novoNivel);
    console.log("personagem:", personagem);
    setUpando(true);
    setErro('');
    try {
      const payload = {
        character_id: id,
        ficha_atual: ficha,
        system: personagem.system || 'D&D 5e',
        nivel_alvo: novoNivel
      };

      if (classNameAlvo) {
        payload.class_name = classNameAlvo;
      }

      const res = await api.post('/level-up', payload);

      console.log("RESPOSTA COMPLETA:", res.data);
      console.log("res.data.data:", res.data.data);
      setFicha(res.data.data);
      setModalLevelUp(false);
      setShowClassLevelUpModal(false);
      setSucesso(`${ficha.name} subiu para nível ${novoNivel}!`);
      setTimeout(() => setSucesso(''), 4000);
    } catch (error) {
    console.log("ERRO CATCH:", error.response?.data || error.message);
    setErro('Erro ao fazer level up: ' + error.message);
    }
    setUpando(false);
  }

  async function confirmarLevelUpComClasse(classeName) {
    if (!classeName) {
      alert("Escolha uma classe");
      return;
    }

    const proximoNivel = (ficha.level || 1) + 1;
    await fazerLevelUpComClasse(proximoNivel, classeName);
  }
  // ===== FIM FUNÇÕES LEVEL UP =====

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

  const combat = ficha.combat || {};

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0]" style={crimson}>

      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>⚔ TAVERNA</span>
        <button onClick={() => navigate('/personagens')}
          className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors" style={cinzel}>
          ← Meus Personagens
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">

        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">FICHA DO PERSONAGEM</p>
            <h1 style={cinzel} className="text-3xl text-[#f0e8d8] font-bold">{ficha.name}</h1>
            <p className="text-[#6a6050] mt-1">{[
  ficha.race, 
  ficha.class ? (() => {
    try {
      const parsed = typeof ficha.class === 'string' ? JSON.parse(ficha.class) : ficha.class;
      return Array.isArray(parsed) ? `${parsed[0]?.name} ${parsed[0]?.level}` : ficha.class;
    } catch {
      return ficha.class;
    }
  })() : '',
  ficha.background
].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleLevelUp}
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
              { label: 'ANTECEDENTE', campo: 'background' },
              { label: 'ALINHAMENTO', campo: 'alignment' },
            ].map(({ label, campo }) => (
              <div key={campo}>
                <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">{label}</label>
                <input 
  disabled={campo === 'class' || campo === 'subclass'}
  readOnly={campo === 'class' || campo === 'subclass'}
  value={
    campo === 'class'
      ? ficha.class ? (() => {
          try {
            const parsed = typeof ficha.class === 'string' ? JSON.parse(ficha.class) : ficha.class;
            return Array.isArray(parsed) ? `${parsed[0]?.name} ${parsed[0]?.level}` : ficha.class;
          } catch {
            return ficha.class;
          }
        })() : ''
      : (ficha[campo] || '')
  }
  onChange={e => editarCampo(campo, e.target.value)}
  className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full focus:outline-none focus:border-[#c8a84b50] text-sm disabled:opacity-50"
  style={{ borderRadius: '2px' }}
/> 
              </div>
            ))}
            <div>
              <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">NÍVEL</label>
              <input type="number" min={1} max={20} value={ficha.level || 1}
                onChange={e => editarCampo('level', Number(e.target.value))}
                className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full focus:outline-none focus:border-[#c8a84b50] text-sm"
                style={{ borderRadius: '2px' }} />
            </div>
          <div>
              <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">XP</label>
              <input type="number" min={0} value={ficha.xp || 0}
                 onChange={e => {
                  const novoXP = Number(e.target.value);
                  const tabela = [0,300,900,2700,6500,14000,23000,34000,48000,64000,85000,100000,120000,140000,165000,195000,225000,265000,305000,355000];
                  const novoNivel = tabela.filter(x => x <= novoXP).length;
                  editarCampo('xp', novoXP);
                  editarCampo('level', Math.min(20, novoNivel));
                }}
                className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full focus:outline-none focus:border-[#c8a84b50] text-sm"
                style={{ borderRadius: '2px' }} />
            </div>
            {(() => {
  const xpAtual = ficha.xp || 0;
  const tabela = [0,300,900,2700,6500,14000,23000,34000,48000,64000,85000,100000,120000,140000,165000,195000,225000,265000,305000,355000];
  const nivelAtual = ficha.level || 1;  // ← usa o nível da ficha
  const xpAtualNivel = tabela[nivelAtual - 1] || 0;
  const xpProxNivel = tabela[nivelAtual] || tabela[tabela.length - 1];
  const pct = Math.min(100, ((xpAtual - xpAtualNivel) / (xpProxNivel - xpAtualNivel)) * 100);
  return nivelAtual < 20 ? (
    <div className="col-span-2 mt-1">
      <div className="h-0.5 bg-[#c8a84b15] w-full">
        <div className="h-full bg-[#c8a84b40] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p style={cinzel} className="text-[#3a3020] text-xs mt-1">{xpAtual} / {xpProxNivel} XP</p>
    </div>
  ) : null;
})()}
          </div>
        </div>

        {/* CLASSES */}
<div className="border border-[#c8a84b20] bg-[#161410] mb-6">
  <div className="px-6 py-4 border-b border-[#c8a84b15]">
    <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">
      CLASSES ({(ficha.classes || []).reduce((s, c) => s + (c.level || 1), 0)} total)
    </p>
  </div>
  <div className="p-6 flex flex-col gap-3">
    {(ficha.classes || []).map((cls, idx) => (
      <div key={idx} className="flex gap-2 items-center bg-[#0f0e0c] p-3 border border-[#c8a84b20]">
        <input
          value={cls.name}
          onChange={e => {
            const novas = [...ficha.classes];
            novas[idx] = { ...novas[idx], name: e.target.value };
            setFicha(prev => ({ ...prev, classes: novas }));
          }}
          className="flex-1 bg-[#161410] border border-[#c8a84b20] text-[#e8e0d0] px-2 py-1 text-sm focus:outline-none focus:border-[#c8a84b50]"
          style={{ borderRadius: '2px' }}
        />
        <label className="text-[#6a6050] text-xs">Lvl:</label>
        <input
          type="number" min={1} max={20}
          value={cls.level || 1}
          onChange={e => {
            const novas = [...ficha.classes];
            novas[idx] = { ...novas[idx], level: Number(e.target.value) };
            setFicha(prev => ({ ...prev, classes: novas }));
          }}
          className="w-16 bg-[#161410] border border-[#c8a84b20] text-[#e8e0d0] px-2 py-1 text-center text-sm focus:outline-none focus:border-[#c8a84b50]"
          style={{ borderRadius: '2px' }}
        />
      </div>
    ))}
  </div>
</div>

        {/* STATS DE COMBATE */}
        <div className="border border-[#c8a84b20] bg-[#161410] mb-6">
          <div className="px-6 py-4 border-b border-[#c8a84b15]">
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">STATS DE COMBATE</p>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6 border border-[#c8a84b15] bg-[#0f0e0c] p-4 rounded">
              <div className="flex-1">
                <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">HP ATUAL</label>
                <input 
                  type="number" 
                  value={combat.hp ?? 0}
                  onChange={e => editarCombat('hp', e.target.value)}
                  className="bg-transparent border-b border-[#c8a84b30] text-[#f0e8d8] text-3xl font-light w-full focus:outline-none focus:border-[#c8a84b60] text-center pb-1"
                  style={cinzel} 
                />
              </div>
              <span className="text-[#4a4030] text-2xl">/</span>
              <div className="flex-1">
                <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">HP MÁXIMO</label>
                <input 
                  type="number" 
                  value={combat.hp_max ?? 0}
                  onChange={e => editarCombat('hp_max', e.target.value)}
                  className="bg-transparent border-b border-[#c8a84b30] text-[#f0e8d8] text-3xl font-light w-full focus:outline-none focus:border-[#c8a84b60] text-center pb-1"
                  style={cinzel} 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {combatFields.filter(f => !['hp', 'hp_max'].includes(f.campo)).map(({ label, campo, tipo }) => (
                <div key={campo} className="flex flex-col items-center border border-[#c8a84b15] bg-[#0f0e0c] p-3 rounded">
                  <label style={cinzel} className="text-[#4a4030] text-xs tracking-widest mb-2 text-center">{label}</label>
                  <input
                    type={tipo}
                    value={combat[campo] ?? (tipo === 'number' ? 0 : '')}
                    onChange={e => editarCombat(campo, e.target.value)}
                    className="bg-transparent text-[#c8a84b] text-xl font-light w-full focus:outline-none text-center"
                    style={cinzel}
                  />
                </div>
              ))}
            </div>

            <div>
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-3">SALVAGUARDAS</p>
              <div className="grid grid-cols-6 gap-2">
                {Object.entries(combat.saving_throws || {}).map(([attr, val]) => (
                  <div key={attr} className="flex flex-col items-center gap-1">
                    <label style={cinzel} className="text-[#4a4030] text-xs">{saveLabel[attr] || attr.toUpperCase()}</label>
                    <input 
                      type="number" 
                      value={val ?? 0}
                      onChange={e => editarSavingThrow(attr, e.target.value)}
                      className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#c8a84b] text-center text-sm w-full py-1.5 focus:outline-none focus:border-[#c8a84b50]"
                      style={{ borderRadius: '2px', ...cinzel }} 
                    />
                  </div>
                ))}
              </div>
              {/* STATS DE COMBATE */}
        <div className="border border-[#c8a84b20] bg-[#161410] mb-6">
          <div className="px-6 py-4 border-b border-[#c8a84b15]">
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">STATS DE COMBATE</p>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6 border border-[#c8a84b15] bg-[#0f0e0c] p-4 rounded">
              <div className="flex-1">
                <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">HP ATUAL</label>
                <input 
                  type="number" 
                  value={combat.hp ?? 0}
                  onChange={e => editarCombat('hp', e.target.value)}
                  className="bg-transparent border-b border-[#c8a84b30] text-[#f0e8d8] text-3xl font-light w-full focus:outline-none focus:border-[#c8a84b60] text-center pb-1"
                  style={cinzel} 
                />
              </div>
              <span className="text-[#4a4030] text-2xl">/</span>
              <div className="flex-1">
                <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">HP MÁXIMO</label>
                <input 
                  type="number" 
                  value={combat.hp_max ?? 0}
                  onChange={e => editarCombat('hp_max', e.target.value)}
                  className="bg-transparent border-b border-[#c8a84b30] text-[#f0e8d8] text-3xl font-light w-full focus:outline-none focus:border-[#c8a84b60] text-center pb-1"
                  style={cinzel} 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {combatFields.filter(f => !['hp', 'hp_max'].includes(f.campo)).map(({ label, campo, tipo }) => (
                <div key={campo} className="flex flex-col items-center border border-[#c8a84b15] bg-[#0f0e0c] p-3 rounded">
                  <label style={cinzel} className="text-[#4a4030] text-xs tracking-widest mb-2 text-center">{label}</label>
                  <input
                    type={tipo}
                    value={combat[campo] ?? (tipo === 'number' ? 0 : '')}
                    onChange={e => editarCombat(campo, e.target.value)}
                    className="bg-transparent text-[#c8a84b] text-xl font-light w-full focus:outline-none text-center"
                    style={cinzel}
                  />
                </div>
              ))}
            </div>

            <div>
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-3">SALVAGUARDAS</p>
              <div className="grid grid-cols-6 gap-2">
                {Object.entries(combat.saving_throws || {}).map(([attr, val]) => (
                  <div key={attr} className="flex flex-col items-center gap-1">
                    <label style={cinzel} className="text-[#4a4030] text-xs">{saveLabel[attr] || attr.toUpperCase()}</label>
                    <input 
                      type="number" 
                      value={val ?? 0}
                      onChange={e => editarSavingThrow(attr, e.target.value)}
                      className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#c8a84b] text-center text-sm w-full py-1.5 focus:outline-none focus:border-[#c8a84b50]"
                      style={{ borderRadius: '2px', ...cinzel }} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* CONDIÇÕES */}
<div className="mt-6">
  <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-3">CONDIÇÕES</p>
  <div className="flex flex-wrap gap-2">
    {[
      { label: 'Caído', cor: '#8a2020' },
      { label: 'Envenenado', cor: '#4a8a20' },
      { label: 'Paralisado', cor: '#8a6020' },
      { label: 'Enfeitiçado', cor: '#8a4a8a' },
      { label: 'Amedrontado', cor: '#6a4020' },
      { label: 'Atordoado', cor: '#4a6a8a' },
      { label: 'Invisível', cor: '#6a6a6a' },
      { label: 'Surdo', cor: '#4a4030' },
      { label: 'Cego', cor: '#303030' },
      { label: 'Incapacitado', cor: '#8a2050' },
      { label: 'Petrificado', cor: '#607060' },
      { label: 'Inconsciente', cor: '#202020' },
    ].map(({ label, cor }) => {
      const ativo = (ficha.condicoes || []).includes(label);
      return (
        <button key={label}
          onClick={() => {
            const atual = ficha.condicoes || [];
            const novo = ativo
              ? atual.filter(c => c !== label)
              : [...atual, label];
            setFicha(prev => ({ ...prev, condicoes: novo }));
          }}
          className="px-3 py-1 text-xs border transition-all"
          style={{
            ...cinzel,
            borderRadius: '2px',
            borderColor: ativo ? cor : '#c8a84b15',
            backgroundColor: ativo ? `${cor}25` : 'transparent',
            color: ativo ? cor : '#4a4030',
          }}>
          {label}
        </button>
      );
    })}
  </div>
</div>
        </div>
            </div>
          </div>
        </div>

        {/* SPELLCASTING */}
        {ficha.spellcasting && (
          <div className="border border-[#c8a84b20] bg-[#161410] mb-6">
            <div className="px-6 py-4 border-b border-[#c8a84b15]">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">LANÇAMENTO DE FEITIÇOS</p>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">HABILIDADE</label>
                  <select value={ficha.spellcasting.ability || 'int'}
                    onChange={e => setFicha(prev => ({
                      ...prev,
                      spellcasting: { ...prev.spellcasting, ability: e.target.value }
                    }))}
                    className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full focus:outline-none focus:border-[#c8a84b50] text-sm"
                    style={{ borderRadius: '2px' }}>
                    {Object.entries(attrLabel).map(([key, val]) => (
                      <option key={key} value={key}>{val}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">DC DO FEITIÇO</label>
                  <input type="number" value={ficha.spellcasting.dc || 0}
                    onChange={e => setFicha(prev => ({
                      ...prev,
                      spellcasting: { ...prev.spellcasting, dc: Number(e.target.value) }
                    }))}
                    className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full focus:outline-none focus:border-[#c8a84b50] text-sm"
                    style={{ borderRadius: '2px' }} />
                </div>
              </div>

              {ficha.spellcasting.spells && ficha.spellcasting.spells.length > 0 ? (
                <div>
                  <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-3">FEITIÇOS</p>
                  <div className="space-y-2">
                    {ficha.spellcasting.spells.map((spell, idx) => (
                      <div key={idx} className="border border-[#c8a84b15] bg-[#0f0e0c] p-3 flex items-end gap-3">
                      <div className="flex-1">
                    <label style={cinzel} className="text-[#4a4030] text-xs tracking-widest block mb-1">NOME</label>
                    <button
                      onClick={() => setSpellDetalhes(spell)}
                      className="text-left text-[#e8e0d0] hover:text-[#c8a84b] text-sm transition-colors w-full"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      {spell.name || '—'}
                    </button>
                  </div>
                  <div className="w-16">
                    <label style={cinzel} className="text-[#4a4030] text-xs tracking-widest block mb-1">NÍVEL</label>
                    <input type="number" min={0} max={9} value={spell.level || 0}
                      onChange={e => {
                        const novoSpell = [...ficha.spellcasting.spells];
                        novoSpell[idx].level = Number(e.target.value);
                        setFicha(prev => ({ ...prev, spellcasting: { ...prev.spellcasting, spells: novoSpell } }));
                      }}
                      className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#c8a84b] text-center text-sm w-full focus:outline-none focus:border-[#c8a84b50]"
                      style={{ borderRadius: '2px' }} />
                  </div>
                  <div className="w-16">
                    <label style={cinzel} className="text-[#4a4030] text-xs tracking-widest block mb-1">SLOTS</label>
                    <input type="number" min={0} value={spell.slots || 0}
                      onChange={e => {
                        const novoSpell = [...ficha.spellcasting.spells];
                        novoSpell[idx].slots = Number(e.target.value);
                        setFicha(prev => ({ ...prev, spellcasting: { ...prev.spellcasting, spells: novoSpell } }));
                      }}
                      className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#c8a84b] text-center text-sm w-full focus:outline-none focus:border-[#c8a84b50]"
                      style={{ borderRadius: '2px' }} />
                  </div>
                  <div className="w-16">
                    <label style={cinzel} className="text-[#4a4030] text-xs tracking-widest block mb-1">USADOS</label>
                    <input type="number" min={0} value={spell.slots_used || 0}
                      onChange={e => {
                        const novoSpell = [...ficha.spellcasting.spells];
                        novoSpell[idx].slots_used = Number(e.target.value);
                        setFicha(prev => ({ ...prev, spellcasting: { ...prev.spellcasting, spells: novoSpell } }));
                      }}
                      className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#c8a84b] text-center text-sm w-full focus:outline-none focus:border-[#c8a84b50]"
                      style={{ borderRadius: '2px' }} />
                  </div>
                  <button onClick={() => {
                    const novoSpells = ficha.spellcasting.spells.filter((_, i) => i !== idx);
                    setFicha(prev => ({ ...prev, spellcasting: { ...prev.spellcasting, spells: novoSpells } }));
                  }}
                    className="text-red-900 hover:text-red-600 px-2 py-1 text-xs border border-red-900 transition-colors"
                    style={{ ...cinzel, borderRadius: '2px' }}>
                    ✕
                  </button>
                </div>
                  ))}
                  </div>
                  <button onClick={abrirModalAddSpell}
                    className="mt-3 border border-[#c8a84b30] text-[#c8a84b] px-4 py-2 text-xs tracking-widest hover:bg-[#c8a84b10] transition-colors"
                    style={{ ...cinzel, borderRadius: '2px' }}>
                    + Adicionar Feitiço
                  </button>
                </div>
              ) : (
                <div className="border border-[#c8a84b15] bg-[#0f0e0c] px-4 py-3 text-center">
                  <p className="text-[#4a4030] text-sm font-light">Nenhum feitiço registrado</p>
                  <button onClick={abrirModalAddSpell}
                    className="mt-2 border border-[#c8a84b30] text-[#c8a84b] px-4 py-1 text-xs tracking-widest hover:bg-[#c8a84b10] transition-colors"
                    style={{ ...cinzel, borderRadius: '2px' }}>
                    + Adicionar Feitiço
                  </button>
                </div>
              )}
              {spellDetalhes && (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    onClick={() => setSpellDetalhes(null)}>
    <div className="bg-[#161410] border border-[#c8a84b30] max-w-md w-full mx-4 p-6"
      style={{ borderRadius: '2px' }}
      onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p style={cinzel} className="text-[#c8a84b] text-lg font-bold">{spellDetalhes.name}</p>
          <p className="text-[#4a4030] text-xs mt-1" style={cinzel}>
            Nível {spellDetalhes.level} · {spellDetalhes.school || ''}
          </p>
        </div>
        <button onClick={() => setSpellDetalhes(null)}
          className="text-[#4a4030] hover:text-[#c8a84b] text-xl transition-colors">✕</button>
      </div>
      {spellDetalhes.description && (
        <div className="mb-3">
          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-1">DESCRIÇÃO</p>
          <p className="text-[#a09880] text-sm leading-relaxed">{spellDetalhes.description}</p>
        </div>
      )}
      {spellDetalhes.mechanics && (
        <div className="mb-3">
          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-1">MECÂNICA</p>
          <p className="text-[#a09880] text-sm leading-relaxed">{spellDetalhes.mechanics}</p>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 mt-4 text-xs text-center">
        {spellDetalhes.range && (
          <div className="border border-[#c8a84b15] p-2">
            <p style={cinzel} className="text-[#4a4030] tracking-widest mb-1">ALCANCE</p>
            <p className="text-[#e8e0d0]">{spellDetalhes.range}</p>
          </div>
        )}
        {spellDetalhes.duration && (
          <div className="border border-[#c8a84b15] p-2">
            <p style={cinzel} className="text-[#4a4030] tracking-widest mb-1">DURAÇÃO</p>
            <p className="text-[#e8e0d0]">{spellDetalhes.duration}</p>
          </div>
        )}
        {spellDetalhes.components && (
          <div className="border border-[#c8a84b15] p-2">
            <p style={cinzel} className="text-[#4a4030] tracking-widest mb-1">COMPONENTES</p>
            <p className="text-[#e8e0d0]">{spellDetalhes.components}</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}
            </div>
          </div>
        )}

        {/* MODAL ADICIONAR FEITIÇO */}
        {modalAddSpell && (
  <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 px-4"
    onClick={() => setModalAddSpell(false)}>
    <div className="bg-[#161410] border border-[#c8a84b30] max-w-md w-full"
      style={{ borderRadius: '2px' }}
      onClick={e => e.stopPropagation()}>
      
      <div className="px-6 py-4 border-b border-[#c8a84b15] flex items-center justify-between">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">ADICIONAR FEITIÇO</p>
        <button onClick={() => setModalAddSpell(false)}
          className="text-[#4a4030] hover:text-[#c8a84b] text-xl transition-colors">×</button>
      </div>
      
      <div className="px-6 py-6 flex flex-col gap-4">
        
        <div className="flex gap-2">
          <button 
            onClick={() => setTab('procurar')}
            className={`flex-1 px-3 py-2 text-xs tracking-widest transition-colors ${
              tab === 'procurar' 
                ? 'bg-[#c8a84b] text-[#0f0e0c]' 
                : 'border border-[#c8a84b30] text-[#c8a84b]'
            }`}
            style={{ ...cinzel, borderRadius: '2px' }}>
            PROCURAR
          </button>
          <button 
            onClick={() => setTab('criar')}
            className={`flex-1 px-3 py-2 text-xs tracking-widest transition-colors ${
              tab === 'criar' 
                ? 'bg-[#c8a84b] text-[#0f0e0c]' 
                : 'border border-[#c8a84b30] text-[#c8a84b]'
            }`}
            style={{ ...cinzel, borderRadius: '2px' }}>
            CRIAR COM IA
          </button>
        </div>

        {tab === 'procurar' && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loadingSpells ? (
              <div className="flex items-center gap-3 justify-center py-4">
                <div className="w-5 h-5 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
                <p style={cinzel} className="text-[#4a4030] text-xs">CARREGANDO...</p>
              </div>
            ) : (
              availableSpells.map((spell, i) => (
                <button key={i} onClick={() => adicionarFeiticoDoDropdown(spell)}
                  className="w-full text-left border border-[#c8a84b25] bg-[#c8a84b08] text-[#c8a84b] px-3 py-2 text-xs hover:bg-[#c8a84b18] transition-colors"
                  style={{ borderRadius: '2px', letterSpacing: '0.5px' }}>
                  <span className="font-bold">{spell.name}</span> <span className="text-[#4a4030]">(Nível {spell.level})</span>
                </button>
              ))
            )}
          </div>
        )}

        {tab === 'criar' && (
          <div className="space-y-3">
            <div>
              <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">
                NOME DA MAGIA
              </label>
              <input 
                type="text"
                value={homebrewInput}
                onChange={e => setHomebrewInput(e.target.value)}
                placeholder="ex: Magia Obscura da Perdição"
                className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full focus:outline-none focus:border-[#c8a84b50] text-sm"
                style={{ borderRadius: '2px' }}
              />
            </div>

            <div className="border border-[#c8a84b15] bg-[#0f0e0c] px-4 py-3">
              <p className="text-[#6a6050] text-xs font-light">
                ✦ A IA vai criar uma magia completa baseada no nome e sua classe. 
                A magia fica salva no banco pra próxima vez!
              </p>
            </div>

            {criandoHomebrew && (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin flex-shrink-0" />
                <p style={cinzel} className="text-[#c8a84b] text-xs tracking-widest">CRIANDO MAGIA...</p>
              </div>
            )}

            <button 
              onClick={criarMagiaHomebrew}
              disabled={criandoHomebrew || !homebrewInput.trim()}
              className="w-full bg-[#c8a84b] text-[#0f0e0c] px-4 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30"
              style={{ ...cinzel, borderRadius: '2px' }}>
              {criandoHomebrew ? 'Aguarde...' : 'CRIAR MAGIA COM IA →'}
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
)}

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
              {ficha.features.filter(f => !f.toLowerCase().includes('spellcasting')).map((f, i) => (
                <button key={i} onClick={() => abrirSkill(f)}
                  className="border border-[#c8a84b25] bg-[#c8a84b08] text-[#c8a84b] px-3 py-1 text-xs hover:bg-[#c8a84b18] hover:border-[#c8a84b50] transition-all"
                  style={{ ...cinzel, borderRadius: '2px', letterSpacing: '0.5px' }}>
                  {f} ↗
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CONTADOR DE RECURSOS */}
<div className="border border-[#c8a84b20] bg-[#161410] mb-6">
  <div className="px-6 py-4 border-b border-[#c8a84b15] flex items-center justify-between">
    <div>
      <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">RECURSOS</p>
      <p className="text-[#4a4030] text-xs mt-1">Features e habilidades com usos limitados</p>
    </div>
    <button onClick={() => {
      const nome = prompt('Nome do recurso (ex: Imposição de Mãos, Metamagia):');
      if (!nome?.trim()) return;
      const max = Number(prompt('Usos máximos:') || 1);
      const recuperacao = prompt('Recupera em:\n1 - Descanso Curto\n2 - Descanso Longo');
      const tipo = recuperacao === '1' ? 'curto' : 'longo';
      const novos = [...(ficha.recursos || []), { nome, max, atual: max, recuperacao: tipo }];
      setFicha(prev => ({ ...prev, recursos: novos }));
    }}
      className="border border-[#c8a84b30] text-[#c8a84b] px-3 py-1 text-xs hover:bg-[#c8a84b10] transition-colors"
      style={{ ...cinzel, borderRadius: '2px' }}>
      + ADICIONAR
    </button>
    </div>

  <div className="p-6">
    {!ficha.recursos || ficha.recursos.length === 0 ? (
      <p className="text-[#3a3020] text-sm text-center py-4">Nenhum recurso adicionado.</p>
    ) : (
      <div className="space-y-3">
        {ficha.recursos.map((recurso, idx) => (
          <div key={idx} className="border border-[#c8a84b15] bg-[#0f0e0c] p-3">
            <div className="flex items-center justify-between mb-2">
              <span style={cinzel} className="text-[#e8e0d0] text-sm">{recurso.nome}</span>
              {recurso.recuperacao && (
                <span style={{ ...cinzel, borderRadius: '2px', borderColor: recurso.recuperacao === 'curto' ? '#4a6a8a40' : '#8a4a8a40', color: recurso.recuperacao === 'curto' ? '#4a6a8a' : '#8a4a8a' }}
                  className="text-xs border px-1.5 py-0.5 ml-2">
                  {recurso.recuperacao === 'curto' ? 'CURTO' : 'LONGO'}
                </span>
              )}
              <div className="flex items-center gap-2">
                <span style={cinzel} className="text-[#4a4030] text-xs">{recurso.atual}/{recurso.max}</span>
                <button onClick={() => {
                  const novos = ficha.recursos.filter((_, i) => i !== idx);
                  setFicha(prev => ({ ...prev, recursos: novos }));
                }} className="text-red-900 hover:text-red-600 text-sm transition-colors">×</button>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: recurso.max }).map((_, i) => (
                <button key={i}
                  onClick={() => {
                    const novos = [...ficha.recursos];
                    novos[idx] = {
                      ...novos[idx],
                      atual: i < novos[idx].atual ? i : i + 1
                    };
                    setFicha(prev => ({ ...prev, recursos: novos }));
                  }}
                  className="w-6 h-6 border transition-all"
                  style={{
                    borderRadius: '2px',
                    borderColor: i < recurso.atual ? '#c8a84b' : '#c8a84b20',
                    backgroundColor: i < recurso.atual ? '#c8a84b25' : 'transparent',
                  }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>

{/* DESCANSO */}
<div className="border border-[#c8a84b20] bg-[#161410] mb-6">
  <div className="px-6 py-4 border-b border-[#c8a84b15]">
    <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">DESCANSO</p>
  </div>
  <div className="p-6 flex gap-3">
    <button onClick={() => {
      // Reseta recursos de descanso curto
      const novosRecursos = (ficha.recursos || []).map(r =>
        r.recuperacao === 'curto' ? { ...r, atual: r.max } : r
      );
      setFicha(prev => ({ ...prev, recursos: novosRecursos }));
    }}
      className="flex-1 border border-[#4a6a8a50] text-[#4a6a8a] py-3 text-xs hover:bg-[#4a6a8a10] transition-colors"
      style={{ ...cinzel, borderRadius: '2px' }}>
      🌙 DESCANSO CURTO
    </button>
    <button onClick={() => {
      // Reseta tudo — HP, recursos, slots
      const novosRecursos = (ficha.recursos || []).map(r => ({ ...r, atual: r.max }));
      const novosSpells = (ficha.spellcasting?.spells || []).map(s => ({ ...s, slots_used: 0 }));
      setFicha(prev => ({
        ...prev,
        recursos: novosRecursos,
        combat: { ...prev.combat, hp: prev.combat?.hp_max },
        spellcasting: { ...prev.spellcasting, spells: novosSpells },
        condicoes: [],
      }));
    }}
      className="flex-1 border border-[#8a4a8a50] text-[#8a4a8a] py-3 text-xs hover:bg-[#8a4a8a10] transition-colors"
      style={{ ...cinzel, borderRadius: '2px' }}>
      ☀ DESCANSO LONGO
    </button>
  </div>
</div>

        {/* INVENTÁRIO */}
{ficha.inventory && ficha.inventory.length > 0 && (
  <div className="border border-[#c8a84b20] bg-[#161410] mb-6">
    <div className="px-6 py-4 border-b border-[#c8a84b15] flex items-center justify-between">
      <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">INVENTÁRIO</p>
      <div className="flex gap-2">
        {['todos', 'magicos'].map(aba => (
          <button key={aba}
            onClick={() => setAbaInventario(aba)}
            className={`px-3 py-1 text-xs transition-colors ${abaInventario === aba ? 'bg-[#c8a84b] text-[#0f0e0c]' : 'border border-[#c8a84b30] text-[#c8a84b]'}`}
            style={{ ...cinzel, borderRadius: '2px' }}>
            {aba === 'todos' ? 'TODOS' : '✦ MÁGICOS'}
          </button>
        ))}
      </div>
    </div>
    <div className="p-6 flex flex-wrap gap-2">
      {ficha.inventory
        .filter(item => abaInventario === 'todos' || item.toLowerCase().includes('(comum)') || item.toLowerCase().includes('(incomum)') || item.toLowerCase().includes('(raro)') || item.toLowerCase().includes('(muito raro)') || item.toLowerCase().includes('(lendário)'))
        .map((item, i) => {
          const isMagico = ['(comum)', '(incomum)', '(raro)', '(muito raro)', '(lendário)'].some(r => item.toLowerCase().includes(r));
          return (
            <span key={i}
              className="border px-3 py-1 text-sm"
              style={{
                borderRadius: '2px',
                borderColor: isMagico ? '#c8a84b40' : '#c8a84b15',
                color: isMagico ? '#c8a84b' : '#6a6050',
                backgroundColor: isMagico ? '#c8a84b08' : 'transparent',
              }}>
              {item}
            </span>
          );
        })}
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

        <div className="flex gap-4">
          <button onClick={salvarFicha} disabled={salvando}
            className="bg-[#c8a84b] text-[#0f0e0c] px-8 py-3 text-sm tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-50"
            style={{ ...cinzel, borderRadius: '2px' }}>
            {salvando ? 'Salvando...' : 'Salvar Ficha'}
          </button>
          <button onClick={handleLevelUp}
            className="border border-[#c8a84b40] text-[#c8a84b] px-8 py-3 text-sm tracking-widest hover:bg-[#c8a84b10] transition-colors"
            style={{ ...cinzel, borderRadius: '2px' }}>
            ↑ Subir de Nível
          </button>
        </div>

        {/* MODAL LEVEL UP COM IA */}
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
                    ✦ A IA vai adicionar automaticamente todas as features, melhorias de atributos e recalcular os stats de combate.
                  </p>
                </div>
                {upando && (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin flex-shrink-0" />
                    <p style={cinzel} className="text-[#c8a84b] text-xs tracking-widest">SUBINDO DE NÍVEL...</p>
                  </div>
                )}
                <button onClick={() => fazerLevelUpComClasse(nivelAlvo, null)} disabled={upando}
                  className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30"
                  style={{ ...cinzel, borderRadius: '2px' }}>
                  {upando ? 'Aguarde...' : `Subir para Nível ${nivelAlvo} com IA →`}
                </button>
                <button onClick={() => !upando && setModalLevelUp(false)}
                  className="text-[#4a4030] text-xs tracking-widest hover:text-[#6a6050] transition-colors text-center"
                  style={cinzel}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ESCOLHER CLASSE (Multiclassing) */}
        {showClassLevelUpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 px-4"
            onClick={() => !upando && setShowClassLevelUpModal(false)}>
            <div className="bg-[#161410] border border-[#c8a84b30] max-w-md w-full"
              style={{ borderRadius: '2px' }}
              onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-[#c8a84b15]">
                <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">QUAL CLASSE SUBIR?</p>
              </div>
              <div className="px-6 py-6 space-y-3">
                {ficha.classes && ficha.classes.map((cls, idx) => (
                  <button key={idx}
                    onClick={() => confirmarLevelUpComClasse(cls.name)}
                    disabled={upando}
                    className="w-full bg-[#0f0e0c] hover:bg-[#1a1814] border border-[#c8a84b30] text-[#e8e0d0] p-4 rounded text-left transition disabled:opacity-50"
                    style={{ borderRadius: '2px' }}>
                    <span style={cinzel} className="font-bold text-[#c8a84b]">{cls.name}</span>
                    <span className="text-[#4a4030] text-sm float-right">{cls.level} → {cls.level + 1}</span>
                  </button>
                ))}
                <button
                  onClick={() => setShowClassLevelUpModal(false)}
                  disabled={upando}
                  className="w-full border border-[#4a4030] text-[#4a4030] hover:text-[#6a6050] p-2 rounded transition disabled:opacity-50"
                  style={{ borderRadius: '2px', ...cinzel }}>
                  Cancelar
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
    </div>
  );
}