import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { cinzel } from '../estilos';

const urlDe = it => it.url || it.image_url || it.file_url || it.art_url || it.src || it.imagem_url;
const miniDe = it => it.thumb_url || it.thumbnail_url || it.thumbnail || it.thumb || urlDe(it);
const nomeDe = it => it.title || it.titulo || it.name || it.nome || '';
const ehMapa = it => /\bmapas?\b|\bmaps?\b/i.test(
  [it.category, it.categoria, it.type, it.tipo, it.tag, JSON.stringify(it.tags || ''), nomeDe(it)]
    .filter(Boolean).join(' ')
);

const POR_PAGINA = 24;
const radius = { borderRadius: '2px' };

export default function SeletorGaleria({ campanhaId, onEscolher, onFechar, soMapasInicial = true }) {
  const [itens, setItens] = useState(null);
  const [busca, setBusca] = useState('');
  const [soMapas, setSoMapas] = useState(true);
  const [limite, setLimite] = useState(POR_PAGINA);

  useEffect(() => {
    api.get(`/gallery?campaign_id=${campanhaId}`)
      .then(r => {
        const lista = Array.isArray(r.data?.data) ? r.data.data : [];
        if (lista.length && !lista.some(urlDe)) console.warn('Galeria: nenhum item com imagem', lista[0]);
        console.info('Tipos da Galeria:', [...new Set(lista.map(i => i.type))]);
        setItens(lista);
      })
      .catch(() => setItens([]));
  }, [campanhaId]);

  const comUrl = (itens || []).filter(urlDe);
  const mapas = comUrl.filter(ehMapa);
  const filtrando = soMapas && mapas.length > 0;
  const base = filtrando ? mapas : comUrl;
  const filtrados = base.filter(i => !busca || nomeDe(i).toLowerCase().includes(busca.toLowerCase()));
  const visiveis = filtrados.slice(0, limite);

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 px-4"
      onClick={onFechar}>
      <div className="bg-[#161410] border border-[#c8a84b30] max-w-3xl w-full max-h-[80vh] overflow-y-auto"
        style={radius} onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[#c8a84b15] flex items-center justify-between gap-3">
          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">ESCOLHER DA GALERIA</p>
          <button onClick={onFechar} className="text-[#8a7e68] hover:text-[#c8a84b] text-xl">✕</button>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-4">
            <input value={busca} onChange={e => { setBusca(e.target.value); setLimite(POR_PAGINA); }}
              placeholder="Buscar..." aria-label="Buscar"
              className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 flex-1 text-sm focus:outline-none focus:border-[#c8a84b50] placeholder-[#3a3020]"
              style={radius} />
            <button onClick={() => { setSoMapas(v => !v); setLimite(POR_PAGINA); }}
              className="text-xs border px-3 py-1 whitespace-nowrap transition-colors"
              style={{ ...cinzel, ...radius,
                       borderColor: filtrando ? '#c8a84b' : '#c8a84b30',
                       color: filtrando ? '#c8a84b' : '#9a8e78' }}>
              🗺 {filtrando ? `Só mapas (${mapas.length})` : `Todas (${comUrl.length})`}
            </button>
          </div>

          {itens && soMapas && mapas.length === 0 && comUrl.length > 0 && (
            <p className="text-[#8a7e68] text-xs mb-3">
              Nenhuma imagem da Galeria parece ser um mapa. Mostrando todas.
            </p>
          )}
          {!itens && <p className="text-[#8a7e68] text-sm text-center py-8">Carregando...</p>}
          {itens && filtrados.length === 0 && (
            <p className="text-[#8a7e68] text-sm text-center py-8">Nenhuma imagem encontrada.</p>
          )}

          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {visiveis.map((it, i) => (
              <button key={it.id || i} onClick={() => onEscolher(urlDe(it))}
                className="text-left border border-[#c8a84b20] bg-[#0f0e0c] hover:border-[#c8a84b] transition-colors"
                style={radius}>
                <img src={miniDe(it)} alt={nomeDe(it)} loading="lazy" decoding="async"
                  className="w-full h-28 object-cover" />
                {nomeDe(it) && <p className="text-xs text-[#9a8e78] px-2 py-1 truncate">{nomeDe(it)}</p>}
              </button>
            ))}
          </div>

          {filtrados.length > limite && (
            <button onClick={() => setLimite(l => l + POR_PAGINA)}
              className="block mx-auto mt-4 text-xs border border-[#c8a84b30] text-[#c8a84b] px-4 py-1 hover:bg-[#c8a84b10] transition-colors"
              style={{ ...cinzel, ...radius }}>
              Mostrar mais ({filtrados.length - limite})
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}