import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import { notificar } from '../utils/notificar';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };

const MOEDAS = [
  { chave: 'cobre', rotulo: 'COBRE', cor: '#b87333' },
  { chave: 'prata', rotulo: 'PRATA', cor: '#c0c0c0' },
  { chave: 'electro', rotulo: 'ELECTRO', cor: '#8fb8a8' },
  { chave: 'ouro', rotulo: 'OURO', cor: '#c8a84b' },
  { chave: 'platina', rotulo: 'PLATINA', cor: '#d8e0f0' },
];

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

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/tesouro');
      setItens(res.data.data.itens || []);
      setMoedas(res.data.data.moedas || {});
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
    } catch {
      notificar('Não foi possível adicionar. Confira os campos.', 'erro');
    }
  }

  async function mudarQuantidade(item, delta) {
    const quantidade = Math.max(0, item.quantidade + delta);
    if (quantidade === item.quantidade) return;
    try {
      const res = await api.patch(`/tesouro/${item.id}`, { quantidade });
      setItens(prev => prev.map(i => (i.id === item.id ? res.data.data : i)));
    } catch {
      notificar('Não foi possível alterar a quantidade.', 'erro');
    }
  }

  async function remover(item) {
    if (!window.confirm(`Remover "${item.nome}" do tesouro?`)) return;
    try {
      await api.delete(`/tesouro/${item.id}`);
      setItens(prev => prev.filter(i => i.id !== item.id));
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
    } catch {
      notificar('Não foi possível ajustar as moedas.', 'erro');
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}