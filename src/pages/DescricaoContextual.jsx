import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useState, useEffect } from 'react';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };

export default function DescricaoContextual() {
  const navigate = useNavigate();
  const [contexto, setContexto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');
  const [historico, setHistorico] = useState([]);
  const [tab, setTab] = useState('descricao'); 
  const [situacao, setSituacao] = useState('');
  const [consequencias, setConsequencias] = useState(null);
  const [gerandoConsequencia, setGerandoConsequencia] = useState(false);
  const [personagens, setPersonagens] = useState([]);
  const [personagemSelecionado, setPersonagemSelecionado] = useState('');
  const [topico, setTopico] = useState('');
  const [conhecimento, setConhecimento] = useState('');
  const [gerandoConhecimento, setGerandoConhecimento] = useState(false);

  async function gerarDescricao() {
    if (!contexto.trim()) return;
    setGerando(true);
    setErro('');
    try {
      const res = await api.post('/gerar-descricao-contextual', { contexto });
      const nova = res.data.data;
      setDescricao(nova);
      setHistorico(prev => [{ contexto, descricao: nova, id: Date.now() }, ...prev].slice(0, 10));
    } catch {
      setErro('Erro ao gerar descrição.');
    }
    setGerando(false);
  }

  async function gerarConsequencia() {
  if (!situacao.trim()) return;
  setGerandoConsequencia(true);
  setErro('');
  try {
    const res = await api.post('/gerar-consequencia', { situacao });
    setConsequencias(res.data.data);
  } catch {
    setErro('Erro ao gerar consequência.');
  }
  setGerandoConsequencia(false);
}

useEffect(() => {
  api.get('/characters').then(res => setPersonagens(res.data.data || [])).catch(() => setPersonagens([]));
}, []);

async function verificarConhecimento() {
  if (!personagemSelecionado || !topico.trim()) return;
  setGerandoConhecimento(true);
  setErro('');
  try {
    const res = await api.post('/personagem/conhecimento', {
      character_id: personagemSelecionado,
      topico
    });
    setConhecimento(res.data.data);
  } catch {
    setErro('Erro ao verificar conhecimento.');
  }
  setGerandoConhecimento(false);
}

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0] page-fade" style={crimson}>
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>⚔ TAVERNA</span>
        <button onClick={() => navigate('/mestre')}
          className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors" style={cinzel}>
          ← Voltar
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">NARRAÇÃO</p>
        <h1 style={cinzel} className="text-2xl text-[#f0e8d8] font-semibold mb-8">Descrição de Cena</h1>

        <div className="flex gap-2 mb-8">
  <button onClick={() => setTab('descricao')}
    className={`px-4 py-2 text-xs tracking-widest transition-colors ${tab === 'descricao' ? 'bg-[#c8a84b] text-[#0f0e0c]' : 'border border-[#c8a84b30] text-[#c8a84b]'}`}
    style={{ ...cinzel, borderRadius: '2px' }}>
    DESCRIÇÃO DE CENA
  </button>
  <button onClick={() => setTab('consequencia')}
    className={`px-4 py-2 text-xs tracking-widest transition-colors ${tab === 'consequencia' ? 'bg-[#c8a84b] text-[#0f0e0c]' : 'border border-[#c8a84b30] text-[#c8a84b]'}`}
    style={{ ...cinzel, borderRadius: '2px' }}>
    CONSEQUÊNCIAS
  </button>
</div>


        {tab === 'descricao' && (
  <>
        <div className="border border-[#c8a84b30] bg-[#161410] mb-8 p-6">
          <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] block mb-2">CONTEXTO</label>
          <textarea value={contexto} onChange={e => setContexto(e.target.value)}
            placeholder="Ex: os jogadores entram numa taverna abandonada há anos, com um lobo faminto escondido nas sombras..."
            rows={4}
            className="bg-[#0f0e0c] border border-[#c8a84b30] text-[#e8e0d0] px-4 py-3 w-full focus:outline-none focus:border-[#c8a84b60] resize-none mb-4"
            style={{ borderRadius: '2px' }} />
          {erro && <p className="text-red-400 text-sm mb-3">{erro}</p>}
          <button onClick={gerarDescricao} disabled={!contexto.trim() || gerando}
            className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30"
            style={{ ...cinzel, borderRadius: '2px' }}>
            {gerando ? 'Gerando...' : 'Gerar Descrição →'}
          </button>
        </div>

        {descricao && (
          <div className="border border-[#c8a84b20] bg-[#161410] mb-8 p-6">
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-3">DESCRIÇÃO GERADA</p>
            <p className="text-[#e8e0d0] text-base leading-relaxed italic">{descricao}</p>
          </div>
        )}

        {historico.length > 1 && (
          <div>
            <p style={cinzel} className="text-[#4a4030] text-xs tracking-[2px] mb-3">HISTÓRICO DA SESSÃO</p>
            <div className="space-y-2">
              {historico.slice(1).map(h => (
                <div key={h.id} className="border border-[#c8a84b10] bg-[#0f0e0c] p-4">
                  <p className="text-[#4a4030] text-xs mb-1">{h.contexto}</p>
                  <p className="text-[#6a6050] text-sm italic">{h.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        )}
  </>
)}
        
        {tab === 'consequencia' && (
  <>
    <div className="border border-[#c8a84b30] bg-[#161410] mb-8 p-6">
      <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] block mb-2">O QUE OS JOGADORES FIZERAM?</label>
      <textarea value={situacao} onChange={e => setSituacao(e.target.value)}
        placeholder="Ex: os jogadores decidiram libertar o prisioneiro em vez de entregá-lo ao capitão da guarda..."
        rows={3}
        className="bg-[#0f0e0c] border border-[#c8a84b30] text-[#e8e0d0] px-4 py-3 w-full focus:outline-none focus:border-[#c8a84b60] resize-none mb-4"
        style={{ borderRadius: '2px' }} />
      {erro && <p className="text-red-400 text-sm mb-3">{erro}</p>}
      <button onClick={gerarConsequencia} disabled={!situacao.trim() || gerandoConsequencia}
        className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30"
        style={{ ...cinzel, borderRadius: '2px' }}>
        {gerandoConsequencia ? 'Gerando...' : 'Gerar Consequências →'}
      </button>
    </div>

    {consequencias && (
      <div className="space-y-3">
        <div className="border border-[#4a8a4a30] bg-[#4a8a4a08] p-5">
          <p style={cinzel} className="text-[#4a8a4a] text-xs tracking-[2px] mb-2">✦ FAVORÁVEL</p>
          <p className="text-[#e8e0d0] text-sm leading-relaxed">{consequencias.favoravel}</p>
        </div>
        <div className="border border-[#8a7020] border-opacity-30 bg-[#8a702008] p-5">
          <p style={cinzel} className="text-[#8a7020] text-xs tracking-[2px] mb-2">◐ NEUTRO / COMPLICADO</p>
          <p className="text-[#e8e0d0] text-sm leading-relaxed">{consequencias.neutro}</p>
        </div>
        <div className="border border-red-900 border-opacity-30 bg-red-950 bg-opacity-10 p-5">
          <p style={cinzel} className="text-red-500 text-xs tracking-[2px] mb-2">✕ DESFAVORÁVEL</p>
          <p className="text-[#e8e0d0] text-sm leading-relaxed">{consequencias.desfavoravel}</p>
        </div>
      </div>
    )}
  </>
)}

<button onClick={() => setTab('conhecimento')}
  className={`px-4 py-2 text-xs tracking-widest transition-colors ${tab === 'conhecimento' ? 'bg-[#c8a84b] text-[#0f0e0c]' : 'border border-[#c8a84b30] text-[#c8a84b]'}`}
  style={{ ...cinzel, borderRadius: '2px' }}>
  CONHECIMENTO
</button>

{tab === 'conhecimento' && (
  <>
    <div className="border border-[#c8a84b30] bg-[#161410] mb-8 p-6">
      <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] block mb-2">PERSONAGEM</label>
      <select value={personagemSelecionado} onChange={e => setPersonagemSelecionado(e.target.value)}
        className="bg-[#0f0e0c] border border-[#c8a84b30] text-[#e8e0d0] px-4 py-3 w-full focus:outline-none focus:border-[#c8a84b60] mb-4"
        style={{ borderRadius: '2px' }}>
        <option value="">Selecione...</option>
        {personagens.map(p => (
          <option key={p.id} value={p.id}>{p.data?.name || p.name}</option>
        ))}
      </select>

      <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] block mb-2">TÓPICO</label>
      <textarea value={topico} onChange={e => setTopico(e.target.value)}
        placeholder="Ex: a lenda do Duque Valerius, esse símbolo arcano gravado na parede..."
        rows={2}
        className="bg-[#0f0e0c] border border-[#c8a84b30] text-[#e8e0d0] px-4 py-3 w-full focus:outline-none focus:border-[#c8a84b60] resize-none mb-4"
        style={{ borderRadius: '2px' }} />

      {erro && <p className="text-red-400 text-sm mb-3">{erro}</p>}
      <button onClick={verificarConhecimento} disabled={!personagemSelecionado || !topico.trim() || gerandoConhecimento}
        className="bg-[#c8a84b] text-[#0f0e0c] px-6 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30"
        style={{ ...cinzel, borderRadius: '2px' }}>
        {gerandoConhecimento ? 'Consultando...' : 'Verificar Conhecimento →'}
      </button>
    </div>

    {conhecimento && (
      <div className="border border-[#c8a84b20] bg-[#161410] p-6">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-3">O QUE O PERSONAGEM SABE</p>
        <p className="text-[#e8e0d0] text-sm leading-relaxed italic">{conhecimento}</p>
      </div>
    )}
  </>
)}
      </div>
    </div>
  );
}