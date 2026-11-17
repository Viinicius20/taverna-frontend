import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { cinzel, crimson } from '../estilos';
import { limparMarkdown } from '../utils/texto';
import RetratoCanvas from '../components/RetratoCanvas';
import LogoTaverna from '../components/LogoTaverna';

const ATRIBUTOS = [['str', 'FOR'], ['dex', 'DES'], ['con', 'CON'], ['int', 'INT'], ['wis', 'SAB'], ['cha', 'CAR']];

const PERICIAS = {
  acrobatics: 'Acrobacia', animal_handling: 'Lidar com Animais', arcana: 'Arcanismo',
  athletics: 'Atletismo', deception: 'Enganação', history: 'História', insight: 'Intuição',
  intimidation: 'Intimidação', investigation: 'Investigação', medicine: 'Medicina',
  nature: 'Natureza', perception: 'Percepção', performance: 'Atuação', persuasion: 'Persuasão',
  religion: 'Religião', sleight_of_hand: 'Prestidigitação', stealth: 'Furtividade', survival: 'Sobrevivência',
};

const RARIDADE_COR = {
  'Comum': '#a09880', 'Incomum': '#4a8a4a', 'Raro': '#4a6aaa', 'Muito Raro': '#8a4aaa', 'Lendário': '#c8a84b',
};

const PERSONALIDADE = [
  ['ideais', 'IDEAIS'], ['vinculos', 'VÍNCULOS'], ['defeitos', 'DEFEITOS'],
  ['medos', 'MEDOS'], ['objetivo_atual', 'OBJETIVO ATUAL'], ['appearance', 'APARÊNCIA'],
];

const mod = v => Math.floor((Number(v) - 10) / 2);
const sinal = n => (n >= 0 ? `+${n}` : `${n}`);
const radius = { borderRadius: '2px' };

function normalizarItem(it) {
  if (typeof it === 'string') return { nome: it };
  const oculto = it.identificado === false;
  return {
    nome: oculto ? (it.nome_misterioso || 'Item não identificado') : (it.name || '?'),
    raridade: it.rarity,
    magico: !!it.is_magic,
    oculto,
    descricao: oculto ? '' : it.description,
    mecanica: oculto ? '' : it.mechanics,
  };
}

function normalizarHabilidade(f) {
  const bruto = typeof f === 'string' ? f : (f?.nome || '');
  const txt = limparMarkdown(bruto).replace(/^\s*-\s*/, '').trim();
  const i = txt.indexOf(':');
  const titulo = i > -1 ? txt.slice(0, i).trim() : txt;
  const desc = i > -1 ? txt.slice(i + 1).trim() : '';
  return { titulo, desc, cabecalho: i > -1 && !desc };
}

function Caixa({ rotulo, valor }) {
  return (
    <div className="border border-[#c8a84b20] bg-[#161410] px-3 py-2 text-center" style={radius}>
      <p style={cinzel} className="text-[#8a7e68] text-[10px] tracking-widest">{rotulo}</p>
      <p style={cinzel} className="text-[#e8e0d0] text-lg">{valor}</p>
    </div>
  );
}

export default function PerfilPersonagem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [char, setChar] = useState(null);
  const [erro, setErro] = useState(false);
  const [aba, setAba] = useState('Habilidades');

  useEffect(() => {
    setChar(null); setErro(false);
    api.get(`/characters/${id}`)
      .then(r => setChar(r.data.data))
      .catch(() => setErro(true));
  }, [id]);

