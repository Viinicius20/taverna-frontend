import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { cinzel } from '../estilos';
import { getCampanhaId } from '../utils/campanha';

const radius = { borderRadius: '2px' };
const TIPOS = [
  ['regiao', 'Terras'], ['local', 'Locais'], ['npc', 'NPCs'], ['faccao', 'Facções'], ['segredo', 'Segredos'],
];

export default function PainelDescobertas() {
  const campanha = getCampanhaId();
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState(null);
  const [tipo, setTipo] = useState('local');
  const [busca, setBusca] = useState('');
  const [soOcultos, setSoOcultos] = useState(true);
  const [marcados, setMarcados] = useState(new Set());
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(() => {
    return api.get(`/descobertas-painel/${campanha}`)
      .then(r => setDados(r.data.data))
      .catch(() => setDados({}));
  }, [campanha]);

  useEffect(() => {
    if (aberto && !dados) carregar();
  }, [aberto, dados, carregar]);

  async function revelar(ids) {
    setOcupado(true);
    try {
      await Promise.all(ids.map(id => api.post('/descobertas', {
        campaign_id: campanha, tipo, entidade_id: String(id),
      })));
      setMarcados(new Set());
      await carregar();
    } catch { alert('Erro ao revelar.'); }
    setOcupado(false);
  }

  async function esconder(descobertaId) {
    setOcupado(true);
    try {
      await api.delete(`/descobertas/${descobertaId}`);
      await carregar();
    } catch { alert('Erro ao esconder.'); }
    setOcupado(false);
  }

  function marcar(id) {
    setMarcados(m => {
      const novo = new Set(m);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      return novo;
    });
  }

  const lista = (dados?.[tipo] || [])
    .filter(i => !soOcultos || !i.revelado)
    .filter(i => !busca || i.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="border border-[#c8a84b20] bg-[#161410]" style={radius}>
      <button onClick={() => setAberto(a => !a)}
        className="w-full flex items-center justify-between px-4 py-3">
        <span style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">👁 DESCOBERTAS</span>
        <span className="text-[#8a7e68] text-xs">{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#c8a84b10] pt-3">
          <div className="flex flex-wrap gap-1">
            {TIPOS.map(([k, nome]) => {
              const todos = dados?.[k] || [];
              const reveladas = todos.filter(i => i.revelado).length;
              return (
                <button key={k} onClick={() => { setTipo(k); setMarcados(new Set()); }}
                  className="text-xs border px-2 py-1 transition-colors"
                  style={{ ...cinzel, ...radius,
                           borderColor: tipo === k ? '#c8a84b' : '#c8a84b20',
                           color: tipo === k ? '#c8a84b' : '#8a7e68' }}>
                  {nome} {dados ? `${reveladas}/${todos.length}` : ''}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 items-center">
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." aria-label="Buscar"
              className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-1 flex-1 text-xs focus:outline-none focus:border-[#c8a84b50] placeholder-[#3a3020]"
              style={radius} />
            <label className="flex items-center gap-1 text-xs text-[#9a8e78] whitespace-nowrap cursor-pointer">
              <input type="checkbox" checked={soOcultos} onChange={e => setSoOcultos(e.target.checked)} />
              só ocultos
            </label>
          </div>

          {!dados && <p className="text-[#8a7e68] text-xs">Carregando...</p>}
          {dados && lista.length === 0 && (
            <p className="text-[#8a7e68] text-xs">
              {soOcultos ? 'Nada oculto aqui. Tudo já foi revelado.' : 'Nada por aqui.'}
            </p>
          )}

          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {lista.map(i => (
              <div key={i.id} className="flex items-center gap-2 border border-[#c8a84b10] bg-[#0f0e0c] px-2 py-1" style={radius}>
                {!i.revelado && (
                  <input type="checkbox" checked={marcados.has(i.id)} onChange={() => marcar(i.id)}
                    aria-label={`Selecionar ${i.nome}`} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#e8e0d0] truncate">{i.nome}</p>
                  {(i.subtitulo || i.aviso) && (
                    <p className="text-[10px] text-[#8a7e68] truncate">
                      {i.subtitulo}
                      {i.aviso && <span className="text-[#b07050]">{i.subtitulo ? ' · ' : ''}{i.aviso}</span>}
                    </p>
                  )}
                </div>
                {i.revelado ? (
                  <button onClick={() => esconder(i.descoberta_id)} disabled={ocupado}
                    className="text-[10px] border border-[#4a8a4a60] text-[#4a8a4a] px-2 py-0.5 disabled:opacity-40"
                    style={{ ...cinzel, ...radius }} title="Clique para esconder de novo">✓ REVELADO</button>
                ) : (
                  <button onClick={() => revelar([i.id])} disabled={ocupado}
                    className="text-[10px] border border-[#c8a84b30] text-[#c8a84b] px-2 py-0.5 hover:bg-[#c8a84b10] disabled:opacity-40"
                    style={{ ...cinzel, ...radius }}>👁 REVELAR</button>
                )}
              </div>
            ))}
          </div>

          {marcados.size > 0 && (
            <button onClick={() => revelar([...marcados])} disabled={ocupado}
              className="w-full bg-[#c8a84b] text-[#0f0e0c] py-2 text-xs font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-50"
              style={{ ...cinzel, ...radius }}>
              {ocupado ? '⟳ REVELANDO...' : `REVELAR SELECIONADOS (${marcados.size})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}