const PADRAO = '00000000-0000-0000-0000-000000000001';
const CHAVE = 'campanha_ativa';

export function getCampanhaId() {
  try { return localStorage.getItem(CHAVE) || PADRAO; } catch { return PADRAO; }
}

export function setCampanhaAtiva(id) {
  try { localStorage.setItem(CHAVE, id); } catch {}
  window.location.reload();
}