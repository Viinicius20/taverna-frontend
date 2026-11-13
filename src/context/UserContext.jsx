import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { setToken, clearToken, getToken } from '../services/token';

const UserContext = createContext(null);

const detectaSenha = x => JSON.stringify(x ?? '').includes('SENHA_NECESSARIA');
const detectaDefinir = x => JSON.stringify(x ?? '').includes('DEFINIR_SENHA');

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [carregandoUser, setCarregandoUser] = useState(true);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem('taverna_user');
      if (salvo && getToken()) setUser(JSON.parse(salvo));
      else if (salvo) localStorage.removeItem('taverna_user');
    } catch { /* dado corrompido: segue deslogado */ }
    setCarregandoUser(false);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    try { localStorage.removeItem('taverna_user'); } catch { /* nada a limpar */ }
  }, []);

  useEffect(() => {
    window.addEventListener('taverna:sessao-expirada', logout);
    return () => window.removeEventListener('taverna:sessao-expirada', logout);
  }, [logout]);

  async function login(username, senha) {
    const precisa = () => Object.assign(new Error('Senha necessária'), { precisaSenha: true });
    let res;
    try {
      res = await api.post('/profiles/login', { username, password: senha || undefined });
    } catch (err) {
      if (detectaSenha(err.response?.data)) throw precisa();
      if (detectaDefinir(err.response?.data)) {
        throw Object.assign(new Error('Definir senha'), { definirSenha: true });
      }
      throw err;
    }
    if (detectaSenha(res.data)) throw precisa();

    const userData = res.data.data;
    const token = res.data.token || res.data.data?.token;
    if (token) setToken(token); else clearToken();
    setUser(userData);
    try { localStorage.setItem('taverna_user', JSON.stringify(userData)); } catch { /* segue sem salvar */ }
    return userData;
  }

  async function definirSenha(username, senha) {
  const res = await api.post('/profiles/definir-senha', { username, password: senha });
  const userData = res.data.data;
  const token = res.data.token;
  if (token) setToken(token); else clearToken();
  setUser(userData);
  try { localStorage.setItem('taverna_user', JSON.stringify(userData)); } catch { /* segue sem salvar */ }
  return userData;
}

  return (
    <UserContext.Provider value={{ user, login, definirSenha, logout, carregandoUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);