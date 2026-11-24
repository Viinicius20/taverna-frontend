import { cinzel, crimson } from '../estilos';
import { getCampanhaId } from '../utils/campanha';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TextoWiki from '../components/TextoWiki';

const CAMPANHA_ID = getCampanhaId();
const CATEGORIAS = ['Lore', 'Pessoas', 'Lugares', 'Facções', 'Eventos', 'Outros'];
const VAZIO = {
  titulo: '', categoria: 'Lore', conteudo: '', notas_mestre: '', revelada: false,
  entidade_tipo: null, entidade_id: null,
};

// AJUSTE: "rota" é a tela onde a entidade pode ser vista (null = sem botão)
const TIPOS = {
  regiao:   { plural: 'Terras',    singular: 'Terra',    categoria: 'Lugares', rota: '/atlas',     rotaNome: 'Atlas' },
  local:    { plural: 'Locais',    singular: 'Local',    categoria: 'Lugares', rota: '/atlas',     rotaNome: 'Atlas' },
  npc:      { plural: 'NPCs',      singular: 'NPC',      categoria: 'Pessoas', rota: null,         rotaNome: '' },
  faccao:   { plural: 'Facções',   singular: 'Facção',   categoria: 'Facções', rota: null,         rotaNome: '' },
  criatura: { plural: 'Criaturas', singular: 'Criatura', categoria: 'Outros',  rota: '/bestiario', rotaNome: 'Bestiário' },
};
const TIPOS_DO_TEXTO = ['npc', 'local', 'faccao']; // os que o TextoWiki já sabe ligar

const campo = 'bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm w-full focus:outline-none focus:border-[#c8a84b50]';
const btnSec = 'text-xs border border-[#c8a84b30] text-[#c8a84b] px-3 py-1.5 hover:bg-[#c8a84b10]';
const radius = { borderRadius: '2px' };

const menciona = (texto, nome) =>
  !!nome && (texto || '').toLowerCase().includes(`[[${nome.toLowerCase()}]]`);

