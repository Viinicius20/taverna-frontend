import { cinzel } from '../estilos';

export default function AbasCartao({ abas, ativa, onMudar, children }) {
  return (
    <div className="border border-[#c8a84b20] bg-[#161410]" style={{ borderRadius: '2px' }}>
      <div className="flex border-b border-[#c8a84b15] overflow-x-auto">
        {abas.map(a => (
          <button key={a.id} onClick={() => onMudar(a.id)}
            className="px-5 py-3 text-xs whitespace-nowrap transition-colors"
            style={{
              ...cinzel,
              color: ativa === a.id ? '#c8a84b' : '#8a7e68',
              borderBottom: ativa === a.id ? '2px solid #c8a84b' : '2px solid transparent',
              marginBottom: -1,
            }}>
            {a.icone} {a.rotulo.toUpperCase()}
            {a.contador > 0 && <span className="ml-2 text-[#b07050]">{a.contador}</span>}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}