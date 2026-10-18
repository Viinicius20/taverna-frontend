import { useState, useEffect } from 'react';
import api from '../services/api';
import { notificar } from '../utils/notificar';

const cinzel = { fontFamily: "'Cinzel', serif" };
const CAMPANHA_ID = '00000000-0000-0000-0000-000000000001';

function textoDia(diaTotal, meses, anoInicial) {
  const anoDias = meses.reduce((a, m) => a + m.dias, 0);
  const ano = anoInicial + Math.floor(diaTotal / anoDias);
  let resto = diaTotal % anoDias;
  for (const m of meses) {
    if (resto < m.dias) return `${resto + 1} de ${m.nome}, ano ${ano}`;
    resto -= m.dias;
  }
  return '';
}

export default function PrazoEvento({ evento, onMudou }) {
  const [cal, setCal] = useState(null);
  const [dias, setDias] = useState(30);

  useEffect(() => {
    api.get(`/calendario/${CAMPANHA_ID}`).then(res => setCal(res.data.data)).catch(() => setCal(null));
  }, [evento.data_alvo]);

  async function salvar(corpo) {
    try {
      await api.put(`/world-events/${evento.id}/prazo`, corpo);
      if (onMudou) onMudou();
    } catch (e) { notificar(e.response?.data?.detail || 'Erro ao salvar o prazo.', 'erro'); }
  }

  if (!cal) return null;
  const alvo = evento.data_alvo;
  const temPrazo = alvo !== null && alvo !== undefined;
  const faltam = temPrazo ? alvo - cal.dia_total : 0;
  const cor = !temPrazo ? '#9a8e78' : faltam < 0 ? '#c84b4b' : faltam <= 7 ? '#c8a84b' : '#4a8a4a';
  const frase = faltam > 0 ? `faltam ${faltam} dias` : faltam === 0 ? 'é hoje' : `venceu há ${-faltam} dias`;

  return (
    <div onClick={e => e.stopPropagation()}>
      <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-2">📅 PRAZO</p>
      {temPrazo ? (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm" style={{ color: cor }}>
            {textoDia(alvo, cal.meses, cal.ano_inicial)} · {frase}
          </span>
          <button onClick={() => salvar({ remover: true })}
            className="text-xs text-[#9a8e78] hover:text-red-600">remover</button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-[#9a8e78] text-sm">daqui a</span>
          <input type="number" min="1" value={dias} onChange={e => setDias(e.target.value)}
            className="w-20 bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-2 py-1 text-sm focus:outline-none"
            style={{ borderRadius: '2px' }} />
          <span className="text-[#9a8e78] text-sm">dias</span>
          <button onClick={() => salvar({ em_dias: Number(dias) })}
            className="border border-[#c8a84b50] text-[#c8a84b] px-3 py-1 text-xs hover:bg-[#c8a84b10]"
            style={{ ...cinzel, borderRadius: '2px' }}>DEFINIR</button>
        </div>
      )}
    </div>
  );
}