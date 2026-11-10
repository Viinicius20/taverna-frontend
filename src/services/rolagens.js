import api from './api';

function sinal(n) {
  if (n > 0) return `+${n}`;
  if (n < 0) return `${n}`;
  return '';
}

export const montarExpressao = (qtd, lados, mod = 0) => `${qtd}d${lados}${sinal(mod)}`;

export async function rolarNoServidor({ expressao, rotulo, characterId, oculta = false, modo = 'normal' }) {
  const res = await api.post('/rolagens', {
    expressao,
    rotulo,
    character_id: characterId || null,
    oculta,
    modo,
  });
  const linha = res.data.data;
  // atualiza o feed na hora, sem esperar o próximo ciclo de polling
  window.dispatchEvent(new CustomEvent('taverna:rolagem', { detail: linha }));
  return linha;
}