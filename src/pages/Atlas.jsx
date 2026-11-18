import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { cinzel, crimson } from '../estilos';
import { getCampanhaId } from '../utils/campanha';
import { useUser } from '../context/UserContext';
import LogoTaverna from '../components/LogoTaverna';
import BotaoRevelar from '../components/BotaoRevelar';
import SeletorGaleria from '../components/SeletorGaleria';

const radius = { borderRadius: '2px' };
const btn = 'text-xs border px-3 py-1 transition-colors disabled:opacity-40';

export default function Atlas() {
  const navigate = useNavigate();
  const campanha = getCampanhaId();
  const { user } = useUser();
  const isMestre = user?.role === 'mestre';
  const [gerando, setGerando] = useState(false);
  const [mapaUrl, setMapaUrl] = useState(null);
  const [pins, setPins] = useState([]);
  const [regioes, setRegioes] = useState([]);
  const [descobertas, setDescobertas] = useState([]);
  const [carregado, setCarregado] = useState(false);
  const [editando, setEditando] = useState(null);       
  const [desenhando, setDesenhando] = useState(null);   
  const [localAberto, setLocalAberto] = useState(null);
  const [regiaoAberta, setRegiaoAberta] = useState(null);
  const [descEdit, setDescEdit] = useState('');
  const [inclinado, setInclinado] = useState(true); 
  const [hoverId, setHoverId] = useState(null);
  const [dim, setDim] = useState({ w: 100, h: 60 });
  const [imgEdit, setImgEdit] = useState('');
  const INCLINACAO = 35;
  const [galeria, setGaleria] = useState(null);

  function carregarDescobertas() {
    if (!isMestre) return;
    api.get(`/descobertas?campaign_id=${campanha}`)
      .then(r => setDescobertas(r.data.data || []))
      .catch(() => {});
  }

  useEffect(() => {
    if (!user) return;
    const rota = isMestre ? `/atlas-mestre/${campanha}` : `/atlas/${campanha}`;
    api.get(rota)
      .then(r => {
        const d = r.data.data;
        setMapaUrl(d.mapa_url);
        setPins(d.pins || []);
        setRegioes(d.regioes || []);
      })
      .catch(() => {})
      .finally(() => setCarregado(true));
    carregarDescobertas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campanha, isMestre, user]);

  const descDe = (tipo, id) =>
    descobertas.find(d => d.tipo === tipo && String(d.entidade_id) === String(id) && !d.personagem_id);

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
    if (!desenhando && !editando) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = +(((e.clientX - r.left) / r.width) * 100).toFixed(2);
    const y = +(((e.clientY - r.top) / r.height) * 100).toFixed(2);

    if (desenhando) { setDesenhando(d => [...d, [x, y]]); return; }

    try {
      await api.patch(`/locations/${editando}`, { pin_x: x, pin_y: y });
      setPins(p => p.map(l => (l.id === editando ? { ...l, x, y } : l)));
      setLocalAberto(editando);
      setRegiaoAberta(null);
      setEditando(null);
    } catch { alert('Erro ao salvar a posição.'); }
  }

  async function concluirRegiao() {
    if (!desenhando || desenhando.length < 3) return alert('Marque pelo menos 3 pontos.');
    const nome = window.prompt('Nome da região:');
    if (!nome?.trim()) return;
    try {
      const res = await api.post('/regioes', { campaign_id: campanha, nome: nome.trim(), pontos: desenhando });
      const nova = res.data.data;
      setRegioes(r => [...r, nova]);
      abrirRegiao(nova);
      setDesenhando(null);
    } catch { alert('Erro ao salvar a região.'); }
  }

  async function gerarComIA() {
  const contexto = window.prompt('Contexto opcional (clima, cultura, tom):') ?? '';
  setGerando(true);
  try {
    const res = await api.post(`/regioes/${regiaoAberta}/gerar`, { contexto });
    setDescEdit(res.data.descricao);
    setRegioes(rs => rs.map(g => (g.id === regiaoAberta ? { ...g, descricao: res.data.descricao } : g)));
    setPins(ps => [...ps, ...res.data.cidades.map(c => ({
      id: c.id, nome: c.name, subtitulo: 'Cidade', descricao: c.description,
      x: null, y: null, regiao_id: regiaoAberta,
    }))]);
  } catch { alert('Erro ao gerar com IA.'); }
  setGerando(false);
}

