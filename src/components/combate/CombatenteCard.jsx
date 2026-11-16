const cinzel = { fontFamily: "'Cinzel', serif" };


const TIPOS = {
  monstro: { label: 'MONSTRO', cls: 'border-red-600 text-red-600' },
  jogador: { label: 'JOGADOR', cls: 'border-[#7ab8d430] text-[#7ab8d4]' },
  npc:     { label: 'NPC',     cls: 'border-[#c8a84b30] text-[#c8a84b60]' },
};

export default function CombatenteCard({
  c, isAtivo, onAtualizar, onRemover, onCondicoes, compacto = false,
}) {
  const hpPct = c.hpMax > 0 ? Math.max(0, Math.min(100, (c.hpAtual / c.hpMax) * 100)) : 0;
  const hpCor = hpPct > 50 ? '#2a7a2a' : hpPct > 25 ? '#8a7020' : '#8a2020';
  const tipo = TIPOS[c.tipo] ?? TIPOS.npc;

  return (
    <div className="border p-3 transition-all"
      style={{
        borderRadius: '2px',
        borderColor: isAtivo ? '#c8a84b' : '#c8a84b15',
        backgroundColor: isAtivo ? '#c8a84b08' : '#161410',
        boxShadow: isAtivo ? '0 0 12px #c8a84b20' : 'none',
      }}>
      <div className="flex items-center gap-3">

        {/* Iniciativa */}
        <div className="flex flex-col items-center">
          <span style={cinzel} className="text-[#c8a84b] text-xs opacity-50 mb-1">INIT</span>
          <input type="number" value={c.iniciativa}
            onChange={e => onAtualizar(c.id, 'iniciativa', Number(e.target.value))}
            className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#c8a84b] text-center text-lg w-14 py-1 focus:outline-none focus:border-[#c8a84b50]"
            style={{ borderRadius: '2px' }} />
        </div>

        {/* Nome, HP e condições */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {isAtivo && <span className="text-[#c8a84b] text-xs">▶</span>}
            {c.tipo === 'jogador' && c.avatar_url && (
              <img src={c.avatar_url} alt={c.nome}
                className="w-6 h-6 object-cover border border-[#c8a84b20]"
                style={{ borderRadius: '2px' }} />
            )}
            <span style={cinzel} className="text-[#e8e0d0] text-sm truncate">{c.nome}</span>
            <span style={{ ...cinzel, borderRadius: '2px' }}
              className={`text-xs px-2 py-0.5 border ${tipo.cls}`}>
              {tipo.label}
            </span>
          </div>

          <div className="h-1.5 bg-[#0f0e0c] rounded-full overflow-hidden">
            <div className="h-full transition-all" style={{ width: `${hpPct}%`, backgroundColor: hpCor }} />
          </div>

          {c.condicoes?.length > 0 && (
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

        {/* HP */}
        <div className="flex items-center gap-1">
          <input type="number" value={c.hpAtual}
            onChange={e => onAtualizar(c.id, 'hpAtual', Number(e.target.value))}
            className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] text-center text-lg w-16 py-1 focus:outline-none focus:border-[#c8a84b50]"
            style={{ borderRadius: '2px' }} />
          <span className="text-[#8a7e68] text-sm">/</span>
          <span style={cinzel} className="text-[#8a7e68] text-sm w-10 text-center">{c.hpMax}</span>
        </div>

        <button onClick={() => onCondicoes(c.id)} title="Gerenciar condições"
          className="text-[#8a7e68] hover:text-[#a86aa8] text-xs transition-colors px-1">⚕</button>

        {!compacto && (
          <button onClick={() => onRemover(c.id)}
            className="text-red-600 text-lg transition-colors px-1">×</button>
        )}
      </div>
    </div>
  );
}