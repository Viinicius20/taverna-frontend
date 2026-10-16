import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const cinzel = { fontFamily: "'Cinzel', serif" };

export default function Login() {
  const [username, setUsername] = useState('');
  const [entrando, setEntrando] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();
  const [senha, setSenha] = useState('');
  const [precisaSenha, setPrecisaSenha] = useState(false);
  const [erro, setErro] = useState('');

async function handleLogin() {
  if (!username.trim() || entrando) return;
  setEntrando(true);
  setErro('');
  try {
    const user = await login(username.trim(), precisaSenha ? senha : undefined);
    if (user.role === 'mestre') navigate('/mestre');
    else navigate('/personagens');
  } catch (err) {
    const status = err.response?.status;
    if (err.precisaSenha) {
      if (precisaSenha) setErro('Senha incorreta.');   // o campo já estava aberto
      setPrecisaSenha(true);
    } else if (precisaSenha && (status === 401 || status === 403)) {
      setErro('Senha incorreta.');
    } else {
      setErro('Erro ao entrar. Tente novamente.');
    }
  }
  setEntrando(false);
}

  return (
    <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center px-4 page-fade">
      <div className="bg-[#161410] border border-[#c8a84b30] max-w-sm w-full p-8" style={{ borderRadius: '2px' }}>
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 text-center">TAVERNA</p>
        <h1 style={cinzel} className="text-2xl text-[#f0e8d8] font-bold mb-8 text-center">Entrar na Mesa</h1>

        <div className="flex flex-col gap-4">
          <div>
            <label style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] block mb-2">SEU NOME / APELIDO</label>
            <input type="text" value={username}
              onChange={e => { setUsername(e.target.value); setPrecisaSenha(false); setSenha(''); setErro(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Ex: João, Mestre, DM..."
              className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-4 py-3 w-full focus:outline-none focus:border-[#c8a84b50] placeholder-[#3a3020]"
              style={{ ...cinzel, borderRadius: '2px' }}
            />
          </div>
          {precisaSenha && (
            <div>
              <label style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] block mb-2">SENHA</label>
              <input type="password" value={senha} autoFocus autoComplete="current-password"
                onChange={e => setSenha(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-4 py-3 w-full focus:outline-none focus:border-[#c8a84b50]"
                style={{ ...cinzel, borderRadius: '2px' }} />
            </div>
          )}

          {erro && <p className="text-red-400 text-sm">{erro}</p>}
          
          <button
            onClick={handleLogin}
            disabled={entrando || !username.trim() || (precisaSenha && !senha)}
            className="bg-[#c8a84b] text-[#0f0e0c] py-3 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30"
            style={{ ...cinzel, borderRadius: '2px' }}>
            {entrando ? 'ENTRANDO...' : 'ENTRAR →'}
          </button>
        </div>

        <p className="text-[#7a6e58] text-xs text-center mt-6">
          Seu progresso é salvo automaticamente.
        </p>
      </div>
    </div>
  );
}