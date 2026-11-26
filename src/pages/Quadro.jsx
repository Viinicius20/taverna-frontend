import { cinzel, crimson } from '../estilos';
import { getCampanhaId } from '../utils/campanha';
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import AnotarBoato from '../components/AnotarBoato';
import { confirmar } from '../utils/notificar';

const BOTAO_QUADRO = 'rounded-sm border px-4 py-2 text-xs font-semibold ' +
  'transition-colors focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-[#c8a84b] ' +
  'disabled:opacity-50';

export default function Quadro() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(null);
  const [countdownDisplay, setCountdownDisplay] = useState('');
  const CAMPANHA_ID = getCampanhaId();
  const { user } = useUser();
  const isMestre = user?.role === 'mestre';
  const [mural, setMural] = useState([]);
  const [mundo, setMundo] = useState([]);
  const [localId, setLocalId] = useState(null);
  const [carregado, setCarregado] = useState(false);
  const [painel, setPainel] = useState('');
  const [fala, setFala] = useState(null);
  const [texto, setTexto] = useState('');
  const [revisado, setRevisado] = useState(false);
  const [liberadoEm, setLiberadoEm] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [entradas, setEntradas] = useState([]);
  const [editor, setEditor] = useState({ texto: '', ativo: true });
  const [buscaFicha, setBuscaFicha] = useState('');

  const local = mundo.find(item => item.tipo === 'local' && item.id === localId);
  const aguardando = liberadoEm && new Date(liberadoEm).getTime() > Date.now();
  const normalizar = v => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const busca = normalizar(buscaFicha.trim());
  const sugestoes = busca && !editor.entidade_id
    ? mundo.filter(item => normalizar(item.nome).includes(busca)).slice(0, 6)
    : [];

  const carregarMural = useCallback(async () => {
    const res = await api.get('/rumores/mural');
    setMural(res.data.data || []);
    setCarregado(true);
  }, []);

useEffect(() => {
  if (!user) return;

  function atualizar() {
    carregarMural().catch(() => setErro('Não foi possível carregar o quadro.'));
    api.get(`/campanha-local/${CAMPANHA_ID}`)
      .then(res => setLocalId(res.data?.data ?? null))
      .catch(() => {});
  }

  atualizar();
  api.get(`/wiki-indice/${CAMPANHA_ID}/jogador`)
    .then(res => setMundo(res.data.data || []))
    .catch(() => {});

  const timer = setInterval(atualizar, 10000);
  return () => clearInterval(timer);
}, [user, CAMPANHA_ID, carregarMural]);

async function executar(acao) {
  if (ocupado) return;
  setOcupado(true);
  setErro('');
  setAviso('');

  try {
    await acao();
  } catch (e) {
    const detalhe = e.response?.data?.detail;
    if (detalhe?.liberado_em) setLiberadoEm(detalhe.liberado_em);
    setErro(
      typeof detalhe === 'string' ? detalhe
        : detalhe?.mensagem || 'Não foi possível concluir a ação.'
    );
  } finally {
    setOcupado(false);
  }
}

function ouvir() {
  executar(async () => {
    const res = await api.get('/boato');
    setFala(res.data.data);
    setPainel('ouvir');
  });
}

function abrirSugestao() {
  executar(async () => {
    const res = await api.get('/rumores/sugestao');
    setLiberadoEm(res.data.data.liberado_em);
    setPainel('sugerir');
  });
}

function revisar() {
  executar(async () => {
    const res = await api.post('/rumores/revisar', { texto: texto.trim() });
    setTexto(res.data.data.texto);
    setRevisado(true);
  });
}

function enviarSugestao() {
  executar(async () => {
    const res = await api.post('/rumores/sugestao', { texto: texto.trim() });
    setLiberadoEm(res.data.data.liberado_em);
    setTexto('');
    setRevisado(false);
    setPainel('');
    setAviso('Rumor enviado. Ele já pode circular na taverna.');
  });
}

async function carregarGestao() {
  const res = await api.get('/rumores/gerenciar');
  setEntradas(res.data.data || []);
}

function selecionarEntrada(entrada) {
  setEditor(entrada || { texto: '', ativo: true });
  const ficha = mundo.find(
    item => item.tipo === entrada?.entidade_tipo && item.id === entrada?.entidade_id
  );
  setBuscaFicha(ficha?.nome || '');
}

function salvarEntrada() {
  executar(async () => {
    const dados = {
      texto: editor.texto.trim(),
      ativo: editor.ativo,
      entidade_tipo: editor.entidade_tipo ?? null,
      entidade_id: editor.entidade_id ?? null,
    };

    if (editor.id) await api.patch(`/rumores/gerenciar/${editor.id}`, dados);
    else await api.post('/rumores/gerenciar', dados);

    selecionarEntrada(null);
    setAviso('Rumor salvo.');
    await carregarGestao();
  });
}

