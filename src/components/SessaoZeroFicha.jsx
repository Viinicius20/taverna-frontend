import { useState, useEffect } from 'react';
import api from '../services/api';

const cinzel = { fontFamily: "'Cinzel', serif" };

export default function SessaoZeroFicha({ personagemId }) {
  const [perguntas, setPerguntas] = useState({});
  const [respostas, setRespostas] = useState({});
  const [estado, setEstado] = useState('');

  useEffect(() => {
    let ativo = true;
    Promise.all([api.get('/sessao-zero/perguntas'), api.get(`/sessao-zero/personagem/${personagemId}`)])
      .then(([p, r]) => {
        if (!ativo) return;
        setPerguntas(p.data.data || {});
        setRespostas(r.data.data || {});
      })
      .catch(() => { if (ativo) setEstado('erro'); });
    return () => { ativo = false; };
  }, [personagemId]);

  async function salvar() {
    setEstado('salvando');
    try {
      const res = await api.put(`/sessao-zero/personagem/${personagemId}`, { respostas });
      setRespostas(res.data.data || {});
      setEstado('salvo');
    } catch { setEstado('erro'); }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-1">SESSÃO ZERO</p>
        <p className="text-[#6a6050] text-sm italic">
          Suas respostas ajudam o mestre a ligar seu personagem ao grupo e ao mundo. Só você e o mestre as leem.
        </p>
      </div>

      {Object.entries(perguntas).map(([chave, texto]) => (
        <div key={chave}>
          <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-2">{texto.toUpperCase()}</label>
          <textarea value={respostas[chave] || ''} rows={2} maxLength={400}
            onChange={e => { setRespostas(r => ({ ...r, [chave]: e.target.value })); setEstado(''); }}
            className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-4 py-3 w-full text-sm focus:outline-none focus:border-[#c8a84b50] resize-none"
            style={{ borderRadius: '2px' }} />
          <p className="text-[#3a3020] text-xs text-right">{(respostas[chave] || '').length}/400</p>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button onClick={salvar} disabled={estado === 'salvando'}
          className="bg-[#c8a84b] text-[#0f0e0c] px-5 py-2 text-xs font-bold disabled:opacity-30"
          style={{ ...cinzel, borderRadius: '2px' }}>
          {estado === 'salvando' ? 'Salvando...' : 'Salvar respostas'}
        </button>
        {estado === 'salvo' && <span className="text-[#4a8a4a] text-xs">Salvo.</span>}
        {estado === 'erro' && <span className="text-red-400 text-xs">Erro ao carregar ou salvar.</span>}
      </div>
    </div>
  );
}