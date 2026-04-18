import { useNavigate } from 'react-router-dom';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };

const navLinks = [
  { label: 'Início', rota: '/' },
  { label: 'Personagens', rota: '/personagens' },
  { label: 'Mestre', rota: '/mestre' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0]" style={crimson}>

      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>
          ⚔ TAVERNA
        </span>
        <div className="flex gap-8">
          {navLinks.map(({ label, rota }) => (
            <button key={label} onClick={() => navigate(rota)} style={cinzel}
              className="text-[#a09880] text-sm tracking-widest hover:text-[#c8a84b] transition-colors">
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* HERO */}
      <div className="text-center px-8 py-24 relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(200,168,75,0.07) 0%, transparent 70%)' }} />
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-6 opacity-80">RPG</p>
        <h1 style={cinzel} className="text-5xl font-bold text-[#f0e8d8] leading-tight mb-4">
          Sua aventura<br />começa <span className="text-[#c8a84b]">aqui</span>
        </h1>
        <p className="text-[#8a8070] text-xl max-w-md mx-auto mb-10 font-light leading-relaxed">
          Crie personagens, gerencie campanhas e dê vida ao seu mundo com o poder da IA.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button onClick={() => navigate('/personagens/criar')}
            className="bg-[#c8a84b] text-[#0f0e0c] px-8 py-3 text-sm tracking-widest font-bold hover:bg-[#e0c060] transition-colors"
            style={{ ...cinzel, borderRadius: '2px' }}>
            Criar Personagem
          </button>
          <button onClick={() => navigate('/personagens')}
            className="border border-[#c8a84b80] text-[#c8a84b] px-8 py-3 text-sm tracking-widest hover:bg-[#c8a84b10] transition-colors"
            style={{ ...cinzel, borderRadius: '2px' }}>
            Ver Personagens
          </button>
        </div>
      </div>

      {/* DIVISOR */}
      <div className="w-16 h-px bg-[#c8a84b60] mx-auto mb-16" />

      {/* FEATURES */}
      <div className="max-w-5xl mx-auto px-8 mb-20">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">O QUE VOCÊ PODE FAZER</p>
        <h2 style={cinzel} className="text-2xl text-[#f0e8d8] mb-1 font-semibold">Ferramentas para a mesa</h2>
        <p className="text-[#7a7060] mb-8 font-light">Tudo que você precisa, em um só lugar.</p>

        <div className="grid grid-cols-2 gap-px bg-[#c8a84b25] border border-[#c8a84b25]">
          {[
            { icon: '✦', title: 'Criação com IA', desc: 'Descreva seu personagem em palavras e a IA monta a ficha completa com atributos, perícias e história.', rota: '/personagens/criar' },
            { icon: '◈', title: 'Import de PDF', desc: 'Já tem uma ficha pronta? Importe direto do PDF e ela é lida e organizada automaticamente.', rota: '/personagens/criar' },
            { icon: '◉', title: 'Habilidades', desc: 'Veja todas as magias, features e perícias com descrições detalhadas geradas pela IA.', rota: '/personagens' },
            { icon: '⬡', title: 'NPCs do Mestre', desc: 'Gere NPCs completos com personalidade, segredos e motivações. Visíveis só para o mestre.', rota: '/mestre' },
          ].map(({ icon, title, desc, rota }) => (
            <div key={title} onClick={() => navigate(rota)}
              className="bg-[#161410] p-8 group cursor-pointer hover:bg-[#1c1a16] transition-colors relative overflow-hidden">
              <span className="text-2xl block mb-5">{icon}</span>
              <span className="absolute top-6 right-6 text-[#c8a84b] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              <h3 style={cinzel} className="text-[#e8dcc8] text-base mb-2 font-semibold tracking-wide">{title}</h3>
              <p className="text-[#6a6050] text-sm leading-relaxed font-light">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ROLES */}
      <div className="max-w-5xl mx-auto px-8 mb-20">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">ACESSO</p>
        <h2 style={cinzel} className="text-2xl text-[#f0e8d8] mb-8 font-semibold">Quem é você na mesa?</h2>

        <div className="grid grid-cols-2 gap-px bg-[#c8a84b25] border border-[#c8a84b25]">
          <div className="bg-[#161410] p-10 hover:bg-[#1c1a16] transition-colors cursor-pointer" onClick={() => navigate('/mestre')}>
            <span className="inline-block text-[#c8a84b] border border-[#c8a84b40] bg-[#c8a84b10] px-3 py-1 text-xs tracking-[3px] mb-5"
              style={cinzel}>MESTRE</span>
            <h3 style={cinzel} className="text-[#f0e8d8] text-xl mb-3 font-semibold">Área do Mestre</h3>
            <p className="text-[#6a6050] text-sm leading-relaxed mb-6 font-light">
              Controle total da campanha. Crie e gerencie NPCs, anotações e informações secretas que só você vê.
            </p>
            <ul className="flex flex-col gap-2">
              {['Painel de NPCs com segredos', 'Notas de sessão privadas', 'Rolagens secretas', 'Visão geral da campanha'].map(f => (
                <li key={f} className="text-[#8a8070] text-xs pl-4 relative" style={{ ...cinzel, letterSpacing: '0.5px' }}>
                  <span className="absolute left-0 text-[#c8a84b80]">—</span>{f}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#161410] p-10 hover:bg-[#1c1a16] transition-colors cursor-pointer" onClick={() => navigate('/personagens')}>
            <span className="inline-block text-[#7ab8d4] border border-[#7ab8d440] bg-[#7ab8d410] px-3 py-1 text-xs tracking-[3px] mb-5"
              style={cinzel}>JOGADOR</span>
            <h3 style={cinzel} className="text-[#f0e8d8] text-xl mb-3 font-semibold">Área do Jogador</h3>
            <p className="text-[#6a6050] text-sm leading-relaxed mb-6 font-light">
              Crie e gerencie seus personagens com ajuda da IA. Acesse suas habilidades e ficha a qualquer hora.
            </p>
            <ul className="flex flex-col gap-2">
              {['Criação de personagem com IA', 'Ficha interativa completa', 'Descrição de habilidades', 'Import de PDF'].map(f => (
                <li key={f} className="text-[#8a8070] text-xs pl-4 relative" style={{ ...cinzel, letterSpacing: '0.5px' }}>
                  <span className="absolute left-0 text-[#7ab8d480]">—</span>{f}
                </li>
              ))}
            </ul>
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