async function enviarRetrato(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
        const res = await api.post(`/characters/${id}/retrato`, form);
        setChar(p => ({ ...p, retrato_url: res.data.url }));
    } catch {
        alert('Não foi possível enviar o retrato.');
    }
}

  if (erro) {
    return <p className="min-h-screen bg-[#0f0e0c] text-[#8a7e68] flex items-center justify-center">Personagem não encontrado.</p>;
  }
  if (!char) {
    return (
      <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center">
        <div className="w-6 h-6 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
      </div>
    );
  }

  const d = char.data || {};
  const c = d.combat || {};
  const attrs = d.attributes || {};
  const classes = (d.classes || []).map(x => `${x.name} ${x.level}`).join(' / ') || d.class || '';
  const subtitulo = [d.race, classes].filter(Boolean).join(' · ');
  const nivel = d.total_level || d.level;

  const hpMax = c.hp_max || c.hp || 0;
  const hp = c.hp ?? hpMax;
  const pct = hpMax > 0 ? Math.max(0, Math.min(100, (hp / hpMax) * 100)) : 0;
  const hpCor = pct > 50 ? '#2a7a2a' : pct > 25 ? '#8a7020' : '#8a2020';

  const pericias = Object.entries(d.skills || {})
    .filter(([k]) => PERICIAS[k])
    .sort((a, b) => b[1] - a[1]);
  const habilidades = (d.features || []).map(normalizarHabilidade).filter(h => h.titulo);
  const itens = (d.inventory || []).map(normalizarItem);
  const magias = d.spellcasting?.spells || [];
  const personalidade = PERSONALIDADE.filter(([k]) => d[k]);
  const moedas = Object.entries(d.moedas || {}).filter(([, v]) => v > 0);
  const momentos = d.momentos || [];
  const temCombate = (d.ataques?.length || 0) + (d.recursos?.length || 0) > 0;

  const abas = [
    'Habilidades',
    temCombate && 'Combate',
    'Perícias',
    'Equipamento',
    magias.length > 0 && 'Magias',
    momentos.length > 0 && 'Momentos',
    'História',
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0] page-fade" style={crimson}>
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#c8a84b20]">
        <LogoTaverna />
        <button onClick={() => navigate(`/personagens/${id}`)} style={cinzel}
          className="text-[#9a8e78] text-sm hover:text-[#c8a84b] transition-colors">← Ficha</button>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-[320px_1fr]">

        {/* Coluna do retrato */}
        <div className="space-y-3">
        <RetratoCanvas src={char.retrato_url || char.avatar_url} nome={char.name} subtitulo={subtitulo} />

        <label className="block text-center border border-[#c8a84b30] text-[#8a7e68] py-1 text-xs cursor-pointer hover:text-[#c8a84b] transition-colors">
            🖼 {char.retrato_url ? 'Trocar retrato' : 'Adicionar retrato'}
            <input type="file" accept="image/*" className="hidden" onChange={enviarRetrato} />
        </label>

        {d.condicoes?.length > 0 && (
            <div className="flex flex-wrap gap-1">
            {d.condicoes.map(cond => (
                <span key={cond} style={{ ...cinzel, ...radius }}
                className="text-xs px-2 py-0.5 border border-[#a86aa840] text-[#a86aa8] bg-[#a86aa810]">
                {cond}
                </span>
            ))}
            </div>
        )}
        </div>

        {/* Coluna principal */}
        <div className="space-y-6 min-w-0">
          <div>
            <p style={cinzel} className="text-[#b07050] text-xs tracking-[4px] opacity-70">
              NÍVEL {nivel ?? '?'}{d.alignment ? ` · ${d.alignment.toUpperCase()}` : ''}
            </p>
            <h1 style={cinzel} className="text-3xl text-[#f0e8d8] font-semibold">{char.name}</h1>
            {(d.subclass || d.background) && (
              <p className="text-[#8a7e68] text-sm mt-1">
                {[d.subclass, d.background && `Antecedente: ${d.background}`].filter(Boolean).join(' · ')}
              </p>
            )}

            <div className="mt-4 h-2 bg-[#161410] border border-[#c8a84b20] overflow-hidden" style={radius}>
              <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: hpCor }} />
            </div>
            <p style={cinzel} className="text-[#8a7e68] text-xs mt-1">{hp} / {hpMax} HP</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            <Caixa rotulo="CA" valor={c.ac ?? '–'} />
            <Caixa rotulo="INICIATIVA" valor={c.initiative != null ? sinal(c.initiative) : '–'} />
            <Caixa rotulo="DESLOC." valor={c.speed ? `${c.speed} ft` : '–'} />
            <Caixa rotulo="PROFIC." valor={c.proficiency_bonus ? `+${c.proficiency_bonus}` : '–'} />
            <Caixa rotulo="PERC. PASS." valor={c.passive_perception ?? '–'} />
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ATRIBUTOS.map(([k, label]) => {
              const v = attrs[k] ?? 10;
              const salv = c.saving_throws?.[k];
              return (
                <div key={k} className="border border-[#c8a84b20] bg-[#161410] py-3 text-center" style={radius}>
                  <p style={cinzel} className="text-[#8a7e68] text-xs tracking-widest">{label}</p>
                  <p style={cinzel} className="text-[#c8a84b] text-2xl">{sinal(mod(v))}</p>
                  <p className="text-[#8a7e68] text-xs">{v}</p>
                  {salv != null && <p className="text-[#6a6050] text-[10px] mt-1">Salv. {sinal(salv)}</p>}
                </div>
              );
            })}
          </div>

          {/* Abas */}
          <div>
            <div className="flex gap-px border-b border-[#c8a84b15] mb-4 overflow-x-auto">
              {abas.map(a => (
                <button key={a} onClick={() => setAba(a)}
                  className="px-4 py-2 text-xs whitespace-nowrap transition-colors"
                  style={{ ...cinzel, color: aba === a ? '#c8a84b' : '#8a7e68',
                           borderBottom: aba === a ? '2px solid #c8a84b' : '2px solid transparent' }}>
                  {a.toUpperCase()}
                </button>
              ))}
            </div>

            {aba === 'Habilidades' && (
              <div className="space-y-1">
                {habilidades.length === 0 && <p className="text-[#8a7e68] text-sm">Nenhuma habilidade registrada.</p>}
                {habilidades.map((h, i) => h.cabecalho ? (
                  <p key={i} style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] pt-3">{h.titulo.toUpperCase()}</p>
                ) : h.desc ? (
                  <details key={i} className="border border-[#c8a84b15] bg-[#161410] px-3 py-2" style={radius}>
                    <summary className="cursor-pointer text-sm text-[#e8e0d0]">{h.titulo}</summary>
                    <p className="text-[#9a8e78] text-sm leading-relaxed font-light mt-2">{h.desc}</p>
                  </details>
                ) : (
                  <div key={i} className="border border-[#c8a84b15] bg-[#161410] px-3 py-2 text-sm" style={radius}>
                    {h.titulo}
                  </div>
                ))}
              </div>
            )}

            {aba === 'Combate' && (
              <div className="space-y-5">
                {d.ataques?.length > 0 && (
                  <div>
                    <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-2">ATAQUES</p>
                    <div className="space-y-2">
                      {d.ataques.map((a, i) => (
                        <div key={i} className="flex items-center justify-between border border-[#c8a84b15] bg-[#161410] px-3 py-2" style={radius}>
                          <span style={cinzel} className="text-sm">{a.nome}</span>
                          <span className="text-[#9a8e78] text-sm">
                            {a.bonus ? `${sinal(Number(a.bonus))} · ` : ''}{a.dano} {a.tipo}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {d.recursos?.length > 0 && (
                  <div>
                    <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-2">RECURSOS</p>
                    <div className="space-y-3">
                      {d.recursos.map((r, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{r.nome}</span>
                            <span className="text-[#8a7e68] text-xs">
                              {r.atual}/{r.max} · {r.recuperacao === 'curto' ? 'descanso curto' : r.recuperacao === 'longo' ? 'descanso longo' : r.recuperacao}
                            </span>
                          </div>
                          <div className="h-1.5 bg-[#161410] overflow-hidden">
                            <div className="h-full bg-[#c8a84b]" style={{ width: `${r.max > 0 ? (r.atual / r.max) * 100 : 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {aba === 'Perícias' && (
              <div className="grid gap-2 sm:grid-cols-2">
                {pericias.length === 0 && <p className="text-[#8a7e68] text-sm">Nenhuma perícia registrada.</p>}
                {pericias.map(([k, v]) => (
                  <div key={k} className="flex justify-between border border-[#c8a84b15] bg-[#161410] px-3 py-2 text-sm" style={radius}>
                    <span>{PERICIAS[k]}</span>
                    <span style={cinzel} className={v > 0 ? 'text-[#c8a84b]' : 'text-[#6a6050]'}>{sinal(v)}</span>
                  </div>
                ))}
              </div>
            )}

            {aba === 'Equipamento' && (
              <div className="space-y-4">
                {moedas.length > 0 && (
                  <div className="flex gap-3 text-sm text-[#c8a84b]" style={cinzel}>
                    {moedas.map(([k, v]) => <span key={k}>{v} {k.toUpperCase()}</span>)}
                  </div>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  {itens.length === 0 && <p className="text-[#8a7e68] text-sm">Inventário vazio.</p>}
                  {itens.map((it, i) => {
                    const cor = RARIDADE_COR[it.raridade] || '#c8a84b';
                    return (
                      <div key={i} className="border bg-[#161410] px-3 py-2" style={{ ...radius, borderColor: it.magico ? `${cor}60` : '#c8a84b15' }}>
                        <p className="text-sm" style={it.magico ? { color: cor } : undefined}>
                          {it.magico && '✦ '}{it.nome}
                        </p>
                        {it.oculto && <p className="text-[#b07050] text-xs">? não identificado</p>}
                        {it.raridade && !it.oculto && <p className="text-[#8a7e68] text-xs">{it.raridade}</p>}
                        {it.mecanica && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-[#8a7e68] text-xs">detalhes</summary>
                            {it.descricao && <p className="text-[#9a8e78] text-xs leading-relaxed mt-1">{limparMarkdown(it.descricao)}</p>}
                            <p className="text-[#9a8e78] text-xs leading-relaxed mt-1">{limparMarkdown(it.mecanica)}</p>
                          </details>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {aba === 'Magias' && (
              <div className="grid gap-2 sm:grid-cols-2">
                {magias.map((s, i) => (
                  <div key={i} className="border border-[#a86aa830] bg-[#161410] px-3 py-2 text-sm" style={radius}>
                    {typeof s === 'object' ? (s.name || s.nome) : s}
                  </div>
                ))}
              </div>
            )}

            {aba === 'Momentos' && (
              <div className="space-y-2">
                {momentos.map(m => (
                  <div key={m.id} className="flex gap-3 border border-[#c8a84b20] bg-[#161410] px-3 py-3" style={radius}>
                    <span className="text-xl">{m.emoji || '✦'}</span>
                    <div>
                      <p className="text-sm text-[#e8e0d0]">{m.texto}</p>
                      <p className="text-[#8a7e68] text-xs mt-1">{m.data}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {aba === 'História' && (
              <div className="space-y-5">
                {d.background_story
                  ? <p className="text-[#a09880] text-sm leading-relaxed font-light">{d.background_story}</p>
                  : <p className="text-[#8a7e68] text-sm">Sem história registrada.</p>}
                {personalidade.map(([k, rotulo]) => (
                  <div key={k}>
                    <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-1">{rotulo}</p>
                    <p className="text-[#a09880] text-sm leading-relaxed font-light">{d[k]}</p>
                  </div>
                ))}
                {d.languages?.length > 0 && (
                  <div>
                    <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] mb-1">IDIOMAS</p>
                    <p className="text-[#a09880] text-sm">{d.languages.join(' · ')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}