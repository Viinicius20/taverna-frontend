import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUser } from '../context/UserContext';

const cinzel = { fontFamily: "'Cinzel', serif" };
const CAMPANHA_ID = '00000000-0000-0000-0000-000000000001';

export default function Galeria() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [imagens, setImagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imagemRevelada, setImagemRevelada] = useState(null);
  const [imagemAberta, setImagemAberta] = useState(null);
  const fileRef = useRef();
  const isMestre = user?.role === 'mestre';

  useEffect(() => {
    buscarImagens();
    if (!isMestre) {
      const interval = setInterval(buscarImagens, 5000);
      return () => clearInterval(interval);
    }
  }, [isMestre]);

  async function buscarImagens() {
    try {
      const res = await api.get('/gallery');
      const todas = res.data.data || [];
      setImagens(todas);
      setImagemRevelada(todas.find(i => i.revealed) || null);
    } catch {
      setImagens([]);
    }
    setCarregando(false);
  }

  async function uploadImagem(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('campaign_id', CAMPANHA_ID);
      formData.append('type', 'map');
      await api.post('/gallery/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      buscarImagens();
    } catch {
      alert('Erro ao fazer upload.');
    }
    setUploading(false);
    fileRef.current.value = '';
  }

  async function revelarImagem(id) {
    try {
      await api.patch(`/gallery/${id}/reveal`);
      buscarImagens();
    } catch {
      alert('Erro ao revelar imagem.');
    }
  }

  async function esconderImagem(id) {
    try {
      await api.patch(`/gallery/${id}/hide`);
      buscarImagens();
    } catch {
      alert('Erro ao esconder imagem.');
    }
  }

  async function deletarImagem(id) {
    if (!window.confirm('Deletar esta imagem?')) return;
    try {
      await api.delete(`/gallery/${id}`);
      buscarImagens();
    } catch {
      alert('Erro ao deletar imagem.');
    }
  }

  // VISÃO DO JOGADOR
  if (!isMestre) {
    return (
      <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0] flex flex-col">
        <nav className="flex items-center justify-between px-8 py-4 border-b border-[#c8a84b20]">
          <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
            onClick={() => navigate('/')}>⚔ TAVERNA</span>
          <button onClick={() => navigate(-1)} style={cinzel}
            className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors">← Voltar</button>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {carregando ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
              <p style={cinzel} className="text-[#4a4030] text-xs tracking-widest">AGUARDANDO...</p>
            </div>
          ) : imagemRevelada ? (
            <div className="w-full max-w-4xl">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-4 text-center">
                O MESTRE REVELOU
              </p>
              <img
                src={imagemRevelada.url}
                alt={imagemRevelada.name}
                className="w-full rounded cursor-pointer"
                style={{ borderRadius: '2px', maxHeight: '80vh', objectFit: 'contain' }}
                onClick={() => setImagemAberta(imagemRevelada)}
              />
              <p style={cinzel} className="text-[#4a4030] text-xs text-center mt-3">
                Clique na imagem para expandir
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="text-4xl opacity-20">🗺</span>
              <p style={cinzel} className="text-[#4a4030] text-sm tracking-widest">
                NENHUMA IMAGEM REVELADA
              </p>
              <p className="text-[#3a3020] text-xs">Aguarde o Mestre revelar algo...</p>
            </div>
          )}
        </div>

        {/* Modal tela cheia */}
        {imagemAberta && (
          <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
            onClick={() => setImagemAberta(null)}>
            <img src={imagemAberta.url} alt={imagemAberta.name}
              className="max-w-full max-h-full object-contain" />
          </div>
        )}
      </div>
    );
  }

  // VISÃO DO MESTRE
  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0]">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>⚔ TAVERNA</span>
        <div className="flex gap-4 items-center">
          <button onClick={() => navigate('/mestre')} style={cinzel}
            className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors">← Mestre</button>
          <label className="bg-[#c8a84b] text-[#0f0e0c] px-5 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors cursor-pointer"
            style={{ ...cinzel, borderRadius: '2px' }}>
            {uploading ? '⟳ ENVIANDO...' : '+ UPLOAD'}
            <input ref={fileRef} type="file" accept="image/*" onChange={uploadImagem} className="hidden" />
          </label>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">MESTRE</p>
        <h1 style={cinzel} className="text-3xl text-[#f0e8d8] font-bold mb-2">Galeria</h1>
        <p className="text-[#7a7060] mb-10 font-light">
          Suba mapas e imagens. Revele uma pra mesa ver em tempo real.
        </p>

        {imagemRevelada && (
          <div className="border border-[#c8a84b30] bg-[#161410] p-4 mb-8 flex items-center gap-4">
            <img src={imagemRevelada.url} alt={imagemRevelada.name}
              className="w-16 h-16 object-cover" style={{ borderRadius: '2px' }} />
            <div className="flex-1">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px]">REVELADA AGORA</p>
              <p className="text-[#e8e0d0] text-sm mt-1">{imagemRevelada.name}</p>
            </div>
            <button onClick={() => esconderImagem(imagemRevelada.id)}
              className="border border-[#c8a84b30] text-[#4a4030] px-4 py-2 text-xs hover:border-[#c8a84b60] hover:text-[#c8a84b] transition-colors"
              style={{ ...cinzel, borderRadius: '2px' }}>
              Esconder
            </button>
          </div>
        )}

        {carregando ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
          </div>
        ) : imagens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 border border-[#c8a84b15] bg-[#161410]">
            <span className="text-4xl opacity-20">🗺</span>
            <p style={cinzel} className="text-[#4a4030] text-sm tracking-widest">NENHUMA IMAGEM AINDA</p>
            <p className="text-[#3a3020] text-xs">Clique em + UPLOAD para adicionar</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {imagens.map(img => (
              <div key={img.id}
                className="border border-[#c8a84b15] bg-[#161410] overflow-hidden group relative"
                style={{ borderRadius: '2px' }}>
                <img src={img.url} alt={img.name}
                  className="w-full h-40 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setImagemAberta(img)} />
                {img.revealed && (
                  <div className="absolute top-2 left-2">
                    <span style={cinzel}
                      className="bg-[#c8a84b] text-[#0f0e0c] text-xs px-2 py-0.5 font-bold">
                      AO VIVO
                    </span>
                  </div>
                )}
                <div className="p-3">
                  <p style={cinzel} className="text-[#6a6050] text-xs truncate mb-2">{img.name}</p>
                  <div className="flex gap-2">
                    {img.revealed ? (
                      <button onClick={() => esconderImagem(img.id)}
                        className="flex-1 border border-[#c8a84b30] text-[#4a4030] py-1.5 text-xs hover:border-[#c8a84b60] hover:text-[#c8a84b] transition-colors"
                        style={{ ...cinzel, borderRadius: '2px' }}>
                        Esconder
                      </button>
                    ) : (
                      <button onClick={() => revelarImagem(img.id)}
                        className="flex-1 bg-[#c8a84b] text-[#0f0e0c] py-1.5 text-xs font-bold hover:bg-[#e0c060] transition-colors"
                        style={{ ...cinzel, borderRadius: '2px' }}>
                        Revelar
                      </button>
                    )}
                    <button onClick={() => deletarImagem(img.id)}
                      className="border border-red-900 text-red-900 px-2 py-1.5 text-xs hover:border-red-600 hover:text-red-600 transition-colors"
                      style={{ ...cinzel, borderRadius: '2px' }}>
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {imagemAberta && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
          onClick={() => setImagemAberta(null)}>
          <img src={imagemAberta.url} alt={imagemAberta.name}
            className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}