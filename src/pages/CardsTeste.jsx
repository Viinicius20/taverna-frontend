import CardRaridade from '../components/CardRaridade';

const EXEMPLOS = [
  { nome: 'Adaga de Bronze', raridade: 'comum', subtitulo: 'Arma · simples', descricao: 'Uma lâmina comum, gasta pelo uso.' },
  { nome: 'Poção de Cura', raridade: 'Incomum', subtitulo: 'Poção', descricao: 'Recupera pontos de vida ao ser bebida.' },
  { nome: 'Capa Élfica', raridade: 'raro', subtitulo: 'Item maravilhoso', descricao: 'Concede vantagem em testes de furtividade.' },
  { nome: 'Espada Flamejante', raridade: 'Muito Raro', subtitulo: 'Arma · requer sintonização', descricao: 'A lâmina se acende em chamas ao comando de quem a empunha.' },
  { nome: 'Coroa do Rei Caído', raridade: 'Lendário', subtitulo: 'Artefato', descricao: 'Dizem que quem a veste ouve a voz dos mortos.' },
];

export default function CardsTeste() {
  return (
    <div className="min-h-screen p-8" style={{ background: 'var(--tav-fundo)' }}>
      <h1 style={{ fontFamily: "'Cinzel', serif", color: 'var(--tav-ouro)' }} className="text-xl mb-6">
        Teste de cards
      </h1>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {EXEMPLOS.map(e => <CardRaridade key={e.nome} {...e} />)}
      </div>
    </div>
  );
}