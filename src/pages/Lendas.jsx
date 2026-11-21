import { useNavigate } from 'react-router-dom';
import { cinzel, crimson } from '../estilos';
import LogoTaverna from '../components/LogoTaverna';
import LendasLocais from '../components/LendasLocais';

export default function Lendas() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0] page-fade" style={crimson}>
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#c8a84b20]">
        <LogoTaverna />
        <button onClick={() => navigate('/mestre')} style={cinzel}
          className="text-[#9a8e78] text-sm hover:text-[#c8a84b] transition-colors">← Mestre</button>
      </nav>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <LendasLocais />
      </div>
    </div>
  );
}