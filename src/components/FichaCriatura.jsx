import { useState } from 'react';
import { cinzel } from '../estilos';

const ATRIBUTOS = [
  ['FOR', ['strength', 'str', 'forca', 'for']],
  ['DES', ['dexterity', 'dex', 'destreza', 'des']],
  ['CON', ['constitution', 'con', 'constituicao']],
  ['INT', ['intelligence', 'int', 'inteligencia']],
  ['SAB', ['wisdom', 'wis', 'sabedoria', 'sab']],
  ['CAR', ['charisma', 'cha', 'carisma', 'car']],
];

function achar(m, chaves) {
  const fontes = [m, m.stats, m.abilities, m.attributes, m.data]
    .filter(f => f && typeof f === 'object');
  for (const f of fontes) {
    for (const k of chaves) {
      const v = f[k];
      if (v !== undefined && v !== null && v !== '') return v;
    }
  }
  return null;
}

function modificador(n) {
  const x = Math.floor((Number(n) - 10) / 2);
  return x >= 0 ? `+${x}` : `${x}`;
}

function textoSimples(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') return Object.entries(v).map(([k, x]) => `${k} ${x}`).join(', ');
  return String(v);
}

function itens(v) {
  if (!v) return [];
  if (typeof v === 'string') return v.trim() ? [{ nome: '', texto: v.trim() }] : [];
  if (Array.isArray(v)) {
    return v
      .map(x => (typeof x === 'string'
        ? { nome: '', texto: x }
        : { nome: x.name || x.nome || '', texto: x.desc || x.description || x.descricao || x.texto || '' }))
      .filter(x => x.nome || x.texto);
  }
  return [];
}

function Caixa({ rotulo, valor }) {
  return (
    <div className="border border-[#c8a84b20] bg-[#161410] px-3 py-3 text-center" style={{ borderRadius: '2px' }}>
      <p style={cinzel} className="text-[#6a6050] text-[10px] tracking-[2px] uppercase">{rotulo}</p>
      <p style={cinzel} className="text-[#e8e0d0] text-lg mt-1">{valor || '—'}</p>
    </div>
  );
}

