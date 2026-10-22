import { useState, useEffect } from 'react';
import api from '../services/api';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };
const CAMPANHA_ID = '00000000-0000-0000-0000-000000000001';

const COR_TIPO = { monstro: '#c84b4b', jogador: '#7ab8d4', npc: '#c8a84b' };
const limpar = t => (t || '').replace(/\\n/g, '\n').replace(/^"|"$/g, '').trim();

function estadoVida(pct) {
  if (pct <= 0) return 'CAÍDO';
  if (pct <= 25) return 'CRÍTICO';
  if (pct <= 50) return 'FERIDO';
  if (pct < 100) return 'ARRANHADO';
  return 'ILESO';
}

export default function TV() {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    let ativo = true;
    const buscar = async () => {
      try {
        const res = await api.get(`/tv/${CAMPANHA_ID}`);
        if (ativo) setDados(res.data.data);
      } catch { /* mantém o último estado */ }
    };
    buscar();
    const i = setInterval(buscar, 3000);
    return () => { ativo = false; clearInterval(i); };
  }, []);

  const combate = dados?.combate;
  const imagem = dados?.imagem;
  const handout = dados?.handout;
  const tokensNoMapa = dados?.tokens || [];
  

  return (
    <div className="h-screen bg-[#0f0e0c] text-[#e8e0d0] flex overflow-hidden" style={crimson}>
      <div className="flex-1 min-w-0 flex items-center justify-center p-4">
  {imagem?.url ? (
    <div className="relative inline-block max-h-full max-w-full">
        <img src={imagem.url} alt={imagem.name}
            className="block max-h-[calc(100vh-2rem)] max-w-full object-contain" />
        {tokensNoMapa.map(token => (
            <img key={token.id} src={token.token_url} alt="token"
            style={{
                position: 'absolute',
                left: `${token.x}%`,
                top: `${token.y}%`,
                width: '40px',
                height: '40px',
                objectFit: 'cover',
                borderRadius: '50%',
                transform: `translate(-50%, -50%) scale(${token.scale || 1}) rotate(${token.rotation || 0}deg)`,
                pointerEvents: 'none',
            }} />
        ))}
        </div>
    ) : (
        <p style={cinzel} className="text-[#8a7e68] text-xl tracking-[4px]">AGUARDANDO O MESTRE...</p>
    )}
    </div>

      <div className="w-[26rem] shrink-0 border-l border-[#c8a84b20] bg-[#161410] flex flex-col p-5 gap-3 overflow-y-auto">
        {dados?.calendario && (
          <p style={cinzel} className="text-[#c8a84b] text-lg tracking-[2px] mb-2">📅 {dados.calendario}</p>
        )}
        <p style={cinzel} className="text-[#c8a84b] text-sm tracking-[4px]">INICIATIVA</p>

        {!combate || combate.combatentes.length === 0 ? (
          <p className="text-[#8a7e68]">Sem combate no momento.</p>
        ) : combate.combatentes.map((c, idx) => {
          const ativo = combate.ativo && idx === combate.turno;
          const cor = COR_TIPO[c.tipo] || '#c8a84b';
          const corHp = c.hp_pct > 50 ? '#2a7a2a' : c.hp_pct > 25 ? '#8a7020' : '#8a2020';
          return (
            <div key={c.id ?? idx} className="border p-3"
              style={{
                borderRadius: '2px',
                borderColor: ativo ? '#c8a84b' : '#c8a84b20',
                backgroundColor: ativo ? '#c8a84b10' : '#0f0e0c',
                boxShadow: ativo ? '0 0 16px #c8a84b30' : 'none',
              }}>
              <div className="flex items-center gap-3 mb-2">
                {ativo && <span className="text-[#c8a84b]">▶</span>}
                {c.avatar_url && (
                  <img src={c.avatar_url} alt="" className="w-8 h-8 object-cover" style={{ borderRadius: '2px' }} />
                )}
                <span style={{ ...cinzel, color: cor }} className="text-lg flex-1 truncate">{c.nome}</span>
                <span className="text-[#9a8e78] text-sm">{c.iniciativa}</span>
              </div>
              <div className="h-2 bg-[#161410] rounded-full overflow-hidden">
                <div className="h-full transition-all" style={{ width: `${c.hp_pct}%`, backgroundColor: corHp }} />
              </div>
              <p style={cinzel} className="text-xs text-[#9a8e78] mt-1 tracking-widest">
                {c.tipo === 'jogador' && c.hp_max ? `${c.hp_atual} / ${c.hp_max}` : estadoVida(c.hp_pct)}
              </p>
              {c.condicoes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.condicoes.map(cond => (
                    <span key={cond} style={{ ...cinzel, borderRadius: '2px' }}
                      className="text-xs px-2 py-0.5 border border-[#a86aa840] text-[#a86aa8] bg-[#a86aa810]">
                      {cond}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {handout && (
          <div className="mt-2 border border-[#c8a84b30] bg-[#0f0e0c] p-4" style={{ borderRadius: '2px' }}>
            <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] mb-2">📜 {handout.name}</p>
            {handout.url ? (
              <img src={handout.url} alt={handout.name} className="w-full" />
            ) : (
              <p className="text-[#a09880] text-sm whitespace-pre-wrap leading-relaxed max-h-64 overflow-hidden">
                {limpar(handout.text_content)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}