export default function Wiki() {
  const navigate = useNavigate();
  const [paginas, setPaginas] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState(false);
  const [modo, setModo] = useState('inicio'); // inicio | lista | ficha | editor
  const [tipoLista, setTipoLista] = useState(null);
  const [ficha, setFicha] = useState(null); // { tipo, id }
  const [atualId, setAtualId] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [busca, setBusca] = useState('');
  const [previa, setPrevia] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [abertos, setAbertos] = useState({});

  useEffect(() => {
    api.get(`/wiki/${CAMPANHA_ID}`)
      .then(res => setPaginas(res.data.data || []))
      .catch(() => setErroLista(true))
      .finally(() => setCarregando(false));
    api.get(`/wiki-indice/${CAMPANHA_ID}`)
      .then(res => setEntidades(res.data.data || []))
      .catch(() => setEntidades([]));
  }, []);

  const termo = busca.trim().toLowerCase();
  const paginasFiltradas = paginas.filter(p => (p.titulo || '').toLowerCase().includes(termo));

  const entidadesPorTipo = useMemo(() => {
    const g = {};
    Object.keys(TIPOS).forEach(t => { g[t] = []; });
    entidades.forEach(e => { if (g[e.tipo]) g[e.tipo].push(e); });
    return g;
  }, [entidades]);

  const entidadesDoTexto = useMemo(
    () => entidades.filter(e => TIPOS_DO_TEXTO.includes(e.tipo)),
    [entidades]
  );

  const entidadeAtual = ficha
    ? entidades.find(e => e.tipo === ficha.tipo && String(e.id) === String(ficha.id))
    : null;

  const paginasDaEntidade = (tipo, id) =>
    paginas.filter(p => p.entidade_tipo === tipo && String(p.entidade_id) === String(id));

  const recentes = [...paginas]
    .sort((a, b) => String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || '')))
    .slice(0, 5);

  /* ---------- navegação ---------- */
  function irInicio() { setModo('inicio'); setFicha(null); setAtualId(null); setTipoLista(null); }

  function abrirLista(tipo) { setTipoLista(tipo); setModo('lista'); setFicha(null); setAtualId(null); }

  function abrirFicha(ent) { setFicha({ tipo: ent.tipo, id: ent.id }); setModo('ficha'); setAtualId(null); }

  function abrir(id) {
    const p = paginas.find(x => x.id === id);
    if (!p) return;
    setAtualId(id);
    setFicha(null);
    setForm({
      titulo: p.titulo, categoria: p.categoria, conteudo: p.conteudo || '',
      notas_mestre: p.notas_mestre || '', revelada: !!p.revelada,
      entidade_tipo: p.entidade_tipo || null, entidade_id: p.entidade_id || null,
    });
    setPrevia(false);
    setModo('editor');
  }

  function nova(preset = {}) {
    setAtualId(null);
    setFicha(null);
    setForm({ ...VAZIO, ...preset });
    setPrevia(false);
    setModo('editor');
  }

  function novaSobre(ent) {
    nova({
      titulo: ent.nome,
      categoria: TIPOS[ent.tipo].categoria,
      entidade_tipo: ent.tipo,
      entidade_id: String(ent.id),
    });
  }

  /* ---------- salvar / apagar ---------- */
  async function salvar() {
    if (!form.titulo.trim()) return;
    setSalvando(true);
    try {
      if (atualId) {
        const res = await api.patch(`/wiki/${atualId}`, form);
        setPaginas(prev => prev.map(p => (p.id === atualId ? res.data.data : p)));
      } else {
        const res = await api.post('/wiki', { campaign_id: CAMPANHA_ID, ...form });
        setPaginas(prev => [...prev, res.data.data]);
        setAtualId(res.data.data.id);
      }
    } catch {
      alert('Não foi possível salvar a página. Confira a conexão e tente de novo.');
    }
    setSalvando(false);
  }

  async function apagar() {
    if (!atualId || !window.confirm('Apagar esta página?')) return;
    try {
      await api.delete(`/wiki/${atualId}`);
      setPaginas(prev => prev.filter(p => p.id !== atualId));
      irInicio();
    } catch {
      alert('Não foi possível apagar a página.');
    }
  }

  /* ---------- peças de tela ---------- */
  const entidadeDoForm = form.entidade_tipo
    ? entidades.find(e => e.tipo === form.entidade_tipo && String(e.id) === String(form.entidade_id))
    : null;
  const citadaEm = atualId
    ? paginas.filter(p => p.id !== atualId && menciona(p.conteudo, form.titulo))
    : [];

  function LinhaPagina({ p }) {
    return (
      <button onClick={() => abrir(p.id)}
        className="block w-full text-left px-3 py-2 text-sm text-[#9a8e78] hover:text-[#c8a84b] border border-[#c8a84b10] hover:border-[#c8a84b30]"
        style={radius}>
        {p.revelada ? '👁 ' : '🔒 '}{p.titulo}
        <span className="text-[#6a6050] text-xs"> · {p.categoria}</span>
      </button>
    );
  }

  function renderInicio() {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 style={cinzel} className="text-xl text-[#f0e8d8]">Enciclopédia da campanha</h2>
          <p className="text-[#8a7e68] text-sm mt-1">
            Tudo o que existe no mundo, mais as páginas de história que você escreve.
          </p>
        </div>

        {entidades.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(TIPOS).map(([tipo, t]) => (
              <button key={tipo} onClick={() => abrirLista(tipo)}
                className="border border-[#c8a84b20] bg-[#161410] p-4 text-left hover:border-[#c8a84b60] transition-colors"
                style={radius}>
                <p style={cinzel} className="text-[#c8a84b] text-2xl">{entidadesPorTipo[tipo].length}</p>
                <p className="text-[#9a8e78] text-sm mt-1">{t.plural}</p>
              </button>
            ))}
          </div>
        )}

        <div>
          <p style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] mb-2">PÁGINAS RECENTES</p>
          {carregando ? (
            <p className="text-[#8a7e68] text-sm">Carregando...</p>
          ) : erroLista ? (
            <p className="text-red-400 text-sm">
              Não foi possível carregar as páginas. Recarregue; se continuar, o servidor pode estar fora do ar.
            </p>
          ) : recentes.length === 0 ? (
            <div className="border border-dashed border-[#c8a84b20] p-5" style={radius}>
              <p className="text-[#9a8e78] text-sm">
                Nenhuma página ainda. Use “+ Nova página”, ou abra um local ou NPC na lateral e escreva a história dele.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentes.map(p => <LinhaPagina key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderLista() {
    const t = TIPOS[tipoLista];
    const lista = entidadesPorTipo[tipoLista] || [];
    return (
      <div className="flex flex-col gap-4">
        <button onClick={irInicio} className="text-xs text-[#9a8e78] hover:text-[#c8a84b] self-start">← Início</button>
        <h2 style={cinzel} className="text-xl text-[#f0e8d8]">{t.plural}</h2>
        {lista.length === 0 ? (
          <p className="text-[#8a7e68] text-sm">Nada por aqui ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lista.map(e => (
              <button key={`${e.tipo}:${e.id}`} onClick={() => abrirFicha(e)}
                className="border border-[#c8a84b20] bg-[#161410] p-4 text-left hover:border-[#c8a84b60] transition-colors"
                style={radius}>
                <p style={cinzel} className="text-[#e8e0d0] text-sm">
                  {e.revelado ? '' : '🔒 '}{e.nome}
                </p>
                {e.subtitulo && <p className="text-[#8a7e68] text-xs mt-0.5">{e.subtitulo}</p>}
                {e.resumo && <p className="text-[#9a8e78] text-sm mt-2 leading-relaxed">{e.resumo}</p>}
                {paginasDaEntidade(e.tipo, e.id).length > 0 && (
                  <p className="text-[#c8a84b] text-xs mt-2">
                    {paginasDaEntidade(e.tipo, e.id).length} página(s) de história
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderFicha() {
    if (!entidadeAtual) {
      return (
        <div className="flex flex-col gap-3">
          <button onClick={irInicio} className="text-xs text-[#9a8e78] hover:text-[#c8a84b] self-start">← Início</button>
          <p className="text-[#8a7e68] text-sm">Não encontrei essa entrada. Ela pode ter sido apagada.</p>
        </div>
      );
    }
    const e = entidadeAtual;
    const t = TIPOS[e.tipo];
    const doMundo = paginasDaEntidade(e.tipo, e.id);
    const citada = paginas.filter(p => menciona(p.conteudo, e.nome));
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => abrirLista(e.tipo)}
          className="text-xs text-[#9a8e78] hover:text-[#c8a84b] self-start">← {t.plural}</button>

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 style={cinzel} className="text-xl text-[#f0e8d8]">{e.nome}</h2>
            <p className="text-[#8a7e68] text-xs mt-1">
              {[t.singular, e.subtitulo].filter(Boolean).join(' · ')}
            </p>
          </div>
          <span style={cinzel}
            className={`text-xs border px-2 py-0.5 ${e.revelado ? 'border-[#c8a84b50] text-[#c8a84b]' : 'border-[#b07050] text-[#b07050]'}`}>
            {e.revelado ? 'Revelado aos jogadores' : 'Oculto dos jogadores'}
          </span>
        </div>

        {e.resumo && <p className="text-[#9a8e78] text-sm leading-relaxed">{e.resumo}</p>}

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => novaSobre(e)} className={btnSec} style={{ ...cinzel, ...radius }}>
            {doMundo.length ? 'Nova página sobre isto' : `Escrever a história de ${e.nome}`}
          </button>
          {t.rota && (
            <button onClick={() => navigate(t.rota)} className={btnSec} style={{ ...cinzel, ...radius }}>
              Ver no {t.rotaNome}
            </button>
          )}
        </div>

        {doMundo.length > 0 && (
          <div>
            <p style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] mb-2">HISTÓRIA</p>
            <div className="flex flex-col gap-2">
              {doMundo.map(p => <LinhaPagina key={p.id} p={p} />)}
            </div>
          </div>
        )}

        {citada.length > 0 && (
          <div>
            <p style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] mb-2">CITADO EM</p>
            <div className="flex flex-col gap-2">
              {citada.map(p => <LinhaPagina key={p.id} p={p} />)}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderEditor() {
    return (
      <div className="border border-[#c8a84b20] bg-[#161410] p-6 flex flex-col gap-3">
        {entidadeDoForm && (
          <button onClick={() => abrirFicha(entidadeDoForm)}
            className="self-start text-xs text-[#c8a84b] hover:underline">
            Sobre: {TIPOS[entidadeDoForm.tipo].singular} {entidadeDoForm.nome}
          </button>
        )}

        <div className="flex gap-2">
          <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            placeholder="Título da página" aria-label="Título da página" className={campo} style={radius} />
          <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
            aria-label="Categoria"
            className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm" style={radius}>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px]">
            CONTEÚDO <span className="text-[#8a7e68]">· use [[Nome]] para criar links</span>
          </p>
          <button onClick={() => setPrevia(!previa)} className="text-xs text-[#9a8e78] hover:text-[#c8a84b]">
            {previa ? 'Editar' : 'Prévia'}
          </button>
        </div>
        {previa ? (
          <div className="border border-[#c8a84b15] bg-[#0f0e0c] p-3 min-h-[10rem]">
            <TextoWiki texto={form.conteudo} paginas={paginas} entidades={entidadesDoTexto} onAbrir={abrir} />
          </div>
        ) : (
          <textarea value={form.conteudo} rows={10} aria-label="Conteúdo"
            placeholder="Conte a história. Ex.: A cidade de [[Nome do local]] foi fundada por..."
            onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))}
            className={campo} style={radius} />
        )}

        <p style={cinzel} className="text-[#a86aa8] text-xs tracking-[2px]">🔒 NOTAS DO MESTRE (nunca aparecem pros jogadores)</p>
        <textarea value={form.notas_mestre} rows={4} aria-label="Notas do mestre"
          onChange={e => setForm(f => ({ ...f, notas_mestre: e.target.value }))}
          className={campo} style={radius} />

        <label className="flex items-center gap-2 text-[#9a8e78] text-xs cursor-pointer">
          <input type="checkbox" checked={form.revelada}
            onChange={e => setForm(f => ({ ...f, revelada: e.target.checked }))} />
          <span style={cinzel} className="tracking-widest">REVELADA PARA OS JOGADORES</span>
        </label>

        <div className="flex gap-2 justify-between">
          <button onClick={salvar} disabled={!form.titulo.trim() || salvando}
            className="bg-[#6a8aaa] text-[#0f0e0c] px-5 py-2 text-xs tracking-widest font-bold disabled:opacity-30"
            style={{ ...cinzel, ...radius }}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
          {atualId && (
            <button onClick={apagar}
              className="text-red-600 hover:text-red-600 text-xs border border-red-600 px-3 py-1.5"
              style={{ ...cinzel, ...radius }}>Apagar</button>
          )}
        </div>

        {citadaEm.length > 0 && (
          <div className="border-t border-[#c8a84b10] pt-3">
            <p style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] mb-2">CITADA EM</p>
            <div className="flex flex-col gap-2">
              {citadaEm.map(p => <LinhaPagina key={p.id} p={p} />)}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------- barra lateral ---------- */
  const nadaEncontrado = termo
    && paginasFiltradas.length === 0
    && Object.values(entidadesPorTipo).every(l => !l.some(e => e.nome.toLowerCase().includes(termo)));

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0]" style={crimson}>
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>⚔ TAVERNA</span>
        <button onClick={() => navigate('/mestre')} className="text-[#9a8e78] text-sm hover:text-[#c8a84b]" style={cinzel}>
          ← Voltar
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-6">
        <div>
          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">CAMPANHA</p>
          <button onClick={irInicio}>
            <h1 style={cinzel} className="text-2xl text-[#f0e8d8] font-semibold mb-4 text-left">Wiki</h1>
          </button>
          <button onClick={() => nova()}
            className="w-full bg-[#c8a84b] text-[#0f0e0c] px-4 py-2 text-xs tracking-widest font-bold mb-3"
            style={{ ...cinzel, ...radius }}>+ Nova página</button>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." aria-label="Buscar..."
            className={`${campo} mb-4`} style={radius} />

          {nadaEncontrado && (
            <p className="text-[#8a7e68] text-sm mb-4">Nada encontrado para “{busca.trim()}”.</p>
          )}

          {CATEGORIAS.map(cat => {
            const lista = paginasFiltradas.filter(p => p.categoria === cat);
            if (lista.length === 0) return null;
            return (
              <div key={cat} className="mb-4">
                <p style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] mb-1">{cat.toUpperCase()}</p>
                {lista.map(p => (
                  <button key={p.id} onClick={() => abrir(p.id)}
                    className={`block w-full text-left px-2 py-1 text-sm ${p.id === atualId ? 'text-[#c8a84b]' : 'text-[#8a7e68] hover:text-[#e8e0d0]'}`}>
                    {p.revelada ? '👁 ' : '🔒 '}{p.titulo}
                  </button>
                ))}
              </div>
            );
          })}

          {entidades.length > 0 && (
            <div className="border-t border-[#c8a84b10] pt-3 mt-2">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-2 opacity-70">MUNDO</p>
              {Object.entries(TIPOS).map(([tipo, t]) => {
                const todas = entidadesPorTipo[tipo];
                const lista = termo ? todas.filter(e => e.nome.toLowerCase().includes(termo)) : todas;
                if (termo && lista.length === 0) return null;
                const aberta = termo ? true : !!abertos[tipo];
                return (
                  <div key={tipo} className="mb-2">
                    <button onClick={() => setAbertos(a => ({ ...a, [tipo]: !a[tipo] }))}
                      aria-expanded={aberta}
                      className="flex w-full items-center justify-between py-1 text-left" style={cinzel}>
                      <span className="text-[#8a7e68] text-xs tracking-[2px]">{t.plural.toUpperCase()}</span>
                      <span className="text-[#6a6050] text-xs">{lista.length} {aberta ? '▲' : '▼'}</span>
                    </button>
                    {aberta && (
                      <div className="max-h-56 overflow-y-auto pr-1">
                        {lista.map(e => (
                          <button key={`${e.tipo}:${e.id}`} onClick={() => abrirFicha(e)}
                            className={`block w-full text-left px-2 py-1 text-sm truncate ${
                              ficha && ficha.tipo === e.tipo && String(ficha.id) === String(e.id) && modo === 'ficha'
                                ? 'text-[#c8a84b]' : 'text-[#8a7e68] hover:text-[#e8e0d0]'}`}>
                            {e.revelado ? '' : '🔒 '}{e.nome}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          {modo === 'inicio' && renderInicio()}
          {modo === 'lista' && renderLista()}
          {modo === 'ficha' && renderFicha()}
          {modo === 'editor' && renderEditor()}
        </div>
      </div>
    </div>
  );
}