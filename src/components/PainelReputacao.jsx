import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

const cinzel = { fontFamily: "'Cinzel', serif" };
const MAXIMO = 100;
const FAIXAS = {
  faction: [
    { min: 50, nome: 'Aliada', emoji: '', cor: '#4a8a4a' },
    { min: -49, nome: 'Neutra', emoji: '', cor: '#8a8070' },
    { min: -Infinity, nome: 'Hostil', emoji: '', cor: '#c84b4b' },
  ],
  npc: [
    { min: 75, nome: 'Leal', emoji: '🤝', cor: '#c8a84b' },
    { min: 50, nome: 'Amigável', emoji: '😊', cor: '#4a8a4a' },
    { min: 21, nome: 'Cordial', emoji: '🙂', cor: '#7aaa5a' },
    { min: -20, nome: 'Neutro', emoji: '😐', cor: '#8a8070' },
    { min: -49, nome: 'Desconfiado', emoji: '😒', cor: '#d08a30' },
    { min: -75, nome: 'Hostil', emoji: '😡', cor: '#c84b4b' },
    { min: -Infinity, nome: 'Inimigo jurado', emoji: '💀', cor: '#8a2020' },
  ],
};
const faixaPorPontos = (tipo, p) => (FAIXAS[tipo] || FAIXAS.faction).find(f => p >= f.min);
const COR = { aliada: '#4a8a4a', neutra: '#8a8070', hostil: '#c84b4b' };

export default function PainelReputacao({ tipo, id, pontos = 0, onMudou }) {
  const [delta, setDelta] = useState(10);
  const [motivo, setMotivo] = useState('');
  const [log, setLog] = useState([]);
  const [erro, setErro] = useState('');

  const carregarLog = useCallback(async () => {
    try {
      const res = await api.get(`/reputation/${tipo}/${id}/log`);
      setLog(res.data.data || []);
    } catch { setLog([]); }
  }, [tipo, id]);

  useEffect(() => { carregarLog(); }, [carregarLog]);

  async function aplicar() {
    const d = Number(delta);
    if (!motivo.trim() || !d) return;
    try {
      await api.post(`/reputation/${tipo}/${id}`, { delta: d, reason: motivo });
      setMotivo(''); setErro('');
      await carregarLog();
      if (onMudou) onMudou();
    } catch { setErro('Erro ao ajustar a reputação.'); }
  }

async function apagarLog(logId) {
  if (!window.confirm('Apagar este registro do histórico?')) return;
  try {
    await api.delete(`/reputation/log/${logId}`);
    setLog(prev => prev.filter(h => h.id !== logId));
  } catch { setErro('Erro ao apagar o registro.'); }
}

  const faixa = faixaPorPontos(tipo, pontos);
  const pos = ((Math.max(-MAXIMO, Math.min(MAXIMO, pontos)) + MAXIMO) / (2 * MAXIMO)) * 100;

  return (
    <div className="flex flex-col gap-3" onClick={e => e.stopPropagation()}>
      <p style={{ ...cinzel, color: faixa.cor }} className="text-xs tracking-[2px]">
        {faixa.emoji ? `${faixa.emoji} ` : ''}{faixa.nome.toUpperCase()} · {pontos > 0 ? '+' : ''}{pontos}
      </p>

      <div className="relative h-2 bg-[#0f0e0c] rounded-full">
        <div className="absolute inset-y-0 w-px bg-[#c8a84b40]" style={{ left: '25%' }} />
        <div className="absolute inset-y-0 w-px bg-[#c8a84b60]" style={{ left: '50%' }} />
        <div className="absolute inset-y-0 w-px bg-[#c8a84b40]" style={{ left: '75%' }} />
        <div className="absolute -top-0.5 w-3 h-3 rounded-full"
          style={{ left: `calc(${pos}% - 6px)`, backgroundColor: faixa.cor }} />
      </div>

      <div className="flex gap-2">
        <input type="number" value={delta} onChange={e => setDelta(e.target.value)}
          title="Pontos (negativo para perder)"
          className="w-20 bg-[#0f0e0c] border border-[#c8a84b20] text-[#c8a84b] text-center px-2 py-2 text-sm focus:outline-none"
          style={{ borderRadius: '2px' }} />
        <input value={motivo} onChange={e => setMotivo(e.target.value)} maxLength={300}
          placeholder="Motivo (ex: Salvou o capitão)"
          className="flex-1 bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
          style={{ borderRadius: '2px' }} />
        <button onClick={aplicar} disabled={!motivo.trim() || !Number(delta)}
          className="bg-[#c8a84b] text-[#0f0e0c] px-4 py-2 text-xs font-bold disabled:opacity-30"
          style={{ ...cinzel, borderRadius: '2px' }}>Aplicar</button>
      </div>
      {erro && <p className="text-red-400 text-xs">{erro}</p>}

      {log.length > 0 && (
  <div className="flex flex-col gap-1">
    {log.map(h => (
      <div key={h.id} className="flex items-start justify-between gap-2">
        <p className="text-xs text-[#8a7e68]">
          <span style={{ color: h.delta > 0 ? COR.aliada : COR.hostil }}>{h.delta > 0 ? '+' : ''}{h.delta}</span>
          {' · '}{h.reason}
          <span className="text-[#7a6e58]"> · {new Date(h.created_at).toLocaleDateString('pt-BR')}{h.source === 'evento' ? ' · evento' : ''}</span>
        </p>
        <button onClick={() => apagarLog(h.id)}
          className="text-red-900 hover:text-red-600 text-xs transition-colors flex-shrink-0">×</button>
      </div>
    ))}
  </div>
)}
    </div>
  );
}