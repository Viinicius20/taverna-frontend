import { useEffect, useState } from 'react';
import api from '../services/api';
import { cinzel } from '../estilos';
import usePolling from '../utils/usePolling';

const painel = 'mb-4 space-y-3 rounded-sm border border-[#c8a84b25] bg-[#161410] p-4';
const campo = 'rounded-sm border border-[#c8a84b25] bg-[#0f0e0c] px-2 py-2 text-sm';
const botao = 'rounded-sm border border-[#c8a84b45] px-3 py-2 text-xs text-[#c8a84b] ' +
  'hover:bg-[#c8a84b15] disabled:opacity-40';

const MODOS = {
  normal: 'Normal',
  vantagem: 'Vantagem',
  desvantagem: 'Desvantagem',
};

function mensagem(e, padrao) {
  const detalhe = e.response?.data?.detail;
  return typeof detalhe === 'string' ? detalhe : padrao;
}

function ResumoRolagem({ resultado, cd }) {
  const dado = resultado.dados?.rolls?.[0];
  const bonus = resultado.modificador ?? 0;

  return (
    <span className="text-[#c8a84b]">
      {dado} {bonus < 0 ? '−' : '+'} {Math.abs(bonus)} = <strong>{resultado.total}</strong>
      {cd != null && (resultado.total >= cd ? ' · Passou' : ' · Falhou')}
    </span>
  );
}

export function PedidosRolagemMestre({ personagens }) {
  const [aberto, setAberto] = useState(false);
  const [opcoes, setOpcoes] = useState(null);
  const [tipo, setTipo] = useState('pericia');
  const [chave, setChave] = useState('');
  const [modo, setModo] = useState('normal');
  const [cd, setCd] = useState('');
  const [cdOculta, setCdOculta] = useState(true);
  const [contexto, setContexto] = useState('');
  const [selecionados, setSelecionados] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  const jogadores = personagens.filter(p => p.user_id);
  const nomes = Object.fromEntries(
    personagens.map(p => [p.id, p.data?.name || p.name])
  );
  const grupos = Object.values(linhas.reduce((lista, linha) => {
    (lista[linha.pedido_id] ??= []).push(linha);
    return lista;
  }, {}));

  async function carregar() {
    const res = await api.get('/pedidos-rolagem');
    setLinhas(res.data.data || []);
  }

  usePolling(() => {
    carregar().catch(() => {});
  }, 4000);

  async function abrirFormulario() {
    if (aberto) {
      setAberto(false);
      return;
    }
    setErro('');
    if (opcoes) {
      setAberto(true);
      return;
    }

    setOcupado(true);
    try {
      const res = await api.get('/pedidos-rolagem/opcoes');
      setOpcoes(res.data.data);
      setAberto(true);
    } catch {
      setErro('Não foi possível carregar os testes.');
    } finally {
      setOcupado(false);
    }
  }

  function alternar(id) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  }

  async function enviar(e) {
    e.preventDefault();
    if (!chave || !selecionados.length || ocupado) return;
    setOcupado(true);
    setErro('');

    try {
      await api.post('/pedidos-rolagem', {
        tipo, chave, modo, contexto,
        cd: cd === '' ? null : Number(cd),
        cd_oculta: cdOculta,
        personagens: selecionados,
      });
      setAberto(false);
      setSelecionados([]);
      setContexto('');
      await carregar().catch(() => {});
    } catch (e) {
      setErro(mensagem(e, 'Não foi possível enviar o pedido.'));
    } finally {
      setOcupado(false);
    }
  }

  async function fechar(pedidoId) {
    if (ocupado) return;
    setOcupado(true);
    setErro('');
    try {
      await api.patch(`/pedidos-rolagem/${pedidoId}/fechar`);
      setLinhas(prev => prev.filter(linha => linha.pedido_id !== pedidoId));
    } catch (e) {
      setErro(mensagem(e, 'Não foi possível fechar o pedido.'));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className={painel}>
      <button type="button" style={cinzel} className={botao}
        disabled={ocupado} aria-expanded={aberto} onClick={abrirFormulario}>
        {aberto ? 'Fechar formulário' : '🎲 Pedir uma rolagem'}
      </button>

      {aberto && (
        <form onSubmit={enviar} className="space-y-3">
          <fieldset disabled={ocupado} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <select className={campo} aria-label="Tipo de teste" value={tipo}
                onChange={e => { setTipo(e.target.value); setChave(''); }}>
                <option value="pericia">Perícia</option>
                <option value="salvaguarda">Salvaguarda</option>
              </select>

              <select className={campo} aria-label="Teste" value={chave} required
                onChange={e => setChave(e.target.value)}>
                <option value="">Escolha o teste</option>
                {opcoes[tipo].map(teste => (
                  <option key={teste.chave} value={teste.chave}>{teste.rotulo}</option>
                ))}
              </select>

              <select className={campo} aria-label="Modo da rolagem" value={modo}
                onChange={e => setModo(e.target.value)}>
                {Object.entries(MODOS).map(([id, nome]) => (
                  <option key={id} value={id}>{nome}</option>
                ))}
              </select>

              <input className={`${campo} w-24`} type="number" min={1} max={99}
                aria-label="CD opcional" placeholder="CD"
                value={cd} onChange={e => setCd(e.target.value)} />
            </div>

            {cd !== '' && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={cdOculta}
                  onChange={e => setCdOculta(e.target.checked)} />
                Ocultar CD dos jogadores
              </label>
            )}

            <input className={`${campo} w-full`} value={contexto} maxLength={200}
              aria-label="Contexto para os jogadores"
              placeholder="Ex.: Quem entrou na oficina nessa hora?"
              onChange={e => setContexto(e.target.value)} />

            <div className="flex flex-wrap gap-3 text-sm">
              {jogadores.length === 0 && (
                <p className="text-[#9a8e78]">Nenhum personagem tem jogador vinculado.</p>
              )}
              {jogadores.map(p => (
                <label key={p.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={selecionados.includes(p.id)}
                    onChange={() => alternar(p.id)} />
                  {nomes[p.id]}
                </label>
              ))}
            </div>

            <button type="submit" className={botao} disabled={!chave || !selecionados.length}>
              Enviar pedido
            </button>
          </fieldset>
        </form>
      )}

      {grupos.map(grupo => {
        const pedido = grupo[0];
        const respondidos = grupo.filter(linha => linha.resultado).length;

        return (
          <article key={pedido.pedido_id} className="space-y-2 border-t border-[#c8a84b20] pt-3">
            <h3 className="text-sm text-[#e8e0d0]">
              {pedido.rotulo} · {respondidos}/{grupo.length} responderam
            </h3>
            <p className="text-xs text-[#9a8e78]">
              {MODOS[pedido.modo]}
              {pedido.cd != null && ` · CD ${pedido.cd}${pedido.cd_oculta ? ' (oculta)' : ''}`}
            </p>
            {pedido.contexto && <p className="text-sm">{pedido.contexto}</p>}

            {grupo.map(linha => (
              <p key={linha.id} className="text-sm">
                {nomes[linha.character_id] || 'Personagem'} ·{' '}
                {linha.resultado
                  ? <ResumoRolagem resultado={linha.resultado} cd={pedido.cd} />
                  : <span className="text-[#9a8e78]">Aguardando</span>}
              </p>
            ))}

            <button type="button" className={botao} disabled={ocupado}
              onClick={() => fechar(pedido.pedido_id)}>
              Fechar pedido
            </button>
          </article>
        );
      })}

      {erro && <p role="alert" className="text-sm text-red-400">{erro}</p>}
    </section>
  );
}

