import { useState, useEffect, useRef } from 'react';

const cinzel = { fontFamily: "'Cinzel', serif" };

export default function ConfirmHost() {
  const [pedido, setPedido] = useState(null);
  const atual = useRef(null);

  useEffect(() => {
    const aoReceber = e => {
      if (atual.current) atual.current.resolve(false);   // se já havia um aberto, cancela ele
      atual.current = e.detail;
      setPedido(e.detail);
    };
    window.addEventListener('taverna-confirm', aoReceber);
    return () => window.removeEventListener('taverna-confirm', aoReceber);
  }, []);

  function responder(valor) {
    if (atual.current) atual.current.resolve(valor);
    atual.current = null;
    setPedido(null);
  }

  if (!pedido) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[110] px-4"
      onClick={() => responder(false)}>
      <div className="bg-[#161410] border border-[#c8a84b50] max-w-sm w-full p-6"
        style={{ borderRadius: '2px', boxShadow: '0 0 30px #c8a84b20' }}
        onClick={e => e.stopPropagation()}>
        <p className="text-[#e8e0d0] text-sm leading-relaxed mb-5 whitespace-pre-line">{pedido.msg}</p>
        <div className="flex gap-2">
          <button onClick={() => responder(false)}
            className="flex-1 border border-[#c8a84b30] text-[#9a8e78] px-4 py-2 text-xs hover:bg-[#c8a84b10] transition-colors"
            style={{ ...cinzel, borderRadius: '2px' }}>
            CANCELAR
          </button>
          <button onClick={() => responder(true)} autoFocus
            className="flex-1 border border-red-900 text-red-600 px-4 py-2 text-xs hover:bg-red-950 transition-colors"
            style={{ ...cinzel, borderRadius: '2px' }}>
            CONFIRMAR
          </button>
        </div>
      </div>
    </div>
  );
}