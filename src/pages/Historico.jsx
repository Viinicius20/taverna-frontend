import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };
const CAMPANHA_ID = '00000000-0000-0000-0000-000000000001';

export default function Historico() {
  const navigate = useNavigate();
  const [sessoes, setSessoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [expandida, setExpandida] = useState(null);

  useEffect(() => {
    buscarSessoes();
  }, []);

  async function buscarSessoes() {
    try {
      const res = await fetch(`https://taverna-backend-eq3b.onrender.com/sessions/${CAMPANHA_ID}`);
      const json = await res.json();
      setSessoes(json.data || []);
    } catch {
      setSessoes([]);
    }
    setCarregando(false);
  }

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0]" style={crimson}>
      <nav className="flex items-center justify-between px-4 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>⚔ TAVERNA</span>
        <button onClick={() => navigate('/')}
          className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors" style={cinzel}>
          ← Voltar
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">CRÔNICAS</p>
        <h1 style={cinzel} className="text-2xl text-[#f0e8d8] font-semibold mb-8">Histórico de Sessões</h1>

        {carregando ? (
          <div className="flex items-center gap-3 justify-center py-16">
            <div className="w-6 h-6 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
            <p style={cinzel} className="text-[#4a4030] text-xs tracking-widest">CARREGANDO...</p>
          </div>
        ) : sessoes.length === 0 ? (
          <p style={cinzel} className="text-[#3a3020] text-sm text-center py-16">NENHUMA SESSÃO REGISTRADA</p>
        ) : (
          <div className="space-y-2">
            {sessoes.map(s => (
              <div key={s.id} className="border border-[#c8a84b15] bg-[#161410]"
                style={{ borderRadius: '2px' }}>
                <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#1c1a16] transition-colors"
                  onClick={() => setExpandida(expandida === s.id ? null : s.id)}>
                  <div className="flex items-center gap-3">
                    <span style={cinzel} className="text-[#c8a84b] text-xs opacity-60">#{s.session_number}</span>
                    <span style={cinzel} className="text-[#e8e0d0] text-sm">{s.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#4a4030] text-xs">
                      {new Date(s.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-[#4a4030] text-xs">{expandida === s.id ? '▲' : '▼'}</span>
                  </div>
                </div>
                {expandida === s.id && s.summary && (
                  <div className="px-4 pb-4 border-t border-[#c8a84b10] pt-3">
                    <p className="text-[#8a8070] text-sm leading-relaxed font-light">{s.summary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}