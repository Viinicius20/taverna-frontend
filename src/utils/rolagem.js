const REGEX = /^(\d{0,3})d(\d{1,4})(?:([+-])(\d{1,4}))?$/;

export function parseRolagem(texto) {
  const limpo = String(texto || '').toLowerCase().replace(/\s+/g, '');
  const m = REGEX.exec(limpo);
  if (!m) return null;
  const qtd = m[1] === '' ? 1 : Number(m[1]);
  const lados = Number(m[2]);
  const mod = m[3] ? (m[3] === '-' ? -1 : 1) * Number(m[4]) : 0;
  if (qtd < 1 || qtd > 100 || lados < 2 || lados > 1000) return null;
  return { qtd, lados, mod };
}

export function formatar({ qtd, lados, mod }) {
  return `${qtd}d${lados}${mod > 0 ? `+${mod}` : mod < 0 ? mod : ''}`;
}

export function rolar(texto, aleatorio = Math.random) {
  const p = parseRolagem(texto);
  if (!p) return null;
  const dados = Array.from({ length: p.qtd }, () => Math.floor(aleatorio() * p.lados) + 1);
  const total = dados.reduce((a, b) => a + b, 0) + p.mod;
  return { expr: formatar(p), dados, mod: p.mod, total, lados: p.lados, qtd: p.qtd };
}