import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const salvo = localStorage.getItem('taverna_user');
    if (salvo) setUser(JSON.parse(salvo));
  }, []);

  async function login(username) {
    const res = await api.post('/profiles/login', { username });
    const userData = res.data.data;
    setUser(userData);
    localStorage.setItem('taverna_user', JSON.stringify(userData));
    return userData;
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('taverna_user');
  }

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);