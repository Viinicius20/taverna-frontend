import { cinzel } from '../../estilos';

const radius = { borderRadius: '2px' };

export default function ControlesCombate({
  temCombatentes, combateAtivo, onOrdenar, onIniciar, onProximo, onResetar,
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div>
        <p style={cinzel} className="text-[#b07050] text-xs tracking-[4px] mb-2 opacity-70">ENCONTRO ATUAL</p>
        <h2 style={cinzel} className="text-xl text-[#f0e8d8] font-semibold">Painel de Combate</h2>
      </div>

      {temCombatentes && (
        <div className="flex gap-2">
          <a href="/tv" target="_blank" rel="noreferrer"
            className="border border-[#c8a84b30] text-[#c8a84b] px-3 py-2 text-xs hover:bg-[#c8a84b10] transition-colors"
            style={{ ...cinzel, ...radius }}>
            📺 TV
          </a>

          <button onClick={onOrdenar}
            className="border border-[#c8a84b40] text-[#c8a84b] px-4 py-2 text-xs hover:bg-[#c8a84b10] transition-colors"
            style={{ ...cinzel, ...radius }}>
            ↕ ORDENAR
          </button>

          {combateAtivo ? (
            <button onClick={onProximo}
              title="Atalho: Espaço ou Enter"
              className="bg-[#c8a84b] text-[#0f0e0c] px-4 py-2 text-xs font-bold hover:bg-[#e0c060] transition-colors"
              style={{ ...cinzel, ...radius }}>
              PRÓXIMO TURNO →
            </button>
          ) : (
            <button onClick={onIniciar}
              className="bg-[#b07050] text-[#f0e8d8] px-4 py-2 text-xs font-bold hover:bg-[#c08060] transition-colors"
              style={{ ...cinzel, ...radius }}>
              ⚔ INICIAR
            </button>
          )}

          <button onClick={onResetar}
            className="border border-red-600 text-red-600 px-3 py-2 text-xs hover:bg-red-600 hover:bg-opacity-10 transition-colors"
            style={{ ...cinzel, ...radius }}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}