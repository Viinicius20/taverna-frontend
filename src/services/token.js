const CHAVE = 'taverna_token';

export function getToken() {
  try { return localStorage.getItem(CHAVE); } catch { return null; }
}
export function setToken(token) {
  try { localStorage.setItem(CHAVE, token); } catch { /* sem storage, a sessão dura até recarregar */ }
}
export function clearToken() {
  try { localStorage.removeItem(CHAVE); } catch { /* nada a limpar */ }
}