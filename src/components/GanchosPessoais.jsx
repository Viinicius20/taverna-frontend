import { useState, useEffect } from 'react';
import api from '../services/api';
import { cinzel } from '../estilos';
import { getCampanhaId } from '../utils/campanha';
import { Link, useLocation } from 'react-router-dom';
import { focarRegistro, registrosDoGancho } from '../utils/ganchosSessaoZero';

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
  const { state } = useLocation();

  useEffect(() => {
    api.get('/sessao-zero/perguntas').then(r => setPerguntas(r.data.data || {})).catch(() => {});
    api.get(`/sessao-zero/campanha/${getCampanhaId()}/respostas`)
      .then(r => setRespostas(Object.fromEntries((r.data.data || []).map(x => [x.id, x.respostas || {}]))))
      .catch(() => {});
  }, []);

  useEffect(() => {
  if (state?.personagemGancho) setAberto(state.personagemGancho);
}, [state]);

  const ganchosDe = p => [
    ...DA_FICHA.filter(([k]) => p.data?.[k]).map(([k, rotulo]) => ({ rotulo, texto: p.data[k] })),
    ...Object.entries(respostas[p.id] || {}).filter(([, v]) => v).map(([k, v]) => ({
      personagemId: p.id,
      nome: p.data?.name || p.name,
      campo: k,
      rotulo: (perguntas[k] || k).replace(/\?$/, '').toUpperCase(), texto: v, sessaoZero: true,
    })),
  ];

  const todos = personagens.flatMap(p => ganchosDe(p).map(g => ({ ...g, nome: p.name })));

  function sortear() {
    if (todos.length) setSorteado(todos[Math.floor(Math.random() * todos.length)]);
  }

  return (
    <div id="ganchos" ref={focarRegistro} className="border border-[#c8a84b20] bg-[#161410] p-4" style={radius}>
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
                      <p className="text-[#9a8e78] text-sm break-words">{g.texto}</p>

                      {g.sessaoZero && (
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-[#c8a84b]">
                          <Link to="/relacoes" state={{ gancho: g }}>Criar vínculo</Link>
                          <Link to="/mestre?aba=npcs" state={{ gancho: g }}>Criar NPC</Link>
                          <Link to="/mestre?aba=sessao#anotacoes" state={{ gancho: g }}>
                            Fixar nas anotações
                          </Link>
                          {registrosDoGancho(g).map(rota => (
                            <Link key={rota} to={rota}>
                              {rota.includes('#vinculo-') ? 'Ver vínculo'
                                : rota.includes('#nota-') ? 'Ver anotação' : 'Ver NPC'}
                            </Link>
                          ))}
                        </div>
                      )}
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