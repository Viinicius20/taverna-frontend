import { useState } from 'react';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };

const DADOS = [
  { tipo: 'd4', lados: 4, symbol: '⬦' },
  { tipo: 'd6', lados: 6, symbol: '⬡' },
  { tipo: 'd8', lados: 8, symbol: '◈' },
  { tipo: 'd10', lados: 10, symbol: '◉' },
  { tipo: 'd12', lados: 12, symbol: '✦' },
  { tipo: 'd20', lados: 20, symbol: '★' },
  { tipo: 'd100', lados: 100, symbol: '◎' },
];

function rolar(lados) {
  return Math.floor(Math.random() * lados) + 1;
}

let dadoAudio = null;

function tocarSomDado() {
  if (dadoAudio) {
    dadoAudio.pause();
    dadoAudio.currentTime = 0;
  }
  dadoAudio = new Audio('/dice.wav');
  dadoAudio.volume = 0.6;
  dadoAudio.play();
}
export default function Dados({ secreto = false }) {
  const [historico, setHistorico] = useState([]);
  const [rolando, setRolando] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [modificador, setModificador] = useState(0);
  const [ultimoResultado, setUltimoResultado] = useState(null);

  async function rolarDado(dado) {
    tocarSomDado();
    setRolando(dado.tipo);
    setUltimoResultado(null);

    // Animação de 600ms
    await new Promise(r => setTimeout(r, 600));

    const resultados = Array.from({ length: quantidade }, () => rolar(dado.lados));
    const soma = resultados.reduce((a, b) => a + b, 0);
    const total = soma + modificador;

    const entrada = {
      id: Date.now(),
      dado: dado.tipo,
      lados: dado.lados,
      quantidade,
      modificador,
      resultados,
      soma,
      total,
      critico: dado.lados === 20 && resultados.includes(20),
      falha: dado.lados === 20 && resultados.includes(1),
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      secreto,
    };

    setUltimoResultado(entrada);
    setHistorico(prev => [entrada, ...prev].slice(0, 20));
    setRolando(null);
  }

  function limpar() {
    setHistorico([]);
    setUltimoResultado(null);
  }

  return (
    <div style={crimson}>

      {/* CONTROLES */}
      <div className="flex items-center gap-6 mb-6 flex-wrap">
        <div>
          <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">QUANTIDADE</label>
          <div className="flex items-center gap-2">
            <button onClick={() => setQuantidade(q => Math.max(1, q - 1))}
              className="border border-[#c8a84b30] text-[#c8a84b] w-8 h-8 hover:bg-[#c8a84b15] transition-colors"
              style={{ borderRadius: '2px' }}>−</button>
            <span style={cinzel} className="text-[#f0e8d8] text-lg w-6 text-center">{quantidade}</span>
            <button onClick={() => setQuantidade(q => Math.min(10, q + 1))}
              className="border border-[#c8a84b30] text-[#c8a84b] w-8 h-8 hover:bg-[#c8a84b15] transition-colors"
              style={{ borderRadius: '2px' }}>+</button>
          </div>
        </div>

        <div>
          <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">MODIFICADOR</label>
          <div className="flex items-center gap-2">
            <button onClick={() => setModificador(m => m - 1)}
              className="border border-[#c8a84b30] text-[#c8a84b] w-8 h-8 hover:bg-[#c8a84b15] transition-colors"
              style={{ borderRadius: '2px' }}>−</button>
            <span style={cinzel} className="text-[#f0e8d8] text-lg w-10 text-center">
              {modificador >= 0 ? '+' : ''}{modificador}
            </span>
            <button onClick={() => setModificador(m => m + 1)}
              className="border border-[#c8a84b30] text-[#c8a84b] w-8 h-8 hover:bg-[#c8a84b15] transition-colors"
              style={{ borderRadius: '2px' }}>+</button>
          </div>
        </div>

        {secreto && (
          <div className="border border-[#8a503020] bg-[#8a503010] px-3 py-2">
            <p style={cinzel} className="text-[#8a5030] text-xs tracking-widest">🔒 ROLAGEM SECRETA</p>
            <p className="text-[#4a3020] text-xs font-light">Só você vê</p>
          </div>
        )}
      </div>

      {/* DADOS */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {DADOS.map(dado => (
          <button key={dado.tipo} onClick={() => rolarDado(dado)}
            disabled={rolando !== null}
            className="flex flex-col items-center gap-2 py-4 border border-[#c8a84b20] bg-[#161410] hover:bg-[#1c1a16] hover:border-[#c8a84b50] transition-all disabled:opacity-50 relative overflow-hidden group"
            style={{ borderRadius: '2px' }}>
            {rolando === dado.tipo && (
              <div className="absolute inset-0 bg-[#c8a84b10] animate-pulse" />
            )}
            <span className={`text-2xl transition-transform ${rolando === dado.tipo ? 'animate-spin' : 'group-hover:scale-110'}`}
              style={{ color: '#c8a84b' }}>
              {dado.symbol}
            </span>
            <span style={cinzel} className="text-[#6a6050] text-xs tracking-widest">{dado.tipo}</span>
          </button>
        ))}
      </div>

      {/* RESULTADO ATUAL */}
      {ultimoResultado && (
        <div className={`border px-6 py-5 mb-6 text-center transition-all ${
          ultimoResultado.critico
            ? 'border-[#c8a84b] bg-[#c8a84b10]'
            : ultimoResultado.falha
            ? 'border-red-900 bg-red-950 bg-opacity-30'
            : 'border-[#c8a84b20] bg-[#161410]'
        }`}>
          {ultimoResultado.critico && (
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2">⚔ CRÍTICO!</p>
          )}
          {ultimoResultado.falha && (
            <p style={cinzel} className="text-red-500 text-xs tracking-[4px] mb-2">✕ FALHA CRÍTICA</p>
          )}

          <div className="flex items-center justify-center gap-3 mb-2 flex-wrap">
            <span style={cinzel} className="text-[#4a4030] text-sm">
              {ultimoResultado.quantidade}{ultimoResultado.dado}
              {ultimoResultado.modificador !== 0 ? (ultimoResultado.modificador > 0 ? `+${ultimoResultado.modificador}` : ultimoResultado.modificador) : ''}
            </span>
            <span className="text-[#4a4030]">=</span>
            <span style={cinzel} className={`text-5xl font-bold ${
              ultimoResultado.critico ? 'text-[#c8a84b]' : ultimoResultado.falha ? 'text-red-500' : 'text-[#f0e8d8]'
            }`}>
              {ultimoResultado.total}
            </span>
          </div>

          {ultimoResultado.resultados.length > 1 && (
            <div className="flex justify-center gap-2 flex-wrap">
              {ultimoResultado.resultados.map((r, i) => (
                <span key={i} className="border border-[#c8a84b20] text-[#6a6050] px-2 py-0.5 text-sm"
                  style={{ borderRadius: '2px', ...cinzel }}>
                  {r}
                </span>
              ))}
              {ultimoResultado.modificador !== 0 && (
                <span className="text-[#4a4030] text-sm self-center">
                  {ultimoResultado.modificador > 0 ? `+${ultimoResultado.modificador}` : ultimoResultado.modificador}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* HISTÓRICO */}
      {historico.length > 0 && (
        <div className="border border-[#c8a84b15] bg-[#161410]">
          <div className="px-4 py-3 border-b border-[#c8a84b10] flex items-center justify-between">
            <p style={cinzel} className="text-[#4a4030] text-xs tracking-[3px]">HISTÓRICO</p>
            <button onClick={limpar} style={cinzel}
              className="text-[#3a3020] text-xs hover:text-[#6a6050] transition-colors tracking-widest">
              Limpar
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {historico.map(h => (
              <div key={h.id} className={`flex items-center justify-between px-4 py-2 border-b border-[#c8a84b08] ${
                h.critico ? 'bg-[#c8a84b05]' : h.falha ? 'bg-red-950 bg-opacity-20' : ''
              }`}>
                <div className="flex items-center gap-3">
                  <span style={cinzel} className="text-[#4a4030] text-xs">{h.hora}</span>
                  <span style={cinzel} className="text-[#6a6050] text-xs">
                    {h.quantidade}{h.dado}
                    {h.modificador !== 0 ? (h.modificador > 0 ? `+${h.modificador}` : h.modificador) : ''}
                  </span>
                  {h.resultados.length > 1 && (
                    <span className="text-[#3a3020] text-xs">
                      [{h.resultados.join(', ')}]
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {h.critico && <span className="text-[#c8a84b] text-xs">★</span>}
                  {h.falha && <span className="text-red-600 text-xs">✕</span>}
                  <span style={cinzel} className={`text-base font-bold ${
                    h.critico ? 'text-[#c8a84b]' : h.falha ? 'text-red-500' : 'text-[#f0e8d8]'
                  }`}>{h.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}