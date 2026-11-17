import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { cinzel, crimson } from '../estilos';
import { getCampanhaId } from '../utils/campanha';
import LogoTaverna from '../components/LogoTaverna';
import { useUser } from '../context/UserContext';

const radius = { borderRadius: '2px' };

export default function Atlas() {
  const navigate = useNavigate();
  const campanha = getCampanhaId();
  const [mapaUrl, setMapaUrl] = useState(null);
  const [pins, setPins] = useState([]);
  const [carregado, setCarregado] = useState(false);
  const [editando, setEditando] = useState(null);   
  const [aberto, setAberto] = useState(null);
  const { user } = useUser();
  const isMestre = user?.role === 'mestre';

useEffect(() => {
  if (!user) return;
  const rota = isMestre ? `/atlas-mestre/${campanha}` : `/atlas/${campanha}`;
  api.get(rota)
    .then(r => { setMapaUrl(r.data.data.mapa_url); setPins(r.data.data.pins); })
    .catch(() => {})
    .finally(() => setCarregado(true));
}, [campanha, isMestre, user]);


  async function enviarMapa(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await api.post(`/mapa/${campanha}`, form);
      setMapaUrl(res.data.url);
    } catch { alert('Não foi possível enviar o mapa.'); }
  }

  async function aoClicarNoMapa(e) {
    if (!editando) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = +(((e.clientX - r.left) / r.width) * 100).toFixed(2);
    const y = +(((e.clientY - r.top) / r.height) * 100).toFixed(2);
    try {
      await api.patch(`/locations/${editando}`, { pin_x: x, pin_y: y });
      setPins(p => p.map(l => (l.id === editando ? { ...l, x, y } : l)));
      setAberto(editando);
      setEditando(null);
    } catch { alert('Erro ao salvar a posição.'); }
  }

  const noMapa = pins.filter(p => p.x != null && p.y != null);
  const semPosicao = pins.filter(p => p.x == null || p.y == null);
  const sel = pins.find(p => p.id === aberto);

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0] page-fade" style={crimson}>
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#c8a84b20]">
        <LogoTaverna />
        <button onClick={() => navigate(-1)} style={cinzel}
          className="text-[#9a8e78] text-sm hover:text-[#c8a84b] transition-colors">← Voltar</button>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <p style={cinzel} className="text-[#b07050] text-xs tracking-[4px] mb-2 opacity-70">O MUNDO CONHECIDO</p>
        <h1 style={cinzel} className="text-2xl text-[#f0e8d8] font-semibold mb-6">Atlas</h1>

        {isMestre && (
          <label className="inline-block border border-[#c8a84b30] text-[#c8a84b] px-3 py-1 text-xs cursor-pointer hover:bg-[#c8a84b10] transition-colors mb-4"
            style={{ ...cinzel, ...radius }}>
            🗺 {mapaUrl ? 'Trocar mapa' : 'Enviar mapa'}
            <input type="file" accept="image/*" className="hidden" onChange={enviarMapa} />
          </label>
        )}

        {carregado && !mapaUrl && (
          <p className="text-[#8a7e68] text-sm text-center py-12">O mapa ainda não foi revelado.</p>
        )}

        {mapaUrl && (
          <div className="relative w-full border border-[#c8a84b30] overflow-hidden"
            style={{ ...radius, cursor: editando ? 'crosshair' : 'default' }}
            onClick={aoClicarNoMapa}>
            <img src={mapaUrl} alt="Mapa" className="block w-full select-none" draggable={false} />
            {noMapa.map(p => (
              <button key={p.id}
                onClick={e => { e.stopPropagation(); if (!editando) setAberto(aberto === p.id ? null : p.id); }}
                title={p.nome}
                className="absolute text-2xl leading-none"
                style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -100%)',
                         filter: aberto === p.id ? 'drop-shadow(0 0 6px #c8a84b)' : 'drop-shadow(0 1px 2px #000)' }}>
                📍
              </button>
            ))}
            {editando && (
              <p style={cinzel} className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#0f0e0c] border border-[#c8a84b] text-[#c8a84b] text-xs px-3 py-1">
                CLIQUE NO MAPA PARA POSICIONAR
              </p>
            )}
          </div>
        )}

        {sel && (
          <div className="mt-4 border border-[#c8a84b30] bg-[#161410] p-4" style={radius}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p style={cinzel} className="text-[#f0e8d8] text-lg">{sel.nome}</p>
                {sel.subtitulo && <p className="text-[#8a7e68] text-xs mt-1">{sel.subtitulo}</p>}
              </div>
              {isMestre && (
                <button onClick={() => setEditando(sel.id)}
                  className="text-xs border border-[#c8a84b30] text-[#c8a84b] px-2 py-1 hover:bg-[#c8a84b10] transition-colors"
                  style={{ ...cinzel, ...radius }}>
                  ↻ Reposicionar
                </button>
              )}
            </div>
            {sel.descricao && <p className="text-[#9a8e78] text-sm leading-relaxed font-light mt-3">{sel.descricao}</p>}
          </div>
        )}

        {isMestre && mapaUrl && semPosicao.length > 0 && (
          <div className="mt-6">
            <p style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] mb-2">LOCAIS SEM POSIÇÃO NO MAPA</p>
            <div className="flex flex-wrap gap-2">
              {semPosicao.map(p => (
                <button key={p.id} onClick={() => setEditando(p.id)}
                  className="border px-3 py-1 text-xs transition-colors"
                  style={{ ...cinzel, ...radius,
                           borderColor: editando === p.id ? '#c8a84b' : '#c8a84b20',
                           color: editando === p.id ? '#c8a84b' : '#9a8e78' }}>
                  📍 {p.nome}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}