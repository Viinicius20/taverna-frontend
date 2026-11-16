import { createPortal } from 'react-dom';
import { cinzel } from '../../estilos';

export default function ModalCondicoes({ combatente, lista, onToggle, onFechar }) {
  if (!combatente) return null;
  const ativas = combatente.condicoes || [];

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 px-4"
      onClick={onFechar}>
      <div className="modal-anim bg-[#161410] border border-[#c8a84b30] max-w-sm w-full"
        style={{ borderRadius: '2px' }} onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[#c8a84b15]">
          <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">
            CONDIÇÕES · {combatente.nome}
          </p>
        </div>
        <div className="p-6 flex flex-wrap gap-2">
          {lista.map(({ label, cor }) => {
            const ativo = ativas.includes(label);
            return (
              <button key={label} onClick={() => onToggle(label)}
                className="px-3 py-1 text-xs border transition-all"
                style={{
                  ...cinzel, borderRadius: '2px',
                  borderColor: ativo ? cor : '#c8a84b15',
                  backgroundColor: ativo ? `${cor}25` : 'transparent',
                  color: ativo ? cor : '#4a4030',
                }}>
                {label}
              </button>
            );
          })}
        </div>
        <div className="px-6 pb-6">
          <button onClick={onFechar}
            className="w-full border border-[#c8a84b20] text-[#8a7e68] py-2 text-xs hover:border-[#c8a84b40] transition-colors"
            style={{ ...cinzel, borderRadius: '2px' }}>
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}