import { useNavigate } from 'react-router-dom';
import { cinzel } from '../estilos';

export default function LogoTaverna({ className = 'text-lg' }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('/')} aria-label="Ir para a página inicial"
      style={cinzel}
      className={`text-[#c8a84b] tracking-widest font-bold hover:text-[#e0c060] transition-colors ${className}`}>
      ⚔ TAVERNA
    </button>
  );
}