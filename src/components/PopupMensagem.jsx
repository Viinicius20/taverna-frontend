import { createPortal } from 'react-dom';
import Retrato from './Retrato';

const cinzel = { fontFamily: "'Cinzel', serif" };

export default function PopupMensagem({ mensagens = [], onLida }) {
  const pendentes = [...mensagens].sort((a, b) =>
    String(a.created_at).localeCompare(String(b.created_at)));
  const msg = pendentes[0];
  if (!msg) return null;

  const ehNpc = Boolean(msg.npc_nome);
  const remetente = ehNpc ? String(msg.npc_nome) : 'Mestre';
  const avatar = ehNpc && typeof msg.npc_avatar_url === 'string' ? msg.npc_avatar_url : null;
  const restantes = pendentes.length - 1;

  return createPortal(
    <>
      <style>{`
        @keyframes tav-pop-in {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .tav-pop { animation: tav-pop-in .35s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .tav-pop { animation: none; } }
      `}</style>

      <div key={msg.id} role="status" aria-live="polite"
        className="tav-pop fixed top-20 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] flex flex-row-reverse items-start gap-3">

        <Retrato src={avatar} nome={remetente} tamanho="sm" />

        <div className="relative flex-1 min-w-0">
          <div className="px-4 py-3" style={{
            background: 'var(--tav-painel)',
            border: '1px solid var(--tav-borda)',
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,.6)',
          }}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <p style={{ ...cinzel, color: 'var(--tav-ouro)' }} className="text-xs tracking-[2px] truncate">
                {remetente.toUpperCase()}{ehNpc ? ' · NPC' : ''}
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                {restantes > 0 && (
                  <span className="text-[#8a7e68] text-xs">+{restantes}</span>
                )}
                <button onClick={() => onLida(msg.id)} aria-label="Marcar como lida" title="Marcar como lida"
                  className="text-[#8a7e68] hover:text-[#c8a84b] text-base leading-none transition-colors">
                  ×
                </button>
              </div>
            </div>

            <p className="text-sm break-words"
              style={{ color: 'var(--tav-texto)', whiteSpace: 'pre-wrap', fontStyle: ehNpc ? 'italic' : 'normal' }}>
              {ehNpc ? `“${msg.message}”` : msg.message}
            </p>
          </div>

          <span aria-hidden="true" style={{
            position: 'absolute', right: -7, top: 18, width: 12, height: 12,
            background: 'var(--tav-painel)',
            borderTop: '1px solid var(--tav-borda)', borderRight: '1px solid var(--tav-borda)',
            transform: 'rotate(45deg)',
          }} />
        </div>
      </div>
    </>,
    document.body
  );
}