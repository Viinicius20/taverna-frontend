import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { cinzel, crimson } from '../estilos';
import { getCampanhaId } from '../utils/campanha';
import { confirmar } from '../utils/notificar';
import { useUser } from '../context/UserContext';
import LogoTaverna from '../components/LogoTaverna';
import BotaoRevelar from '../components/BotaoRevelar';
import SeletorGaleria from '../components/SeletorGaleria';

const radius = { borderRadius: '2px' };
const btn = 'text-xs border px-3 py-1 transition-colors disabled:opacity-40';
const LARG = 100;
const ALT = 56.25;        // o mundo é 16:9
const INCLINACAO = 35;
const PROF = 1.6;         // espessura das terras
const CAMADAS = 8;

// ---------- ambientes: cada um muda cor, textura, relevo e lados da terra ----------
// r/g/b = degradê do ruído (do claro ao escuro); freq = tamanho da textura;
// espessura = quanto a terra "sobe" do mar (oceano é quase plano)

const AMBIENTES = {
  floresta: {
    label: 'Floresta', emoji: '🌲',
    r: '0.80 0.68 0.42 0.20', g: '0.66 0.62 0.52 0.38', b: '0.42 0.30 0.20 0.14',
    freq: 0.3, oitavas: 4, relevo: 5, espessura: 1,
    lado: '#a8834a', base: '#2e2312', borda: '#c8a84b',
  },
  deserto: {
    label: 'Deserto', emoji: '🏜️',
    r: '0.97 0.91 0.80 0.68', g: '0.87 0.75 0.61 0.46', b: '0.64 0.47 0.33 0.22',
    freq: 0.16, oitavas: 4, relevo: 4, espessura: 1,
    lado: '#c79a55', base: '#5a4220', borda: '#e0b860',
  },
  neve: {
    label: 'Neve', emoji: '❄️',
    r: '0.98 0.90 0.78 0.64', g: '0.99 0.94 0.87 0.77', b: '1 0.98 0.95 0.90',
    freq: 0.22, oitavas: 4, relevo: 5, espessura: 1,
    lado: '#b8c8d8', base: '#4a5a6a', borda: '#dff1ff',
  },
  fogo: {
    label: 'Fogo', emoji: '🔥',
    r: '0.16 0.38 0.82 1', g: '0.10 0.12 0.30 0.62', b: '0.10 0.08 0.08 0.10',
    freq: 0.25, oitavas: 5, relevo: 6, espessura: 1.2,
    lado: '#3a2218', base: '#150c08', borda: '#ff7a3c',
  },
  pantano: {
    label: 'Pântano', emoji: '🐊',
    r: '0.34 0.26 0.19 0.12', g: '0.42 0.37 0.30 0.22', b: '0.24 0.17 0.12 0.10',
    freq: 0.35, oitavas: 4, relevo: 3, espessura: 0.7,
    lado: '#4c4a2c', base: '#1c1a0e', borda: '#8aa05a',
  },
  montanha: {
    label: 'Montanha', emoji: '⛰️',
    r: '0.84 0.62 0.44 0.28', g: '0.82 0.60 0.43 0.27', b: '0.80 0.60 0.44 0.30',
    freq: 0.4, oitavas: 5, relevo: 9, espessura: 1.8,
    lado: '#7a7468', base: '#26231e', borda: '#c9c2b2',
  },
  oceano: {
    label: 'Oceano', emoji: '🌊',
    r: '0.12 0.14 0.18 0.24', g: '0.32 0.40 0.50 0.62', b: '0.52 0.60 0.70 0.82',
    freq: 0.08, oitavas: 3, relevo: 1.5, espessura: 0.25,
    lado: '#1d4a66', base: '#0b2233', borda: '#6fb7d6',
  },
};

const ambienteDe = chave => AMBIENTES[chave] || AMBIENTES.floresta;

// campos do local ligado à terra (os mesmos da página Locais)
const CAMPOS_LOCAL = [
  { chave: 'region_info', label: 'REGIÃO' },
  { chave: 'commerce', label: 'COMÉRCIO' },
  { chave: 'monsters', label: 'MONSTROS/PERIGOS' },
  { chave: 'quests', label: 'IDEIAS DE QUEST' },
  { chave: 'boss', label: 'AMEAÇA PRINCIPAL' },
];
const CHAVES_LOCAL = ['description', ...CAMPOS_LOCAL.map(c => c.chave), 'language', 'avg_level', 'faction_id'];
const formDe = l => Object.fromEntries(CHAVES_LOCAL.map(k => [k, l?.[k] ?? '']));
const campo = 'bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full text-sm focus:outline-none focus:border-[#c8a84b50] placeholder-[#3a3020] resize-y';

// ---------- forma das terras: sempre a mesma para a mesma semente ----------

