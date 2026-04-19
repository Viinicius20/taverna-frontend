import { useNavigate } from 'react-router-dom';
import Dados from '../components/Dados';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };

export default function RolarDados() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0]" style={crimson}>

      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>
          ⚔ TAVERNA
        </span>
        <button onClick={() => navigate('/')}
          className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors" style={cinzel}>
          ← Voltar
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">MESA DE RPG</p>
        <h1 style={cinzel} className="text-3xl text-[#f0e8d8] font-bold mb-2">Rolar Dados</h1>
        <p className="text-[#7a7060] mb-10 font-light">Clique em um dado para rolar. Use quantidade e modificador para ajustar.</p>

        <Dados secreto={false} />
      </div>
    </div>
  );
}