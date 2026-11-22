import { useState, useEffect } from 'react';
import api from '../services/api';
import { cinzel } from '../estilos';
import { getCampanhaId } from '../utils/campanha';

const CAMPOS = [
  { chave: 'segredos', rotulo: '🤫 SEGREDOS', dica: 'O que a facção esconde...' },
  { chave: 'objetivo_oculto', rotulo: 'OBJETIVO OCULTO', dica: 'O que ela realmente quer...' },
  { chave: 'notas_mestre', rotulo: 'ANOTAÇÕES DO MESTRE', dica: 'O que você quiser lembrar...' },
];

let promessa = null;   
const cache = {};

function carregar() {
  if (!promessa) {
    promessa = api.get(`/faccao-notas/${getCampanhaId()}`)
      .then(r => { Object.assign(cache, r.data.data || {}); return cache; })
      .catch(() => { promessa = null; return cache; });
  }
  return promessa;
}

export default function NotasFaccao({ faccaoId, campos = CAMPOS }) {
  const [notas, setNotas] = useState(cache[faccaoId] || {});
  const [estado, setEstado] = useState('');   

  useEffect(() => {
    carregar().then(c => setNotas(c[faccaoId] || {}));
  }, [faccaoId]);

  async function salvar(chave, valor) {
    if (valor === ((cache[faccaoId] || {})[chave] || '')) return;   
    setEstado('salvando');
    try {
      await api.put(`/faccao-notas/${getCampanhaId()}/${faccaoId}`, { notas: { [chave]: valor } });
      cache[faccaoId] = { ...(cache[faccaoId] || {}), [chave]: valor };
      setEstado('salvo');
    } catch { setEstado('erro'); }
  }

  return (
    <div className="space-y-3 border-t border-[#c8a84b10] pt-3" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <p style={cinzel} className="text-[#b07050] text-xs tracking-[3px] opacity-70">EXCLUSIVO DO MESTRE</p>
        <span className="text-xs text-[#6a6050]">
          {estado === 'salvando' ? 'salvando...' : estado === 'salvo' ? 'salvo ✓' : estado === 'erro' ? 'erro ao salvar' : ''}
        </span>
      </div>
      {campos.map(c => (
        <div key={c.chave}>
          <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">{c.rotulo}</label>
          <textarea rows={3} value={notas[c.chave] || ''} placeholder={c.dica} aria-label={c.rotulo}
            onChange={e => setNotas(n => ({ ...n, [c.chave]: e.target.value }))}
            onBlur={e => salvar(c.chave, e.target.value)}
            className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full text-sm focus:outline-none focus:border-[#c8a84b50] placeholder-[#3a3020] resize-none"
            style={{ borderRadius: '2px' }} />
        </div>
      ))}
    </div>
  );
}