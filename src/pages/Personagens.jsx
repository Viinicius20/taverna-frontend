import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };

export default function Personagens() {
  const navigate = useNavigate();
  const [personagens, setPersonagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [deletando, setDeletando] = useState(null);

  // Modal de habilidade
  const [modal, setModal] = useState(null); // { skill, system, context }
  const [descricaoSkill, setDescricaoSkill] = useState(null);
  const [carregandoSkill, setCarregandoSkill] = useState(false);

  useEffect(() => {
    buscarPersonagens();
  }, []);

  async function buscarPersonagens() {
    setCarregando(true);
    try {
      const res = await api.get('/characters');
      setPersonagens(res.data.data || []);
    } catch {
      setErro('Erro ao buscar personagens. Verifique se o backend está rodando.');
    }
    setCarregando(false);
  }

  async function deletarPersonagem(id) {
    if (!window.confirm('Tem certeza que deseja deletar este personagem?')) return;
    setDeletando(id);
    try {
      await api.delete(`/characters/${id}`);
      setPersonagens(prev => prev.filter(p => p.id !== id));
    } catch {
      setErro('Erro ao deletar personagem.');
    }
    setDeletando(null);
  }

  async function abrirSkill(skillName, system, characterContext) {
    setModal({ skill: skillName, system, context: characterContext });
    setDescricaoSkill(null);
    setCarregandoSkill(true);
    try {
      const res = await api.get(`/skill-description/${encodeURIComponent(skillName)}`, {
        params: { system, character_context: characterContext }
      });
      setDescricaoSkill(res.data.data);
    } catch {
      setDescricaoSkill({ error: 'Não foi possível carregar a descrição.' });
    }
    setCarregandoSkill(false);
  }

  function fecharModal() {
    setModal(null);
    setDescricaoSkill(null);
  }

  const attrLabel = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };

  const tipoColor = {
    'magia': '#7ab8d4',
    'feature racial': '#a8c87a',
    'feature de classe': '#c8a84b',
    'perícia': '#c87ab8',
  };

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
          <button onClick={() => navigate('/personagens/criar')}
            className="bg-[#c8a84b] text-[#0f0e0c] px-5 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors"
            style={{ ...cinzel, borderRadius: '2px' }}>
            + Novo Personagem
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">

        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">ÁREA DO JOGADOR</p>
        <h1 style={cinzel} className="text-3xl text-[#f0e8d8] font-bold mb-2">Meus Personagens</h1>
        <p className="text-[#7a7060] mb-10 font-light">
          Todos os seus aventureiros em um só lugar. <span className="text-[#4a4030]">Clique em uma habilidade para ver sua descrição.</span>
        </p>

        {/* CARREGANDO */}
        {carregando && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-10 h-10 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
            <p style={cinzel} className="text-[#c8a84b] text-sm tracking-widest">CARREGANDO...</p>
          </div>
        )}

        {/* ERRO */}
        {erro && !carregando && (
          <div className="border border-red-900 bg-red-950 bg-opacity-30 px-6 py-4 mb-6">
            <p className="text-red-400 text-sm">{erro}</p>
          </div>
        )}

        {/* VAZIO */}
        {!carregando && !erro && personagens.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 border border-[#c8a84b15] bg-[#161410]">
            <span className="text-4xl opacity-20">⚔</span>
            <p style={cinzel} className="text-[#4a4030] text-sm tracking-widest">NENHUM PERSONAGEM AINDA</p>
            <button onClick={() => navigate('/personagens/criar')}
              className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors mt-2"
              style={{ ...cinzel, borderRadius: '2px' }}>
              Criar Primeiro Personagem
            </button>
          </div>
        )}

        {/* LISTA */}
        {!carregando && personagens.length > 0 && (
          <div className="flex flex-col gap-px bg-[#c8a84b15] border border-[#c8a84b15]">
            {personagens.map(p => {
              const d = p.data || {};
              const attrs = d.attributes || {};
              const context = `${d.race || ''} ${d.class || ''} nível ${d.level || 1}`;

              return (
                <div key={p.id} className="bg-[#161410] hover:bg-[#1a1814] transition-colors group">
                  <div className="p-6 flex items-start justify-between gap-4">

                    <div className="flex-1 min-w-0">
                      {/* Nome e badges */}
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h2 style={cinzel}
                          className="text-[#f0e8d8] text-lg font-semibold cursor-pointer hover:text-[#c8a84b] transition-colors"
                          onClick={() => navigate(`/personagens/${p.id}`)}>
                          {d.name || p.name || 'Sem nome'}
                        </h2>
                        <span className="border border-[#c8a84b25] text-[#c8a84b] px-2 py-0.5 text-xs"
                          style={{ ...cinzel, borderRadius: '2px' }}>
                          {p.system || 'D&D 5e'}
                        </span>
                        {d.level && (
                          <span className="text-[#4a4030] text-xs" style={cinzel}>Nível {d.level}</span>
                        )}
                      </div>

                      <p className="text-[#6a6050] text-sm mb-4">
                        {[d.race, d.class, d.background].filter(Boolean).join(' · ')}
                      </p>

                      {/* Atributos */}
                      {Object.keys(attrs).length > 0 && (
                        <div className="flex gap-4 flex-wrap mb-4">
                          {Object.entries(attrs).map(([attr, val]) => (
                            <div key={attr} className="flex flex-col items-center gap-0.5">
                              <span style={cinzel} className="text-[#4a4030] text-xs">
                                {attrLabel[attr] || attr.toUpperCase()}
                              </span>
                              <span className="text-[#c8a84b] text-sm font-light">{val}</span>
                              <span style={cinzel} className="text-[#3a3020] text-xs">
                                {Math.floor((val - 10) / 2) >= 0 ? '+' : ''}{Math.floor((val - 10) / 2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Features clicáveis */}
                      {d.features && d.features.length > 0 && (
                        <div>
                          <p style={cinzel} className="text-[#4a4030] text-xs tracking-widest mb-2">
                            HABILIDADES — clique para ver descrição
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {d.features.map((f, i) => (
                              <button key={i}
                                onClick={() => abrirSkill(f, p.system || 'D&D 5e', context)}
                                className="border border-[#c8a84b25] bg-[#c8a84b08] text-[#c8a84b] px-3 py-1 text-xs hover:bg-[#c8a84b18] hover:border-[#c8a84b50] transition-all cursor-pointer"
                                style={{ ...cinzel, borderRadius: '2px', letterSpacing: '0.5px' }}>
                                {f} ↗
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Deletar */}
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => deletarPersonagem(p.id)} disabled={deletando === p.id}
                        className="border border-red-900 text-red-700 hover:text-red-400 hover:border-red-700 px-3 py-1.5 text-xs transition-colors disabled:opacity-40"
                        style={{ ...cinzel, borderRadius: '2px', letterSpacing: '1px' }}>
                        {deletando === p.id ? '...' : 'Deletar'}
                      </button>
                    </div>
                  </div>

                  {/* Preview história */}
                  {d.background_story && (
                    <div className="px-6 pb-5">
                      <p className="text-[#3a3028] text-sm font-light leading-relaxed line-clamp-2"
                        style={{ borderTop: '0.5px solid #1a1810', paddingTop: '12px' }}>
                        {d.background_story}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!carregando && personagens.length > 0 && (
          <p style={cinzel} className="text-[#3a3020] text-xs tracking-widest text-center mt-6">
            {personagens.length} {personagens.length === 1 ? 'PERSONAGEM' : 'PERSONAGENS'}
          </p>
        )}
      </div>

      {/* MODAL DE HABILIDADE */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 px-4"
          onClick={fecharModal}>
          <div className="bg-[#161410] border border-[#c8a84b30] max-w-lg w-full max-h-[80vh] overflow-y-auto"
            style={{ borderRadius: '2px' }}
            onClick={e => e.stopPropagation()}>

            {/* Header do modal */}
            <div className="px-6 py-4 border-b border-[#c8a84b15] flex items-center justify-between">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">HABILIDADE</p>
              <button onClick={fecharModal}
                className="text-[#4a4030] hover:text-[#c8a84b] text-xl transition-colors leading-none">
                ×
              </button>
            </div>

            <div className="px-6 py-6">
              {/* Carregando */}
              {carregandoSkill && (
                <div className="flex flex-col items-center py-10 gap-4">
                  <div className="w-8 h-8 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
                  <p style={cinzel} className="text-[#4a4030] text-xs tracking-widest">CONSULTANDO A IA...</p>
                </div>
              )}

              {/* Conteúdo */}
              {!carregandoSkill && descricaoSkill && !descricaoSkill.error && (
                <div className="flex flex-col gap-5">

                  {/* Nome e tipo */}
                  <div>
                    <h2 style={cinzel} className="text-[#f0e8d8] text-xl font-semibold mb-2">
                      {descricaoSkill.name || modal.skill}
                    </h2>
                    {descricaoSkill.type && (
                      <span className="text-xs px-3 py-1 border"
                        style={{
                          ...cinzel,
                          borderRadius: '2px',
                          letterSpacing: '1px',
                          color: tipoColor[descricaoSkill.type] || '#c8a84b',
                          borderColor: `${tipoColor[descricaoSkill.type] || '#c8a84b'}40`,
                          background: `${tipoColor[descricaoSkill.type] || '#c8a84b'}10`,
                        }}>
                        {descricaoSkill.type.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Origem */}
                  {descricaoSkill.source && (
                    <div>
                      <p style={cinzel} className="text-[#4a4030] text-xs tracking-[2px] mb-1">ORIGEM</p>
                      <p className="text-[#6a6050] text-sm font-light">{descricaoSkill.source}</p>
                    </div>
                  )}

                  {/* Descrição */}
                  {descricaoSkill.description && (
                    <div>
                      <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-2">DESCRIÇÃO</p>
                      <p className="text-[#a09880] text-base leading-relaxed font-light">
                        {descricaoSkill.description}
                      </p>
                    </div>
                  )}

                  {/* Mecânica */}
                  {descricaoSkill.mechanics && (
                    <div className="border border-[#c8a84b15] bg-[#0f0e0c] px-4 py-4">
                      <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-2">EM JOGO</p>
                      <p className="text-[#8a8070] text-sm leading-relaxed font-light">
                        {descricaoSkill.mechanics}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Erro */}
              {!carregandoSkill && descricaoSkill?.error && (
                <p className="text-red-400 text-sm text-center py-8">{descricaoSkill.error}</p>
              )}
            </div>

            <div className="px-6 pb-6">
              <button onClick={fecharModal}
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