import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { notificar } from '../utils/notificar';
import { VINCULOS } from '../constants/vinculos';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };
const CAMPANHA_ID = '00000000-0000-0000-0000-000000000001';

const PERGUNTAS_CURTAS = { grupo: 'Conhece o grupo', medo: 'Medo', divida: 'Dívida', segredo: 'Segredo', reencontro: 'Reencontro' };

export default function SessaoZero() {
  const navigate = useNavigate();
  const [jogadores, setJogadores] = useState([]);
  const [proposta, setProposta] = useState(null);
  const [nomes, setNomes] = useState({});
  const [fora, setFora] = useState({ ganchos: {}, npcs: {}, vinculos: {}, fatos: {} });
  const [gerando, setGerando] = useState(false);
  const [aplicando, setAplicando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get(`/sessao-zero/campanha/${CAMPANHA_ID}/respostas`);
      setJogadores(res.data.data || []);
    } catch { notificar('Erro ao carregar as respostas.', 'erro'); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function gerar() {
    setGerando(true);
    try {
      const res = await api.post(`/sessao-zero/campanha/${CAMPANHA_ID}/gerar`);
      setProposta(res.data.data);
      setNomes(res.data.personagens || {});
      setFora({ ganchos: {}, npcs: {}, vinculos: {} });
    } catch (e) {
      const d = e.response?.data?.detail;
      notificar(typeof d === 'string' ? d : 'Erro ao gerar a proposta.', 'erro');
    }
    setGerando(false);
  }

  const alternar = (grupo, i) => setFora(f => ({ ...f, [grupo]: { ...f[grupo], [i]: !f[grupo][i] } }));
  const marcado = (grupo, i) => !fora[grupo][i];

  const chavesNpc = proposta ? proposta.npcs.filter((_, i) => marcado('npcs', i)).map(n => n.chave) : [];
  const refOk = ref => !ref.startsWith('npc:') || chavesNpc.includes(ref.slice(4));
  const nomeRef = ref => {
    if (ref.startsWith('character:')) return nomes[ref.slice(10)] || 'jogador';
    return proposta.npcs.find(n => n.chave === ref.slice(4))?.nome || 'NPC';
  };

  async function aplicar() {
    setAplicando(true);
    try {
      const res = await api.post(`/sessao-zero/campanha/${CAMPANHA_ID}/aplicar`, {
        ganchos: proposta.ganchos.filter((_, i) => marcado('ganchos', i)),
        npcs: proposta.npcs.filter((_, i) => marcado('npcs', i)),
        vinculos: proposta.vinculos.filter((v, i) => marcado('vinculos', i) && refOk(v.de) && refOk(v.para)),
        fatos: proposta.fatos.filter((_, i) => marcado('fatos', i)),
      });
      const d = res.data.data;
      notificar(`Criados: ${d.npcs} NPCs, ${d.vinculos} vínculos, ${d.ganchos} ganchos, ${d.fatos} fatos.`, 'sucesso');
      setProposta(null);
    } catch (e) {
      const d = e.response?.data?.detail;
      notificar(typeof d === 'string' ? d : 'Erro ao aplicar a proposta.', 'erro');
    }
    setAplicando(false);
  }

  const Marca = ({ grupo, i }) => (
    <input type="checkbox" checked={marcado(grupo, i)} onChange={() => alternar(grupo, i)} className="mt-1" />
  );
  const respondeu = jogadores.filter(j => Object.keys(j.respostas).length > 0).length;

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0] page-fade" style={crimson}>
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold">⚔ TAVERNA</span>
        <button onClick={() => navigate('/mestre')} style={cinzel}
          className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors">← Mestre</button>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">CAMPANHA</p>
        <h1 style={cinzel} className="text-3xl text-[#f0e8d8] font-bold mb-2">Sessão Zero</h1>
        <p className="text-[#7a7060] mb-8 font-light">{respondeu} de {jogadores.length} jogadores responderam.</p>

        <div className="flex flex-col gap-3 mb-8">
          {jogadores.map(j => (
            <details key={j.id} className="border border-[#c8a84b15] bg-[#161410] px-4 py-3">
              <summary className="cursor-pointer text-sm" style={cinzel}>
                {j.nome} <span className="text-xs text-[#6a6050]">{Object.keys(j.respostas).length ? '· respondeu' : '· aguardando'}</span>
              </summary>
              {Object.entries(j.respostas).map(([k, v]) => (
                <p key={k} className="text-xs text-[#9a8e78] mt-2"><b className="text-[#c8a84b]">{PERGUNTAS_CURTAS[k] || k}:</b> {v}</p>
              ))}
            </details>
          ))}
        </div>

        <button onClick={gerar} disabled={gerando || respondeu === 0}
          className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-3 text-xs tracking-widest font-bold disabled:opacity-30 mb-8"
          style={{ ...cinzel, borderRadius: '2px' }}>
          {gerando ? 'A IA está pensando...' : '✦ Gerar proposta com IA'}
        </button>

        {proposta && (
          <div className="flex flex-col gap-6">
            <p className="text-sm text-[#9a8e78] italic">Nada foi gravado ainda. Desmarque o que não quiser e aplique.</p>

            <section>
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-2">GANCHOS (viram post-its)</p>
              {proposta.ganchos.map((g, i) => (
                <label key={i} className="flex gap-3 border border-[#c8a84b15] bg-[#161410] px-4 py-3 mb-2 cursor-pointer">
                  <Marca grupo="ganchos" i={i} />
                  <span><b>{g.titulo}</b><br /><span className="text-xs text-[#9a8e78]">{g.descricao}</span></span>
                </label>
              ))}
            </section>

            <section>
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-2">NPCS NOVOS</p>
              {proposta.npcs.map((n, i) => (
                <label key={n.chave} className="flex gap-3 border border-[#c8a84b15] bg-[#161410] px-4 py-3 mb-2 cursor-pointer">
                  <Marca grupo="npcs" i={i} />
                  <span><b>{n.nome}</b> <span className="text-xs text-[#6a6050]">{n.ocupacao}</span><br />
                    <span className="text-xs text-[#9a8e78]">{n.personalidade} {n.motivacao}</span></span>
                </label>
              ))}
            </section>

            <section>
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-2">VÍNCULOS</p>
              {proposta.vinculos.map((v, i) => {
                const ok = refOk(v.de) && refOk(v.para);
                return (
                  <label key={i} className={`flex gap-3 border border-[#c8a84b15] bg-[#161410] px-4 py-3 mb-2 cursor-pointer ${ok ? '' : 'opacity-40'}`}>
                    <Marca grupo="vinculos" i={i} />
                    <span className="text-sm">{nomeRef(v.de)} <span className="text-[#6a6050]">{VINCULOS[v.tipo] || v.tipo}</span> {nomeRef(v.para)}
                      {v.secreto ? ' 🔒' : ''}{v.nota && <><br /><span className="text-xs text-[#9a8e78] italic">{v.nota}</span></>}</span>
                  </label>
                );
              })}
            </section>

            <section>
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-2">FATOS DO DIÁRIO</p>
                {proposta.fatos.map((f, i) => (
                    <label key={i} className="flex gap-3 border border-[#c8a84b15] bg-[#161410] px-4 py-3 mb-2 cursor-pointer">
                    <Marca grupo="fatos" i={i} />
                    <span className="text-sm">{f.texto}<br />
                        <span className="text-xs text-[#6a6050]">
                        {f.todos ? '👥 Todos os jogadores' : `🔒 Só: ${f.personagens.map(id => nomes[id] || 'jogador').join(', ')}`}
                        </span>
                    </span>
                    </label>
                ))}
            </section>

            <button onClick={aplicar} disabled={aplicando}
              className="bg-[#4a8a4a] text-[#0f0e0c] px-6 py-3 text-xs tracking-widest font-bold disabled:opacity-30"
              style={{ ...cinzel, borderRadius: '2px' }}>
              {aplicando ? 'Aplicando...' : 'Aplicar selecionados'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}