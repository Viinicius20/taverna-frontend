import { useState } from 'react';
import api from '../services/api';

const campo = 'w-full rounded-sm border border-[#c8a84b25] bg-[#0f0e0c] px-2 py-2 text-sm';
const botao = 'rounded-sm border border-[#c8a84b45] px-3 py-2 text-xs text-[#c8a84b] ' +
  'hover:bg-[#c8a84b15] disabled:opacity-40';

const CAMPOS_TEXTO = [
  ['descricao', 'Descrição da cena', 3000],
  ['diferencial', 'Reviravolta', 1500],
  ['ligacao_mundo', 'Ligação com o mundo', 1500],
  ['recompensa', 'Recompensa sugerida', 1500],
];

function criatura(dados = {}) {
  return {
    chave: crypto.randomUUID(),
    nome: String(dados.nome ?? '').slice(0, 120),
    quantidade: dados.quantidade ?? 1,
    hp: dados.hp ?? '',
    dex: dados.dex ?? '',
    cr: String(dados.cr ?? '').slice(0, 20),
  };
}

function inteiroEntre(valor, minimo, maximo) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= minimo && numero <= maximo;
}

export default function EncontroEditor({
  inicial, locais, onSalvo, onCombate, podeCarregar,
}) {
  const [rascunho, setRascunho] = useState(() => ({
    id: inicial.id,
    titulo: String(inicial.titulo ?? '').slice(0, 120),
    local_id: inicial.local_id || '',
    ...Object.fromEntries(CAMPOS_TEXTO.map(([chave, , limite]) => [
      chave, String(inicial[chave] ?? '').slice(0, limite),
    ])),
    inimigos: Array.isArray(inicial.inimigos)
      ? inicial.inimigos.slice(0, 20).map(item => criatura(item || {}))
      : [],
  }));
  const [busca, setBusca] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  function atualizar(campo, valor) {
    setRascunho(prev => ({ ...prev, [campo]: valor }));
    setAviso('');
  }

  function atualizarCriatura(chave, dados) {
    setRascunho(prev => ({
      ...prev,
      inimigos: prev.inimigos.map(item => item.chave === chave ? { ...item, ...dados } : item),
    }));
    setAviso('');
  }

  const camposValidos = rascunho.titulo.trim() && rascunho.inimigos.every(item =>
    item.nome.trim() &&
    inteiroEntre(item.quantidade, 1, 20) &&
    (item.hp === '' || inteiroEntre(item.hp, 1, 9999)) &&
    (item.dex === '' || inteiroEntre(item.dex, 1, 30))
  );

  const combateValido = camposValidos && rascunho.inimigos.length > 0 &&
    rascunho.inimigos.every(item => inteiroEntre(item.hp, 1, 9999));

  function dadosParaSalvar() {
    const { id, ...campos } = rascunho;
    return {
      ...campos,
      titulo: campos.titulo.trim(),
      local_id: campos.local_id || null,
      inimigos: campos.inimigos.map(({ nome, quantidade, hp, dex, cr }) => ({
        nome: nome.trim(),
        quantidade: Number(quantidade),
        hp: hp === '' ? null : Number(hp),
        dex: dex === '' ? null : Number(dex),
        cr,
      })),
    };
  }

  async function salvar(e) {
    e.preventDefault();
    if (!camposValidos || ocupado) return;
    setOcupado(true);
    setErro('');

    try {
      const dados = dadosParaSalvar();
      const res = rascunho.id
        ? await api.patch(`/encontros-preparados/${rascunho.id}`, dados)
        : await api.post('/encontros-preparados', dados);
      const salvo = res.data.data;
      setRascunho(prev => ({ ...prev, id: salvo.id }));
      onSalvo(salvo);
      setAviso('Encontro salvo.');
    } catch (e) {
      const detalhe = e.response?.data?.detail;
      setErro(typeof detalhe === 'string' ? detalhe : 'Não foi possível salvar o encontro.');
    } finally {
      setOcupado(false);
    }
  }

  async function buscarFicha(item) {
    if (!item.nome.trim() || ocupado) return;
    setOcupado(true);
    setErro('');
    setBusca(null);
    try {
      const res = await api.get('/bestiary', { params: { name: item.nome.trim() } });
      setBusca({ chave: item.chave, fichas: (res.data.data || []).slice(0, 8) });
    } catch {
      setErro('Não foi possível buscar no bestiário.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4 border border-[#c8a84b25] bg-[#161410] p-4">
      <fieldset disabled={ocupado} className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm">
            Título
            <input required maxLength={120} className={campo}
              value={rascunho.titulo} onChange={e => atualizar('titulo', e.target.value)} />
          </label>
          <label className="text-sm">
            Local no Atlas
            <select className={campo} value={rascunho.local_id}
              onChange={e => atualizar('local_id', e.target.value)}>
              <option value="">Sem local vinculado</option>
              {locais.map(local => <option key={local.id} value={local.id}>{local.name}</option>)}
            </select>
          </label>
        </div>

        {CAMPOS_TEXTO.map(([chave, rotulo, limite]) => (
          <label key={chave} className="block text-sm">
            {rotulo}
            <textarea className={campo} rows={chave === 'descricao' ? 3 : 2}
              maxLength={limite} value={rascunho[chave]}
              onChange={e => atualizar(chave, e.target.value)} />
          </label>
        ))}

        {rascunho.inimigos.map(item => (
          <div key={item.chave} className="space-y-2 border-t border-[#c8a84b20] pt-3">
            <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr]">
              <label className="text-sm">
                Criatura
                <input required maxLength={120} className={campo} value={item.nome}
                  onChange={e => {
                    atualizarCriatura(item.chave, {
                      nome: e.target.value, hp: '', dex: '', cr: '',
                    });
                    setBusca(null);
                  }} />
              </label>
              {[
                ['quantidade', 'Quantidade', 20],
                ['hp', 'HP de cada', 9999],
                ['dex', 'Destreza', 30],
              ].map(([chave, rotulo, max]) => (
                <label key={chave} className="text-sm">
                  {rotulo}
                  <input type="number" min={1} max={max} step={1}
                    required={chave === 'quantidade'} className={campo} value={item[chave]}
                    onChange={e => atualizarCriatura(item.chave, { [chave]: e.target.value })} />
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {item.cr && <span className="text-xs text-[#9a8e78]">CR {item.cr}</span>}
              <button type="button" className={botao} disabled={!item.nome.trim()}
                onClick={() => buscarFicha(item)}>
                Usar ficha do bestiário
              </button>
              <button type="button" className="text-xs text-red-400 hover:underline"
                onClick={() => atualizar('inimigos', rascunho.inimigos.filter(i => i.chave !== item.chave))}>
                Remover criatura
              </button>
            </div>

            {busca?.chave === item.chave && (
              <div className="flex flex-wrap gap-2">
                {!busca.fichas.length && (
                  <p className="text-sm text-[#9a8e78]">Nenhuma ficha encontrada. Você pode preencher o HP manualmente.</p>
                )}
                {busca.fichas.map(ficha => (
                  <button key={ficha.id} type="button" className={botao} onClick={() => {
                    atualizarCriatura(item.chave, {
                      nome: ficha.name,
                      hp: ficha.hp ?? '',
                      dex: ficha.attributes?.dex ?? '',
                      cr: String(ficha.cr ?? ''),
                    });
                    setBusca(null);
                  }}>
                    {ficha.name} · {ficha.hp ?? '—'} HP
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <button type="button" className={botao} disabled={rascunho.inimigos.length >= 20}
          onClick={() => atualizar('inimigos', [...rascunho.inimigos, criatura()])}>
          + Criatura
        </button>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={botao} disabled={!camposValidos || ocupado}>
          Salvar encontro
        </button>
        <button type="button" className={botao} disabled={!combateValido || !podeCarregar || ocupado}
          onClick={() => onCombate(dadosParaSalvar())}>
          Carregar no combate
        </button>
      </div>

      {rascunho.inimigos.some(item => !inteiroEntre(item.hp, 1, 9999)) && (
        <p className="text-xs text-[#9a8e78]">Preencha o HP das criaturas para carregar no combate.</p>
      )}
      {!podeCarregar && (
        <p className="text-xs text-[#9a8e78]">Encerre ou limpe o encontro atual para carregar outro.</p>
      )}
      {erro && <p role="alert" className="text-sm text-red-400">{erro}</p>}
      {aviso && <p role="status" className="text-sm text-[#c8a84b]">{aviso}</p>}
    </form>
  );
}