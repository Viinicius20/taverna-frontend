import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getCampanhaId } from '../utils/campanha';
import { cinzel, crimson } from '../estilos';
import TextoWiki from '../components/TextoWiki';

const CAMPANHA_ID = getCampanhaId();
const radius = { borderRadius: '2px' };

const SECOES = [
  { chave: 'terras',   rotulo: 'Terras',    tipo: 'regiao' },
  { chave: 'locais',   rotulo: 'Locais',    tipo: 'local' },
  { chave: 'npcs',     rotulo: 'NPCs',      tipo: 'npc' },
  { chave: 'faccoes',  rotulo: 'Facções',   tipo: 'faccao' },
  { chave: 'monstros', rotulo: 'Criaturas', tipo: 'criatura' },
  { chave: 'itens',    rotulo: 'Itens',     tipo: 'item' },
];

export default function Enciclopedia() {
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(false);
  const [aba, setAba] = useState('cronicas');
  const [paginaAberta, setPaginaAberta] = useState(null);

  useEffect(() => {
    api.get(`/enciclopedia/${CAMPANHA_ID}`)
      .then(r => setDados(r.data.data))
      .catch(() => setErro(true));
  }, []);

  // pro TextoWiki: só o que o jogador já descobriu vira link
  const paginas = dados?.paginas || [];
  const entidades = useMemo(() => {
    if (!dados) return [];
    return SECOES.flatMap(s => (dados[s.chave] || []).map(x => ({ ...x, tipo: s.tipo })));
  }, [dados]);

    const sobre = (tipo, id) =>
    paginas.filter(p => p.entidade_tipo === tipo && String(p.entidade_id) === String(id));

  if (erro) return <p className="text-red-400 p-6">Não foi possível carregar a enciclopédia.</p>;
  if (!dados) return <p className="text-[#8a7e68] p-6">Carregando...</p>;

  const aberta = paginas.find(p => p.id === paginaAberta);
  const secao = SECOES.find(s => s.chave === aba);

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0]" style={crimson}>
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#c8a84b20]">
        <button onClick={() => navigate('/')} style={cinzel}
            className="text-[#c8a84b] text-lg tracking-widest font-bold">⚔ ENCICLOPÉDIA</button>
        <button onClick={() => navigate('/')} className="text-[#9a8e78] text-sm hover:text-[#c8a84b]" style={cinzel}>← Voltar</button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-5">
        <div className="flex gap-2 flex-wrap">
          {[{ chave: 'cronicas', rotulo: `Crônicas (${paginas.length})` },
            ...SECOES.map(s => ({ chave: s.chave, rotulo: `${s.rotulo} (${(dados[s.chave] || []).length})` }))
          ].map(a => (
            <button key={a.chave} onClick={() => { setAba(a.chave); setPaginaAberta(null); }}
              style={{ ...cinzel, ...radius }}
              className={`text-xs px-3 py-1.5 border ${aba === a.chave
                ? 'border-[#c8a84b] text-[#c8a84b]' : 'border-[#c8a84b30] text-[#9a8e78]'}`}>
              {a.rotulo}
            </button>
          ))}
        </div>

        {aba === 'cronicas' && (aberta ? (
          <div className="flex flex-col gap-3">
            <button onClick={() => setPaginaAberta(null)} className="text-xs text-[#9a8e78] hover:text-[#c8a84b] self-start">← Crônicas</button>
            <h2 style={cinzel} className="text-xl text-[#f0e8d8]">{aberta.titulo}</h2>
            <TextoWiki texto={aberta.conteudo} paginas={paginas} entidades={entidades}
              onAbrir={setPaginaAberta} />
          </div>
        ) : paginas.length === 0 ? (
          <p className="text-[#8a7e68] text-sm">Nenhuma crônica revelada ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {paginas.map(p => (
              <button key={p.id} onClick={() => setPaginaAberta(p.id)}
                className="text-left px-3 py-2 text-sm text-[#9a8e78] hover:text-[#c8a84b] border border-[#c8a84b10] hover:border-[#c8a84b30]"
                style={radius}>
                {p.titulo} <span className="text-[#6a6050] text-xs">· {p.categoria}</span>
              </button>
            ))}
          </div>
        ))}

        {secao && (
          (dados[secao.chave] || []).length === 0
            ? <p className="text-[#8a7e68] text-sm">Nada descoberto aqui ainda.</p>
            : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dados[secao.chave].map(x => (
                  <div key={x.id} className="border border-[#c8a84b20] bg-[#161410] p-4" style={radius}>
                    <p style={cinzel} className="text-[#e8e0d0] text-sm">{x.nome}</p>
                    {x.subtitulo && <p className="text-[#8a7e68] text-xs mt-0.5">{x.subtitulo}</p>}
                    {x.descricao && <p className="text-[#9a8e78] text-sm mt-2 leading-relaxed">{x.descricao}</p>}
                    {sobre(secao.tipo, x.id).map(p => (
                      <button key={p.id} onClick={() => { setAba('cronicas'); setPaginaAberta(p.id); }}
                        className="block text-xs text-[#c8a84b] hover:underline mt-2">
                        📜 {p.titulo}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
        )}
      </div>
    </div>
  );
}