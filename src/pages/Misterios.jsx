import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const cinzel = { fontFamily: "'Cinzel', serif" };

export default function Misterios() {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [total, setTotal] = useState(5);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/misterios');
      setLista(res.data.data || []);
    } catch {
      setErro('Erro ao carregar os mistérios.');
    }
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function criar() {
    if (!titulo.trim()) return;
    try {
      await api.post('/misterios', { title: titulo, description: descricao, clues_total: Number(total) || 1 });
      setTitulo(''); setDescricao(''); setTotal(5); setErro('');
      carregar();
    } catch { setErro('Erro ao criar o mistério.'); }
  }

  async function mudarPistas(m, delta) {
    const novo = Math.max(0, Math.min(m.clues_total, m.clues_found + delta));
    if (novo === m.clues_found) return;
    try {
      await api.put(`/misterios/${m.id}/pistas`, { clues_found: novo });
      carregar();
    } catch { setErro('Erro ao atualizar as pistas.'); }
  }

  async function apagar(m) {
    if (!window.confirm(`Apagar "${m.title}"?`)) return;
    try { await api.delete(`/misterios/${m.id}`); carregar(); }
    catch { setErro('Erro ao apagar.'); }
  }

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0] page-fade">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold">⚔ TAVERNA</span>
        <button onClick={() => navigate('/mestre')} style={cinzel}
          className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors">← Mestre</button>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">MUNDO</p>
        <h1 style={cinzel} className="text-3xl text-[#f0e8d8] font-bold mb-8">Mistérios Abertos</h1>

        <div className="border border-[#c8a84b20] bg-[#161410] p-4 flex flex-col gap-3 mb-8">
          <input value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={200}
            placeholder="Ex: Quem matou o rei?"
            className="bg-[#0f0e0c] border border-[#c8a84b20] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]"
            style={{ borderRadius: '2px' }} />
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} maxLength={2000}
            placeholder="O que os jogadores sabem até agora (opcional)"
            className="bg-[#0f0e0c] border border-[#c8a84b20] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50] resize-none"
            style={{ borderRadius: '2px' }} />
          <div className="flex items-center gap-3">
            <label style={cinzel} className="text-[#6a6050] text-xs">PISTAS NO TOTAL</label>
            <input type="number" min={1} max={50} value={total} onChange={e => setTotal(e.target.value)}
              className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#c8a84b] w-16 px-2 py-1 text-center text-sm focus:outline-none"
              style={{ borderRadius: '2px' }} />
            <button onClick={criar} disabled={!titulo.trim()} style={{ ...cinzel, borderRadius: '2px' }}
              className="ml-auto bg-[#c8a84b] text-[#0f0e0c] px-5 py-2 text-xs font-bold hover:bg-[#e0c060] disabled:opacity-30">
              + Novo mistério
            </button>
          </div>
          {erro && <p className="text-red-400 text-sm">{erro}</p>}
        </div>

        {carregando ? (
          <p style={cinzel} className="text-[#4a4030] text-xs tracking-widest text-center py-10">CARREGANDO...</p>
        ) : lista.length === 0 ? (
          <p className="text-[#3a3020] text-sm text-center py-10 italic">Nenhum mistério. O mundo é suspeitosamente tranquilo.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {lista.map(m => {
              const pct = Math.round((m.clues_found / m.clues_total) * 100);
              const resolvido = m.status === 'resolvido';
              return (
                <div key={m.id} className={`border bg-[#161410] p-5 ${resolvido ? 'border-[#2a7a2a60]' : 'border-[#c8a84b20]'}`}
                  style={{ borderRadius: '2px' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p style={cinzel} className={`text-lg ${resolvido ? 'text-[#4a8a4a] line-through' : 'text-[#f0e8d8]'}`}>
                        {resolvido ? '✓' : '❓'} {m.title}
                      </p>
                      {m.description && <p className="text-[#6a6050] text-sm mt-1 italic">{m.description}</p>}
                    </div>
                    <button onClick={() => apagar(m)} className="text-red-900 hover:text-red-600 text-lg" title="Apagar">×</button>
                  </div>
                  <div className="h-1.5 bg-[#0f0e0c] rounded-full overflow-hidden my-3">
                    <div className="h-full" style={{ width: `${pct}%`, backgroundColor: resolvido ? '#2a7a2a' : '#c8a84b' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={cinzel} className="text-[#c8a84b] text-xs">{m.clues_found}/{m.clues_total} pistas encontradas</span>
                    <div className="flex gap-2">
                      <button onClick={() => mudarPistas(m, -1)} style={{ ...cinzel, borderRadius: '2px' }}
                        className="border border-[#c8a84b30] text-[#6a6050] px-3 py-1 text-xs hover:border-[#c8a84b60]">−</button>
                      <button onClick={() => mudarPistas(m, 1)} style={{ ...cinzel, borderRadius: '2px' }}
                        className="border border-[#c8a84b30] text-[#c8a84b] px-3 py-1 text-xs hover:bg-[#c8a84b10]">+ Pista</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}