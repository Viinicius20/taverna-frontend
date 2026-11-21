import { cinzel } from '../estilos';

function normalizar(valor) {
  if (!valor) return [];
  let dados = valor;
  if (typeof valor === 'string') {
    const limpo = valor.replace(/```json|```/g, '').trim();
    try { dados = JSON.parse(limpo); } catch { return null; }   // texto comum
  }
  if (dados === null || typeof dados !== 'object') return null;
  if (!Array.isArray(dados)) dados = [dados];
  return dados.map(d => (typeof d === 'string'
    ? { titulo: '', descricao: d }
    : { titulo: d.title || d.titulo || d.nome || '', descricao: d.description || d.descricao || '' }));
}

export default function IdeiasQuest({ valor }) {
  const itens = normalizar(valor);
  if (itens === null) {
    return <p className="text-[#9a8e78] text-sm leading-relaxed font-light whitespace-pre-line">{valor}</p>;
  }
  return (
    <div className="space-y-2">
      {itens.map((q, i) => (
        <div key={i} className="border border-[#c8a84b15] bg-[#0f0e0c] px-3 py-2" style={{ borderRadius: '2px' }}>
          {q.titulo && <p style={cinzel} className="text-[#e8e0d0] text-sm">{q.titulo}</p>}
          <p className="text-[#9a8e78] text-sm leading-relaxed font-light mt-1">{q.descricao}</p>
        </div>
      ))}
    </div>
  );
}