function sorteador(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formaDe(g) {
  const rnd = sorteador(g.semente || 1);
  const n = 36;
  const amps = [0.22 * rnd() + 0.08, 0.16 * rnd() + 0.05, 0.1 * rnd() + 0.03, 0.06 * rnd() + 0.02];
  const fases = amps.map(() => rnd() * Math.PI * 2);
  const esticar = 0.85 + rnd() * 0.5;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let rr = 1;
    amps.forEach((am, k) => { rr += am * Math.sin((k + 2) * a + fases[k]); });
    rr += (rnd() - 0.5) * 0.07;
    pts.push([g.cx + Math.cos(a) * g.raio * rr * esticar, g.cy + Math.sin(a) * g.raio * rr * 0.8]);
  }
  return pts;
}

function geometria(g) {
  const pts = formaDe(g);
  const xs = pts.map(p => p[0]);
  const ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return {
    p: pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' '),
    x0, y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0,
  };
}

// o ponto (x, y) está dentro do polígono? (usado para saber em qual terra o clique caiu)
function dentro([x, y], poly) {
  let d = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
}

// textura de terreno: ruído -> degradê do ambiente -> iluminação para dar relevo
function FiltroTerreno({ id, semente, ambiente }) {
  const a = ambienteDe(ambiente);
  return (
    <filter id={id} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency={a.freq} numOctaves={a.oitavas} seed={(semente || 1) % 997} result="ruido" />
      <feColorMatrix in="ruido" type="matrix" result="cinza"
        values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1" />
      <feComponentTransfer in="cinza" result="contraste">
        <feFuncR type="linear" slope="2.6" intercept="-0.8" />
        <feFuncG type="linear" slope="2.6" intercept="-0.8" />
        <feFuncB type="linear" slope="2.6" intercept="-0.8" />
      </feComponentTransfer>
      <feComponentTransfer in="contraste" result="cor">
        <feFuncR type="table" tableValues={a.r} />
        <feFuncG type="table" tableValues={a.g} />
        <feFuncB type="table" tableValues={a.b} />
      </feComponentTransfer>
      <feColorMatrix in="contraste" type="matrix" result="altura"
        values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" />
      <feDiffuseLighting in="altura" surfaceScale={a.relevo} diffuseConstant="1.4" lightingColor="#ffffff" result="luz">
        <feDistantLight azimuth="225" elevation="55" />
      </feDiffuseLighting>
      <feBlend in="cor" in2="luz" mode="multiply" />
    </filter>
  );
}

