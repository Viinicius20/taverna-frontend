import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUser } from '../context/UserContext';

const cinzel = { fontFamily: "'Cinzel', serif" };
const CAMPANHA_ID = '00000000-0000-0000-0000-000000000001';

const CATEGORIAS_TOKEN = ['Nobre', 'Cultista', 'Aberração', 'Bandido', 'Goblin', 'Humanoide', 'Undead', 'Gigante', 'Besta', 'Dragão', 'Demônio', 'Construto', 'Outro'];

const COR_CATEGORIA = {
  'Nobre': '#6a6a6a', 'Cultista': '#8a4a20', 'Aberração': '#4a8a4a',
  'Bandido': '#4a6a8a', 'Goblin': '#6a8a20', 'Humanoide': '#4a6aaa',
  'Undead': '#8a6020', 'Gigante': '#8a4a4a', 'Besta': '#6a8a6a',
  'Dragão': '#c8a84b', 'Demônio': '#8a2020', 'Construto': '#6a6a8a', 'Outro': '#4a4030'
};

export default function Galeria() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [imagens, setImagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imagemRevelada, setImagemRevelada] = useState(null);
  const [imagemAberta, setImagemAberta] = useState(null);
  const [aba, setAba] = useState('mapas'); // 'mapas' | 'tokens'
  const [categoriaAtiva, setCategoriaAtiva] = useState('');
  const [uploadCategoria, setUploadCategoria] = useState('Outro');
  const fileRef = useRef();
  const isMestre = user?.role === 'mestre';
  const [modoMapa, setModoMapa] = useState(false);
  const [mapaAtivo, setMapaAtivo] = useState(null);
  const [tokensNoMapa, setTokensNoMapa] = useState([]);
  const [rotatingTokenId, setRotatingTokenId] = useState(null);
  const [initialAngle, setInitialAngle] = useState(0);
  const [initialMouseAngle, setInitialMouseAngle] = useState(0);
  const [resizingTokenId, setResizingTokenId] = useState(null);
  const [initialScale, setInitialScale] = useState(1);
  const [initialDistance, setInitialDistance] = useState(0);

  useEffect(() => {
  buscarImagens();
  if (!isMestre) {
    const interval = setInterval(async () => {
      const res = await api.get('/gallery', { params: { campaign_id: CAMPANHA_ID } });
      const todas = res.data.data || [];
      setImagens(todas);
      const revelada = todas.find(i => i.revealed);
      setImagemRevelada(revelada || null);
      if (revelada) {
        buscarTokensNoMapa(revelada.id);
      }
    }, 3000);
    return () => clearInterval(interval);
  }
}, [isMestre]);

  async function buscarImagens() {
    try {
      const res = await api.get('/gallery', { params: { campaign_id: CAMPANHA_ID } });
      const todas = res.data.data || [];
      setImagens(todas);
      setImagemRevelada(todas.find(i => i.revealed) || null);
    } catch {
      setImagens([]);
    }
    setCarregando(false);
  }

  async function uploadImagem(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  setUploading(true);
  try {
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', aba === 'tokens' ? 'token' : 'map');
      formData.append('category', aba === 'tokens' ? uploadCategoria : '');
      await api.post(`/gallery/upload?campaign_id=${CAMPANHA_ID}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
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
    } catch {}
  }

  async function esconderImagem(id) {
    try {
      await api.patch(`/gallery/${id}/hide`);
      buscarImagens();
    } catch {}
  }

  async function buscarTokensNoMapa(mapId) {
  try {
    const res = await api.get(`/map-tokens/${CAMPANHA_ID}`);
    setTokensNoMapa(res.data.data.filter(t => t.map_id === mapId));
  } catch {
    setTokensNoMapa([]);
  }
}

  async function deletarImagem(id) {
    if (!window.confirm('Deletar esta imagem?')) return;
    try {
      await api.delete(`/gallery/${id}`);
      buscarImagens();
    } catch {}
  }

  const mapas = imagens.filter(i => i.type === 'map');
  const tokens = imagens.filter(i => i.type === 'token');
  const categorias = [...new Set(tokens.map(t => t.category).filter(Boolean))];
  const tokensFiltrados = categoriaAtiva ? tokens.filter(t => t.category === categoriaAtiva) : tokens;

// ======================== FUNÇÕES DE INTERAÇÃO COM TOKENS ========================

// Função auxiliar
const getMouseAngle = (mouseX, mouseY, centerX, centerY) => {
  const dx = mouseX - centerX;
  const dy = mouseY - centerY;
  return Math.atan2(dy, dx) * (180 / Math.PI);
};

// ==================== ROTAÇÃO ====================
const handleRotationStart = (e, tokenId) => {
  e.stopPropagation();
  e.preventDefault();

  const token = tokensNoMapa.find(t => t.id === tokenId);
  if (!token) return;

  setRotatingTokenId(tokenId);

  const tokenElement = e.currentTarget.closest(`[data-token-id="${tokenId}"]`);
  if (!tokenElement) return;

  const rect = tokenElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const mouseAngle = getMouseAngle(e.clientX, e.clientY, centerX, centerY);

  setInitialMouseAngle(mouseAngle);
  setInitialAngle(token.rotation || 0);

  document.addEventListener('mousemove', handleRotationMove);
  document.addEventListener('mouseup', handleRotationEnd);
};

const handleRotationMove = (e) => {
  if (!rotatingTokenId) return;

  const tokenElement = document.querySelector(`[data-token-id="${rotatingTokenId}"]`);
  if (!tokenElement) return;

  const rect = tokenElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const currentMouseAngle = getMouseAngle(e.clientX, e.clientY, centerX, centerY);

  let newRotation = initialAngle + (currentMouseAngle - initialMouseAngle);

  const currentTransform = tokenElement.style.transform;
  const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
  const scale = scaleMatch ? parseFloat(scaleMatch[1]) : (tokensNoMapa.find(t => t.id === rotatingTokenId)?.scale || 1);

  tokenElement.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${newRotation}deg)`;
};

const handleRotationEnd = async () => {
  if (!rotatingTokenId) return

  const tokenElement = document.querySelector(`[data-token-id="${rotatingTokenId}"]`);
  if (!tokenElement) return;

  const transform = tokenElement.style.transform;
  const match = transform.match(/rotate\(([^)]+)deg\)/);
  let finalRotation = match ? parseFloat(match[1]) : 0;

  finalRotation = ((finalRotation % 360) + 360) % 360;

  try {
    await api.patch(`/map-tokens/${rotatingTokenId}/rotation`, { 
      rotation: Math.round(finalRotation) 
    });

    setTokensNoMapa(prev => 
      prev.map(t => t.id === rotatingTokenId 
        ? { ...t, rotation: Math.round(finalRotation) } 
        : t
      )
    );
  } catch (error) {
    console.error("Erro ao salvar rotação:", error);
  }

  setRotatingTokenId(null);
  setInitialAngle(0);
  setInitialMouseAngle(0);

  document.removeEventListener('mousemove', handleRotationMove);
  document.removeEventListener('mouseup', handleRotationEnd);
};

// ==================== RESIZE / ESCALA ====================
const handleResizeStart = (e, tokenId) => {
  e.stopPropagation();
  e.preventDefault();

  const token = tokensNoMapa.find(t => t.id === tokenId);
  if (!token) return;

  setResizingTokenId(tokenId);
  setInitialScale(token.scale || 1);

  const tokenElement = e.currentTarget.closest(`[data-token-id="${tokenId}"]`);
  const rect = tokenElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const startDistance = Math.hypot(e.clientX - centerX, e.clientY - centerY);
  setInitialDistance(startDistance);

  document.addEventListener('mousemove', handleResizeMove);
  document.addEventListener('mouseup', handleResizeEnd);
};

const handleResizeMove = (e) => {
  if (!resizingTokenId) return;

  const tokenElement = document.querySelector(`[data-token-id="${resizingTokenId}"]`);
  if (!tokenElement) return;

  const rect = tokenElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const currentDistance = Math.hypot(e.clientX - centerX, e.clientY - centerY);
  
  let newScale = initialScale * (currentDistance / initialDistance);
  newScale = Math.max(0.3, Math.min(newScale, 5)); // limites

  const currentTransform = tokenElement.style.transform;
  const rotMatch = currentTransform.match(/rotate\(([^)]+)deg\)/);
  const currentRotation = rotMatch ? parseFloat(rotMatch[1]) : (tokensNoMapa.find(t => t.id === resizingTokenId)?.rotation || 0);

  tokenElement.style.transform = `translate(-50%, -50%) scale(${newScale}) rotate(${currentRotation}deg)`;
};

