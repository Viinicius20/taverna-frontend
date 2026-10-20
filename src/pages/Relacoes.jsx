import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { notificar, confirmar } from '../utils/notificar';
import MapaRelacoes from '../components/MapaRelacoes';
import { VINCULOS } from '../constants/vinculos';


const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };
const CAMPANHA_ID = '00000000-0000-0000-0000-000000000001';

const CAMINHO_LOCAIS = `/locations/${CAMPANHA_ID}`;   // copie o caminho real da página Mistérios

const TIPOS = { npc: 'NPCs', faction: 'Facções', location: 'Locais', character: 'Jogadores' };
const campo = 'bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]';

const mensagem = (e, padrao) => (typeof e.response?.data?.detail === 'string' ? e.response.data.detail : padrao);

export default function Relacoes() {
  const navigate = useNavigate();
  const [entidades, setEntidades] = useState([]);
  const [grafo, setGrafo] = useState({ nos: [], arestas: [] });
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [tipo, setTipo] = useState('conhece');
  const [nota, setNota] = useState('');
  const [secreto, setSecreto] = useState(true);
  const [erro, setErro] = useState('');
  const [vista, setVista] = useState('lista');
  const [como, setComo] = useState('');

  const carregarEntidades = useCallback(async () => {
    const lista = [];
    const pegar = async (caminho, tipoEnt, nome) => {
      try {
        const res = await api.get(caminho);
        (res.data.data || []).forEach(e =>
          lista.push({ chave: `${tipoEnt}:${e.id}`, tipo: tipoEnt, nome: nome(e) || '(sem nome)' }));
      } catch { /* segue sem esse grupo */ }
    };
    await Promise.all([
      pegar(`/npcs/${CAMPANHA_ID}`, 'npc', e => e.data?.name || e.name),
      pegar(`/factions/${CAMPANHA_ID}`, 'faction', e => e.name),
      pegar(CAMINHO_LOCAIS, 'location', e => e.name),
      pegar('/characters', 'character', e => e.data?.name || e.name),
    ]);
    setEntidades(lista);
  }, []);

const carregarGrafo = useCallback(async () => {
  try {
    const id = como ? como.split(':')[1] : null;
    const res = await api.get(`/relacoes/${CAMPANHA_ID}/grafo`, { params: id ? { como: id } : {} });
    setGrafo(res.data.data);
    setErro('');
  } catch { setErro('Erro ao carregar os vínculos.'); }
}, [como]);

useEffect(() => { carregarEntidades(); }, [carregarEntidades]);
useEffect(() => { carregarGrafo(); }, [carregarGrafo]);

  const nomes = useMemo(() => Object.fromEntries(grafo.nos.map(n => [n.id, n.label])), [grafo]);

  async function criar() {
    const [st, sid] = origem.split(':');
    const [tt, tid] = destino.split(':');
    if (!sid || !tid) return;
    try {
      await api.post(`/relacoes/${CAMPANHA_ID}`, {
        source_type: st, source_id: sid, target_type: tt, target_id: tid,
        kind: tipo, note: nota, secret: secreto,
      });
      setNota(''); setErro('');
      carregarGrafo();
    } catch (e) { setErro(mensagem(e, 'Erro ao criar o vínculo.')); }
  }

  async function apagar(id) {
    if (!(await confirmar('Apagar este vínculo?'))) return;
    try { await api.delete(`/relacoes/${CAMPANHA_ID}/${id}`); carregarGrafo(); }
    catch { notificar('Erro ao apagar o vínculo.', 'erro'); }
  }

  const opcoes = Object.keys(TIPOS).map(t => (
    <optgroup key={t} label={TIPOS[t]}>
      {entidades.filter(e => e.tipo === t).sort((a, b) => a.nome.localeCompare(b.nome))
        .map(e => <option key={e.chave} value={e.chave}>{e.nome}</option>)}
    </optgroup>
  ));

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0] page-fade" style={crimson}>
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold">⚔ TAVERNA</span>
        <button onClick={() => navigate('/mestre')} style={cinzel}
          className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors">← Mestre</button>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">MUNDO</p>
        <h1 style={cinzel} className="text-3xl text-[#f0e8d8] font-bold mb-8">Vínculos</h1>

        <div className="border border-[#c8a84b20] bg-[#161410] p-4 flex flex-col gap-3 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <select value={origem} onChange={e => setOrigem(e.target.value)} className={`${campo} flex-1 min-w-40`} style={{ borderRadius: '2px' }}>
              <option value="">De...</option>{opcoes}
            </select>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className={campo} style={{ borderRadius: '2px' }}>
              {Object.entries(VINCULOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={destino} onChange={e => setDestino(e.target.value)} className={`${campo} flex-1 min-w-40`} style={{ borderRadius: '2px' }}>
              <option value="">Para...</option>{opcoes}
            </select>
          </div>
          <input value={nota} onChange={e => setNota(e.target.value)} maxLength={300}
            placeholder="Nota (opcional): por que existe esse vínculo?" className={campo} style={{ borderRadius: '2px' }} />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-[#6a6050] cursor-pointer" style={cinzel}>
              <input type="checkbox" checked={secreto} onChange={e => setSecreto(e.target.checked)} />
              🔒 Secreto (os jogadores não veem)
            </label>
            <button onClick={criar} disabled={!origem || !destino || origem === destino}
              className="ml-auto bg-[#c8a84b] text-[#0f0e0c] px-5 py-2 text-xs font-bold disabled:opacity-30"
              style={{ ...cinzel, borderRadius: '2px' }}>
              + Criar vínculo
            </button>
          </div>
          {erro && <p className="text-red-400 text-sm">{erro}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span style={cinzel} className="text-[#7a6e58] text-xs tracking-[2px]">VER COMO:</span>
          <select value={como} onChange={e => setComo(e.target.value)} className={campo} style={{ borderRadius: '2px' }}>
            <option value="">Mestre (tudo)</option>
            {entidades.filter(e => e.tipo === 'character').sort((a, b) => a.nome.localeCompare(b.nome))
              .map(e => <option key={e.chave} value={e.chave}>{e.nome}</option>)}
          </select>
          {como && <span className="text-xs text-[#8a5030]">👁 Visão do jogador: sem facções, locais nem vínculos secretos</span>}
        </div>

        <div className="flex gap-2 mb-4">
            {[['lista', 'Lista'], ['mapa', 'Mapa']].map(([id, rotulo]) => (
                <button key={id} onClick={() => setVista(id)}
                className="px-4 py-1.5 text-xs border transition-colors"
                style={{
                    ...cinzel, borderRadius: '2px',
                    borderColor: vista === id ? '#c8a84b' : '#c8a84b20',
                    color: vista === id ? '#c8a84b' : '#6a6050',
                }}>
                {rotulo}
                </button>
            ))}
        </div>

        {vista === 'mapa' ? (
        grafo.nos.length === 0 ? (
            <p className="text-[#7a6e58] text-sm text-center py-10 italic">
              {como ? 'Esse personagem ainda não conhece ninguém.' : 'Crie alguns vínculos para ver o mapa.'}
            </p>
        ) : (
            <MapaRelacoes grafo={grafo} />
        )
        ) : grafo.arestas.length === 0 ? (
        <p className="text-[#7a6e58] text-sm text-center py-10 italic">
          {como ? 'Nenhum vínculo visível para esse personagem.' : 'Nenhum vínculo ainda. O mundo está cheio de estranhos.'}
        </p>
        ) : (
        <div className="flex flex-col gap-2">
            {grafo.arestas.map(a => (
            <div key={a.id} className="flex items-center justify-between gap-3 border border-[#c8a84b15] bg-[#161410] px-4 py-3">
                <div>
                <p className="text-sm">
                    <span className="text-[#f0e8d8]">{nomes[a.source]}</span>
                    <span className="text-[#6a6050]"> {VINCULOS[a.kind] || a.kind} </span>
                    <span className="text-[#f0e8d8]">{nomes[a.target]}</span>
                    {a.secret && <span title="Secreto"> 🔒</span>}
                </p>
                {a.note && <p className="text-xs text-[#6a6050] italic mt-1">{a.note}</p>}
                </div>
                <button onClick={() => apagar(a.id)} className="text-red-900 hover:text-red-600 text-lg" title="Apagar">×</button>
            </div>
            ))}
        </div>
        )}
      </div>
    </div>
  );
}