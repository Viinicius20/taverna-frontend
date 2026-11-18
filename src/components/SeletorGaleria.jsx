import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { cinzel } from '../estilos';

const urlDe = it => it.url || it.image_url || it.file_url || it.art_url || it.src || it.imagem_url;
const nomeDe = it => it.title || it.titulo || it.name || it.nome || '';

export default function SeletorGaleria({ campanhaId, onEscolher, onFechar }) {
  const [itens, setItens] = useState(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    api.get(`/gallery?campaign_id=${campanhaId}`)
      .then(r => {
        const lista = Array.isArray(r.data?.data) ? r.data.data : [];
        if (lista[0] && !urlDe(lista[0])) console.warn('Galeria: não achei o campo da imagem em', lista[0]);
        setItens(lista);
      })
      .catch(() => setItens([]));
  }, [campanhaId]);

  const lista = (itens || []).filter(i =>
    urlDe(i) && (!busca || nomeDe(i).toLowerCase().includes(busca.toLowerCase())));

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 px-4"
      onClick={onFechar}>
      <div className="bg-[#161410] border border-[#c8a84b30] max-w-3xl w-full max-h-[80vh] overflow-y-auto"
        style={{ borderRadius: '2px' }} onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[#c8a84b15] flex items-center justify-between gap-3">
          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">ESCOLHER DA GALERIA</p>
          <button onClick={onFechar} className="text-[#8a7e68] hover:text-[#c8a84b] text-xl">✕</button>
        </div>
        <div className="p-6">
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." aria-label="Buscar"
            className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full text-sm mb-4 focus:outline-none focus:border-[#c8a84b50] placeholder-[#3a3020]"
            style={{ borderRadius: '2px' }} />

          {!itens && <p className="text-[#8a7e68] text-sm text-center py-8">Carregando...</p>}
          {itens && lista.length === 0 && (
            <p className="text-[#8a7e68] text-sm text-center py-8">Nenhuma imagem encontrada.</p>
          )}

          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {lista.map((it, i) => (
              <button key={it.id || i} onClick={() => onEscolher(urlDe(it))}
                className="text-left border border-[#c8a84b20] bg-[#0f0e0c] hover:border-[#c8a84b] transition-colors"
                style={{ borderRadius: '2px' }}>
                <img src={urlDe(it)} alt={nomeDe(it)} className="w-full h-28 object-cover" />
                {nomeDe(it) && <p className="text-xs text-[#9a8e78] px-2 py-1 truncate">{nomeDe(it)}</p>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}