const handleResizeEnd = async () => {
  if (!resizingTokenId) return;

  const tokenElement = document.querySelector(`[data-token-id="${resizingTokenId}"]`);
  if (!tokenElement) return;

  const transform = tokenElement.style.transform;
  const scaleMatch = transform.match(/scale\(([^)]+)\)/);
  const finalScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

  try {
    await api.patch(`/map-tokens/${resizingTokenId}/scale`, { 
      scale: parseFloat(finalScale.toFixed(2)) 
    });

    setTokensNoMapa(prev => 
      prev.map(t => t.id === resizingTokenId 
        ? { ...t, scale: parseFloat(finalScale.toFixed(2)) } 
        : t
      )
    );
  } catch (error) {
    console.error("Erro ao salvar escala:", error);
  }

  setResizingTokenId(null);
  document.removeEventListener('mousemove', handleResizeMove);
  document.removeEventListener('mouseup', handleResizeEnd);
};

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
          <div className="w-full max-w-4xl relative">
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-4 text-center">O MESTRE REVELOU</p>
            <div className="relative" style={{ display: 'inline-block', width: '100%' }}>
  <img src={imagemRevelada.url} alt={imagemRevelada.name}
    className="w-full"
    style={{ borderRadius: '2px', maxHeight: '80vh', objectFit: 'contain', display: 'block' }} />
  {tokensNoMapa.map(token => (
    <img key={token.id} src={token.token_url} alt="token"
      style={{
        position: 'absolute',
        left: `${token.x}%`,
        top: `${token.y}%`,
        width: '40px',
        height: '40px',
        objectFit: 'cover',
        borderRadius: '50%',
        transform: `translate(-50%, -50%) scale(${token.scale || 1}) rotate(${token.rotation || 0}deg)`,
        pointerEvents: 'none',
      }} />
  ))}
