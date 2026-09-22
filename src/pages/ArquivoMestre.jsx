import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };
const CAMPANHA_ID = '00000000-0000-0000-0000-000000000001';

const CATEGORIAS = [
  { id: 'segredos', label: '🔴 Segredos', cor: '#8a2020' },
  { id: 'pistas', label: '🟡 Pistas ainda não descobertas', cor: '#8a7020' },
  { id: 'planos', label: '🟣 Planos dos vilões', cor: '#8a4a8a' },
  { id: 'eventos_futuros', label: '🔵 Eventos futuros', cor: '#4a6a8a' },
  { id: 'mortes', label: '⚫ Mortes planejadas', cor: '#4a4030' },
  { id: 'npcs', label: '🟢 NPCs importantes', cor: '#4a8a4a' },
];

export default function ArquivoMestre() {
  const navigate = useNavigate();
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [categoriaAberta, setCategoriaAberta] = useState('segredos');
  const [novoTexto, setNovoTexto] = useState('');
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    buscarItens();
  }, []);

  async function buscarItens() {
    try {
      const res = await api.get(`/arquivo-mestre/${CAMPANHA_ID}`);
      setItens(res.data.data || []);
    } catch {
      setItens([]);
    }
    setCarregando(false);
  }

  async function criarItem() {
    if (!novoTexto.trim()) return;
    setCriando(true);
    try {
      await api.post('/arquivo-mestre', {
        campaign_id: CAMPANHA_ID,
        categoria: categoriaAberta,
        texto: novoTexto
      });
      setNovoTexto('');
      buscarItens();
    } catch {
      alert('Erro ao criar item.');
    }
    setCriando(false);
  }

  async function deletarItem(id) {
    if (!window.confirm('Deletar este item?')) return;
    try {
      await api.delete(`/arquivo-mestre/${id}`);
      setItens(prev => prev.filter(i => i.id !== id));
    } catch {
      alert('Erro ao deletar.');
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0] page-fade" style={crimson}>
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>⚔ TAVERNA</span>
        <button onClick={() => navigate('/mestre')}
          className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors" style={cinzel}>
          ← Voltar
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">CAMPANHA</p>
        <h1 style={cinzel} className="text-2xl text-[#f0e8d8] font-semibold mb-8">Arquivo Secreto do Mestre</h1>

        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIAS.map(c => (
            <button key={c.id} onClick={() => setCategoriaAberta(c.id)}
              className="px-4 py-2 text-xs tracking-widest transition-colors border"
              style={{
                ...cinzel, borderRadius: '2px',
                borderColor: categoriaAberta === c.id ? c.cor : '#c8a84b15',
                backgroundColor: categoriaAberta === c.id ? `${c.cor}20` : 'transparent',
                color: categoriaAberta === c.id ? c.cor : '#6a6050',
              }}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="border border-[#c8a84b30] bg-[#161410] mb-8 p-6">
          <textarea value={novoTexto} onChange={e => setNovoTexto(e.target.value)}
            placeholder={`Adicionar em "${CATEGORIAS.find(c => c.id === categoriaAberta)?.label}"...`}
            rows={3}
            className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-4 py-3 w-full focus:outline-none focus:border-[#c8a84b60] resize-none mb-3"
            style={{ borderRadius: '2px' }} />
          <button onClick={criarItem} disabled={!novoTexto.trim() || criando}
            className="bg-[#c8a84b] text-[#0f0e0c] px-5 py-2 text-xs tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30"
            style={{ ...cinzel, borderRadius: '2px' }}>
            {criando ? 'Salvando...' : '+ Adicionar'}
          </button>
        </div>

        {carregando ? (
          <div className="flex items-center gap-3 justify-center py-16">
            <div className="w-6 h-6 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
            <p style={cinzel} className="text-[#4a4030] text-xs tracking-widest">CARREGANDO...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {itens.filter(i => i.categoria === categoriaAberta).length === 0 ? (
              <p style={cinzel} className="text-[#3a3020] text-sm text-center py-10">NADA REGISTRADO NESSA CATEGORIA</p>
            ) : (
              itens.filter(i => i.categoria === categoriaAberta).map(item => (
                <div key={item.id} className="border border-[#c8a84b15] bg-[#161410] px-4 py-3 flex items-start justify-between gap-3" style={{ borderRadius: '2px' }}>
                  <p className="text-[#a09880] text-sm leading-relaxed flex-1">{item.texto}</p>
                  <button onClick={() => deletarItem(item.id)}
                    className="text-red-900 hover:text-red-600 text-sm transition-colors flex-shrink-0">×</button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}