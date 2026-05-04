import { useNavigate } from 'react-router-dom';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };

const navLinks = [
  { label: 'Início', rota: '/' },
  { label: 'Personagens', rota: '/personagens' },
  { label: 'Dados', rota: '/dados' },
  { label: 'Mestre', rota: '/mestre' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0] overflow-x-hidden" style={crimson}>

      {/* NAV */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>
          ⚔ TAVERNA
        </span>
        <div className="flex gap-6 sm:gap-8">
          {navLinks.map(({ label, rota }) => (
            <button key={label} onClick={() => navigate(rota)} style={cinzel}
              className="text-[#a09880] text-sm tracking-widest hover:text-[#c8a84b] transition-colors">
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* HERO */}
      <div className="text-center px-4 sm:px-8 py-20 md:py-24 relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(200,168,75,0.07) 0%, transparent 70%)' }} />
        
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-6 opacity-80">RPG</p>
        <h1 style={cinzel} className="text-4xl sm:text-5xl font-bold text-[#f0e8d8] leading-tight mb-4">
          Sua aventura<br />começa <span className="text-[#c8a84b]">aqui</span>
        </h1>
        <p className="text-[#8a8070] text-lg sm:text-xl max-w-md mx-auto mb-10 font-light leading-relaxed px-4">
          Crie personagens, gerencie campanhas e dê vida ao seu mundo com o poder da IA.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
          <button onClick={() => navigate('/personagens/criar')}
            className="bg-[#c8a84b] text-[#0f0e0c] px-8 py-3.5 text-sm tracking-widest font-bold hover:bg-[#e0c060] transition-colors"
            style={{ ...cinzel, borderRadius: '2px' }}>
            Criar Personagem
          </button>
          <button onClick={() => navigate('/personagens')}
            className="border border-[#c8a84b80] text-[#c8a84b] px-8 py-3.5 text-sm tracking-widest hover:bg-[#c8a84b10] transition-colors"
            style={{ ...cinzel, borderRadius: '2px' }}>
            Ver Personagens
          </button>
        </div>
      </div>

      {/* DIVISOR */}
      <div className="w-16 h-px bg-[#c8a84b60] mx-auto mb-12 sm:mb-16" />

      {/* FEATURES */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 mb-20">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">O QUE VOCÊ PODE FAZER</p>
        <h2 style={cinzel} className="text-2xl text-[#f0e8d8] mb-1 font-semibold">Ferramentas para a mesa</h2>
        <p className="text-[#7a7060] mb-8 font-light">Tudo que você precisa, em um só lugar.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#c8a84b25] border border-[#c8a84b25]">
          {[
            { icon: '✦', title: 'Criação com IA', desc: 'Descreva seu personagem em palavras e a IA monta a ficha completa.', rota: '/personagens/criar' },
            { icon: '◈', title: 'Import de PDF', desc: 'Já tem uma ficha pronta? Importe direto do PDF.', rota: '/personagens/criar' },
            { icon: '◉', title: 'Habilidades', desc: 'Veja todas as magias, features e perícias com descrições.', rota: '/personagens' },
            { icon: '⬡', title: 'NPCs do Mestre', desc: 'Gere NPCs completos com segredos.', rota: '/mestre' },
          ].map(({ icon, title, desc, rota }) => (
            <div key={title} onClick={() => navigate(rota)}
              className="bg-[#161410] p-6 sm:p-8 group cursor-pointer hover:bg-[#1c1a16] transition-colors">
              <span className="text-3xl block mb-5">{icon}</span>
              <span className="absolute top-6 right-6 text-[#c8a84b] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              <h3 style={cinzel} className="text-[#e8dcc8] text-base mb-2 font-semibold tracking-wide">{title}</h3>
              <p className="text-[#6a6050] text-sm leading-relaxed font-light">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ROLES */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 mb-20">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">ACESSO</p>
        <h2 style={cinzel} className="text-2xl text-[#f0e8d8] mb-8 font-semibold">Quem é você na mesa?</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#c8a84b25] border border-[#c8a84b25]">
          {/* Mestre Card */}
          <div className="bg-[#161410] p-8 md:p-10 hover:bg-[#1c1a16] transition-colors cursor-pointer" 
               onClick={() => navigate('/mestre')}>
            {/* ... seu conteúdo do Mestre continua igual ... */}
          </div>

          {/* Jogador Card */}
          <div className="bg-[#161410] p-8 md:p-10 hover:bg-[#1c1a16] transition-colors cursor-pointer" 
               onClick={() => navigate('/personagens')}>
            {/* ... seu conteúdo do Jogador continua igual ... */}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#c8a84b15] py-8 text-center">
        <p style={cinzel} className="text-[#403830] text-xs tracking-[3px]">TAVERNA</p>
      </footer>
    </div>
  );
}