</div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="text-4xl opacity-20">🗺</span>
            <p style={cinzel} className="text-[#4a4030] text-sm tracking-widest">NENHUMA IMAGEM REVELADA</p>
            <p className="text-[#3a3020] text-xs">Aguarde o Mestre revelar algo...</p>
          </div>
        )}
      </div>

      {imagemAberta && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
          onClick={() => setImagemAberta(null)}>
          <img src={imagemAberta.url} alt={imagemAberta.name} className="max-w-full max-h-full object-contain" />
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

          {/* Categoria ao subir token */}
          {aba === 'tokens' && (
            <select value={uploadCategoria} onChange={e => setUploadCategoria(e.target.value)}
              className="bg-[#161410] border border-[#c8a84b20] text-[#6a6050] px-3 py-2 text-xs focus:outline-none"
              style={{ ...cinzel, borderRadius: '2px' }}>
              {CATEGORIAS_TOKEN.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          <label className="bg-[#c8a84b] text-[#0f0e0c] px-5 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors cursor-pointer"
            style={{ ...cinzel, borderRadius: '2px' }}>
            {uploading ? '⟳ ENVIANDO...' : '+ UPLOAD'}
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={uploadImagem} className="hidden" />
          </label>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">MESTRE</p>
        <h1 style={cinzel} className="text-3xl text-[#f0e8d8] font-bold mb-8">Galeria</h1>

        {/* Abas */}
        <div className="flex gap-px mb-8 border-b border-[#c8a84b15]">
          {[{ id: 'mapas', label: '🗺 MAPAS' }, { id: 'tokens', label: '⬡ TOKENS' }].map(({ id, label }) => (
            <button key={id} onClick={() => { setAba(id); setCategoriaAtiva(''); }}
              className="px-6 py-3 text-xs tracking-widest transition-colors"
              style={{
                ...cinzel,
                borderBottom: aba === id ? '2px solid #c8a84b' : '2px solid transparent',
                color: aba === id ? '#c8a84b' : '#4a4030',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* ABA MAPAS */}
        {aba === 'mapas' && (
          <>
            {imagemRevelada && imagemRevelada.type === 'map' && (
              <div className="border border-[#c8a84b30] bg-[#161410] p-4 mb-6 flex items-center gap-4">
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

            {mapas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 border border-[#c8a84b15] bg-[#161410]">
                <span className="text-4xl opacity-20">🗺</span>
                <p style={cinzel} className="text-[#4a4030] text-sm tracking-widest">NENHUM MAPA AINDA</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {mapas.map(img => (
                  <div key={img.id} className="border border-[#c8a84b15] bg-[#161410] overflow-hidden relative"
                    style={{ borderRadius: '2px' }}>
                    <img src={img.url} alt={img.name}
                      className="w-full h-40 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setImagemAberta(img)} />
                    {img.revealed && (
                      <div className="absolute top-2 left-2">
                        <span style={cinzel} className="bg-[#c8a84b] text-[#0f0e0c] text-xs px-2 py-0.5 font-bold">AO VIVO</span>
                      </div>
                    )}
                    <div className="p-3">
                      <p style={cinzel} className="text-[#6a6050] text-xs truncate mb-2">{img.name}</p>
                      <div className="flex gap-2">
  {img.revealed ? (
    <button onClick={() => esconderImagem(img.id)}
      className="flex-1 border border-[#c8a84b30] text-[#4a4030] py-1.5 text-xs hover:border-[#c8a84b60] hover:text-[#c8a84b] transition-colors"
      style={{ ...cinzel, borderRadius: '2px' }}>Esconder</button>
  ) : (
    <button onClick={() => revelarImagem(img.id)}
      className="flex-1 bg-[#c8a84b] text-[#0f0e0c] py-1.5 text-xs font-bold hover:bg-[#e0c060] transition-colors"
      style={{ ...cinzel, borderRadius: '2px' }}>Revelar</button>
  )}
  <button onClick={() => { setMapaAtivo(img); setModoMapa(true); buscarTokensNoMapa(img.id); }}
    className="border border-[#c8a84b30] text-[#c8a84b] px-2 py-1.5 text-xs hover:bg-[#c8a84b10] transition-colors"
    style={{ ...cinzel, borderRadius: '2px' }}>🎯</button>
  <button onClick={() => deletarImagem(img.id)}
    className="border border-red-900 text-red-900 px-2 py-1.5 text-xs hover:border-red-600 hover:text-red-600 transition-colors"
    style={{ ...cinzel, borderRadius: '2px' }}>×</button>
</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ABA TOKENS */}
        {aba === 'tokens' && (
          <>
            {/* Filtro por categoria */}
            {categorias.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <button onClick={() => setCategoriaAtiva('')}
                  className="px-3 py-1.5 text-xs border transition-all"
                  style={{
                    ...cinzel, borderRadius: '2px',
                    borderColor: !categoriaAtiva ? '#c8a84b' : '#c8a84b20',
                    backgroundColor: !categoriaAtiva ? '#c8a84b15' : 'transparent',
                    color: !categoriaAtiva ? '#c8a84b' : '#4a4030',
                  }}>
                  Todos
                </button>
                {categorias.map(cat => (
                  <button key={cat} onClick={() => setCategoriaAtiva(cat)}
                    className="px-3 py-1.5 text-xs border transition-all"
                    style={{
                      ...cinzel, borderRadius: '2px',
                      borderColor: categoriaAtiva === cat ? COR_CATEGORIA[cat] || '#c8a84b' : '#c8a84b20',
                      backgroundColor: categoriaAtiva === cat ? `${COR_CATEGORIA[cat] || '#c8a84b'}20` : 'transparent',
                      color: categoriaAtiva === cat ? COR_CATEGORIA[cat] || '#c8a84b' : '#4a4030',
                    }}>
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {tokensFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 border border-[#c8a84b15] bg-[#161410]">
                <span className="text-4xl opacity-20">⬡</span>
                <p style={cinzel} className="text-[#4a4030] text-sm tracking-widest">NENHUM TOKEN AINDA</p>
                <p className="text-[#3a3020] text-xs">Selecione a categoria e clique em + UPLOAD</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {tokensFiltrados.map(token => (
                  <div key={token.id} className="flex flex-col items-center gap-2 group">
                    <div className="relative">
                      <img src={token.url} alt={token.name}
                        className="w-20 h-20 object-cover rounded-full cursor-pointer hover:opacity-80 transition-opacity border-2"
                        style={{ borderColor: COR_CATEGORIA[token.category] || '#c8a84b30' }}
                        onClick={() => setImagemAberta(token)} />
                      <button onClick={() => deletarImagem(token.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-900 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        ×
                      </button>
                    </div>
                    <p style={cinzel} className="text-[#4a4030] text-xs text-center truncate w-full">{token.category}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODO MAPA */}
{modoMapa && mapaAtivo && (
  <div className="fixed inset-0 bg-[#0f0e0c] z-50 flex flex-col">
    {/* Header */}
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#c8a84b20] bg-[#161410]">
      <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">🎯 MODO MAPA — {mapaAtivo.name}</p>
      <button onClick={() => setModoMapa(false)}
        className="text-[#4a4030] hover:text-[#c8a84b] text-xl transition-colors">✕</button>
    </div>

    <div className="flex flex-1 overflow-hidden">
      {/* Mapa */}
      <div className="flex-1 relative overflow-hidden"
        onDragEnd={async e => {
  const mapContainer = e.currentTarget.parentElement;
  const imgEl = mapContainer.querySelector('img');
  const imgRect = imgEl.getBoundingClientRect();
  const x = ((e.clientX - imgRect.left) / imgRect.width) * 100;
  const y = ((e.clientY - imgRect.top) / imgRect.height) * 100;
  await api.patch(`/map-tokens/${t.id}/position`, { x, y });
  setTokensNoMapa(prev => prev.map(tk => tk.id === t.id ? { ...tk, x, y } : tk));
}}
        onDrop={async e => {
  e.preventDefault();
  
  const tokenId = e.dataTransfer.getData('tokenId');
  const tokenUrl = e.dataTransfer.getData('tokenUrl');

  const imgEl = e.currentTarget.querySelector('img');
  const imgRect = imgEl.getBoundingClientRect();
  const x = ((e.clientX - imgRect.left) / imgRect.width) * 100;
  const y = ((e.clientY - imgRect.top) / imgRect.height) * 100;

  
  const tokenId = e.dataTransfer.getData('tokenId');
  // eslint-disable-next-line no-unused-vars
  const tokenUrl = e.dataTransfer.getData('tokenUrl');

  const rect = e.currentTarget.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;

  try {
    const res = await api.post('/map-tokens', {
      campaign_id: CAMPANHA_ID,
      map_id: mapaAtivo.id,
      token_id: tokenId,
      token_url: tokenUrl,
      x: Math.round(x),
      y: Math.round(y),
      label: '',
      scale: 1.0,      
      rotation: 0      
    });

    setTokensNoMapa(prev => [...prev, res.data.data]);
  } catch (error) {
    console.error("Erro ao adicionar token:", error);
  }
}}>
        <img src={mapaAtivo.url} alt={mapaAtivo.name} className="w-full h-full object-contain" />
                {tokensNoMapa.map(t => (
          <div 
            key={t.id}
            data-token-id={t.id}
            style={{ 
              position: 'absolute', 
              left: `${t.x}%`, 
              top: `${t.y}%`, 
              transform: `translate(-50%, -50%) scale(${t.scale || 1}) rotate(${t.rotation || 0}deg)`,
              transformOrigin: 'center',
              cursor: 'grab',
              pointerEvents: 'auto'
            }}
            draggable
            onDragEnd={async e => {
              const rect = e.currentTarget.parentElement.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              await api.patch(`/map-tokens/${t.id}/position`, { x, y });
              setTokensNoMapa(prev => prev.map(tk => tk.id === t.id ? { ...tk, x, y } : tk));
            }}
          >
            <div className="relative">
              {/* Imagem do Token */}
              <img 
                src={t.token_url} 
                alt="" 
                className="w-10 h-10 rounded-full border-2 border-[#c8a84b]" 
              />

              {/* Alça de Rotação */}
              <div 
                className="absolute -top-6 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full border-2 border-white cursor-pointer flex items-center justify-center text-sm shadow-lg z-20 select-none"
                onMouseDown={(e) => handleRotationStart(e, t.id)}
              >
                ↻
              </div>

              {/* Novo: Alça de Resize (Escala) */}
              <div 
                className="absolute bottom-[-8px] right-[-8px] w-5 h-5 bg-green-500 hover:bg-green-600 rounded-full border-2 border-white cursor-nwse-resize shadow-lg z-20"
                onMouseDown={(e) => handleResizeStart(e, t.id)}
              >
                ⤢
              </div>

              {/* Label */}
              {t.label && (
                <p style={cinzel} className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-white text-xs whitespace-nowrap bg-black bg-opacity-70 px-1">
                  {t.label}
                </p>
              )}

              {/* Botão Deletar */}
              <button 
                onClick={() => api.delete(`/map-tokens/${t.id}`).then(() => setTokensNoMapa(prev => prev.filter(tk => tk.id !== t.id)))}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-900 text-white text-xs rounded-full flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar tokens */}
      <div className="w-48 bg-[#161410] border-l border-[#c8a84b20] overflow-y-auto p-3">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-3">TOKENS</p>
        <div className="grid grid-cols-2 gap-2">
          {tokens.map(token => (
            <div key={token.id}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('tokenId', token.id);
                e.dataTransfer.setData('tokenUrl', token.url);
              }}
              className="flex flex-col items-center gap-1 cursor-grab">
              <img src={token.url} alt={token.name}
                className="w-12 h-12 rounded-full object-cover border border-[#c8a84b20]" />
              <p style={cinzel} className="text-[#4a4030] text-xs text-center truncate w-full">{token.category}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)}

      {imagemAberta && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
          onClick={() => setImagemAberta(null)}>
          <img src={imagemAberta.url} alt={imagemAberta.name} className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}