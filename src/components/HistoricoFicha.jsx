import { useState, useEffect } from 'react';
import api from '../services/api';

const cinzel = { fontFamily: "'Cinzel', serif" };

function rotuloCampo(campo) {
  return campo.split('.').map(p => p.replace(/_/g, ' ')).join(' › ');
}

function resumir(v) {
  if (v === null || v === undefined || v === '') return '—';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return s.length > 80 ? `${s.slice(0, 80)}…` : s;
}

function formatarData(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function HistoricoFicha({ characterId }) {
  const [linhas, setLinhas] = useState(null);
  const [erro, setErro] = useState(false);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    if (!characterId) return;
    let ativo = true;
    setLinhas(null);
    setErro(false);
    api.get(`/characters/${characterId}/historico`)
      .then(res => { if (ativo) setLinhas(res.data.data || []); })
      .catch(() => { if (ativo) { setErro(true); setLinhas([]); } });
    return () => { ativo = false; };
  }, [characterId]);

  const termo = filtro.trim().toLowerCase();
  const visiveis = (linhas || []).filter(l => rotuloCampo(l.campo).toLowerCase().includes(termo));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">HISTÓRICO DE ALTERAÇÕES</p>
        <input value={filtro} onChange={e => setFiltro(e.target.value)}
          placeholder="Filtrar por campo..." aria-label="Filtrar por campo..."
          className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
          style={{ borderRadius: '2px' }} />
      </div>

      {linhas === null && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
        </div>
      )}

      {erro && (
        <p className="text-red-400 text-sm text-center py-12">Não foi possível carregar o histórico.</p>
      )}

      {linhas !== null && !erro && visiveis.length === 0 && (
        <p className="text-[#8a7e68] text-sm text-center py-12">Nenhuma alteração registrada.</p>
      )}

      <div className="space-y-2">
        {visiveis.map(l => (
          <div key={l.id} className="border border-[#c8a84b15] bg-[#161410] p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px]">
                {rotuloCampo(l.campo).toUpperCase()}
              </p>
              <p className="text-[#8a7e68] text-xs">{l.autor} · {formatarData(l.created_at)}</p>
            </div>
            <p className="text-sm break-words">
              <span className="text-[#8a7e68]">{resumir(l.valor_antigo)}</span>
              <span className="text-[#c8a84b] mx-2">→</span>
              <span className="text-[#e8e0d0]">{resumir(l.valor_novo)}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}