export function PedidosRolagemFicha({ personagemId }) {
  const [pedidos, setPedidos] = useState([]);
  const [rolando, setRolando] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setPedidos([]);
    setErro('');
  }, [personagemId]);

  async function carregar() {
    const res = await api.get(`/pedidos-rolagem/personagem/${personagemId}`);
    setPedidos(res.data.data || []);
  }

  usePolling(() => {
    carregar().catch(() => {});
  }, 4000, Boolean(personagemId));

  async function responder(id) {
    if (rolando) return;
    setRolando(id);
    setErro('');

    try {
      const res = await api.post(`/pedidos-rolagem/${id}/responder`);
      setPedidos(prev => prev.map(p => p.id === id ? res.data.data : p));
    } catch (e) {
      setErro(mensagem(e, 'Não foi possível responder ao pedido.'));
    } finally {
      setRolando(null);
    }
  }

  if (!pedidos.length && !erro) return null;

  return (
    <section className={painel}>
      <h2 style={cinzel} className="text-sm text-[#c8a84b]">Rolagens pedidas pelo Mestre</h2>

      {pedidos.map(pedido => (
        <article key={pedido.id} className="space-y-2 border-t border-[#c8a84b20] pt-3">
          <p className="text-sm">
            {pedido.rotulo} · {MODOS[pedido.modo]}
            {pedido.cd != null && ` · CD ${pedido.cd}`}
          </p>
          {pedido.contexto && <p className="text-sm text-[#9a8e78]">{pedido.contexto}</p>}

          {pedido.resultado ? (
            <ResumoRolagem resultado={pedido.resultado} cd={pedido.cd} />
          ) : (
            <button type="button" className={botao} disabled={Boolean(rolando)}
              onClick={() => responder(pedido.id)}>
              {rolando === pedido.id ? 'Rolando…' : '🎲 Rolar agora'}
            </button>
          )}
        </article>
      ))}

      {erro && <p role="alert" className="text-sm text-red-400">{erro}</p>}
    </section>
  );
}