import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const cinzel = { fontFamily: "'Cinzel', serif" };

export default function Login() {
  const [username, setUsername] = useState('');
  const [entrando, setEntrando] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  async function handleLogin() {
    if (!username.trim()) return;
    setEntrando(true);
    try {
      const user = await login(username.trim());
      if (user.role === 'mestre') navigate('/mestre');
      else navigate('/personagens');
    } catch {
      alert('Erro ao entrar. Tente novamente.');
    }
    setEntrando(false);
  }

  return (
    <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center px-4">
      <div className="bg-[#161410] border border-[#c8a84b30] max-w-sm w-full p-8" style={{ borderRadius: '2px' }}>
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 text-center">TAVERNA</p>
        <h1 style={cinzel} className="text-2xl text-[#f0e8d8] font-bold mb-8 text-center">Entrar na Mesa</h1>

        <div className="flex flex-col gap-4">
          <div>
            <label style={cinzel} className="text-[#4a4030] text-xs tracking-[2px] block mb-2">SEU NOME / APELIDO</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Ex: João, Mestre, DM..."
              className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-4 py-3 w-full focus:outline-none focus:border-[#c8a84b50] placeholder-[#3a3020]"
              style={{ ...cinzel, borderRadius: '2px' }}
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={entrando || !username.trim()}
            className="bg-[#c8a84b] text-[#0f0e0c] py-3 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30"
            style={{ ...cinzel, borderRadius: '2px' }}>
            {entrando ? 'ENTRANDO...' : 'ENTRAR →'}
          </button>
        </div>

        <p className="text-[#3a3020] text-xs text-center mt-6">
          Seu progresso é salvo automaticamente.
        </p>
      </div>
    </div>
  );
}