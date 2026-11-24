import { useRef, useState } from 'react';
import api from '../services/api';
import { cinzel } from '../estilos';

const MAX_MB = 5;

export default function FotoCriatura({ criatura, onMudou, somenteLeitura = false }) {
  const inputRef = useRef(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  async function escolher(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';                      // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;
    if (arquivo.size > MAX_MB * 1024 * 1024) {
      setErro(`A imagem passa de ${MAX_MB} MB.`);
      return;
    }
    setEnviando(true);
    setErro('');
    try {
      const dados = new FormData();
      dados.append('arquivo', arquivo);
      const r = await api.post(`/bestiario/${criatura.id}/foto`, dados);
      onMudou(r.data.art_url);
    } catch (err) {
      setErro(err.response?.data?.detail || 'Não foi possível enviar a imagem.');
    }
    setEnviando(false);
  }

  return (
    <div className="relative w-full h-full">
      {criatura.art_url && (
        <img src={criatura.art_url} alt={criatura.name} className="w-full h-full object-cover" />
      )}

      {!somenteLeitura && (
        <>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp"
            className="hidden" onChange={escolher} aria-label="Enviar retrato" />
          <button onClick={() => inputRef.current?.click()} disabled={enviando}
            className="absolute top-2 right-2 z-10 bg-[#0f0e0cdd] border border-[#c8a84b50] text-[#c8a84b] px-3 py-1 text-xs hover:bg-[#c8a84b20] disabled:opacity-50"
            style={{ ...cinzel, borderRadius: '2px' }}>
            {enviando ? 'Enviando...' : criatura.art_url ? 'Trocar retrato' : 'Enviar retrato'}
          </button>
        </>
      )}

      {erro && (
        <p className="absolute top-10 right-2 left-2 z-10 bg-[#0f0e0cee] border border-red-900 text-red-400 text-xs px-2 py-1">
          {erro}
        </p>
      )}
    </div>
  );
}