export default function FichaCriatura({ m, retrato, acoesMestre = null, oculto = false }) {
  const [aba, setAba] = useState(null);

  if (oculto) {
    return (
      <div className="border border-dashed border-[#c8a84b20] p-6">
        <p style={cinzel} className="text-[#8a7e68] text-sm">Criatura desconhecida</p>
        <p className="text-[#6a6050] text-sm mt-1">Os jogadores ainda não a descobriram.</p>
      </div>
    );
  }

  const abas = {
    habilidades: {
      rotulo: 'Habilidades',
      secoes: [{ titulo: '', lista: itens(achar(m, ['special_abilities', 'traits', 'habilidades'])) }],
    },
    acoes: {
      rotulo: 'Ações',
      secoes: [
        { titulo: '', lista: itens(achar(m, ['actions', 'acoes'])) },
        { titulo: 'Reações', lista: itens(achar(m, ['reactions', 'reacoes'])) },
        { titulo: 'Ações lendárias', lista: itens(achar(m, ['legendary_actions', 'acoes_lendarias'])) },
      ],
    },
  };
  const lore = itens(achar(m, ['description', 'desc', 'lore', 'history', 'historia']))
    .map(x => x.texto).filter(Boolean).join('\n\n');
  const vazia = a => a.secoes.every(s => s.lista.length === 0);
  const ativa = aba && abas[aba]
    ? aba
    : (Object.keys(abas).find(k => !vazia(abas[k])) || 'habilidades');

  const sentidos = textoSimples(achar(m, ['senses', 'sentidos']));
  const idiomas = textoSimples(achar(m, ['languages', 'idiomas']));
  const alinhamento = textoSimples(achar(m, ['alignment', 'alinhamento']));
  const velocidade = textoSimples(achar(m, ['speed', 'deslocamento', 'velocidade']));
  const resistencias = textoSimples(achar(m, ['damage_resistances', 'resistances', 'resistencias']));
  const imunidades = [
    textoSimples(achar(m, ['damage_immunities', 'immunities', 'imunidades'])),
    textoSimples(achar(m, ['condition_immunities', 'imunidades_condicao'])),
  ].filter(Boolean).join('; ');
  const linhas = [
    ['Velocidade', velocidade],
    ['Sentidos', sentidos],
    ['Idiomas', idiomas],
    ['Resistências', resistencias],
    ['Imunidades', imunidades],
  ].filter(([, v]) => v);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_17rem] gap-6">
      {/* retrato: no celular fica em cima, no desktop à direita */}
      <div className="md:order-2">
        <div className="relative border border-[#c8a84b80] p-1">
          <span className="absolute -top-1 -left-1 w-2 h-2 rotate-45 bg-[#c8a84b]" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rotate-45 bg-[#c8a84b]" />
          <span className="absolute -bottom-1 -left-1 w-2 h-2 rotate-45 bg-[#c8a84b]" />
          <span className="absolute -bottom-1 -right-1 w-2 h-2 rotate-45 bg-[#c8a84b]" />

          <div className="relative aspect-[3/4] overflow-hidden bg-[#161410]">
            <p className="absolute inset-0 flex items-center justify-center text-[#3a3020] text-sm">
              Sem retrato
            </p>
            <div className="absolute inset-0 [&_img]:w-full [&_img]:h-full [&_img]:object-cover">
              {retrato}
            </div>
            <div className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-10 bg-gradient-to-t from-[#0f0e0c] to-transparent text-center pointer-events-none">
              <p style={cinzel} className="text-[#f0e8d8] text-base uppercase tracking-wide">{m.name}</p>
              <p className="text-[#c8a84b] text-[11px]">{[m.size, m.type].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
        </div>
        {acoesMestre && <div className="mt-3 flex flex-col gap-2">{acoesMestre}</div>}
      </div>

      {/* dados */}
      <div className="md:order-1 flex flex-col gap-4 min-w-0">
        <div>
          <p style={cinzel} className="text-[#8a7e68] text-xs tracking-[3px] uppercase">
            {[m.cr !== undefined && m.cr !== null ? `CR ${m.cr}` : null, alinhamento].filter(Boolean).join(' · ')}
          </p>
          <h2 style={cinzel} className="text-[#f0e8d8] text-3xl mt-1">{m.name}</h2>
          <div className="flex gap-2 mt-2 flex-wrap">
            {m.is_homebrew && (
              <span style={cinzel} className="text-xs border border-[#b07050] text-[#b07050] px-1.5 py-0.5">HOMEBREW</span>
            )}
          </div>
        </div>

        {m.discovered === false && (
          <p className="text-[#b07050] text-xs border border-[#b0705040] px-3 py-2" style={{ borderRadius: '2px' }}>
            👁️ Os jogadores ainda não conhecem esta criatura.
          </p>
        )}

        {lore && (
          <p className="text-[#9a8e78] text-sm leading-relaxed whitespace-pre-line max-w-prose">{lore}</p>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Caixa rotulo="CA" valor={m.ac} />
          <Caixa rotulo="HP" valor={m.hp} />
          <Caixa rotulo="CR" valor={m.cr} />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ATRIBUTOS.map(([rotulo, chaves]) => {
            const valor = achar(m, chaves);
            return (
              <div key={rotulo} className="border border-[#c8a84b20] bg-[#161410] py-2 text-center" style={{ borderRadius: '2px' }}>
                <p style={cinzel} className="text-[#6a6050] text-[10px] tracking-[2px]">{rotulo}</p>
                <p style={cinzel} className="text-[#c8a84b] text-xl">{valor !== null ? modificador(valor) : '—'}</p>
                <p className="text-[#6a6050] text-xs">{valor !== null ? valor : ''}</p>
              </div>
            );
          })}
        </div>

        {linhas.length > 0 && (
          <dl className="text-xs leading-relaxed flex flex-col gap-1">
            {linhas.map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <dt style={cinzel} className="text-[#6a6050] tracking-[2px] uppercase shrink-0 w-28">{k}</dt>
                <dd className="text-[#9a8e78]">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        <div>
          <div className="flex gap-5 border-b border-[#c8a84b15]" role="tablist">
            {Object.entries(abas).map(([chave, a]) => (
              <button key={chave} role="tab" aria-selected={ativa === chave} onClick={() => setAba(chave)}
                style={cinzel}
                className={`pb-2 text-xs tracking-[2px] uppercase border-b-2 -mb-px ${
                  ativa === chave ? 'text-[#c8a84b] border-[#c8a84b]' : 'text-[#6a6050] border-transparent hover:text-[#9a8e78]'}`}>
                {a.rotulo}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {vazia(abas[ativa]) ? (
              <p className="text-[#6a6050] text-sm">Nada registrado aqui ainda.</p>
            ) : (
              abas[ativa].secoes.filter(s => s.lista.length > 0).map((s, i) => (
                <div key={i} className="flex flex-col gap-2">
                  {s.titulo && (
                    <p style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] uppercase mt-2">{s.titulo}</p>
                  )}
                  {s.lista.map((x, j) => (
                    <div key={j} className="border border-[#c8a84b15] bg-[#161410] px-4 py-3" style={{ borderRadius: '2px' }}>
                      {x.nome && <p style={cinzel} className="text-[#e8e0d0] text-sm font-bold">{x.nome}</p>}
                      {x.texto && (
                        <p className="text-[#9a8e78] text-sm leading-relaxed whitespace-pre-line mt-1">{x.texto}</p>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}