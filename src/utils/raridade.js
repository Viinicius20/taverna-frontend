const MAPA = {
  comum: 'comum', common: 'comum',
  incomum: 'incomum', uncommon: 'incomum',
  raro: 'raro', rare: 'raro',
  'muito raro': 'epico', 'very rare': 'epico', epico: 'epico', epic: 'epico',
  lendario: 'lendario', legendary: 'lendario', artefato: 'lendario', artifact: 'lendario',
};

export function normalizarRaridade(valor) {
  const chave = String(valor ?? '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return MAPA[chave] || 'comum';
}

export const ROTULO_RARIDADE = {
  comum: 'Comum', incomum: 'Incomum', raro: 'Raro', epico: 'Muito raro', lendario: 'Lendário',
};