function abrirRegiao(g) {
  setRegiaoAberta(g.id);
  setLocalAberto(null);
  setDescEdit(g.descricao || '');
  setImgEdit(g.imagem_url || '');
}

async function salvarImagem() {
  const url = imgEdit.trim();
  try {
    await api.patch(`/regioes/${regiaoAberta}`, { imagem_url: url });
    setRegioes(rs => rs.map(g => (g.id === regiaoAberta ? { ...g, imagem_url: url } : g)));
  } catch { alert('Erro ao salvar a imagem.'); }
}

  function abrirLocal(id) {
    setLocalAberto(id);
    setRegiaoAberta(null);
  }

  async function salvarDescricao() {
    try {
      await api.patch(`/regioes/${regiaoAberta}`, { descricao: descEdit });
      setRegioes(rs => rs.map(g => (g.id === regiaoAberta ? { ...g, descricao: descEdit } : g)));
    } catch { alert('Erro ao salvar a descrição.'); }
  }

  async function apagarRegiao(id) {
    if (!window.confirm('Apagar esta região? Os locais continuam existindo.')) return;
    try {
      await api.delete(`/regioes/${id}`);
      setRegioes(rs => rs.filter(g => g.id !== id));
      setPins(ps => ps.map(p => (p.regiao_id === id ? { ...p, regiao_id: null } : p)));
      setRegiaoAberta(null);
    } catch { alert('Erro ao apagar a região.'); }
  }

  async function usarMapaDaGaleria(url) {
  try {
    await api.put(`/mapa/${campanha}/url`, { url });
    setMapaUrl(url);
  } catch { alert('Não foi possível usar essa imagem como mapa.'); }
  setGaleria(null);
}

