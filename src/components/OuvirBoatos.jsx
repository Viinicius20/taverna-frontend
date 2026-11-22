import { useState } from 'react';
import api from '../services/api';
import { cinzel } from '../estilos';

const PERICIAS = [['investigation', 'Investigação'], ['persuasion', 'Persuasão'], ['insight', 'Intuição']];
const radius = { borderRadius: '2px' };

export default function OuvirBoatos({ personagemId }) {
  const [pericia, setPericia] = useState('investigation');
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');

  async function ouvir() {
    setCarregando(true);
    setErro('');
    try {
      const r = await api.post(`/boato/ouvir/${personagemId}?pericia=${pericia}`);
      setResultado(r.data.data);
    } catch (e) {
      setErro(e.response?.status === 429
        ? 'A taverna está barulhenta demais. Tente de novo em instantes.'
        : 'Ninguém quis falar agora.');
    }
    setCarregando(false);
  }

  const rol = resultado?.rolagem;
  const nomePericia = PERICIAS.find(([k]) => k === rol?.pericia)?.[1];

  return (
    <div className="border border-[#c8a84b20] bg-[#161410] p-4 space-y-3" style={radius}>
      <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">OUVIR OS BOATOS</p>
      <div className="flex gap-2">
        <select value={pericia} onChange={e => setPericia(e.target.value)} aria-label="Perícia"
          className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#9a8e78] px-2 py-1 text-xs flex-1 focus:outline-none"
          style={radius}>
          {PERICIAS.map(([k, nome]) => <option key={k} value={k}>{nome}</option>)}
        </select>
        <button onClick={ouvir} disabled={carregando}
          className="bg-[#c8a84b] text-[#0f0e0c] px-4 py-1 text-xs font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-50"
          style={{ ...cinzel, ...radius }}>
          {carregando ? '⟳ ...' : '🍺 OUVIR'}
        </button>
      </div>

      {erro && <p className="text-red-400 text-xs">{erro}</p>}

      {resultado && (
        <div className="border-t border-[#c8a84b10] pt-3">
          {rol && (
            <p className="text-[#8a7e68] text-xs mb-2">
              🎲 {nomePericia}: {rol.d20} {rol.bonus >= 0 ? '+' : '−'} {Math.abs(rol.bonus)} = <span className="text-[#c8a84b]">{rol.total}</span>
            </p>
          )}
          <p className="text-[#e8e0d0] text-sm italic">"{resultado.boato}"</p>
          {resultado.fonte && <p className="text-[#8a7e68] text-xs mt-1">: {resultado.fonte}</p>}
        </div>
      )}
    </div>
  );
}