import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { cinzel } from '../estilos';
import { getCampanhaId } from '../utils/campanha';

const ROTULO = {
  pagina: 'Página', regiao: 'Terra', local: 'Local', npc: 'NPC',
  faccao: 'Facção', criatura: 'Criatura', item: 'Item',
};
const ICONE = {
  pagina: '📜', regiao: '🗺', local: '📍', npc: '🧑', faccao: '🏛', criatura: '🐉', item: '🎒',
};

const semAcento = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// AJUSTE: rota da Wiki no seu App.jsx
const ROTA_WIKI = '/wiki';

export default function BuscaGlobal({ isMestre = true }) {
  const navigate = useNavigate();
  const [aberta, setAberta] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState('');
  const [itens, setItens] = useState([]);
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const listaRef = useRef(null);

  // Ctrl+K (ou Cmd+K) abre e fecha
  useEffect(() => {
    const aoTeclar = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAberta(a => !a);
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []);

  // ao abrir: limpa, foca e carrega o índice
  useEffect(() => {
    if (!aberta) return;
    setBusca('');
    setSel(0);
    setCarregando(true);
    requestAnimationFrame(() => inputRef.current?.focus());

    const id = getCampanhaId();
    const sufixo = isMestre ? '' : '/jogador';
    Promise.all([
      api.get(`/wiki/${id}${sufixo}`).then(r => r.data.data || []).catch(() => []),
      api.get(`/wiki-indice/${id}${sufixo}`).then(r => r.data.data || []).catch(() => []),
    ]).then(([paginas, mundo]) => {
      setItens([
        ...paginas.map(p => ({ tipo: 'pagina', id: p.id, nome: p.titulo, sub: p.categoria })),
        ...mundo.map(e => ({ tipo: e.tipo, id: e.id, nome: e.nome, sub: e.subtitulo })),
      ]);
      setCarregando(false);
    });
  }, [aberta, isMestre]);

  const resultados = useMemo(() => {
    const q = semAcento(busca.trim());
    if (!q) return itens.slice(0, 12);
    return itens
      .map(i => ({ i, pos: semAcento(i.nome).indexOf(q) }))
      .filter(x => x.pos !== -1)
      .sort((a, b) => (a.pos === 0 ? 0 : 1) - (b.pos === 0 ? 0 : 1)
        || (a.i.nome || '').localeCompare(b.i.nome || ''))
      .slice(0, 30)
      .map(x => x.i);
  }, [busca, itens]);

  // mantém o item selecionado visível ao navegar com as setas
  useEffect(() => {
    listaRef.current?.children[sel]?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  function ir(item) {
    if (!item) return;
    setAberta(false);
    navigate(item.tipo === 'pagina'
      ? `${ROTA_WIKI}?pagina=${encodeURIComponent(item.id)}`
      : `${ROTA_WIKI}?tipo=${encodeURIComponent(item.tipo)}&id=${encodeURIComponent(item.id)}`);
  }

  function aoTeclarNoCampo(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel(s => Math.min(s + 1, Math.max(resultados.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      ir(resultados[sel]);
    } else if (e.key === 'Escape') {
      setAberta(false);
    }
  }

  if (!aberta) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center pt-24 px-4"
      onClick={() => setAberta(false)}>
      <div role="dialog" aria-modal="true" aria-label="Busca global"
        className="w-full max-w-xl bg-[#161410] border border-[#c8a84b30]"
        style={{ borderRadius: '2px' }} onClick={e => e.stopPropagation()}>
        <input ref={inputRef} value={busca}
          onChange={e => { setBusca(e.target.value); setSel(0); }}
          onKeyDown={aoTeclarNoCampo}
          placeholder="Buscar páginas, NPCs, locais, facções, criaturas..."
          aria-label="Buscar"
          className="w-full bg-[#0f0e0c] border-b border-[#c8a84b20] text-[#e8e0d0] px-4 py-3 text-sm focus:outline-none placeholder-[#6a6050]" />

        <ul ref={listaRef} role="listbox" className="max-h-80 overflow-y-auto">
          {resultados.map((r, i) => (
            <li key={`${r.tipo}:${r.id}`} role="option" aria-selected={i === sel}
              onMouseEnter={() => setSel(i)}
              onClick={() => ir(r)}
              className={`flex items-center justify-between gap-3 px-4 py-2 text-sm cursor-pointer ${
                i === sel ? 'bg-[#c8a84b15] text-[#c8a84b]' : 'text-[#9a8e78]'}`}>
              <span className="truncate">
                {ICONE[r.tipo] || '•'} {r.nome || '(sem nome)'}
                {r.sub && <span className="text-[#6a6050] text-xs"> · {r.sub}</span>}
              </span>
              <span style={cinzel} className="text-[#6a6050] text-[10px] tracking-[2px] uppercase shrink-0">
                {ROTULO[r.tipo] || r.tipo}
              </span>
            </li>
          ))}
        </ul>

        {!carregando && resultados.length === 0 && (
          <p className="px-4 py-6 text-center text-[#6a6050] text-sm">
            Nada encontrado para “{busca.trim()}”.
          </p>
        )}
        {carregando && itens.length === 0 && (
          <p className="px-4 py-6 text-center text-[#6a6050] text-sm">Carregando...</p>
        )}

        <p className="px-4 py-2 border-t border-[#c8a84b10] text-[#6a6050] text-[11px]">
          ↑↓ navegar · Enter abrir · Esc fechar
        </p>
      </div>
    </div>
  );
}