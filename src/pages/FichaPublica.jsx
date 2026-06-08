import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };

const attrLabel = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };

export default function FichaPublica() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ficha, setFicha] = useState(null);
  const [personagem, setPersonagem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    buscarPersonagem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function buscarPersonagem() {
    try {
      const res = await api.get(`/characters/${id}`);
      setPersonagem(res.data.data);
      setFicha(res.data.data.data);
    } catch {
      setErro('Personagem não encontrado.');
    }
    setCarregando(false);
  }

  if (carregando) return (
    <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center">
      <div className="w-8 h-8 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
    </div>
  );

  if (erro) return (
    <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center">
      <p style={cinzel} className="text-[#4a4030] text-sm">{erro}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0]" style={crimson}>
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>⚔ TAVERNA</span>
        <span style={cinzel} className="text-[#4a4030] text-xs tracking-widest">FICHA PÚBLICA</span>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-12">

        {/* Header */}
        <div className="mb-10">
          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">
            {personagem?.system || 'D&D 5e'}
          </p>
          <h1 style={cinzel} className="text-4xl text-[#f0e8d8] font-bold mb-2">{ficha?.name}</h1>
          <p className="text-[#6a6050]">
            {[ficha?.race, ficha?.class, ficha?.background].filter(Boolean).join(' · ')}
          </p>
          {ficha?.level && (
            <p style={cinzel} className="text-[#4a4030] text-xs mt-1">Nível {ficha.level}</p>
          )}
        </div>

        {/* Atributos */}
        {ficha?.attributes && Object.keys(ficha.attributes).length > 0 && (
          <div className="border border-[#c8a84b20] bg-[#161410] mb-6">
            <div className="px-6 py-4 border-b border-[#c8a84b15]">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">ATRIBUTOS</p>
            </div>
            <div className="p-6 grid grid-cols-6 gap-3">
              {Object.entries(ficha.attributes).map(([attr, val]) => (
                <div key={attr} className="flex flex-col items-center border border-[#c8a84b15] bg-[#0f0e0c] p-3">
                  <span style={cinzel} className="text-[#4a4030] text-xs mb-1">
                    {attrLabel[attr] || attr.toUpperCase()}
                  </span>
                  <span style={cinzel} className="text-[#c8a84b] text-xl">{val}</span>
                  <span style={cinzel} className="text-[#3a3020] text-xs">
                    {Math.floor((val - 10) / 2) >= 0 ? '+' : ''}{Math.floor((val - 10) / 2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Combat */}
        {ficha?.combat && (
          <div className="border border-[#c8a84b20] bg-[#161410] mb-6">
            <div className="px-6 py-4 border-b border-[#c8a84b15]">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">COMBATE</p>
            </div>
            <div className="p-6 grid grid-cols-3 gap-4">
              {[
                { label: 'HP', val: `${ficha.combat.hp_max || ficha.combat.hp}` },
                { label: 'CA', val: ficha.combat.ac || ficha.combat.ca },
                { label: 'INICIATIVA', val: ficha.combat.initiative ? `+${ficha.combat.initiative}` : '0' },
                { label: 'VELOCIDADE', val: `${ficha.combat.speed}m` },
                { label: 'PROF.', val: `+${ficha.combat.proficiency_bonus || ficha.combat.proficiency || 2}` },
                { label: 'DADO DE VIDA', val: ficha.combat.hit_dice },
              ].filter(i => i.val).map(({ label, val }) => (
                <div key={label} className="flex flex-col items-center border border-[#c8a84b15] bg-[#0f0e0c] p-3">
                  <span style={cinzel} className="text-[#4a4030] text-xs mb-1">{label}</span>
                  <span style={cinzel} className="text-[#c8a84b] text-lg">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Habilidades */}
        {ficha?.features && ficha.features.length > 0 && (
          <div className="border border-[#c8a84b20] bg-[#161410] mb-6">
            <div className="px-6 py-4 border-b border-[#c8a84b15]">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">HABILIDADES</p>
            </div>
            <div className="p-6 flex flex-wrap gap-2">
              {ficha.features
                .filter(f => typeof f === 'string' && f.trim() && !f.startsWith('**'))
                .map((f, i) => (
                  <span key={i}
                    className="border border-[#c8a84b20] text-[#6a6050] px-3 py-1 text-xs"
                    style={{ borderRadius: '2px' }}>
                    {f}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* História */}
        {ficha?.background_story && (
          <div className="border border-[#c8a84b20] bg-[#161410] mb-6">
            <div className="px-6 py-4 border-b border-[#c8a84b15]">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">HISTÓRIA</p>
            </div>
            <div className="p-6">
              <p className="text-[#6a6050] leading-relaxed font-light">{ficha.background_story}</p>
            </div>
          </div>
        )}

        {/* Botão copiar link */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copiado!');
          }}
          className="border border-[#c8a84b30] text-[#c8a84b] px-6 py-2 text-xs tracking-widest hover:bg-[#c8a84b10] transition-colors w-full mt-4"
          style={{ ...cinzel, borderRadius: '2px' }}>
          🔗 Copiar Link desta Ficha
        </button>

      </div>
    </div>
  );
}