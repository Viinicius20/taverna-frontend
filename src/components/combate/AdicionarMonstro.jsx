import { cinzel } from '../../estilos';
import api from '../../services/api';

const radius = { borderRadius: '2px' };

export default function AdicionarMonstro({
  novoMonstro, setNovoMonstro, sugestoes, setSugestoes, onAdicionar,
}) {
  async function buscar(val) {
    setNovoMonstro(p => ({ ...p, nome: val }));
    if (val.length < 2) return setSugestoes([]);
    try {
      const res = await api.get(`/bestiary?name=${encodeURIComponent(val)}`);
      setSugestoes((res.data.data || []).slice(0, 5));
    } catch {
      setSugestoes([]);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4 mt-6">
      <div className="relative w-full">
        <input value={novoMonstro.nome}
          onChange={e => buscar(e.target.value)}
          placeholder="Nome do monstro..." aria-label="Nome do monstro..."
          className="bg-[#161410] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full text-sm focus:outline-none focus:border-[#c8a84b50] placeholder-[#3a3020]"
          style={radius} />

        {sugestoes.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-[#161410] border border-[#c8a84b20] z-10" style={radius}>
            {sugestoes.map(m => (
              <button key={m.id}
                onClick={() => {
                  setNovoMonstro(p => ({ ...p, nome: m.name, hp: m.hp }));
                  setSugestoes([]);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[#c8a84b10] transition-colors flex items-center justify-between"
                style={cinzel}>
                <span className="text-[#e8e0d0]">{m.name}</span>
                <span className="text-[#8a7e68] text-xs">CR {m.cr} · HP {m.hp}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input value={novoMonstro.hp}
          onChange={e => setNovoMonstro(p => ({ ...p, hp: e.target.value }))}
          placeholder="HP" aria-label="HP" type="number" min={1}
          className="bg-[#161410] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-20 text-sm text-center focus:outline-none focus:border-[#c8a84b50]"
          style={radius} />
        <input value={novoMonstro.qtd}
          onChange={e => setNovoMonstro(p => ({ ...p, qtd: Math.max(1, Number(e.target.value)) }))}
          type="number" min={1} max={20} aria-label="Quantidade"
          className="bg-[#161410] border border-[#c8a84b20] text-[#c8a84b] px-3 py-2 w-16 text-sm text-center focus:outline-none focus:border-[#c8a84b50]"
          style={radius} />
        <button onClick={onAdicionar}
          className="bg-[#c8a84b] text-[#0f0e0c] px-4 py-2 text-xs font-bold hover:bg-[#e0c060] transition-colors"
          style={{ ...cinzel, ...radius }}>
          + MONSTRO
        </button>
      </div>
    </div>
  );
}