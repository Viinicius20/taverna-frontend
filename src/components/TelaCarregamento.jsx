const cinzel = { fontFamily: "'Cinzel', serif" };

export default function TelaCarregamento({ dica, falhou, onTentar, onContinuar }) {
  return (
    <div role="status" aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--tav-fundo)' }}>
      <style>{`
        @keyframes tav-fade { from { opacity: 0; } to { opacity: 1; } }
        .tav-dica { animation: tav-fade .6s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .tav-dica { animation: none; } }
      `}</style>

      <p style={{ ...cinzel, color: 'var(--tav-ouro)' }} className="text-xs tracking-[6px] mb-8">
        ⚔ TAVERNA
      </p>

      {falhou ? (
        <>
          <h1 style={{ ...cinzel, color: 'var(--tav-texto)' }} className="text-xl mb-3">
            O servidor não respondeu
          </h1>
          <p style={{ color: 'var(--tav-texto-suave)' }} className="text-sm mb-8 max-w-sm">
            Pode ser a sua conexão ou o servidor ainda subindo.
          </p>
          <div className="flex gap-3">
            <button onClick={onTentar} style={{ ...cinzel, borderRadius: 2 }}
              className="bg-[#c8a84b] text-[#0f0e0c] px-5 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors">
              TENTAR DE NOVO
            </button>
            <button onClick={onContinuar} style={{ ...cinzel, borderRadius: 2 }}
              className="border border-[#c8a84b30] text-[#9a8e78] px-5 py-2 text-xs tracking-widest hover:text-[#c8a84b] transition-colors">
              CONTINUAR
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="w-12 h-12 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin mb-6" />
          <h1 style={{ ...cinzel, color: 'var(--tav-texto)' }} className="text-xl mb-2">
            Acordando a taverna...
          </h1>
          <p style={{ color: 'var(--tav-texto-suave)' }} className="text-sm mb-10">
            O servidor estava dormindo. Costuma levar até um minuto.
          </p>
          <p key={dica} className="tav-dica text-sm italic max-w-sm" style={{ color: 'var(--tav-texto)' }}>
            {dica}
          </p>
        </>
      )}
    </div>
  );
}