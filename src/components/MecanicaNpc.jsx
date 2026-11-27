import { useState } from 'react';
import { cinzel } from '../estilos';
import { montarExpressao, rolarNoServidor } from '../services/rolagens';

const ATRIBUTOS = [
  ['str', 'Força'], ['dex', 'Destreza'], ['con', 'Constituição'],
  ['int', 'Inteligência'], ['wis', 'Sabedoria'], ['cha', 'Carisma'],
];

const ATAQUE_VAZIO = { nome: '', bonus: '', dano: '' };
const campo = 'min-w-0 rounded-sm border border-[#c8a84b25] bg-[#0f0e0c] px-2 py-2 text-sm';
const botao = 'rounded-sm border border-[#c8a84b40] px-3 py-2 text-xs text-[#c8a84b] hover:bg-[#c8a84b15] disabled:opacity-40';

function lerAtaques(valor, dados) {
  if (valor !== '') {
    try {
      const ataques = JSON.parse(valor);
      if (Array.isArray(ataques)) return ataques;
    } catch {
      // Reaproveita os ataques da ficha se a nota estiver ilegível.
    }
  }

  const ataques = dados.ataques ?? dados.attacks;
  if (!Array.isArray(ataques)) return [];

  return ataques.filter(item => item && typeof item === 'object').map(item => ({
    nome: String(item.nome ?? item.name ?? 'Ataque'),
    bonus: String(item.bonus ?? item.attack_bonus ?? 0),
    dano: String(item.dano ?? item.damage_dice ?? ''),
  }));
}

function inteiro(valor) {
  if (valor == null || String(valor).trim() === '') return null;
  const numero = Number(valor);
  return Number.isInteger(numero) ? numero : null;
}

function comSinal(numero) {
  return numero >= 0 ? `+${numero}` : String(numero);
}

function expressaoDeDano(valor) {
  const texto = String(valor ?? '').toLowerCase().replace(/\s+/g, '');
  const partes = /^(\d{1,2})?d(\d{1,3})([+-]\d{1,3})?$/.exec(texto);
  if (!partes) return null;

  const quantidade = Number(partes[1] ?? 1);
  const lados = Number(partes[2]);
  return quantidade >= 1 && quantidade <= 20 && lados >= 2 && lados <= 100
    ? texto : null;
}

