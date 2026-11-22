import { useState, useEffect } from 'react';
import api from '../services/api';
import { cinzel } from '../estilos';
import { getCampanhaId } from '../utils/campanha';

const radius = { borderRadius: '2px' };
const DA_FICHA = [
  ['medos', 'MEDOS'], ['vinculos', 'VÍNCULOS'], ['defeitos', 'DEFEITOS'],
  ['ideais', 'IDEAIS'], ['objetivo_atual', 'OBJETIVO ATUAL'],
];

export default function GanchosPessoais({ personagens = [] }) {
  const [perguntas, setPerguntas] = useState({});
  const [respostas, setRespostas] = useState({});
  const [aberto, setAberto] = useState(null);
  const [sorteado, setSorteado] = useState(null);

  useEffect(() => {
    api.get('/sessao-zero/perguntas').then(r => setPerguntas(r.data.data || {})).catch(() => {});
    api.get(`/sessao-zero/campanha/${getCampanhaId()}/respostas`)
      .then(r => setRespostas(Object.fromEntries((r.data.data || []).map(x => [x.id, x.respostas || {}]))))
      .catch(() => {});
  }, []);

  const ganchosDe = p => [
    ...DA_FICHA.filter(([k]) => p.data?.[k]).map(([k, rotulo]) => ({ rotulo, texto: p.data[k] })),
    ...Object.entries(respostas[p.id] || {}).filter(([, v]) => v).map(([k, v]) => ({
      rotulo: (perguntas[k] || k).replace(/\?$/, '').toUpperCase(), texto: v, sessaoZero: true,
    })),
  ];

  const todos = personagens.flatMap(p => ganchosDe(p).map(g => ({ ...g, nome: p.name })));

  function sortear() {
    if (todos.length) setSorteado(todos[Math.floor(Math.random() * todos.length)]);
  }

  return (
    <div className="border border-[#c8a84b20] bg-[#161410] p-4" style={radius}>
      <div className="flex items-center justify-between mb-3">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">GANCHOS PESSOAIS</p>
        <button onClick={sortear} disabled={!todos.length}
          className="text-xs border border-[#c8a84b30] text-[#c8a84b] px-2 py-1 hover:bg-[#c8a84b10] transition-colors disabled:opacity-40"
          style={{ ...cinzel, ...radius }}>🎯 Sortear</button>
      </div>

      {sorteado && (
        <div className="border border-[#b07050] bg-[#b0705010] p-3 mb-3" style={radius}>
          <p style={cinzel} className="text-[#e8e0d0] text-sm">{sorteado.nome}</p>
          <p className="text-[#8a7e68] text-xs mb-1">{sorteado.rotulo}</p>
          <p className="text-[#e8e0d0] text-sm">{sorteado.texto}</p>
        </div>
      )}

      {personagens.length === 0 && <p className="text-[#8a7e68] text-sm">Nenhum personagem.</p>}
      <div className="space-y-1">
        {personagens.map(p => {
          const ganchos = ganchosDe(p);
          return (
            <div key={p.id} className="border border-[#c8a84b10] bg-[#0f0e0c]" style={radius}>
              <button onClick={() => setAberto(aberto === p.id ? null : p.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-left">
                <span style={cinzel} className="text-sm text-[#e8e0d0]">{p.name}</span>
                <span className="text-[#8a7e68] text-xs">{ganchos.length}</span>
              </button>
              {aberto === p.id && (
                <div className="px-3 pb-3 space-y-2">
                  {ganchos.length === 0 && <p className="text-[#6a6050] text-xs">Nada preenchido ainda.</p>}
                  {ganchos.map((g, i) => (
                    <div key={i}>
                      <p className="text-[#8a7e68] text-[10px] tracking-widest" style={cinzel}>
                        {g.rotulo}{g.sessaoZero ? ' · SESSÃO ZERO' : ''}
                      </p>
                      <p className="text-[#9a8e78] text-sm">{g.texto}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}