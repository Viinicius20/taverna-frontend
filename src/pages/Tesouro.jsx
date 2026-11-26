import { cinzel, crimson } from '../estilos';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import { notificar } from '../utils/notificar';

const botaoTesouro = 'rounded-sm border border-[#c8a84b40] px-3 py-2 text-xs ' +
  'text-[#c8a84b] hover:bg-[#c8a84b15] disabled:opacity-40';

const MOEDAS = [
  { chave: 'cobre', rotulo: 'COBRE', cor: '#b87333' },
  { chave: 'prata', rotulo: 'PRATA', cor: '#c0c0c0' },
  { chave: 'electro', rotulo: 'ELECTRO', cor: '#8fb8a8' },
  { chave: 'ouro', rotulo: 'OURO', cor: '#c8a84b' },
  { chave: 'platina', rotulo: 'PLATINA', cor: '#d8e0f0' },
];

const DIVISIVEIS = MOEDAS.filter(({ chave }) => chave !== 'platina');

const NOVO_VAZIO = { nome: '', quantidade: '1', notas: '', valor: '' };
const campo = "bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]";

export default function Tesouro() {
  const navigate = useNavigate();
  const { user } = useUser();
  const isMestre = user?.role === 'mestre';

  const [itens, setItens] = useState([]);
  const [moedas, setMoedas] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [novo, setNovo] = useState(NOVO_VAZIO);
  const [ajuste, setAjuste] = useState({});

  const [historico, setHistorico] = useState([]);
  const [personagens, setPersonagens] = useState([]);
  const [formMov, setFormMov] = useState(null);
  const [movendo, setMovendo] = useState(false);

  const valorMov = Number(formMov?.valor);
  const numPessoas = formMov?.personagens.length ?? 0;
  const parte = numPessoas && Number.isInteger(valorMov)
    ? Math.floor(valorMov / numPessoas) : 0;
  const saldo = moedas[formMov?.moeda] ?? 0;
  const itemMov = itens.find(item => item.id === formMov?.item);
  const divisaoValida = parte > 0 && valorMov <= saldo;
  const entregaValida = formMov?.personagem && itemMov &&
    Number.isInteger(valorMov) && valorMov > 0 && valorMov <= itemMov.quantidade;

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/tesouro');
      setItens(res.data.data.itens || []);
      setMoedas(res.data.data.moedas || {});
      setHistorico(res.data.data.historico || []);
      setErro(false);
    } catch {
      setErro(true);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') carregar();
    }, 10000);
    return () => clearInterval(timer);
  }, [carregar]);

  async function adicionar() {
    const nome = novo.nome.trim();
    if (!nome) return;
    try {
      const res = await api.post('/tesouro', {
        nome,
        quantidade: Number(novo.quantidade) || 1,
        notas: novo.notas.trim() || null,
        valor_po: novo.valor === '' ? null : Number(novo.valor),
      });
      setItens(prev => [res.data.data, ...prev]);
      setNovo(NOVO_VAZIO);
      await carregar();
    } catch {
      notificar('Não foi possível adicionar. Confira os campos.', 'erro');
    }
  }

  async function mudarQuantidade(item, delta) {
    const quantidade = Math.max(0, item.quantidade + delta);
    if (quantidade === item.quantidade) return;
    try {
      const res = await api.patch(`/tesouro/${item.id}`, { quantidade }, {
        params: { quantidade_anterior: item.quantidade },
      });
      setItens(prev => prev.map(i => (i.id === item.id ? res.data.data : i)));
      await carregar();
    } catch (e) {
      notificar(
        e.response?.status === 409
          ? 'A quantidade mudou. Confira o tesouro atualizado.'
          : 'Não foi possível alterar a quantidade.',
        'erro'
      );
      await carregar();
    }
  }

  async function remover(item) {
    if (!window.confirm(`Remover "${item.nome}" do tesouro?`)) return;
    try {
      await api.delete(`/tesouro/${item.id}`);
      setItens(prev => prev.filter(i => i.id !== item.id));
      await carregar();
    } catch {
      notificar('Não foi possível remover o item.', 'erro');
    }
  }

  async function aplicarMoedas() {
    const delta = {};
    MOEDAS.forEach(({ chave }) => {
      const n = parseInt(ajuste[chave], 10);
      if (n) delta[chave] = n;
    });
    if (Object.keys(delta).length === 0) return;
    try {
      const res = await api.patch('/tesouro/moedas', delta);
      setMoedas(res.data.data);
      setAjuste({});
      await carregar();
    } catch {
      notificar('Não foi possível ajustar as moedas.', 'erro');
    }
  }

