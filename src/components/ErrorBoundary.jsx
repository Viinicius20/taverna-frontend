import { Component } from 'react';

const cinzel = { fontFamily: "'Cinzel', serif" };
const botao = 'px-4 py-2 text-xs tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-[#c8a84b]';

export default class ErrorBoundary extends Component {
  state = { erro: null };

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro, info) {
    console.error('Erro de renderização:', erro, info?.componentStack);
  }

  componentDidUpdate(anterior) {
    // trocar de página limpa o erro
    if (this.state.erro && anterior.resetKey !== this.props.resetKey) this.setState({ erro: null });
  }

  render() {
    if (!this.state.erro) return this.props.children;
    const dev = process.env.NODE_ENV !== 'production';

    return (
      <div role="alert" className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0] flex items-center justify-center px-6">
        <div className="max-w-md w-full border border-[#c8a84b30] bg-[#161410] p-8 text-center" style={{ borderRadius: '2px' }}>
          <p style={{ ...cinzel, color: '#c8a84b' }} className="text-xs tracking-[4px] mb-3">ALGO DEU ERRADO</p>
          <p className="text-[#9a8e78] text-sm leading-relaxed mb-6">
            Esta tela encontrou um problema e não pôde ser exibida. O que já estava salvo continua salvo.
          </p>
          {dev && (
            <pre className="text-left text-xs text-red-400 bg-[#0f0e0c] p-3 mb-6 overflow-auto max-h-40">
              {String(this.state.erro?.message || this.state.erro)}
            </pre>
          )}
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => this.setState({ erro: null })}
              className={`${botao} border border-[#c8a84b50] text-[#c8a84b] hover:bg-[#c8a84b10]`}
              style={{ ...cinzel, borderRadius: '2px' }}>
              TENTAR DE NOVO
            </button>
            <button onClick={() => window.location.assign('/')}
              className={`${botao} bg-[#c8a84b] text-[#0f0e0c] font-bold hover:bg-[#e0c060]`}
              style={{ ...cinzel, borderRadius: '2px' }}>
              VOLTAR AO INÍCIO
            </button>
          </div>
        </div>
      </div>
    );
  }
}