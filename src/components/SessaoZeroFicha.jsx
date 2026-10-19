import { useState, useEffect } from 'react';
import api from '../services/api';

const cinzel = { fontFamily: "'Cinzel', serif" };
const COR = 'var(--cor-classe, #c8a84b)';
const LIMITE = 400;

export default function SessaoZeroFicha({ personagemId }) {
  const [perguntas, setPerguntas] = useState({});
  const [respostas, setRespostas] = useState({});
  const [salvas, setSalvas] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [estado, setEstado] = useState('');

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    Promise.all([api.get('/sessao-zero/perguntas'), api.get(`/sessao-zero/personagem/${personagemId}`)])
      .then(([p, r]) => {
        if (!ativo) return;
        const dados = r.data.data || {};
        setPerguntas(p.data.data || {});
        setRespostas(dados);
        setSalvas(dados);
        setEstado('');
      })
      .catch(e => { if (ativo) setEstado(`erro ${e.response?.status ?? 'de rede'}`); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [personagemId]);

  async function salvar() {
    setEstado('salvando');
    try {
      const res = await api.put(`/sessao-zero/personagem/${personagemId}`, { respostas });
      const dados = res.data.data || respostas;
      setRespostas(dados);
      setSalvas(dados);
      setEstado('salvo');
    } catch (e) { setEstado(`erro ${e.response?.status ?? 'de rede'}`); }
  }

  const chaves = Object.keys(perguntas);
  const respondidas = chaves.filter(k => (respostas[k] || '').trim().length > 0).length;
  const pct = chaves.length ? Math.round((respondidas / chaves.length) * 100) : 0;
  const alterado = chaves.some(k => (respostas[k] || '') !== (salvas[k] || ''));
  const erro = estado.startsWith('erro');

  return (
    <div className="max-w-3xl mx-auto px-6 pb-28 flex flex-col gap-5">
      <div>
        <p style={{ ...cinzel, color: COR }} className="text-xs tracking-[3px] mb-2">SESSÃO ZERO</p>
        <p className="text-[#9a8e78] text-sm leading-relaxed">
          Suas respostas ajudam o mestre a ligar seu personagem ao grupo e ao mundo.
        </p>
        <p className="text-[#8a5030] text-xs mt-2">🔒 Só você e o mestre leem.</p>
      </div>

      {carregando && <p className="text-[#7a6e58] text-sm">Carregando perguntas...</p>}
      {!carregando && chaves.length === 0 && erro && (
        <p className="text-red-400 text-sm">Não foi possível carregar as perguntas ({estado.slice(5)}).</p>
      )}

      {chaves.length > 0 && (
        <div>
          <div className="flex justify-between text-xs text-[#9a8e78] mb-1">
            <span>{respondidas} de {chaves.length} respondidas</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1 bg-[#161410]" style={{ borderRadius: '2px' }}>
            <div className="h-1 transition-all" style={{ width: `${pct}%`, backgroundColor: COR, borderRadius: '2px' }} />
          </div>
        </div>
      )}

      {chaves.map((chave, i) => {
        const valor = respostas[chave] || '';
        const perto = valor.length >= LIMITE * 0.9;
        return (
          <div key={chave} className="border border-[#c8a84b20] bg-[#161410] p-5" style={{ borderRadius: '2px' }}>
            <label htmlFor={`sz-${chave}`} className="block mb-3">
              <span style={{ ...cinzel, color: COR }} className="text-xs tracking-[2px] mr-2">{i + 1}.</span>
              <span className="text-[#e8e0d0] text-sm">{perguntas[chave]}</span>
            </label>
            <textarea id={`sz-${chave}`} value={valor} rows={3} maxLength={LIMITE}
              placeholder="Escreva aqui..."
              onChange={e => { setRespostas(r => ({ ...r, [chave]: e.target.value })); setEstado(''); }}
              className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full text-sm leading-relaxed focus:outline-none focus:border-[#c8a84b50] resize-none"
              style={{ borderRadius: '2px' }} />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs" style={{ color: COR }}>{valor.trim() ? '✓' : ''}</span>
              <span className={`text-xs ${perto ? 'text-[#c8a84b]' : 'text-[#7a6e58]'}`}>{valor.length}/{LIMITE}</span>
            </div>
          </div>
        );
      })}

      {chaves.length > 0 && (
        <div className="flex items-center gap-4">
          <button onClick={salvar} disabled={!alterado || estado === 'salvando'}
            className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30"
            style={{ ...cinzel, borderRadius: '2px' }}>
            {estado === 'salvando' ? 'SALVANDO...' : 'SALVAR RESPOSTAS'}
          </button>
          {erro && <span className="text-red-400 text-xs">Erro ao salvar ({estado.slice(5)}).</span>}
          {!erro && alterado && estado !== 'salvando' && <span className="text-xs text-[#9a8e78]">Alterações não salvas</span>}
          {!erro && !alterado && respondidas > 0 && <span className="text-xs text-[#4a8a4a]">✓ Tudo salvo</span>}
        </div>
      )}
    </div>
  );
}