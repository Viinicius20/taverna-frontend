import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TextoWiki from '../components/TextoWiki';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };
const CAMPANHA_ID = '00000000-0000-0000-0000-000000000001';
const CATEGORIAS = ['Lore', 'Pessoas', 'Lugares', 'Facções', 'Eventos', 'Outros'];
const VAZIO = { titulo: '', categoria: 'Lore', conteudo: '', notas_mestre: '', revelada: false };

export default function Wiki() {
  const navigate = useNavigate();
  const [paginas, setPaginas] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [atualId, setAtualId] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [busca, setBusca] = useState('');
  const [previa, setPrevia] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api.get(`/wiki/${CAMPANHA_ID}`).then(res => setPaginas(res.data.data || [])).catch(() => setPaginas([]));
    const nomes = (rota, tipo) => api.get(`${rota}/${CAMPANHA_ID}`)
      .then(r => (r.data.data || []).map(x => ({ nome: x.name, tipo }))).catch(() => []);
    Promise.all([nomes('/npcs', 'npc'), nomes('/locations', 'local'), nomes('/factions', 'faccao')])
      .then(listas => setEntidades(listas.flat()));
  }, []);

  function abrir(id) {
    const p = paginas.find(x => x.id === id);
    if (!p) return;
    setAtualId(id);
    setForm({ titulo: p.titulo, categoria: p.categoria, conteudo: p.conteudo || '', notas_mestre: p.notas_mestre || '', revelada: !!p.revelada });
    setPrevia(false);
  }

  function nova() { setAtualId(null); setForm(VAZIO); setPrevia(false); }

  async function salvar() {
    if (!form.titulo.trim()) return;
    setSalvando(true);
    try {
      if (atualId) {
        const res = await api.patch(`/wiki/${atualId}`, form);
        setPaginas(prev => prev.map(p => p.id === atualId ? res.data.data : p));
      } else {
        const res = await api.post('/wiki', { campaign_id: CAMPANHA_ID, ...form });
        setPaginas(prev => [...prev, res.data.data]);
        setAtualId(res.data.data.id);
      }
    } catch { alert('Erro ao salvar a página.'); }
    setSalvando(false);
  }

  async function apagar() {
    if (!atualId || !window.confirm('Apagar esta página?')) return;
    try {
      await api.delete(`/wiki/${atualId}`);
      setPaginas(prev => prev.filter(p => p.id !== atualId));
      nova();
    } catch { alert('Erro ao apagar.'); }
  }

  const filtradas = paginas.filter(p => p.titulo.toLowerCase().includes(busca.toLowerCase()));
  const campo = 'bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm w-full focus:outline-none focus:border-[#c8a84b50]';

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0]" style={crimson}>
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>⚔ TAVERNA</span>
        <button onClick={() => navigate('/mestre')} className="text-[#6a6050] text-sm hover:text-[#c8a84b]" style={cinzel}>
          ← Voltar
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-6">
        <div>
          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">CAMPANHA</p>
          <h1 style={cinzel} className="text-2xl text-[#f0e8d8] font-semibold mb-4">Wiki</h1>
          <button onClick={nova}
            className="w-full bg-[#c8a84b] text-[#0f0e0c] px-4 py-2 text-xs tracking-widest font-bold mb-3"
            style={{ ...cinzel, borderRadius: '2px' }}>+ Nova página</button>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." className={`${campo} mb-4`}
            style={{ borderRadius: '2px' }} />
          {CATEGORIAS.map(cat => {
            const lista = filtradas.filter(p => p.categoria === cat);
            if (lista.length === 0) return null;
            return (
              <div key={cat} className="mb-4">
                <p style={cinzel} className="text-[#4a4030] text-xs tracking-[2px] mb-1">{cat.toUpperCase()}</p>
                {lista.map(p => (
                  <button key={p.id} onClick={() => abrir(p.id)}
                    className={`block w-full text-left px-2 py-1 text-sm ${p.id === atualId ? 'text-[#c8a84b]' : 'text-[#a09880] hover:text-[#e8e0d0]'}`}>
                    {p.revelada ? '👁 ' : '🔒 '}{p.titulo}
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        <div className="border border-[#c8a84b20] bg-[#161410] p-6 flex flex-col gap-3">
          <div className="flex gap-2">
            <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Título da página" className={campo} style={{ borderRadius: '2px' }} />
            <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
              className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm" style={{ borderRadius: '2px' }}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px]">
              CONTEÚDO <span className="text-[#4a4030]">· use [[Nome]] para criar links</span>
            </p>
            <button onClick={() => setPrevia(!previa)} className="text-xs text-[#6a6050] hover:text-[#c8a84b]">
              {previa ? 'Editar' : 'Prévia'}
            </button>
          </div>
          {previa ? (
            <div className="border border-[#c8a84b15] bg-[#0f0e0c] p-3 min-h-[10rem]">
              <TextoWiki texto={form.conteudo} paginas={paginas} entidades={entidades}
                onAbrir={abrir} />
            </div>
          ) : (
            <textarea value={form.conteudo} rows={10}
              onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))}
              className={campo} style={{ borderRadius: '2px' }} />
          )}

          <p style={cinzel} className="text-[#8a4a8a] text-xs tracking-[2px]">🔒 NOTAS DO MESTRE (nunca aparecem pros jogadores)</p>
          <textarea value={form.notas_mestre} rows={4}
            onChange={e => setForm(f => ({ ...f, notas_mestre: e.target.value }))}
            className={campo} style={{ borderRadius: '2px' }} />

          <label className="flex items-center gap-2 text-[#6a6050] text-xs cursor-pointer">
            <input type="checkbox" checked={form.revelada}
              onChange={e => setForm(f => ({ ...f, revelada: e.target.checked }))} />
            <span style={cinzel} className="tracking-widest">REVELADA PARA OS JOGADORES</span>
          </label>

          <div className="flex gap-2 justify-between">
            <button onClick={salvar} disabled={!form.titulo.trim() || salvando}
              className="bg-[#4a6a8a] text-[#0f0e0c] px-5 py-2 text-xs tracking-widest font-bold disabled:opacity-30"
              style={{ ...cinzel, borderRadius: '2px' }}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            {atualId && (
              <button onClick={apagar}
                className="text-red-900 hover:text-red-600 text-xs border border-red-900 px-3 py-1.5"
                style={{ ...cinzel, borderRadius: '2px' }}>Apagar</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}