export default function MecanicaNpc({ npc, getNota, editarNotaLocal, getAttr }) {
  const dados = npc.data || {};
  const nome = dados.name || npc.name || 'NPC';
  const ataques = lerAtaques(getNota(npc.id, 'ataques_mecanica'), dados);
  const [rascunho, setRascunho] = useState(ATAQUE_VAZIO);
  const [editando, setEditando] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');

  function salvarAtaque(e) {
    e.preventDefault();
    const nomeAtaque = rascunho.nome.trim();
    const bonus = inteiro(rascunho.bonus);
    const dano = expressaoDeDano(rascunho.dano);

    if (!nomeAtaque || bonus == null || Math.abs(bonus) > 999) {
      setErro('Preencha o nome e o bônus de acerto.');
      return;
    }
    if (rascunho.dano.trim() && !dano) {
      setErro('Use uma expressão de dano como 1d8+3.');
      return;
    }

    const ataque = { nome: nomeAtaque, bonus: String(bonus), dano: dano || '' };
    const novos = editando == null
      ? [...ataques, ataque]
      : ataques.map((item, i) => i === editando ? ataque : item);
    const texto = JSON.stringify(novos);

    if (texto.length > 5000) {
      setErro('O NPC atingiu o limite de espaço para ataques.');
      return;
    }

    editarNotaLocal(npc.id, 'ataques_mecanica', texto);
    setRascunho(ATAQUE_VAZIO);
    setEditando(null);
    setErro('');
  }

  function removerAtaque(indice) {
    editarNotaLocal(
      npc.id,
      'ataques_mecanica',
      JSON.stringify(ataques.filter((_, i) => i !== indice))
    );
    setEditando(null);
    setRascunho(ATAQUE_VAZIO);
    setErro('');
  }

  async function rolar(rotulo, expressao) {
    if (ocupado) return;
    setOcupado(true);
    setErro('');
    setResultado(null);

    try {
      const linha = await rolarNoServidor({
        expressao,
        rotulo: `${nome} · ${rotulo}`.slice(0, 60),
        oculta: true,
      });
      setResultado({
        rotulo,
        dados: linha.dados?.rolls || [],
        bonus: linha.modificador ?? 0,
        total: linha.total,
      });
    } catch {
      setErro('Não foi possível fazer a rolagem.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 style={cinzel} className="mb-3 text-xs tracking-[3px] text-[#c8a84b]">
          SALVAGUARDAS
        </h3>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {ATRIBUTOS.map(([chave, rotulo]) => {
            const nota = getNota(npc.id, `salvaguarda_${chave}`);
            const salvo = inteiro(dados.combat?.saving_throws?.[chave]);
            const atributo = inteiro(getAttr(npc.id, chave, dados.attributes?.[chave])) ?? 10;
            const bonus = inteiro(nota) ?? salvo ?? Math.floor((atributo - 10) / 2);

            return (
              <div key={chave} className="flex flex-col gap-1">
                <button
                  type="button"
                  disabled={ocupado || Math.abs(bonus) > 999}
                  className={botao}
                  onClick={() => rolar(`Salvaguarda de ${rotulo}`, montarExpressao(1, 20, bonus))}
                >
                  {rotulo} {comSinal(bonus)}
                </button>
                <input
                  type="number"
                  min={-999}
                  max={999}
                  step={1}
                  value={nota}
                  placeholder={comSinal(salvo ?? Math.floor((atributo - 10) / 2))}
                  aria-label={`Bônus manual de salvaguarda de ${rotulo}`}
                  className={`${campo} w-full text-center`}
                  onChange={e => editarNotaLocal(npc.id, `salvaguarda_${chave}`, e.target.value)}
                />
              </div>
            );
          })}
        </div>

        <p className="mt-2 text-xs text-[#9a8e78]">
          Clique no atributo pra rolar. Deixe o campo vazio pra usar o bônus da ficha.
        </p>
      </section>

      <section className="border-t border-[#c8a84b20] pt-4">
        <h3 style={cinzel} className="mb-3 text-xs tracking-[3px] text-[#c8a84b]">
          ATAQUES
        </h3>

        <div className="mb-3 space-y-2">
          {ataques.map((ataque, i) => {
            const bonus = inteiro(ataque.bonus);
            const dano = expressaoDeDano(ataque.dano);

            return (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <span className="mr-auto text-sm">{ataque.nome}</span>
                <button
                  type="button"
                  className={botao}
                  disabled={ocupado || bonus == null || Math.abs(bonus) > 999}
                  onClick={() => rolar(`${ataque.nome} · acerto`, montarExpressao(1, 20, bonus))}
                >
                  Acerto {bonus == null ? '' : comSinal(bonus)}
                </button>
                {dano && (
                  <button
                    type="button"
                    className={botao}
                    disabled={ocupado}
                    onClick={() => rolar(`${ataque.nome} · dano`, dano)}
                  >
                    Dano {dano}
                  </button>
                )}
                <button
                  type="button"
                  className="text-xs text-[#c8a84b] underline"
                  onClick={() => { setEditando(i); setRascunho(ataque); setErro(''); }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="text-xs text-red-400 hover:underline"
                  onClick={() => removerAtaque(i)}
                >
                  Remover
                </button>
              </div>
            );
          })}
        </div>

        <form onSubmit={salvarAtaque} className="flex flex-wrap gap-2">
          <input
            required maxLength={80} className={`${campo} flex-1`}
            aria-label="Nome do ataque" placeholder="Nome do ataque"
            value={rascunho.nome}
            onChange={e => setRascunho(prev => ({ ...prev, nome: e.target.value }))}
          />
          <input
            required type="number" min={-999} max={999} step={1} className={`${campo} w-24`}
            aria-label="Bônus de acerto" placeholder="Acerto"
            value={rascunho.bonus}
            onChange={e => setRascunho(prev => ({ ...prev, bonus: e.target.value }))}
          />
          <input
            maxLength={15} className={`${campo} w-28`}
            aria-label="Dados de dano" placeholder="Ex.: 1d8+3"
            value={rascunho.dano}
            onChange={e => setRascunho(prev => ({ ...prev, dano: e.target.value }))}
          />
          <button type="submit" className={botao}>
            {editando == null ? '+ Ataque' : 'Salvar ataque'}
          </button>
          {editando != null && (
            <button
              type="button"
              className={botao}
              onClick={() => { setEditando(null); setRascunho(ATAQUE_VAZIO); }}
            >
              Cancelar
            </button>
          )}
        </form>
      </section>

      {resultado && (
        <p role="status" className="rounded-sm border border-[#c8a84b40] p-3 text-sm text-[#c8a84b]">
          {resultado.rotulo} · [{resultado.dados.join(' + ')}] {comSinal(resultado.bonus)}
          {' = '}<strong>{resultado.total}</strong>
        </p>
      )}
      {erro && <p role="alert" className="text-sm text-red-400">{erro}</p>}
    </div>
  );
}