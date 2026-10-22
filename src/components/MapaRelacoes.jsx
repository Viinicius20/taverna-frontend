import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { VINCULOS } from '../constants/vinculos';

const cinzel = { fontFamily: "'Cinzel', serif" };

const COR_TIPO = { npc: '#c8a84b', faction: '#a86aa8', location: '#6a9a8a', character: '#7ab8d4' };
const NOME_TIPO = { npc: 'NPCs', faction: 'Facções', location: 'Locais', character: 'Jogadores' };

// a biblioteca troca source/target por objetos depois de desenhar
const idDe = x => (typeof x === 'object' ? x.id : x);

function corScore(score) {
  if (score == null) return '#4a4030';
  if (score >= 50) return '#4a8a4a';
  if (score <= -50) return '#c84b4b';
  return '#8a8070';
}

export default function MapaRelacoes({ grafo }) {
  const caixa = useRef(null);
  const [largura, setLargura] = useState(600);
  const [visiveis, setVisiveis] = useState({ npc: true, faction: true, location: true, character: true });
  const [selecionado, setSelecionado] = useState(null);
  const fg = useRef(null);
  const ajustar = useRef(true);

  useEffect(() => {
    if (!caixa.current) return undefined;
    const obs = new ResizeObserver(([e]) => setLargura(Math.floor(e.contentRect.width)));
    obs.observe(caixa.current);
    return () => obs.disconnect();
  }, []);

  const nomes = useMemo(() => Object.fromEntries(grafo.nos.map(n => [n.id, n.label])), [grafo]);

  const dados = useMemo(() => {
    const nodes = grafo.nos.filter(n => visiveis[n.tipo]).map(n => ({ ...n }));
    const ids = new Set(nodes.map(n => n.id));
    const links = grafo.arestas
      .filter(a => ids.has(a.source) && ids.has(a.target))
      .map(a => ({ ...a }));
    const grau = {};
    links.forEach(l => {
      grau[l.source] = (grau[l.source] || 0) + 1;
      grau[l.target] = (grau[l.target] || 0) + 1;
    });
    nodes.forEach(n => { n.grau = grau[n.id] || 0; });
    return { nodes, links };
  }, [grafo, visiveis]);

  const vizinhos = useMemo(() => {
    const s = new Set();
    if (!selecionado) return s;
    dados.links.forEach(l => {
      const a = idDe(l.source);
      const b = idDe(l.target);
      if (a === selecionado) s.add(b);
      if (b === selecionado) s.add(a);
    });
    return s;
  }, [dados, selecionado]);

useEffect(() => {
  ajustar.current = true;
  if (!fg.current) return;
  fg.current.d3Force('charge')?.strength(-140);
  fg.current.d3Force('link')?.distance(70);
  fg.current.d3ReheatSimulation();
}, [dados]);

useEffect(() => {
  if (selecionado && !dados.nodes.some(n => n.id === selecionado)) setSelecionado(null);
}, [dados, selecionado]);

const desenharNo = useCallback((no, ctx, escala) => {
  const raio = 5 + Math.min(5, no.grau || 0) * 0.8;
  const foco = !selecionado || no.id === selecionado || vizinhos.has(no.id);
  ctx.globalAlpha = foco ? 1 : 0.2;

    ctx.beginPath();
    ctx.arc(no.x, no.y, raio + 2.5, 0, 2 * Math.PI);
    ctx.lineWidth = 2 / escala;
    ctx.strokeStyle = corScore(no.score);   // anel = reputação
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(no.x, no.y, raio, 0, 2 * Math.PI);
    ctx.fillStyle = COR_TIPO[no.tipo];      // miolo = tipo
    ctx.fill();

  if (escala >= 0.6 || (selecionado && foco)) {
    ctx.font = `${11 / escala}px serif`;
    ctx.fillStyle = '#e8e0d0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(no.label, no.x, no.y + raio + 4 / escala);
  }
  ctx.globalAlpha = 1;
}, [selecionado, vizinhos]);

  const corLigacao = l => (selecionado && (idDe(l.source) === selecionado || idDe(l.target) === selecionado)
    ? '#c8a84b' : 'rgba(200,168,75,0.25)');

  const rotuloLigacao = (l, ctx, escala) => {
    if (!selecionado) return;
    if (idDe(l.source) !== selecionado && idDe(l.target) !== selecionado) return;
    const a = l.source;
    const b = l.target;
    if (typeof a !== 'object' || typeof b !== 'object') return;
    const x = (a.x + b.x) / 2;
    const y = (a.y + b.y) / 2;
    const texto = VINCULOS[l.kind] || l.kind;
    ctx.font = `${10 / escala}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(texto).width + 6 / escala;
    ctx.fillStyle = 'rgba(15,14,12,0.85)';
    ctx.fillRect(x - w / 2, y - 7 / escala, w, 14 / escala);
    ctx.fillStyle = '#c8a84b';
    ctx.fillText(texto, x, y);
  };

  const ligacoes = selecionado
    ? grafo.arestas.filter(a => a.source === selecionado || a.target === selecionado)
    : [];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {Object.keys(NOME_TIPO).map(t => (
          <button key={t} onClick={() => setVisiveis(v => ({ ...v, [t]: !v[t] }))}
            className="px-3 py-1 text-xs border transition-colors"
            style={{
              ...cinzel, borderRadius: '2px',
              borderColor: visiveis[t] ? COR_TIPO[t] : '#c8a84b20',
              color: visiveis[t] ? COR_TIPO[t] : '#4a4030',
            }}>
            {NOME_TIPO[t]}
          </button>
        ))}
        <button onClick={() => { ajustar.current = true; fg.current?.d3ReheatSimulation(); }}
          className="px-3 py-1 text-xs border border-[#c8a84b30] text-[#9a8e78] hover:text-[#c8a84b] transition-colors"
          style={{ ...cinzel, borderRadius: '2px' }}>
          ↻ Reorganizar
        </button>
        <span className="text-xs text-[#6a6050] ml-auto">
          anel: <span style={{ color: '#4a8a4a' }}>aliada</span> · <span style={{ color: '#8a8070' }}>neutra</span> · <span style={{ color: '#c84b4b' }}>hostil</span> · tracejado = secreto
        </span>
      </div>

      <div ref={caixa} className="border border-[#c8a84b20] bg-[#0f0e0c]" style={{ borderRadius: '2px' }}>
        <ForceGraph2D
          graphData={dados}
          width={largura}
          height={520}
          backgroundColor="#0f0e0c"
          cooldownTicks={120}
          nodeCanvasObject={desenharNo}
          nodeCanvasObjectMode={() => 'replace'}
          nodePointerAreaPaint={(no, cor, ctx) => {
            ctx.fillStyle = cor;
            ctx.beginPath();
            ctx.arc(no.x, no.y, 12, 0, 2 * Math.PI);
            ctx.fill();
          }}
          nodeLabel={n => `${n.label} (${NOME_TIPO[n.tipo]})`}
          linkColor={corLigacao}
          linkWidth={l => (corLigacao(l) === '#c8a84b' ? 2 : 1)}
          linkLineDash={l => (l.secret ? [4, 3] : null)}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          linkLabel={l => `${VINCULOS[l.kind] || l.kind}${l.note ? ` — ${l.note}` : ''}`}
          onNodeClick={no => setSelecionado(s => (s === no.id ? null : no.id))}
          onBackgroundClick={() => setSelecionado(null)}
          ref={fg}
          onEngineStop={() => {
            if (ajustar.current) { fg.current?.zoomToFit(400, 60); ajustar.current = false; }
          }}
          linkCanvasObjectMode={() => 'after'}
          linkCanvasObject={rotuloLigacao}
        />
      </div>

      {selecionado && (
        <div className="border border-[#c8a84b20] bg-[#161410] p-4 mt-3">
          <p style={cinzel} className="text-[#c8a84b] text-sm mb-2">{nomes[selecionado]}</p>
          {ligacoes.map(a => (
            <p key={a.id} className="text-xs text-[#9a8e78] mb-1">
              {nomes[a.source]} {VINCULOS[a.kind] || a.kind} {nomes[a.target]}
              {a.secret ? ' 🔒' : ''}{a.note ? ` — ${a.note}` : ''}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}