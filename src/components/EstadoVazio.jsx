import { cinzel } from '../estilos';

export default function EstadoVazio({ titulo, texto, acao, onAcao }) {
  return (
    <div className="border border-dashed border-[#c8a84b20] px-6 py-8 text-center"
      style={{ borderRadius: '2px' }}>
      <p style={cinzel} className="text-[#8a7e68] text-sm">{titulo}</p>
      {texto && (
        <p className="text-[#6a6050] text-sm mt-2 max-w-md mx-auto leading-relaxed">{texto}</p>
      )}
      {acao && onAcao && (
        <button onClick={onAcao}
          className="mt-4 text-xs border border-[#c8a84b30] text-[#c8a84b] px-4 py-1.5 hover:bg-[#c8a84b10]"
          style={{ ...cinzel, borderRadius: '2px' }}>
          {acao}
        </button>
      )}
    </div>
  );
}