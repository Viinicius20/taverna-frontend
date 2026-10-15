import { useState } from "react";
import { parseRolagem, formatar, rolar } from "../utils/rolagem";

const cinzel = { fontFamily: "'Cinzel', serif" };   // copie a definição exata das suas páginas
const CHAVE = 'rolagens_rapidas';
const PADRAO = ['1d20', '1d20+5', '2d6+3', '1d100'];

function carregarSalvas() {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE));
    if (Array.isArray(bruto)) return bruto.filter(t => typeof t === 'string' && parseRolagem(t));
  } catch { /* storage indisponível ou conteúdo inválido */ }
  return PADRAO;
}

function gravar(lista) {
  try { localStorage.setItem(CHAVE, JSON.stringify(lista)); } catch { /* sem storage, segue sem salvar */ }
}

export default function RolagemRapida() {
  const [salvas, setSalvas] = useState(carregarSalvas);
  const [historico, setHistorico] = useState([]);
  const [novo, setNovo] = useState('');
  const [erro, setErro] = useState('');

  function atualizar(lista) { setSalvas(lista); gravar(lista); }

  function executar(expr) {
    const r = rolar(expr);
    if (!r) return;
    setHistorico(h => [{ ...r, id: Date.now() + Math.random() }, ...h].slice(0, 8));
  }

  function adicionar() {
    const p = parseRolagem(novo);
    if (!p) { setErro('Use NdM ou NdM+K, ex: 2d6+3'); return; }
    const expr = formatar(p);
    if (salvas.includes(expr)) { setErro('Esse botão já existe.'); return; }
    if (salvas.length >= 12) { setErro('Máximo de 12 botões.'); return; }
    atualizar([...salvas, expr]);
    setNovo(''); setErro('');
  }

  const remover = expr => atualizar(salvas.filter(s => s !== expr));

  const corTotal = r => {
    if (r.qtd === 1 && r.lados === 20) {
      if (r.dados[0] === 20) return '#c8a84b';   // crítico
      if (r.dados[0] === 1) return '#c84b4b';    // falha crítica
    }
    return '#e8e0d0';
  };
  const detalhe = r => `[${r.dados.join(' + ')}]${r.mod ? ` ${r.mod > 0 ? '+' : '−'} ${Math.abs(r.mod)}` : ''}`;
  const [ultimo, ...anteriores] = historico;

  return (
    <div className="mb-8">
      <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-3">ROLAGEM RÁPIDA</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {salvas.map(expr => (
          <span key={expr} className="inline-flex border border-[#c8a84b30]" style={{ borderRadius: '2px' }}>
            <button onClick={() => executar(expr)} style={cinzel}
              className="px-3 py-1 text-xs text-[#c8a84b] hover:bg-[#c8a84b10] transition-colors">
              {expr}
            </button>
            <button onClick={() => remover(expr)} aria-label={`Remover ${expr}`} title="Remover"
              className="px-2 text-xs text-[#8a7e68] hover:text-red-600 border-l border-[#c8a84b20]">×</button>
          </span>
        ))}
      </div>

      {ultimo && (
        <div className="border border-[#c8a84b20] bg-[#161410] px-4 py-3 mb-3" style={{ borderRadius: '2px' }}>
          <div className="flex items-baseline gap-3">
            <span style={{ ...cinzel, color: corTotal(ultimo) }} className="text-3xl font-bold">{ultimo.total}</span>
            <span style={cinzel} className="text-[#8a7e68] text-xs">{ultimo.expr}</span>
            <span className="text-[#8a7e68] text-xs">{detalhe(ultimo)}</span>
          </div>
          {anteriores.length > 0 && (
            <div className="mt-2 flex flex-col gap-0.5">
              {anteriores.map(r => (
                <p key={r.id} className="text-xs text-[#8a7e68]">
                  {r.expr} → <span style={{ color: corTotal(r) }}>{r.total}</span> <span>{detalhe(r)}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <input value={novo} onChange={e => setNovo(e.target.value)} maxLength={14}
          onKeyDown={e => { if (e.key === 'Enter') adicionar(); }}
          placeholder="Novo botão: ex 4d8+2"
          className="w-48 bg-[#161410] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-1.5 text-sm focus:outline-none focus:border-[#c8a84b50]"
          style={{ borderRadius: '2px' }} />
        <button onClick={adicionar} disabled={!novo.trim()} style={{ ...cinzel, borderRadius: '2px' }}
          className="border border-[#c8a84b40] text-[#c8a84b] px-3 py-1.5 text-xs hover:bg-[#c8a84b10] disabled:opacity-30">
          + Botão
        </button>
      </div>
      {erro && <p className="text-red-400 text-xs mt-2">{erro}</p>}
    </div>
  );
}