async function removerDoQuadro(id) {
  if (!(await confirmar('Remover esta fala do quadro?'))) return;

  executar(async () => {
    await api.delete(`/rumores/mural/${id}`);
    setMural(atual => atual.filter(item => item.id !== id));
    setAviso('Fala removida do quadro.');
  });
}

useEffect(() => {
  let ativo = true;

  async function buscarCountdown() {
    try {
      const res = await api.get(`/session-state/${CAMPANHA_ID}`);
      const json = res.data;
      if (!ativo) return;
      if (json.data?.countdown_active && json.data?.countdown_end) {
        const diff = Math.floor((new Date(json.data.countdown_end) - new Date()) / 1000);
        setCountdown(diff > 0 ? json.data : null);
      } else {
        setCountdown(null);
        setCountdownDisplay('');
      }
    } catch {}
  }

  buscarCountdown();
  const interval = setInterval(buscarCountdown, 3000);
  return () => {
    ativo = false;
    clearInterval(interval);
  };
}, [CAMPANHA_ID]);;

// Countdown: roda independente
useEffect(() => {
  if (!countdown?.countdown_end) return;
  const interval = setInterval(() => {
    const diff = Math.max(0, Math.floor((new Date(countdown.countdown_end) - new Date()) / 1000));
    const min = Math.floor(diff / 60);
    const seg = diff % 60;
    setCountdownDisplay(`${min}:${seg.toString().padStart(2, '0')}`);
    if (diff === 0) setCountdown(null);
  }, 1000);
  return () => clearInterval(interval);
}, [countdown?.countdown_end]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0] page-fade" style={crimson}>

      <nav className="flex items-center justify-between px-4 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>⚔ TAVERNA</span>
        <div className="flex gap-3 items-center">
          <button onClick={() => navigate('/')}
            className="text-[#9a8e78] text-sm hover:text-[#c8a84b] transition-colors" style={cinzel}>
            ← Voltar
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">SESSÃO ATUAL</p>
        <h1 style={cinzel} className="text-2xl text-[#f0e8d8] font-semibold mb-8">Quadro de Rumores</h1>

        {local && (
          <p className="mb-4 text-sm text-[#9a8e78]">
            Local do grupo · <span className="text-[#c8a84b]">{local.nome}</span>
          </p>
        )}

        {user && (
          <div className="mb-6 flex flex-wrap items-center gap-2" style={cinzel}>
            <button
              type="button"
              disabled={ocupado}
              onClick={ouvir}
              className={`${BOTAO_QUADRO} border-[#c8a84b] bg-[#c8a84b]
                          text-[#161410] hover:bg-[#e0c060]`}
            >
              🍺 Ouvir boatos
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={abrirSugestao}
              className={`${BOTAO_QUADRO} border-[#c8a84b50] text-[#c8a84b]
                          hover:bg-[#c8a84b15]`}
            >
              Sugerir rumor
            </button>
            {isMestre && (
              <button
                type="button"
                disabled={ocupado}
                aria-expanded={painel === 'gerenciar'}
                onClick={() => executar(async () => {
                  if (painel === 'gerenciar') {
                    setPainel('');
                    return;
                  }
                  await carregarGestao();
                  setPainel('gerenciar');
                })}
                className={`${BOTAO_QUADRO} border-[#c8a84b25] text-[#b8a98b]
                            hover:border-[#c8a84b60] hover:text-[#c8a84b]`}
              >
                {painel === 'gerenciar' ? 'Fechar gerenciamento' : 'Gerenciar'}
              </button>
            )}
          </div>
        )}

        {erro && <p role="alert" className="text-red-400 mb-3">{erro}</p>}
        {aviso && <p role="status" className="text-[#c8a84b] mb-3">{aviso}</p>}

        {painel === 'ouvir' && fala && (
          <div className="mb-6 border border-[#c8a84b20] bg-[#161410] p-4">
            <p className="italic">“{fala.boato}”</p>
            <p className="text-xs text-[#9a8e78] mt-2">— {fala.fonte}</p>
            <AnotarBoato
              key={fala.fala_id}
              falaId={fala.fala_id}
              onAnotado={() => carregarMural().catch(() => {})}
            />
          </div>
        )}

        {painel === 'sugerir' && (
          <div className="mb-6 border border-[#c8a84b20] bg-[#161410] p-4 space-y-3">
            {aguardando ? (
              <p className="text-[#9a8e78]">
                Próxima sugestão disponível em {new Date(liberadoEm).toLocaleString('pt-BR')}.
              </p>
            ) : (
              <>
                <textarea
                  value={texto}
                  onChange={e => { setTexto(e.target.value); setRevisado(false); }}
                  maxLength={1000}
                  rows={3}
                  aria-label="Sua sugestão de rumor"
                  placeholder="Escreva como alguém contaria a fofoca na taverna…"
                  className="w-full bg-[#0f0e0c] border border-[#c8a84b20] p-3"
                />
                <p className="text-sm text-[#9a8e78]">
                  {revisado
                    ? 'Confira o texto revisado antes de confirmar.'
                    : 'A IA revisa a escrita. Você pode sugerir um rumor a cada 72 horas.'}
                </p>
                <button
                  type="button"
                  disabled={ocupado || !texto.trim()}
                  onClick={revisado ? enviarSugestao : revisar}
                  className="text-[#c8a84b] underline disabled:opacity-50"
                >
                  {revisado ? 'Confirmar e enviar' : 'Revisar texto'}
                </button>
              </>
            )}
          </div>
        )}

        {isMestre && painel === 'gerenciar' && (
          <div className="mb-6 border border-[#c8a84b20] bg-[#161410] p-4 space-y-3">
            <div className="flex flex-wrap gap-4 text-sm text-[#c8a84b]">
              <button type="button" onClick={() => selecionarEntrada(null)}>Novo rumor</button>
              <Link to="/lendas">Gerenciar lendas</Link>
            </div>
            {entradas.map(entrada => (
              <button
                type="button"
                key={entrada.id}
                onClick={() => selecionarEntrada(entrada)}
                className="block text-left text-sm text-[#e8e0d0]"
              >
                {entrada.ativo ? 'Em circulação' : 'Desativado'} · {entrada.texto}
              </button>
            ))}
            <textarea
              value={editor.texto}
              onChange={e => setEditor(prev => ({ ...prev, texto: e.target.value }))}
              maxLength={1000}
              rows={3}
              aria-label="Texto do rumor"
              className="w-full bg-[#0f0e0c] border border-[#c8a84b20] p-3"
            />
            <input
              value={buscaFicha}
              onChange={e => {
                setBuscaFicha(e.target.value);
                setEditor(prev => ({ ...prev, entidade_tipo: null, entidade_id: null }));
              }}
              placeholder="Vincular ficha do mundo"
              aria-label="Vincular ficha do mundo"
              className="bg-[#0f0e0c] border border-[#c8a84b20] p-2"
            />
            {sugestoes.map(item => (
              <button
                type="button"
                key={`${item.tipo}:${item.id}`}
                onClick={() => {
                  setBuscaFicha(item.nome);
                  setEditor(prev => ({ ...prev, entidade_tipo: item.tipo, entidade_id: item.id }));
                }}
                className="block text-sm text-[#c8a84b]"
              >
                {item.nome} · {item.tipo}
              </button>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editor.ativo}
                onChange={e => setEditor(prev => ({ ...prev, ativo: e.target.checked }))}
              />
              Disponível no sorteio
            </label>
            <button
              type="button"
              onClick={salvarEntrada}
              disabled={ocupado || !editor.texto.trim()}
              className="text-[#c8a84b] underline disabled:opacity-50"
            >
              Salvar rumor
            </button>
          </div>
        )}

        {countdown && countdownDisplay && (
          <div className="border border-red-900 bg-[#1a0808] p-6 text-center mb-8 animate-pulse"
            style={{ borderRadius: '2px' }}>
            <p style={cinzel} className="text-red-600 text-xs tracking-[4px] mb-2">⚠ DECISÃO NECESSÁRIA</p>
            <p style={cinzel} className="text-red-500 text-5xl font-bold tracking-widest">{countdownDisplay}</p>
          </div>
        )}

        {!user ? (
          <p className="text-[#9a8e78]">Entre na campanha para ver o mural.</p>
        ) : !carregado ? (
          <p className="text-[#9a8e78]">Carregando rumores…</p>
        ) : mural.length === 0 ? (
          <p className="text-[#9a8e78] py-8">
            O quadro ainda está vazio. Ouça um boato e anote o que vale lembrar.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {mural.map(item => {
              const lugar = mundo.find(f => f.tipo === 'local' && f.id === item.local_id);
              const ficha = mundo.find(f => f.tipo === item.entidade_tipo && f.id === item.entidade_id);
              {isMestre && (
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => removerDoQuadro(item.id)}
                  className="block mt-3 text-xs text-[#c18078] hover:text-red-300
                            hover:underline disabled:opacity-50"
                >
                  Remover do quadro
                </button>
              )}

              return (
                <article key={item.id} className="border border-[#c8a84b20] bg-[#161410] p-4">
                  <p className="italic break-words">“{item.texto}”</p>
                  <p className="text-xs text-[#9a8e78] mt-2">— {item.fonte}</p>
                  {lugar && <p className="text-xs text-[#9a8e78] mt-1">{lugar.nome}</p>}
                  {ficha && (
                    <Link
                      to={`/wiki?tipo=${encodeURIComponent(ficha.tipo)}&id=${encodeURIComponent(ficha.id)}`}
                      className="inline-block mt-2 text-xs text-[#c8a84b] underline"
                    >
                      Abrir ficha · {ficha.nome}
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