async function usarImagemNaRegiao(url) {
  try {
    await api.patch(`/regioes/${regiaoAberta}`, { imagem_url: url });
    setRegioes(rs => rs.map(g => (g.id === regiaoAberta ? { ...g, imagem_url: url } : g)));
    setImgEdit(url);
  } catch { alert('Não foi possível usar essa imagem na região.'); }
  setGaleria(null);
}

  async function vincular(localId, regiaoId) {
    if (!regiaoId) return;
    try {
      await api.patch(`/locations/${localId}`, { regiao_id: regiaoId });
      setPins(ps => ps.map(p => (p.id === localId ? { ...p, regiao_id: regiaoId } : p)));
    } catch { alert('Erro ao vincular o local.'); }
  }

  const noMapa = pins.filter(p => p.x != null && p.y != null);
  const semPosicao = pins.filter(p => p.x == null || p.y == null);
  const local = pins.find(p => p.id === localAberto);
  const regiao = regioes.find(g => g.id === regiaoAberta);
  const locaisDaRegiao = regiao ? pins.filter(p => p.regiao_id === regiao.id) : [];
  const modoClique = !!(desenhando || editando);

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
          <div className="flex flex-wrap gap-2 mb-4">
            <label className={`${btn} cursor-pointer border-[#c8a84b30] text-[#c8a84b] hover:bg-[#c8a84b10]`}
              style={{ ...cinzel, ...radius }}>
              🗺 {mapaUrl ? 'Trocar mapa' : 'Enviar mapa'}
              <input type="file" accept="image/*" className="hidden" onChange={enviarMapa} />
            </label>
            <button onClick={() => setGaleria('mapa')}
              className={`${btn} border-[#c8a84b30] text-[#c8a84b] hover:bg-[#c8a84b10]`} style={{ ...cinzel, ...radius }}>
              🖼 Mapa da Galeria
            </button>

            {mapaUrl && !desenhando && (
              <button onClick={() => { setDesenhando([]); setEditando(null); }}
                className={`${btn} border-[#c8a84b30] text-[#c8a84b] hover:bg-[#c8a84b10]`}
                style={{ ...cinzel, ...radius }}>
                ＋ Nova região
              </button>
            )}

            {desenhando && (
              <>
                <button onClick={() => setDesenhando(d => d.slice(0, -1))} disabled={desenhando.length === 0}
                  className={`${btn} border-[#c8a84b30] text-[#9a8e78]`} style={{ ...cinzel, ...radius }}>↶ Desfazer</button>
                <button onClick={concluirRegiao} disabled={desenhando.length < 3}
                  className={`${btn} border-[#4a8a4a60] text-[#4a8a4a]`} style={{ ...cinzel, ...radius }}>✓ Concluir</button>
                <button onClick={() => setDesenhando(null)}
                  className={`${btn} border-red-600 text-red-600`} style={{ ...cinzel, ...radius }}>✕ Cancelar</button>
              </>
            )}
          </div>
        )}

        {mapaUrl && (
          <button onClick={() => setInclinado(v => !v)}
            className={`${btn} mb-4 ${inclinado ? 'border-[#c8a84b] text-[#c8a84b]' : 'border-[#c8a84b30] text-[#9a8e78]'}`}
            style={{ ...cinzel, ...radius }}>
            🧊 {inclinado ? 'Mapa plano' : 'Inclinar mapa'}
          </button>
        )}

        {carregado && !mapaUrl && (
          <p className="text-[#8a7e68] text-sm text-center py-12">
            {isMestre ? 'Nenhum mapa ainda. Envie uma imagem ou escolha da Galeria.' : 'O mapa ainda não foi revelado.'}
          </p>
        )}
        {mapaUrl && (() => {
          const tilt = inclinado && !modoClique;      
          const k = dim.h / dim.w;                    
          const H = 100 * k;
          const PROF = 1.8;                           
          const CAMADAS = 8;

          const pts = g => (g.pontos || []).map(([x, y]) => `${x},${y * k}`).join(' ');
          const caixa = g => {
            const xs = (g.pontos || []).map(p => p[0]);
            const ys = (g.pontos || []).map(p => p[1] * k);
            return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
          };
          const centroY = g => {
            const ys = (g.pontos || []).map(p => p[1]);
            return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 0;
          };
          const prioridade = g => (regiaoAberta === g.id ? 2 : hoverId === g.id ? 1 : 0);
          const ordem = [...regioes].sort((a, b) => prioridade(a) - prioridade(b) || centroY(a) - centroY(b));

          return (
            <div style={{ perspective: '1400px', padding: tilt ? '2rem 0 3rem' : 0, transition: 'padding 0.6s ease' }}>
              <div className="relative w-full border border-[#c8a84b30]"
                style={{
                  ...radius,
                  cursor: modoClique ? 'crosshair' : 'default',
                  transformStyle: 'preserve-3d',
                  transform: tilt ? `rotateX(${INCLINACAO}deg)` : 'none',
                  transformOrigin: '50% 100%',
                  transition: 'transform 0.6s ease, box-shadow 0.6s ease',
                  boxShadow: tilt ? '0 50px 60px -20px rgba(0,0,0,0.8)' : 'none',
                }}
                onClick={aoClicarNoMapa}>
                <img src={mapaUrl} alt="Mapa" className="block w-full select-none" draggable={false}
                  onLoad={e => setDim({ w: e.target.naturalWidth, h: e.target.naturalHeight })} />

                {/* regiões em relevo */}
                <svg viewBox={`0 0 100 ${H}`} className="absolute inset-0 w-full h-full"
                  style={{ pointerEvents: modoClique ? 'none' : 'auto' }}>
                  {ordem.map(g => {
                    const aberta = regiaoAberta === g.id;
                    const lift = aberta ? 1.6 : hoverId === g.id ? 0.8 : 0;
                    const b = caixa(g);
                    const p = pts(g);
                    return (
                      <g key={g.id}>
                        {/* lados da peça: camadas empilhadas, a base fica fixa e o topo sobe */}
                        {Array.from({ length: CAMADAS + 1 }, (_, i) => (
                          <polygon key={i} points={p}
                            style={{
                              fill: i === CAMADAS ? '#14100a' : '#4a3b1e',
                              transform: `translateY(${-lift + (i * (PROF + lift)) / CAMADAS}px)`,
                              transition: 'transform 0.25s ease',
                              pointerEvents: 'none',
                            }} />
                        ))}

                        {/* topo da peça */}
                        <g style={{ transform: `translateY(${-lift}px)`, transition: 'transform 0.25s ease' }}>
                          <clipPath id={`clip-${g.id}`}><polygon points={p} /></clipPath>
                          <g clipPath={`url(#clip-${g.id})`}>
                            {g.imagem_url ? (
                              <image href={g.imagem_url} x={b.x0} y={b.y0}
                                width={b.x1 - b.x0} height={b.y1 - b.y0} preserveAspectRatio="xMidYMid slice" />
                            ) : (
                              <image href={mapaUrl} x="0" y="0" width="100" height={H} preserveAspectRatio="none" />
                            )}
                          </g>
                          <polygon points={p} vectorEffect="non-scaling-stroke"
                            onClick={e => { e.stopPropagation(); abrirRegiao(g); }}
                            onMouseEnter={() => setHoverId(g.id)}
                            onMouseLeave={() => setHoverId(null)}
                            style={{
                              cursor: 'pointer',
                              fill: aberta ? 'rgba(200,168,75,0.22)' : hoverId === g.id ? 'rgba(200,168,75,0.14)' : 'rgba(0,0,0,0)',
                              stroke: '#c8a84b',
                              strokeWidth: aberta ? 2 : 1,
                              pointerEvents: modoClique ? 'none' : 'all',
                            }} />
                        </g>
                      </g>
                    );
                  })}

                  {desenhando?.length > 1 && (
                    <polyline points={desenhando.map(([x, y]) => `${x},${y * k}`).join(' ')}
                      vectorEffect="non-scaling-stroke"
                      style={{ fill: 'none', stroke: '#f0e8d8', strokeWidth: 2, strokeDasharray: '4 3' }} />
                  )}
                </svg>

                {/* pontos do desenho */}
                {desenhando?.map(([x, y], i) => (
                  <span key={i} className="absolute w-2 h-2 rounded-full bg-[#f0e8d8] pointer-events-none"
                    style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }} />
                ))}

                {/* pins: em pé mesmo com o mapa inclinado */}
                {noMapa.map(p => (
                  <button key={p.id} title={p.nome}
                    onClick={e => { e.stopPropagation(); if (!modoClique) abrirLocal(p.id); }}
                    className="absolute text-2xl leading-none"
                    style={{
                      left: `${p.x}%`, top: `${p.y}%`,
                      transform: `translate(-50%, -100%) rotateX(${tilt ? -INCLINACAO : 0}deg)`,
                      transformOrigin: '50% 100%',
                      transition: 'transform 0.6s ease',
                      filter: localAberto === p.id ? 'drop-shadow(0 0 6px #c8a84b)' : 'drop-shadow(0 1px 2px #000)',
                    }}>
                    📍
                  </button>
                ))}

                {modoClique && (
                  <p style={cinzel}
                    className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#0f0e0c] border border-[#c8a84b] text-[#c8a84b] text-xs px-3 py-1 pointer-events-none whitespace-nowrap">
                    {desenhando ? `CLIQUE PARA MARCAR OS PONTOS (${desenhando.length})` : 'CLIQUE NO MAPA PARA POSICIONAR'}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* card da região */}
        {regiao && (
          <div className="mt-4 border border-[#c8a84b30] bg-[#161410] p-4 space-y-4" style={radius}>
            <div className="flex items-start justify-between gap-3">
              <p style={cinzel} className="text-[#f0e8d8] text-lg">{regiao.nome}</p>
              {isMestre && (
                <div className="flex gap-2 items-center">
                  <BotaoRevelar tipo="regiao" entidadeId={regiao.id} campanhaId={campanha}
                    descoberta={descDe('regiao', regiao.id)} onMudou={carregarDescobertas} />
                  <button onClick={gerarComIA} disabled={gerando}
                    className={`${btn} border-[#a86aa850] text-[#a86aa8]`} style={{ ...cinzel, ...radius }}>
                    {gerando ? '⟳ Gerando...' : '✨ Gerar com IA'}
                  </button>
                  <button onClick={() => apagarRegiao(regiao.id)}
                    className={`${btn} border-red-600 text-red-600`} style={{ ...cinzel, ...radius }}>🗑</button>
                </div>
              )}
            </div>

            {isMestre ? (
              <div>
                <textarea value={descEdit} onChange={e => setDescEdit(e.target.value)} rows={4}
                  placeholder="Descreva a região: clima, cultura, perigos..." aria-label="Descrição da região"
                  className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full text-sm focus:outline-none focus:border-[#c8a84b50] placeholder-[#3a3020] resize-none"
                  style={radius} />
                <button onClick={salvarDescricao} disabled={descEdit === (regiao.descricao || '')}
                  className={`${btn} mt-2 border-[#c8a84b30] text-[#c8a84b]`} style={{ ...cinzel, ...radius }}>
                  Salvar descrição
                </button>
              </div>
            ) : (
              regiao.descricao && <p className="text-[#9a8e78] text-sm leading-relaxed font-light">{regiao.descricao}</p>
            )}

            {regiao.imagem_url && (
              <img src={regiao.imagem_url} alt={regiao.nome}
                className="w-full max-h-80 object-cover border border-[#c8a84b20]" style={radius} />
            )}

            {isMestre && (
              <div className="flex gap-2">
                <input value={imgEdit} onChange={e => setImgEdit(e.target.value)}
                  placeholder="Endereço de uma imagem da Galeria (aparência da região)"
                  aria-label="Imagem da região"
                  className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-1 flex-1 text-xs focus:outline-none focus:border-[#c8a84b50] placeholder-[#3a3020]"
                  style={radius} />
                <button onClick={salvarImagem} disabled={imgEdit.trim() === (regiao.imagem_url || '')}
                  className={`${btn} border-[#c8a84b30] text-[#c8a84b]`} style={{ ...cinzel, ...radius }}>
                  Salvar
                </button>
                <button onClick={() => setGaleria('regiao')}
                  className={`${btn} border-[#c8a84b30] text-[#c8a84b]`} style={{ ...cinzel, ...radius }}>
                  🖼 Galeria
                </button>
              </div>
            )}

            <div>
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-2">CIDADES E LOCAIS</p>
              {locaisDaRegiao.length === 0 ? (
                <p className="text-[#8a7e68] text-sm">Nada conhecido por aqui ainda.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {locaisDaRegiao.map(p => (
                    <button key={p.id} onClick={() => abrirLocal(p.id)}
                      className={`${btn} border-[#c8a84b20] text-[#9a8e78] hover:text-[#c8a84b]`}
                      style={{ ...cinzel, ...radius }}>
                      📍 {p.nome}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* card do local */}
        {local && (
          <div className="mt-4 border border-[#c8a84b30] bg-[#161410] p-4" style={radius}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p style={cinzel} className="text-[#f0e8d8] text-lg">{local.nome}</p>
                <p className="text-[#8a7e68] text-xs mt-1">
                  {[local.subtitulo, regioes.find(g => g.id === local.regiao_id)?.nome].filter(Boolean).join(' · ')}
                </p>
              </div>
              {isMestre && (
                <div className="flex flex-wrap gap-2 justify-end">
                  <BotaoRevelar tipo="local" entidadeId={local.id} campanhaId={campanha}
                    descoberta={descDe('local', local.id)} onMudou={carregarDescobertas} />
                  <button onClick={() => setEditando(local.id)}
                    className={`${btn} border-[#c8a84b30] text-[#c8a84b] hover:bg-[#c8a84b10]`}
                    style={{ ...cinzel, ...radius }}>↻ Reposicionar</button>
                </div>
              )}
            </div>
            {local.descricao && <p className="text-[#9a8e78] text-sm leading-relaxed font-light mt-3">{local.descricao}</p>}

                    {isMestre && regioes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#c8a84b10]">
                        <label style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] mr-2">REGIÃO</label>
                        <select value={local.regiao_id || ''} onChange={e => vincular(local.id, e.target.value)}
                          className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#9a8e78] px-2 py-1 text-xs focus:outline-none"
                          style={radius}>
                          <option value="">— escolher —</option>
                          {regioes.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}

        {/* locais sem posição (mestre) */}
        {isMestre && mapaUrl && semPosicao.length > 0 && (
          <div className="mt-6">
            <p style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] mb-2">LOCAIS SEM POSIÇÃO NO MAPA</p>
            <div className="flex flex-wrap gap-2">
              {semPosicao.map(p => (
                <button key={p.id} onClick={() => { setEditando(p.id); setDesenhando(null); }}
                  className={`${btn} ${editando === p.id ? 'border-[#c8a84b] text-[#c8a84b]' : 'border-[#c8a84b20] text-[#9a8e78]'}`}
                  style={{ ...cinzel, ...radius }}>
                  📍 {p.nome}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {galeria && (
        <SeletorGaleria campanhaId={campanha}
          onEscolher={galeria === 'mapa' ? usarMapaDaGaleria : usarImagemNaRegiao}
          onFechar={() => setGaleria(null)} />
      )}
    </div>
  );
}