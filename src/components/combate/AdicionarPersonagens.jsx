import { cinzel } from '../../estilos';

const radius = { borderRadius: '2px' };

export default function AdicionarPersonagens({
  npcs = [], personagens = [], idsEmCombate,
  onAdicionar, onVerFicha, onEntregarItem,
}) {
  if (npcs.length === 0 && personagens.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {npcs.length > 0 && (
        <div>
          <p style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] mb-2">NPCS</p>
          <div className="flex flex-wrap gap-2">
            {npcs.map(npc => (
              <button key={npc.id} onClick={() => onAdicionar(npc)}
                disabled={idsEmCombate.has(npc.id)}
                className="border border-[#c8a84b20] text-[#9a8e78] px-3 py-1 text-xs hover:border-[#c8a84b50] hover:text-[#c8a84b] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ ...cinzel, ...radius }}>
                + {npc.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {personagens.length > 0 && (
        <div>
          <p style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] mb-2">JOGADORES</p>
          <div className="flex flex-wrap gap-2">
            {personagens.map(p => (
              <div key={p.id} className="flex items-center gap-1">
                <button onClick={() => onAdicionar(p)}
                  disabled={idsEmCombate.has(p.id)}
                  className="border border-[#7ab8d420] text-[#9a8e78] px-3 py-1 text-xs hover:border-[#7ab8d450] hover:text-[#7ab8d4] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ ...cinzel, ...radius }}>
                  + {p.name}
                </button>

                {onVerFicha && (
                  <button onClick={() => onVerFicha(p)} title="Ver ficha"
                    className="text-[#8a7e68] hover:text-[#c8a84b] text-xs transition-colors px-1">
                    👁
                  </button>
                )}
                {onEntregarItem && (
                  <button onClick={() => onEntregarItem(p)} title="Entregar item"
                    className="text-[#8a7e68] hover:text-[#c8a84b] text-xs transition-colors px-1">
                    📦
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}