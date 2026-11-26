import { getCampanhaId } from './campanha';

function chave(gancho) {
  const usuario = JSON.parse(localStorage.getItem('taverna_user'));
  if (usuario?.role !== 'mestre') return null;
  return JSON.stringify([
    'ganchos-sessao-zero', usuario.id || usuario.username,
    getCampanhaId(), gancho.personagemId, gancho.campo,
  ]);
}

export function registrosDoGancho(gancho) {
  try {
    const id = chave(gancho);
    const registros = id && JSON.parse(localStorage.getItem(id));
    return Array.isArray(registros) ? registros : [];
  } catch {
    return [];
  }
}

export function registrarUsoDoGancho(gancho, rota) {
  try {
    const id = chave(gancho);
    if (id) {
      const rotas = [...new Set([...registrosDoGancho(gancho), rota])];
      localStorage.setItem(id, JSON.stringify(rotas));
    }
  } catch {
    // O registro já foi salvo pela API.
  }
}

export function focarRegistro(elemento) {
  if (elemento && window.location.hash === '#' + elemento.id) {
    elemento.scrollIntoView({ block: 'start' });
  }
}