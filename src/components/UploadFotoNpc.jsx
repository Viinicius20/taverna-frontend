import { cinzel } from '../estilos';
import { useState } from 'react';
import api from '../services/api';
import { notificar } from '../utils/notificar';


export default function UploadFotoNpc({ npcId, onEnviado }) {
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      notificar('Imagem maior que 3 MB.', 'erro');
      return;
    }
    setEnviando(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post(`/npcs/${npcId}/avatar`, form);
      onEnviado(res.data.art_url);
    } catch (err) {
      notificar(err.response?.data?.detail || 'Não foi possível enviar a foto.', 'erro');
    }
    setEnviando(false);
  }

  return (
    <label onClick={e => e.stopPropagation()}
      className="text-[#c8a84b] hover:text-[#e0c060] text-xs border border-[#c8a84b30] hover:border-[#c8a84b60] px-4 py-1.5 transition-colors cursor-pointer"
      style={{ ...cinzel, borderRadius: '2px', letterSpacing: '1px' }}>
      {enviando ? 'Enviando...' : '📷 Enviar foto'}
      <input type="file" accept="image/jpeg,image/png,image/webp"
        onChange={enviar} disabled={enviando} className="hidden" />
    </label>
  );
}