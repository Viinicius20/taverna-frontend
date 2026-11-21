import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { cinzel } from '../estilos';
import { getCampanhaId } from '../utils/campanha';

let cache = null;  

export default function CampoLocal({ value, onChange, onEscolher, placeholder = 'Ex: Porto de Valdris' }) {
  const [locais, setLocais] = useState(cache || []);
  const [aberto, setAberto] = useState(false);
  const caixa = useRef(null);

  useEffect(() => {
    if (cache) return;
    api.get(`/locations/${getCampanhaId()}`)
      .then(r => { cache = r.data.data || []; setLocais(cache); })
      .catch(() => {});
  }, []);

  useEffect(() => {   // fecha a lista ao clicar fora
    function fora(e) {
      if (caixa.current && !caixa.current.contains(e.target)) setAberto(false);
    }
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, []);

  const termo = (value || '').trim().toLowerCase();
  const sugestoes = locais
    .filter(l => l.name && l.name.toLowerCase().includes(termo) && l.name.toLowerCase() !== termo)
    .slice(0, 6);

  return (
    <div ref={caixa} className="relative">
      <input value={value || ''}
        onChange={e => { onChange(e.target.value); setAberto(true); }}
        onFocus={() => setAberto(true)}
        onKeyDown={e => e.key === 'Escape' && setAberto(false)}
        placeholder={placeholder} aria-label="Local atual"
        className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full text-sm focus:outline-none focus:border-[#c8a84b50] placeholder-[#3a3020]"
        style={{ borderRadius: '2px' }} />

      {aberto && sugestoes.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-[#161410] border border-[#c8a84b20] z-10 max-h-56 overflow-y-auto"
          style={{ borderRadius: '2px' }}>
          {sugestoes.map(l => (
            <button key={l.id} type="button"
              onClick={() => { onChange(l.name); onEscolher?.(l); setAberto(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[#c8a84b10] transition-colors flex items-center justify-between"
              style={cinzel}>
              <span className="text-[#e8e0d0]">{l.name}</span>
              {l.type && <span className="text-[#8a7e68] text-xs">{l.type}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}