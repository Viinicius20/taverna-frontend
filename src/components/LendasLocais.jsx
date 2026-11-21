import { useState, useEffect } from 'react';
import api from '../services/api';
import { cinzel } from '../estilos';

const radius = { borderRadius: '2px' };
const campo = 'bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full text-sm focus:outline-none focus:border-[#c8a84b50] placeholder-[#3a3020]';

export default function LendasLocais() {
  const [lendas, setLendas] = useState([]);
  const [novo, setNovo] = useState({ titulo: '', verdade: '', versao_popular: '' });
  const [aberta, setAberta] = useState(null);

  useEffect(() => {
    api.get('/lendas').then(r => setLendas(r.data.data || [])).catch(() => {});
  }, []);

  async function criar() {
    if (!novo.titulo.trim()) return;
    try {
      const r = await api.post('/lendas', novo);
      setLendas(ls => [...ls, r.data.data]);
      setNovo({ titulo: '', verdade: '', versao_popular: '' });
      setAberta(r.data.data.id);
    } catch { alert('Erro ao criar a lenda.'); }
  }

  function editar(id, campos) {
    setLendas(ls => ls.map(l => (l.id === id ? { ...l, ...campos } : l)));
  }

  async function salvar(id, campos) {
    try { await api.patch(`/lendas/${id}`, campos); }
    catch { alert('Erro ao salvar.'); }
  }

  async function apagar(id) {
    if (!window.confirm('Apagar esta lenda?')) return;
    try {
      await api.delete(`/lendas/${id}`);
      setLendas(ls => ls.filter(l => l.id !== id));
    } catch { alert('Erro ao apagar.'); }
  }

  return (
    <div className="border border-[#c8a84b20] bg-[#161410] p-6" style={radius}>
      <p style={cinzel} className="text-[#b07050] text-xs tracking-[4px] mb-2 opacity-70">BOATOS DA NOITE</p>
      <h2 style={cinzel} className="text-xl text-[#f0e8d8] font-semibold mb-1">Lendas Locais</h2>
      <p className="text-[#7a7060] mb-4 font-light text-sm">
        O que você escreve em "o que realmente aconteceu" só o servidor vê. Os boatos partem daí e vão se distorcendo.
      </p>

      <div className="space-y-2 mb-6">
        {lendas.length === 0 && <p className="text-[#8a7e68] text-sm">Nenhuma lenda ainda.</p>}
        {lendas.map(l => (
          <div key={l.id} className="border border-[#c8a84b15] bg-[#0f0e0c]" style={radius}>
            <div className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer"
              onClick={() => setAberta(aberta === l.id ? null : l.id)}>
              <span style={cinzel} className="text-sm text-[#e8e0d0]">{l.titulo}</span>
              <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                <button onClick={() => { editar(l.id, { ativa: !l.ativa }); salvar(l.id, { ativa: !l.ativa }); }}
                  className="text-xs border px-2 py-0.5 transition-colors"
                  style={{ ...cinzel, ...radius,
                           borderColor: l.ativa ? '#4a8a4a60' : '#c8a84b20',
                           color: l.ativa ? '#4a8a4a' : '#8a7e68' }}>
                  {l.ativa ? 'ATIVA' : 'PAUSADA'}
                </button>
                <button onClick={() => apagar(l.id)} className="text-red-600 text-sm">×</button>
              </div>
            </div>

            {aberta === l.id && (
              <div className="px-3 pb-3 space-y-3 border-t border-[#c8a84b10] pt-3">
                <div>
                  <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">O QUE REALMENTE ACONTECEU</label>
                  <textarea rows={3} value={l.verdade || ''} className={`${campo} resize-none`} style={radius}
                    onChange={e => editar(l.id, { verdade: e.target.value })}
                    onBlur={e => salvar(l.id, { verdade: e.target.value })} />
                </div>
                <div>
                  <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">O QUE O POVO DIZ</label>
                  <textarea rows={2} value={l.versao_popular || ''} className={`${campo} resize-none`} style={radius}
                    onChange={e => editar(l.id, { versao_popular: e.target.value })}
                    onBlur={e => salvar(l.id, { versao_popular: e.target.value })} />
                </div>
                <div className="border-t border-[#c8a84b10] pt-3">
                  <p style={cinzel} className="text-[#8a7e68] text-xs tracking-[2px] mb-1">
                    VERSÃO EM CIRCULAÇÃO · passou de boca em boca {l.distorcao || 0}×
                  </p>
                  <p className="text-[#9a8e78] text-sm italic">{l.ultimo_boato || 'Nenhuma versão ainda.'}</p>
                  {(l.ultimo_boato || l.distorcao > 0) && (
                    <button onClick={() => { editar(l.id, { distorcao: 0, ultimo_boato: '' }); salvar(l.id, { distorcao: 0, ultimo_boato: '' }); }}
                      className="mt-2 text-xs border border-[#c8a84b30] text-[#c8a84b] px-2 py-1 hover:bg-[#c8a84b10] transition-colors"
                      style={{ ...cinzel, ...radius }}>
                      ↺ Reiniciar a fofoca
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-[#c8a84b15] pt-4">
        <input value={novo.titulo} onChange={e => setNovo(p => ({ ...p, titulo: e.target.value }))}
          placeholder="Título da lenda (ex: O Último Barco)" aria-label="Título da lenda" className={campo} style={radius} />
        <textarea rows={2} value={novo.verdade} onChange={e => setNovo(p => ({ ...p, verdade: e.target.value }))}
          placeholder="O que realmente aconteceu (só você vê)" aria-label="O que realmente aconteceu"
          className={`${campo} resize-none`} style={radius} />
        <textarea rows={2} value={novo.versao_popular} onChange={e => setNovo(p => ({ ...p, versao_popular: e.target.value }))}
          placeholder="O que o povo diz (opcional)" aria-label="O que o povo diz"
          className={`${campo} resize-none`} style={radius} />
        <button onClick={criar} disabled={!novo.titulo.trim()}
          className="bg-[#c8a84b] text-[#0f0e0c] px-5 py-2 text-xs font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-40"
          style={{ ...cinzel, ...radius }}>
          ＋ ADICIONAR LENDA
        </button>
      </div>
    </div>
  );
}