export default function Atlas() {
  const navigate = useNavigate();
  const campanha = getCampanhaId();
  const { user } = useUser();
  const isMestre = user?.role === 'mestre';

  const [regioes, setRegioes] = useState([]);
  const [pins, setPins] = useState([]);
  const [descobertas, setDescobertas] = useState([]);
  const [carregado, setCarregado] = useState(false);
  const [inclinado, setInclinado] = useState(true);
  const [hoverId, setHoverId] = useState(null);
  const [regiaoAberta, setRegiaoAberta] = useState(null);
  const [localAberto, setLocalAberto] = useState(null);
  const [movendo, setMovendo] = useState(null);       // terra sendo arrastada
  const [editando, setEditando] = useState(null);     // local sendo posicionado
  const [escolhendo, setEscolhendo] = useState(null); // terra esperando um 📍 que a descreva
  const [nomeEdit, setNomeEdit] = useState('');
  const [descEdit, setDescEdit] = useState('');
  const [gerando, setGerando] = useState(false);
  const [galeria, setGaleria] = useState(false);
  const arrasto = useRef(null);
  const [locaisFull, setLocaisFull] = useState(null);   // locais completos (só mestre)
  const [faccoes, setFaccoes] = useState([]);
  const [form, setForm] = useState(null);               // edição do local ligado à terra aberta
  const [salvandoLocal, setSalvandoLocal] = useState(false);

  useEffect(() => {
    if (!isMestre) return;
    api.get(`/locations/${campanha}`).then(r => setLocaisFull(r.data.data || [])).catch(() => setLocaisFull([]));
    api.get(`/factions/${campanha}`).then(r => setFaccoes(r.data.data || [])).catch(() => setFaccoes([]));
  }, [campanha, isMestre]);

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
        setPins(r.data.data.pins || []);
        setRegioes(r.data.data.regioes || []);
      })
      .catch(() => {})
      .finally(() => setCarregado(true));
    carregarDescobertas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campanha, isMestre, user]);

  const descDe = (tipo, id) =>
    descobertas.find(d => d.tipo === tipo && String(d.entidade_id) === String(id) && !d.personagem_id);

  function cancelarModos() {
    arrasto.current = null;
    setMovendo(null);
    setEditando(null);
    setEscolhendo(null);
  }

  // ---------- terras ----------

  function ajustarLocal(id, campos) {
    setRegioes(rs => rs.map(g => (g.id === id ? { ...g, ...campos } : g)));
  }

  async function salvarCampos(id, campos) {
    try { await api.patch(`/regioes/${id}`, campos); }
    catch { alert('Erro ao salvar.'); }
  }

  async function criarTerra() {
    const nome = window.prompt('Nome da nova terra:');
    if (!nome?.trim()) return;
    const raio = +(5 + Math.random() * 8).toFixed(1);
    let cx = LARG / 2;
    let cy = ALT / 2;
    for (let t = 0; t < 60; t++) {   // procura um canto livre, sem encostar nas outras
      const x = raio * 1.6 + Math.random() * (LARG - raio * 3.2);
      const y = raio * 1.2 + Math.random() * (ALT - raio * 2.4);
      if (regioes.every(g => g.cx == null || Math.hypot(g.cx - x, g.cy - y) > (g.raio + raio) * 1.5)) {
        cx = x; cy = y; break;
      }
    }
    try {
      const res = await api.post('/regioes', {
        campaign_id: campanha, nome: nome.trim(),
        cx: +cx.toFixed(2), cy: +cy.toFixed(2), raio,
        semente: Math.floor(Math.random() * 1000000),
        ambiente: 'floresta',
      });
      const nova = { ambiente: 'floresta', ...res.data.data, descoberta: true, descricao: '', subtitulo: '' };
      setRegioes(rs => [...rs, nova]);
      abrirRegiao(nova);
    } catch { alert('Erro ao criar a terra.'); }
  }

  function abrirRegiao(g) {
    setRegiaoAberta(g.id);
    setLocalAberto(null);
    setNomeEdit(g.nome || '');
    setDescEdit(g.descricao || '');
  }

  function abrirLocal(id) {
    setLocalAberto(id);
    setRegiaoAberta(null);
  }

  async function salvarNome() {
    const nome = nomeEdit.trim();
    if (!nome) return;
    ajustarLocal(regiaoAberta, { nome });
    await salvarCampos(regiaoAberta, { nome });
  }

  async function salvarDescricao() {
    ajustarLocal(regiaoAberta, { descricao: descEdit });
    await salvarCampos(regiaoAberta, { descricao: descEdit });
  }

  async function embaralhar() {
    const semente = Math.floor(Math.random() * 1000000);
    ajustarLocal(regiaoAberta, { semente });
    await salvarCampos(regiaoAberta, { semente });
  }

  async function trocarAmbiente(ambiente) {
    ajustarLocal(regiaoAberta, { ambiente });
    await salvarCampos(regiaoAberta, { ambiente });
  }

  // liga um local à terra e importa descrição e subtítulo dele
  async function vincularLocal(regiaoId, localId) {
    if (!regiaoId || !localId) return;
    const l = pins.find(p => p.id === localId);
    ajustarLocal(regiaoId, { local_id: localId, descricao: l?.descricao || '', subtitulo: l?.subtitulo || '' });
    await salvarCampos(regiaoId, { local_id: localId });
  }

  async function escolherFoto(url) {
    ajustarLocal(regiaoAberta, { imagem_url: url });
    await salvarCampos(regiaoAberta, { imagem_url: url });
    setGaleria(false);
  }

  async function removerFoto() {
    ajustarLocal(regiaoAberta, { imagem_url: null });
    await salvarCampos(regiaoAberta, { imagem_url: '' });
  }

  async function apagarRegiao(id) {
    if (!(await confirmar('Apagar esta terra? Os locais continuam existindo.'))) return;
    try {
      await api.delete(`/regioes/${id}`);
      setRegioes(rs => rs.filter(g => g.id !== id));
      setPins(ps => ps.map(p => (p.regiao_id === id ? { ...p, regiao_id: null } : p)));
      setRegiaoAberta(null);
    } catch { alert('Erro ao apagar a terra.'); }
  }

  async function gerarComIA() {
    const contexto = window.prompt('Contexto opcional (clima, cultura, tom):') ?? '';
    setGerando(true);
    try {
      const res = await api.post(`/regioes/${regiaoAberta}/gerar`, { contexto });
      setDescEdit(res.data.descricao);
      ajustarLocal(regiaoAberta, { descricao: res.data.descricao });
      setPins(ps => [...ps, ...res.data.cidades.map(c => ({
        id: c.id, nome: c.name, subtitulo: 'Cidade', descricao: c.description,
        x: null, y: null, regiao_id: regiaoAberta,
      }))]);
    } catch { alert('Erro ao gerar com IA.'); }
    setGerando(false);
  }

  // ---------- locais (pins) ----------

  async function salvarLocalDaTerra() {
    if (!localDaTerra || !form) return;
    setSalvandoLocal(true);
    const campos = { ...form, faction_id: form.faction_id || null };
    try {
      await api.patch(`/locations/${localDaTerra.id}`, campos);
      setLocaisFull(ls => ls.map(l => (l.id === localDaTerra.id ? { ...l, ...campos } : l)));
      setPins(ps => ps.map(p => (p.id === localDaTerra.id ? { ...p, descricao: form.description } : p)));
      ajustarLocal(regiao.id, { descricao: form.description });
    } catch { alert('Erro ao salvar as alterações.'); }
    setSalvandoLocal(false);
  }

  async function vincularRegiaoAoLocal(localId, regiaoId) {
    if (!regiaoId) return;
    try {
      await api.patch(`/locations/${localId}`, { regiao_id: regiaoId });
      setPins(ps => ps.map(p => (p.id === localId ? { ...p, regiao_id: regiaoId } : p)));
    } catch { alert('Erro ao vincular o local.'); }
  }

  // ---------- cliques e arrasto no mapa ----------

  function pontoNoMundo(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 100;    // % da largura
    const py = ((e.clientY - r.top) / r.height) * 100;    // % da altura
    return { px, py, x: px, y: (py / 100) * ALT };        // x/y em unidades do SVG
  }

  function iniciarArrasto(e) {
    if (!movendo) return;
    const t = regioes.find(g => g.id === movendo);
    if (!t) return;
    const { x, y } = pontoNoMundo(e);
    const sobreATerra = dentro([x, y], formaDe(t));
    arrasto.current = {
      id: t.id, cx0: t.cx, cy0: t.cy,
      ox: sobreATerra ? t.cx - x : 0,      // pegou na terra: mantém o ponto de agarre
      oy: sobreATerra ? t.cy - y : 0,      // clicou fora: o centro pula pro cursor
      pins0: pins.filter(p => p.regiao_id === t.id && p.x != null).map(p => ({ id: p.id, x: p.x, y: p.y })),
      moveu: false, cx: t.cx, cy: t.cy,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    moverArrasto(e);
  }

  function moverArrasto(e) {
    const a = arrasto.current;
    if (!a) return;
    const { x, y } = pontoNoMundo(e);
    const cx = +Math.min(LARG - 1, Math.max(1, x + a.ox)).toFixed(2);
    const cy = +Math.min(ALT - 1, Math.max(1, y + a.oy)).toFixed(2);
    a.moveu = true; a.cx = cx; a.cy = cy;
    const dx = cx - a.cx0;
    const dy = ((cy - a.cy0) / ALT) * 100;
    ajustarLocal(a.id, { cx, cy });
    setPins(ps => ps.map(p => {
      const o = a.pins0.find(q => q.id === p.id);
      return o ? { ...p, x: +(o.x + dx).toFixed(2), y: +(o.y + dy).toFixed(2) } : p;
    }));
  }

  async function soltarArrasto() {
    const a = arrasto.current;
    arrasto.current = null;
    if (!a) return;
    setMovendo(null);
    if (!a.moveu) return;
    const dx = a.cx - a.cx0;
    const dy = ((a.cy - a.cy0) / ALT) * 100;
    await salvarCampos(a.id, { cx: a.cx, cy: a.cy });
    await Promise.all(a.pins0.map(o =>
      api.patch(`/locations/${o.id}`, {
        pin_x: +(o.x + dx).toFixed(2), pin_y: +(o.y + dy).toFixed(2),
      }).catch(() => {})
    ));
  }

  async function aoClicarNoMundo(e) {
    if (!editando) return;
    const { px, py, x: sx, y: sy } = pontoNoMundo(e);
    const id = editando;
    const alvo = [...ordem].reverse().find(g => dentro([sx, sy], formaDe(g)));  // terra de cima primeiro
    const campos = { pin_x: +px.toFixed(2), pin_y: +py.toFixed(2) };
    if (alvo) campos.regiao_id = alvo.id;
    try {
      await api.patch(`/locations/${id}`, campos);
      setPins(ps => ps.map(l => (l.id === id
        ? { ...l, x: campos.pin_x, y: campos.pin_y, ...(alvo ? { regiao_id: alvo.id } : {}) }
        : l)));
      setLocalAberto(id);
      setRegiaoAberta(null);
      setEditando(null);
    } catch { alert('Erro ao salvar a posição.'); return; }

    // caiu numa terra que ainda não tem local: oferece importar as informações dele
    if (alvo && !alvo.local_id) {
      const l = pins.find(p => p.id === id);
      if (await confirmar(`Usar "${l?.nome}" como descrição da terra "${alvo.nome}"?`)) {
        await vincularLocal(alvo.id, id);
      }
    }
  }

  // ---------- derivados ----------

  const terras = regioes.filter(g => g.cx != null);
  const noMapa = pins.filter(p => p.x != null && p.y != null);
  const semPosicao = pins.filter(p => p.x == null || p.y == null);
  const local = pins.find(p => p.id === localAberto);
  const regiao = regioes.find(g => g.id === regiaoAberta);
  const localDaTerra = regiao?.local_id ? locaisFull?.find(l => l.id === regiao.local_id) : null;
  const mudou = !!(form && localDaTerra && CHAVES_LOCAL.some(k => (form[k] ?? '') !== (localDaTerra[k] ?? '')));
  const modoClique = !!(movendo || editando);
  const emModo = !!(movendo || editando || escolhendo);
  const tilt = inclinado && !modoClique;
  const painelAberto = !!(regiao || local);
  const prioridade = g => (regiaoAberta === g.id ? 2 : hoverId === g.id ? 1 : 0);
  // quem está atrás é desenhado primeiro, e a terra levantada fica por cima
  const ordem = [...terras].sort((a, b) => prioridade(a) - prioridade(b) || a.cy - b.cy);
  const aviso = movendo ? 'ARRASTE A TERRA PARA O NOVO LUGAR'
    : editando ? 'CLIQUE NO MAPA PARA POSICIONAR'
    : escolhendo ? 'CLIQUE NO 📍 QUE DESCREVE ESTA TERRA' : null;

  useEffect(() => {
    setForm(localDaTerra ? formDe(localDaTerra) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localDaTerra?.id, locaisFull]);

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0] page-fade" style={crimson}>
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#c8a84b20]">
        <LogoTaverna />
        <button onClick={() => navigate(-1)} style={cinzel}
          className="text-[#9a8e78] text-sm hover:text-[#c8a84b] transition-colors">← Voltar</button>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <p style={cinzel} className="text-[#b07050] text-xs tracking-[4px] mb-2 opacity-70">O IMPÉRIO</p>
        <h1 style={cinzel} className="text-2xl text-[#f0e8d8] font-semibold mb-6">Atlas</h1>

        <div className="flex flex-wrap gap-2 mb-4">
          {isMestre && (
            <button onClick={criarTerra}
              className={`${btn} border-[#c8a84b30] text-[#c8a84b] hover:bg-[#c8a84b10]`}
              style={{ ...cinzel, ...radius }}>
              ＋ Nova terra
            </button>
          )}
          {terras.length > 0 && (
            <button onClick={() => setInclinado(v => !v)}
              className={`${btn} ${inclinado ? 'border-[#c8a84b] text-[#c8a84b]' : 'border-[#c8a84b30] text-[#9a8e78]'}`}
              style={{ ...cinzel, ...radius }}>
              🧊 {inclinado ? 'Mapa plano' : 'Inclinar mapa'}
            </button>
          )}
          {emModo && (
            <button onClick={cancelarModos}
              className={`${btn} border-red-600 text-red-600`} style={{ ...cinzel, ...radius }}>
              ✕ Cancelar
            </button>
          )}
        </div>

        <div className={painelAberto ? 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] items-start' : ''}>
          {/* ---------- mapa ---------- */}
          <div className="min-w-0">
            {carregado && terras.length === 0 && (
              <p className="text-[#8a7e68] text-sm text-center py-12">
                {isMestre ? 'Nenhuma terra ainda. Clique em "Nova terra".' : 'O mundo ainda é um mistério.'}
              </p>
            )}

            {terras.length > 0 && (
              <div style={{ perspective: '1400px', padding: tilt ? '2rem 0 3rem' : 0, transition: 'padding 0.6s ease' }}>
                <div className="relative w-full border border-[#c8a84b30]"
                  style={{
                    ...radius,
                    aspectRatio: '16 / 9',
                    background: 'radial-gradient(ellipse at 50% 40%, #12262c 0%, #0b161a 70%, #080d10 100%)',
                    cursor: movendo ? 'grab' : editando ? 'crosshair' : 'default',
                    touchAction: movendo ? 'none' : 'auto',
                    transformStyle: 'preserve-3d',
                    transform: tilt ? `rotateX(${INCLINACAO}deg)` : 'none',
                    transformOrigin: '50% 100%',
                    transition: 'transform 0.6s ease, box-shadow 0.6s ease',
                    boxShadow: tilt ? '0 50px 60px -20px rgba(0,0,0,0.8)' : 'none',
                  }}
                  onClick={aoClicarNoMundo}
                  onPointerDown={iniciarArrasto}
                  onPointerMove={moverArrasto}
                  onPointerUp={soltarArrasto}
                  onPointerCancel={soltarArrasto}>

                  <svg viewBox={`0 0 ${LARG} ${ALT}`} className="absolute inset-0 w-full h-full"
                    style={{ pointerEvents: modoClique ? 'none' : 'auto' }}>
                    <defs>
                      {ordem.filter(g => isMestre || g.descoberta).map(g => (
                        <FiltroTerreno key={g.id} id={`terra-${g.id}`} semente={g.semente} ambiente={g.ambiente} />
                      ))}
                    </defs>

                    {ordem.map(g => {
                      const { p, x0, y0, w, h } = geometria(g);
                      const amb = ambienteDe(g.ambiente);
                      const prof = PROF * amb.espessura;
                      const oculta = isMestre ? !descDe('regiao', g.id) : !g.descoberta;
                      const escura = oculta && !isMestre;           // o jogador só vê a silhueta
                      const clicavel = isMestre || g.descoberta;
                      const aberta = regiaoAberta === g.id;
                      const lift = aberta ? 1.4 : hoverId === g.id && clicavel ? 0.7 : 0;

                      return (
                        <g key={g.id}>
                          {/* lados da terra: camadas empilhadas, a base fica fixa e o topo sobe */}
                          {Array.from({ length: CAMADAS + 1 }, (_, i) => (
                            <polygon key={i} points={p}
                              style={{
                                fill: i === CAMADAS ? (escura ? '#0b0906' : amb.base) : (escura ? '#1d1810' : amb.lado),
                                transform: `translateY(${-lift + (i * (prof + lift)) / CAMADAS}px)`,
                                transition: 'transform 0.25s ease',
                                pointerEvents: 'none',
                              }} />
                          ))}

                          {/* topo da terra */}
                          <g style={{ transform: `translateY(${-lift}px)`, transition: 'transform 0.25s ease' }}>
                            <clipPath id={`clip-${g.id}`}><polygon points={p} /></clipPath>
                            <g clipPath={`url(#clip-${g.id})`}>
                              {escura
                                ? <rect x={x0} y={y0} width={w} height={h} fill="#1b1710" />
                                : <rect x={x0} y={y0} width={w} height={h} filter={`url(#terra-${g.id})`} />}
                            </g>
                            <polygon points={p} vectorEffect="non-scaling-stroke"
                              onClick={clicavel ? e => { e.stopPropagation(); abrirRegiao(g); } : undefined}
                              onMouseEnter={clicavel ? () => setHoverId(g.id) : undefined}
                              onMouseLeave={clicavel ? () => setHoverId(null) : undefined}
                              style={{
                                cursor: clicavel ? 'pointer' : 'default',
                                fill: oculta
                                  ? (isMestre ? 'rgba(8,10,12,0.45)' : 'rgba(8,10,12,0.78)')
                                  : aberta ? 'rgba(200,168,75,0.18)' : hoverId === g.id ? 'rgba(200,168,75,0.10)' : 'rgba(0,0,0,0)',
                                stroke: oculta ? 'rgba(200,168,75,0.25)' : amb.borda,
                                strokeWidth: aberta ? 2 : 1,
                                strokeDasharray: oculta && isMestre ? '2 1.5' : 'none',
                                pointerEvents: modoClique || !clicavel ? 'none' : 'all',
                              }} />
                            {g.nome && (!oculta || isMestre) && (
                              <text x={g.cx} y={g.cy} textAnchor="middle" dominantBaseline="middle"
                                style={{ fontFamily: "'Cinzel', serif", fontSize: 2.2, fill: '#f0e8d8',
                                         stroke: '#0f0e0c', strokeWidth: 0.5, paintOrder: 'stroke',
                                         pointerEvents: 'none', opacity: oculta ? 0.6 : 1 }}>
                                {g.nome}
                              </text>
                            )}
                          </g>
                        </g>
                      );
                    })}
                  </svg>

                  {/* pins dos locais: em pé mesmo com o mapa inclinado */}
                  {noMapa.map(p => (
                    <button key={p.id} title={p.nome}
                      onClick={e => {
                        e.stopPropagation();
                        if (escolhendo) { vincularLocal(escolhendo, p.id); setEscolhendo(null); return; }
                        if (!modoClique) abrirLocal(p.id);
                      }}
                      className="absolute text-2xl leading-none"
                      style={{
                        left: `${p.x}%`, top: `${p.y}%`,
                        transform: `translate(-50%, -100%) rotateX(${tilt ? -INCLINACAO : 0}deg)`,
                        transformOrigin: '50% 100%',
                        transition: movendo ? 'none' : 'transform 0.6s ease',
                        filter: localAberto === p.id ? 'drop-shadow(0 0 6px #c8a84b)' : 'drop-shadow(0 1px 2px #000)',
                      }}>
                      📍
                    </button>
                  ))}

                  {aviso && (
                    <p style={cinzel}
                      className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#0f0e0c] border border-[#c8a84b] text-[#c8a84b] text-xs px-3 py-1 pointer-events-none whitespace-nowrap">
                      {aviso}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ---------- painel lateral ---------- */}
          {painelAberto && (
            <aside className="space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
              {/* card da terra */}
              {regiao && (
                <div className="border border-[#c8a84b30] bg-[#161410] p-4 space-y-4" style={radius}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p style={cinzel} className="text-[#f0e8d8] text-lg">{regiao.nome}</p>
                      {regiao.subtitulo && <p className="text-[#8a7e68] text-xs mt-1">{regiao.subtitulo}</p>}
                      <p className="text-[#6a6050] text-xs mt-1">
                        {ambienteDe(regiao.ambiente).emoji} {ambienteDe(regiao.ambiente).label}
                      </p>
                    </div>
                    {isMestre && (
                      <div className="flex gap-2 items-center flex-wrap">
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

                  {regiao.imagem_url && (
                    <img src={regiao.imagem_url} alt={regiao.nome}
                      className="w-full aspect-video object-cover border border-[#c8a84b20]" style={radius} />
                  )}

                  {regiao.local_id && isMestre && form ? (
                    <div className="space-y-3">
                      <div>
                        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-1">DESCRIÇÃO</p>
                        <textarea value={form.description} rows={5} aria-label="Descrição"
                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                          className={campo} style={radius} />
                      </div>
                      {CAMPOS_LOCAL.map(({ chave, label }) => (
                        <div key={chave}>
                          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-1">{label}</p>
                          <textarea value={form[chave]} rows={chave === 'quests' ? 6 : 4} aria-label={label}
                            onChange={e => setForm(f => ({ ...f, [chave]: e.target.value }))}
                            className={campo} style={radius} />
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-1">IDIOMA</p>
                          <input value={form.language} aria-label="Idioma"
                            onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                            className={campo} style={radius} />
                        </div>
                        <div>
                          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-1">NÍVEL MÉDIO</p>
                          <input value={form.avg_level} aria-label="Nível médio"
                            onChange={e => setForm(f => ({ ...f, avg_level: e.target.value }))}
                            className={campo} style={radius} />
                        </div>
                      </div>
                      <div>
                        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-1">FACÇÃO CONTROLADORA</p>
                        <select value={form.faction_id} aria-label="Facção controladora"
                          onChange={e => setForm(f => ({ ...f, faction_id: e.target.value }))}
                          className={campo} style={radius}>
                          <option value="">Nenhuma</option>
                          {faccoes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-3 sticky bottom-0 bg-[#161410] py-2">
                        <button onClick={salvarLocalDaTerra} disabled={!mudou || salvandoLocal}
                          className={`${btn} border-[#c8a84b] text-[#c8a84b] hover:bg-[#c8a84b10]`}
                          style={{ ...cinzel, ...radius }}>
                          {salvandoLocal ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                        {mudou && <span className="text-[#8a7e68] text-xs">Alterações não salvas</span>}
                      </div>
                    </div>
                  ) : regiao.local_id ? (
                    <div>
                      <p className="text-[#9a8e78] text-sm leading-relaxed font-light max-h-44 overflow-y-auto pr-1">{regiao.descricao}</p>
                      {isMestre && <p className="text-[#6a6050] text-xs mt-2">
                        {locaisFull === null ? 'Carregando informações do local...' : 'Não achei o local ligado a esta terra.'}
                      </p>}
                    </div>
                  ) : isMestre ? (
                    <div>
                      <textarea value={descEdit} onChange={e => setDescEdit(e.target.value)} rows={4}
                        placeholder="Descreva a terra ou ligue um local abaixo..." aria-label="Descrição da terra"
                        className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full text-sm focus:outline-none focus:border-[#c8a84b50] placeholder-[#3a3020] resize-none"
                        style={radius} />
                      <button onClick={salvarDescricao} disabled={descEdit === (regiao.descricao || '')}
                        className={`${btn} mt-2 border-[#c8a84b30] text-[#c8a84b]`} style={{ ...cinzel, ...radius }}>
                        Salvar descrição
                      </button>
                    </div>
                  ) : (
                    regiao.descricao && <p className="text-[#9a8e78] text-sm leading-relaxed font-light max-h-44 overflow-y-auto pr-1">{regiao.descricao}</p>
                  )}

                  {isMestre && (
                    <div className="border-t border-[#c8a84b10] pt-3 space-y-3">
                      <p style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px]">AJUSTES DA TERRA</p>

                      <div className="flex flex-wrap items-center gap-2">
                        <label style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] w-full">AMBIENTE</label>
                        {Object.entries(AMBIENTES).map(([chave, a]) => (
                          <button key={chave} onClick={() => trocarAmbiente(chave)} title={a.label}
                            className={`${btn} ${(regiao.ambiente || 'floresta') === chave
                              ? 'border-[#c8a84b] text-[#c8a84b] bg-[#c8a84b10]'
                              : 'border-[#c8a84b20] text-[#9a8e78] hover:text-[#c8a84b]'}`}
                            style={{ ...cinzel, ...radius }}>
                            {a.emoji} {a.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setGaleria(true)}
                          className={`${btn} border-[#c8a84b30] text-[#c8a84b]`} style={{ ...cinzel, ...radius }}>
                          🖼 {regiao.imagem_url ? 'Trocar foto' : 'Foto da Galeria'}
                        </button>
                        {regiao.imagem_url && (
                          <button onClick={removerFoto}
                            className={`${btn} border-[#c8a84b20] text-[#9a8e78]`} style={{ ...cinzel, ...radius }}>
                            Remover foto
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input value={nomeEdit} onChange={e => setNomeEdit(e.target.value)} aria-label="Nome da terra"
                          className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-1 flex-1 min-w-0 text-sm focus:outline-none focus:border-[#c8a84b50]"
                          style={radius} />
                        <button onClick={salvarNome} disabled={!nomeEdit.trim() || nomeEdit.trim() === regiao.nome}
                          className={`${btn} border-[#c8a84b30] text-[#c8a84b]`} style={{ ...cinzel, ...radius }}>
                          Salvar nome
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <label style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px]">TAMANHO</label>
                        <input type="range" min="3" max="22" step="0.5" value={regiao.raio || 8}
                          onChange={e => ajustarLocal(regiao.id, { raio: Number(e.target.value) })}
                          onPointerUp={e => salvarCampos(regiao.id, { raio: Number(e.target.value) })}
                          onKeyUp={e => salvarCampos(regiao.id, { raio: Number(e.target.value) })}
                          aria-label="Tamanho da terra" />
                        <button onClick={() => { setMovendo(regiao.id); setEditando(null); setEscolhendo(null); }}
                          className={`${btn} border-[#c8a84b30] text-[#c8a84b]`} style={{ ...cinzel, ...radius }}>↔ Mover</button>
                        <button onClick={embaralhar}
                          className={`${btn} border-[#c8a84b30] text-[#c8a84b]`} style={{ ...cinzel, ...radius }}>🎲 Nova forma</button>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <label style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] w-full">LOCAL QUE DESCREVE ESTA TERRA</label>
                        <select value={regiao.local_id || ''} onChange={e => vincularLocal(regiao.id, e.target.value)}
                          className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#9a8e78] px-2 py-1 text-xs focus:outline-none min-w-0 flex-1"
                          style={radius}>
                          <option value="">— escolher —</option>
                          {pins.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                        <button onClick={() => { setEscolhendo(regiao.id); setMovendo(null); setEditando(null); }}
                          className={`${btn} border-[#c8a84b30] text-[#c8a84b]`} style={{ ...cinzel, ...radius }}>
                          📍 Escolher no mapa
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* card do local */}
              {local && (
                <div className="border border-[#c8a84b30] bg-[#161410] p-4" style={radius}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
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
                        <button onClick={() => { setEditando(local.id); setMovendo(null); setEscolhendo(null); }}
                          className={`${btn} border-[#c8a84b30] text-[#c8a84b] hover:bg-[#c8a84b10]`}
                          style={{ ...cinzel, ...radius }}>📍 Posicionar</button>
                      </div>
                    )}
                  </div>
                  {local.descricao && (
                    <p className="text-[#9a8e78] text-sm leading-relaxed font-light mt-3 max-h-48 overflow-y-auto pr-1">{local.descricao}</p>
                  )}

                  {isMestre && terras.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#c8a84b10]">
                      <label style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] mr-2">TERRA</label>
                      <select value={local.regiao_id || ''} onChange={e => vincularRegiaoAoLocal(local.id, e.target.value)}
                        className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#9a8e78] px-2 py-1 text-xs focus:outline-none"
                        style={radius}>
                        <option value="">— escolher —</option>
                        {terras.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </aside>
          )}
        </div>

        {/* locais sem posição (mestre) */}
        {isMestre && terras.length > 0 && semPosicao.length > 0 && (
          <div className="mt-6">
            <p style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] mb-2">LOCAIS SEM POSIÇÃO NO MAPA</p>
            <div className="flex flex-wrap gap-2">
              {semPosicao.map(p => (
                <button key={p.id} onClick={() => { setEditando(p.id); setMovendo(null); setEscolhendo(null); }}
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
        <SeletorGaleria campanhaId={campanha} soMapasInicial={false}
          onEscolher={escolherFoto} onFechar={() => setGaleria(false)} />
      )}
    </div>
  );
}