async function abrirMovimento(item = null) {
  if (movendo) return;
  setMovendo(true);

  try {
    const res = await api.get('/characters');
    setPersonagens(res.data.data || []);
    setFormMov({
      tipo: item ? 'entregar' : 'dividir',
      item: item?.id,
      moeda: 'ouro',
      valor: item ? '1' : '',
      personagens: [],
      personagem: '',
      operacao_id: crypto.randomUUID(),
    });
  } catch {
    notificar('Não foi possível carregar os personagens.', 'erro');
  } finally {
    setMovendo(false);
  }
}

function marcarPersonagem(id) {
  setFormMov(prev => ({
    ...prev,
    personagens: prev.personagens.includes(id)
      ? prev.personagens.filter(p => p !== id)
      : [...prev.personagens, id],
  }));
}

async function confirmarMovimento(e) {
  e.preventDefault();
  if (!formMov || movendo) return;

  const dividir = formMov.tipo === 'dividir';
  if (dividir ? !divisaoValida : !entregaValida) return;

  setMovendo(true);
  const dados = dividir
    ? { moeda: formMov.moeda, valor: valorMov, personagens: formMov.personagens }
    : { item: formMov.item, personagem: formMov.personagem, quantidade: valorMov };

  try {
    await api.post(`/tesouro/${formMov.tipo}`, {
      ...dados,
      operacao_id: formMov.operacao_id,
    });
    setFormMov(null);
    notificar(dividir ? 'Moedas divididas.' : 'Item entregue.');
    await carregar();
  } catch (e) {
    const detalhe = e.response?.data?.detail;
    notificar(typeof detalhe === 'string' ? detalhe : 'Não foi possível concluir a movimentação.', 'erro');
    await carregar();
  } finally {
    setMovendo(false);
  }
}

  const valorTotal = itens.reduce((s, i) => s + (i.valor_po || 0) * i.quantidade, 0);

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0] page-fade" style={crimson}>
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>⚔ TAVERNA</span>
        <button onClick={() => navigate(-1)}
          className="text-[#9a8e78] text-sm hover:text-[#c8a84b] transition-colors" style={cinzel}>
          ← Voltar
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">DO GRUPO</p>
        <h1 style={cinzel} className="text-3xl text-[#f0e8d8] font-bold mb-8">Tesouro</h1>

        {carregando && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
          </div>
        )}

        {erro && !carregando && (
          <p className="text-red-400 text-sm text-center py-8">Não foi possível carregar o tesouro.</p>
        )}

        {!carregando && !erro && (
          <>
            {/* MOEDAS */}
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-3">MOEDAS</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
              {MOEDAS.map(({ chave, rotulo, cor }) => (
                <div key={chave} className="border border-[#c8a84b15] bg-[#161410] px-3 py-3 text-center"
                  style={{ borderRadius: '2px' }}>
                  <p style={{ ...cinzel, color: cor }} className="text-xl font-bold">{moedas[chave] ?? 0}</p>
                  <p style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] mt-1">{rotulo}</p>
                  {isMestre && (
                    <input type="number" value={ajuste[chave] ?? ''} placeholder="±"
                      aria-label={`Ajustar ${rotulo}`}
                      onChange={e => setAjuste(prev => ({ ...prev, [chave]: e.target.value }))}
                      className={`${campo} w-full mt-2 text-center`} style={{ borderRadius: '2px' }} />
                  )}
                </div>
              ))}
            </div>
            {isMestre && (
              <button onClick={aplicarMoedas} style={{ ...cinzel, borderRadius: '2px' }}
                className="border border-[#c8a84b40] text-[#c8a84b] px-4 py-2 text-xs tracking-widest hover:bg-[#c8a84b10] transition-colors mb-10">
                APLICAR AJUSTE
              </button>
            )}
            {!isMestre && <div className="mb-10" />}

            {isMestre && (
              <div className="mb-6">
                <button
                  type="button"
                  disabled={movendo}
                  onClick={() => abrirMovimento()}
                  className={botaoTesouro}
                  id="dividir-tesouro"
                >
                  Dividir moedas
                </button>

                {formMov && (
                  <form onSubmit={confirmarMovimento} className="mt-3 border border-[#c8a84b20] bg-[#161410] p-4">
                    <fieldset disabled={movendo} className="space-y-3">
                      <legend className="text-sm text-[#c8a84b]">
                        {formMov.tipo === 'dividir'
                          ? 'Dividir moedas'
                          : `Enviar ao inventário · ${itemMov?.nome || 'Item indisponível'}`}
                      </legend>

                      {formMov.tipo === 'dividir' ? (
                        <>
                          <div className="flex flex-wrap gap-2">
                            <select
                              aria-label="Moeda pra dividir"
                              value={formMov.moeda}
                              onChange={e => setFormMov(prev => ({ ...prev, moeda: e.target.value }))}
                              className={campo}
                            >
                              {DIVISIVEIS.map(({ chave, rotulo }) => (
                                <option key={chave} value={chave}>{rotulo}</option>
                              ))}
                            </select>
                            <input
                              type="number" min={1} max={saldo} step={1}
                              aria-label="Valor a dividir" placeholder="Valor a dividir"
                              value={formMov.valor}
                              onChange={e => setFormMov(prev => ({ ...prev, valor: e.target.value }))}
                              className={campo}
                            />
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm">
                            {personagens.map(p => (
                              <label key={p.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={formMov.personagens.includes(p.id)}
                                  onChange={() => marcarPersonagem(p.id)}
                                />
                                {p.data?.name || p.name}
                              </label>
                            ))}
                          </div>
                          {divisaoValida && (
                            <p className="text-sm text-[#c8a84b]">
                              {parte} por personagem · sobra {valorMov % numPessoas} da divisão ·
                              saldo final {saldo - parte * numPessoas}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <select
                            aria-label="Personagem que vai receber"
                            value={formMov.personagem}
                            onChange={e => setFormMov(prev => ({ ...prev, personagem: e.target.value }))}
                            className={campo}
                          >
                            <option value="">Escolha o personagem</option>
                            {personagens.map(p => (
                              <option key={p.id} value={p.id}>{p.data?.name || p.name}</option>
                            ))}
                          </select>
                          <input
                            type="number" min={1} max={itemMov?.quantidade} step={1}
                            aria-label="Quantidade a entregar"
                            value={formMov.valor}
                            onChange={e => setFormMov(prev => ({ ...prev, valor: e.target.value }))}
                            className={`${campo} w-24`}
                          />
                        </div>
                      )}

                      {personagens.length === 0 && (
                        <p className="text-sm text-[#9a8e78]">A campanha ainda não tem personagens.</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={movendo || !(formMov.tipo === 'dividir' ? divisaoValida : entregaValida)}
                          className={botaoTesouro}
                        >
                          {formMov.tipo === 'dividir' ? 'Confirmar divisão' : 'Confirmar entrega'}
                        </button>
                        <button type="button" onClick={() => setFormMov(null)} className={botaoTesouro}>
                          Cancelar
                        </button>
                      </div>
                    </fieldset>
                  </form>
                )}
              </div>
            )}

            {/* ITENS */}
            <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
              <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">ITENS E RECURSOS</p>
              {valorTotal > 0 && (
                <p className="text-[#8a7e68] text-xs">Valor estimado: {valorTotal} PO</p>
              )}
            </div>

            {isMestre && (
              <div className="border border-[#c8a84b20] bg-[#161410] p-4 mb-4 grid gap-2 sm:grid-cols-6"
                style={{ borderRadius: '2px' }}>
                <input value={novo.nome} maxLength={80} placeholder="Nome do item" aria-label="Nome do item"
                  onChange={e => setNovo(p => ({ ...p, nome: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && adicionar()}
                  className={`${campo} sm:col-span-3`} style={{ borderRadius: '2px' }} />
                <input type="number" min={0} value={novo.quantidade} aria-label="Quantidade"
                  onChange={e => setNovo(p => ({ ...p, quantidade: e.target.value }))}
                  className={campo} style={{ borderRadius: '2px' }} />
                <input type="number" min={0} value={novo.valor} placeholder="Valor (PO)" aria-label="Valor em PO"
                  onChange={e => setNovo(p => ({ ...p, valor: e.target.value }))}
                  className={campo} style={{ borderRadius: '2px' }} />
                <button onClick={adicionar} disabled={!novo.nome.trim()} style={{ ...cinzel, borderRadius: '2px' }}
                  className="bg-[#c8a84b] text-[#0f0e0c] px-3 py-2 text-xs font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-40">
                  + ADICIONAR
                </button>
                <input value={novo.notas} maxLength={300} placeholder="Notas (opcional)" aria-label="Notas"
                  onChange={e => setNovo(p => ({ ...p, notas: e.target.value }))}
                  className={`${campo} sm:col-span-6`} style={{ borderRadius: '2px' }} />
              </div>
            )}

            {itens.length === 0 ? (
              <p className="text-[#8a7e68] text-sm text-center py-10">O tesouro do grupo está vazio.</p>
            ) : (
              <div className="space-y-2">
                {itens.map(item => (
                  <div key={item.id} className="border border-[#c8a84b15] bg-[#161410] px-4 py-3"
                    style={{ borderRadius: '2px' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p style={cinzel} className="text-[#e8e0d0] text-sm break-words">{item.nome}</p>
                        {item.notas && (
                          <p className="text-[#8a7e68] text-xs mt-1 break-words">{item.notas}</p>
                        )}
                        {item.valor_po != null && (
                          <p className="text-[#8a7e68] text-xs mt-1">{item.valor_po} PO cada</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isMestre && (
                          <button onClick={() => mudarQuantidade(item, -1)} aria-label="Diminuir"
                            className="border border-[#c8a84b30] text-[#c8a84b] w-7 h-7 hover:bg-[#c8a84b15]"
                            style={{ borderRadius: '2px' }}>−</button>
                        )}
                        <span style={cinzel} className="text-[#c8a84b] text-lg w-10 text-center">×{item.quantidade}</span>
                        {isMestre && (
                          <>
                            <button onClick={() => mudarQuantidade(item, 1)} aria-label="Aumentar"
                              className="border border-[#c8a84b30] text-[#c8a84b] w-7 h-7 hover:bg-[#c8a84b15]"
                              style={{ borderRadius: '2px' }}>+</button>
                            <button onClick={() => remover(item)} aria-label={`Remover ${item.nome}`}
                              className="text-red-600 hover:text-red-400 text-lg ml-1">×</button>
                          </>
                        )}
                      </div>
                      {isMestre && item.quantidade > 0 && (
                        <button
                          type="button"
                          disabled={movendo}
                          className={`${botaoTesouro} mt-2`}
                          onClick={async () => {
                            await abrirMovimento(item);
                            document.getElementById('dividir-tesouro')?.scrollIntoView({ block: 'start' });
                          }}
                        >
                          Enviar ao inventário
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <section className="mt-10">
              <h2 style={cinzel} className="mb-3 text-xs tracking-[3px] text-[#c8a84b]">
                HISTÓRICO DO TESOURO
              </h2>
              {historico.length === 0 ? (
                <p className="text-sm text-[#9a8e78]">Ainda não há movimentações registradas.</p>
              ) : (
                <ul className="divide-y divide-[#c8a84b20]">
                  {historico.map(mov => (
                    <li key={mov.id} className="flex flex-wrap gap-x-4 gap-y-1 py-2 text-sm">
                      <span className="text-[#c8a84b]">Dia {mov.dia_total + 1}</span>
                      <span className="text-[#e8e0d0]">{mov.descricao}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}