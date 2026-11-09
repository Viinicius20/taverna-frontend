import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const cinzel = { fontFamily: "'Cinzel', serif" };
const campo = "bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-4 py-3 w-full focus:outline-none focus:border-[#c8a84b50]";
const rotulo = "text-[#8a7e68] text-xs tracking-[2px] block mb-2";

export default function Login() {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [precisaSenha, setPrecisaSenha] = useState(false);
  const [definindo, setDefinindo] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState('');
  const { login, definirSenha } = useUser();
  const navigate = useNavigate();

  function resetar() {
    setPrecisaSenha(false);
    setDefinindo(false);
    setSenha('');
    setConfirmar('');
    setErro('');
  }

  async function handleLogin() {
    if (!username.trim() || entrando) return;
    if (definindo) {
      if (senha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return; }
      if (senha !== confirmar) { setErro('As senhas não conferem.'); return; }
    }
    setEntrando(true);
    setErro('');
    try {
      const nome = username.trim();
      const user = definindo
        ? await definirSenha(nome, senha)
        : await login(nome, precisaSenha ? senha : undefined);
      navigate(user.role === 'mestre' ? '/mestre' : '/personagens');
    } catch (err) {
      const status = err.response?.status;
      if (err.definirSenha) {
        setDefinindo(true);
        setPrecisaSenha(false);
        setSenha('');
        setConfirmar('');
      } else if (err.precisaSenha) {
        if (precisaSenha) setErro('Senha incorreta.');
        setPrecisaSenha(true);
      } else if (definindo && status === 409) {
        setErro('Esse nome já tem senha. Volte e entre normalmente.');
      } else if (definindo && status === 400) {
        setErro(err.response?.data?.detail || 'Senha inválida.');
      } else if (precisaSenha && (status === 401 || status === 403)) {
        setErro('Senha incorreta.');
      } else if (status === 429) {
        setErro('Muitas tentativas. Espere um minuto.');
      } else {
        setErro('Erro ao entrar. Tente novamente.');
      }
    }
    setEntrando(false);
  }

  const pedeSenha = precisaSenha || definindo;
  const desabilitado = entrando || !username.trim() || (pedeSenha && !senha) || (definindo && !confirmar);

  return (
    <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center px-4 page-fade">
      <div className="bg-[#161410] border border-[#c8a84b30] max-w-sm w-full p-8" style={{ borderRadius: '2px' }}>
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 text-center">TAVERNA</p>
        <h1 style={cinzel} className="text-2xl text-[#f0e8d8] font-bold mb-8 text-center">Entrar na Mesa</h1>

        <div className="flex flex-col gap-4">
          <div>
            <label style={cinzel} className={rotulo}>SEU NOME / APELIDO</label>
            <input type="text" value={username}
              onChange={e => { setUsername(e.target.value); resetar(); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Ex: João, Mestre, DM..." aria-label="Ex: João, Mestre, DM..."
              className={`${campo} placeholder-[#3a3020]`}
              style={{ ...cinzel, borderRadius: '2px' }} />
          </div>

          {definindo && (
            <p className="text-[#9a8e78] text-sm">
              Primeiro acesso. Escolha uma senha pra proteger seu perfil.
            </p>
          )}

          {pedeSenha && (
            <div>
              <label style={cinzel} className={rotulo}>{definindo ? 'NOVA SENHA' : 'SENHA'}</label>
              <input type="password" value={senha} autoFocus
                autoComplete={definindo ? 'new-password' : 'current-password'}
                onChange={e => setSenha(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className={campo} style={{ ...cinzel, borderRadius: '2px' }} />
            </div>
          )}

          {definindo && (
            <div>
              <label style={cinzel} className={rotulo}>CONFIRMAR SENHA</label>
              <input type="password" value={confirmar} autoComplete="new-password"
                onChange={e => setConfirmar(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className={campo} style={{ ...cinzel, borderRadius: '2px' }} />
            </div>
          )}

          {erro && <p className="text-red-400 text-sm">{erro}</p>}

          <button onClick={handleLogin} disabled={desabilitado}
            className="bg-[#c8a84b] text-[#0f0e0c] py-3 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30"
            style={{ ...cinzel, borderRadius: '2px' }}>
            {entrando ? 'ENTRANDO...' : definindo ? 'CRIAR SENHA E ENTRAR →' : 'ENTRAR →'}
          </button>
        </div>

        <p className="text-[#8a7e68] text-xs text-center mt-6">
          Seu progresso é salvo automaticamente.
        </p>
      </div>
    </div>
  );
}