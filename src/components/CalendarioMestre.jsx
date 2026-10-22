import { useState, useEffect } from 'react';
import api from '../services/api';
import { notificar } from '../utils/notificar';

const cinzel = { fontFamily: "'Cinzel', serif" };
const CAMPANHA_ID = '00000000-0000-0000-0000-000000000001';
const campo = 'bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 text-sm focus:outline-none focus:border-[#c8a84b50]';
const botao = 'border border-[#c8a84b50] text-[#c8a84b] px-3 py-2 text-xs hover:bg-[#c8a84b10] transition-colors';

export default function CalendarioMestre() {
  const [cal, setCal] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [dias, setDias] = useState(1);
  const [motivo, setMotivo] = useState('');
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ ano: 1, mes: 1, dia: 1 });
  const [meses, setMeses] = useState([]);
  const reversivel = h => h.dias > 0;

  async function carregar() {
    try {
      const [a, b] = await Promise.all([
        api.get(`/calendario/${CAMPANHA_ID}`),
        api.get(`/calendario/${CAMPANHA_ID}/historico`),
      ]);
      const c = a.data.data;
      setCal(c);
      setHistorico(b.data.data || []);
      setForm({ ano: c.data.ano, mes: c.data.mes, dia: c.data.dia });
      setMeses(c.meses);
    } catch { notificar('Erro ao carregar o calendário.', 'erro'); }
  }
  useEffect(() => { carregar(); }, []);

  async function avancar(n) {
    if (!n || n < 1) return;
    try {
      const res = await api.post(`/calendario/${CAMPANHA_ID}/avancar`, { dias: n, motivo: motivo.trim() || null });
      setMotivo('');
      notificar(`+${n} dia(s): ${res.data.data.texto}`, 'sucesso');
      carregar();
    } catch (e) { notificar(e.response?.data?.detail || 'Erro ao avançar.', 'erro'); }
  }

  async function definirData() {
    try {
      await api.put(`/calendario/${CAMPANHA_ID}/data`, {
        ano: Number(form.ano), mes: Number(form.mes), dia: Number(form.dia),
      });
      carregar();
    } catch (e) { notificar(e.response?.data?.detail || 'Erro ao definir a data.', 'erro'); }
  }

  async function salvarMeses() {
    try {
      await api.put(`/calendario/${CAMPANHA_ID}/meses`, { meses });
      notificar('Meses salvos.', 'sucesso');
      carregar();
    } catch (e) { notificar(e.response?.data?.detail || 'Erro ao salvar os meses.', 'erro'); }
  }

async function voltarAte(h) {
  if (!window.confirm('Voltar o tempo até antes desta linha? Esta linha e as mais novas são desfeitas e a data recua.')) return;
  try {
    const res = await api.post(`/calendario/${CAMPANHA_ID}/voltar`, { log_id: h.id });
    notificar(`Data: ${res.data.data.texto}`, 'sucesso');
    carregar();
  } catch (e) { notificar(e.response?.data?.detail || 'Erro ao voltar o tempo.', 'erro'); }
}

async function apagarLinha(id) {
  if (!window.confirm('Apagar só o registro? A data do calendário não muda.')) return;
  try {
    await api.delete(`/calendario/${CAMPANHA_ID}/historico/${id}`);
    carregar();
  } catch (e) { notificar(e.response?.data?.detail || 'Erro ao apagar o registro.', 'erro'); }
}

async function limparHistorico() {
  if (!window.confirm('Apagar todo o histórico? A data do calendário não muda.')) return;
  try {
    await api.delete(`/calendario/${CAMPANHA_ID}/historico`);
    carregar();
  } catch (e) { notificar(e.response?.data?.detail || 'Erro ao limpar o histórico.', 'erro'); }
}

  if (!cal) return <p className="text-[#8a7e68] text-sm">Carregando calendário...</p>;

  return (
    <div className="border border-[#c8a84b20] bg-[#161410] p-6 flex flex-col gap-4">
      <p style={cinzel} className="text-[#e8e0d0] text-2xl">{cal.texto}</p>

      <div className="flex flex-wrap items-center gap-2">
        {[1, 7, 30].map(n => (
          <button key={n} onClick={() => avancar(n)} className={botao} style={{ ...cinzel, borderRadius: '2px' }}>
            +{n} {n === 1 ? 'DIA' : 'DIAS'}
          </button>
        ))}
        <input type="number" min="1" max="3650" value={dias} onChange={e => setDias(e.target.value)}
          className={`${campo} w-24`} style={{ borderRadius: '2px' }} />
        <button onClick={() => avancar(Number(dias))} className={botao} style={{ ...cinzel, borderRadius: '2px' }}>
          AVANÇAR
        </button>
      </div>
      <input value={motivo} onChange={e => setMotivo(e.target.value)} maxLength={200}
        placeholder="Motivo (opcional): viagem, descanso longo..." aria-label="Motivo (opcional): viagem, descanso longo..."
        className={campo} style={{ borderRadius: '2px' }} />

      <button onClick={() => setEditando(!editando)} className="text-xs text-[#9a8e78] hover:text-[#c8a84b] self-start">
        {editando ? '▲ Fechar edição' : '▼ Definir data e meses'}
      </button>

      {editando && (
        <div className="flex flex-col gap-4 border-t border-[#c8a84b15] pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <input type="number" value={form.ano} onChange={e => setForm(f => ({ ...f, ano: e.target.value }))}
              className={`${campo} w-24`} style={{ borderRadius: '2px' }} />
            <select value={form.mes} onChange={e => setForm(f => ({ ...f, mes: e.target.value }))}
              className={campo} style={{ borderRadius: '2px' }}>
              {cal.meses.map((m, i) => <option key={i} value={i + 1}>{m.nome}</option>)}
            </select>
            <input type="number" min="1" value={form.dia} onChange={e => setForm(f => ({ ...f, dia: e.target.value }))}
              className={`${campo} w-20`} style={{ borderRadius: '2px' }} />
            <button onClick={definirData} className={botao} style={{ ...cinzel, borderRadius: '2px' }}>DEFINIR DATA</button>
          </div>

          <div className="flex flex-col gap-2">
            <p style={cinzel} className="text-[#9a8e78] text-xs tracking-[2px]">MESES DO MUNDO</p>
            {meses.map((m, i) => (
              <div key={i} className="flex gap-2">
                <input value={m.nome} maxLength={30}
                  onChange={e => setMeses(prev => prev.map((x, j) => j === i ? { ...x, nome: e.target.value } : x))}
                  className={`${campo} flex-1`} style={{ borderRadius: '2px' }} />
                <input type="number" min="1" max="60" value={m.dias}
                  onChange={e => setMeses(prev => prev.map((x, j) => j === i ? { ...x, dias: Number(e.target.value) } : x))}
                  className={`${campo} w-20`} style={{ borderRadius: '2px' }} />
                <button onClick={() => setMeses(prev => prev.filter((_, j) => j !== i))}
                  className="text-red-600 hover:text-red-600 text-xs">×</button>
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={() => setMeses(prev => [...prev, { nome: 'Novo mês', dias: 30 }])}
                className={botao} style={{ ...cinzel, borderRadius: '2px' }}>+ MÊS</button>
              <button onClick={salvarMeses} className={botao} style={{ ...cinzel, borderRadius: '2px' }}>SALVAR MESES</button>
            </div>
          </div>
        </div>
      )}

        {historico.length > 0 && (
          <div className="border-t border-[#c8a84b15] pt-4 flex flex-col gap-1">
            <div className="flex items-center justify-between mb-1">
              <p style={cinzel} className="text-[#9a8e78] text-xs tracking-[2px]">HISTÓRICO</p>
              <button onClick={limparHistorico} className="text-red-600 hover:text-red-600 text-xs"
                style={cinzel}>LIMPAR</button>
            </div>
            {historico.map(h => (
              <div key={h.id} className="flex items-center justify-between gap-2">
                <p className="text-xs text-[#9a8e78]">
                  {h.dias > 0 ? `+${h.dias}d` : 'ajuste'} · {h.data_depois}{h.motivo ? ` · ${h.motivo}` : ''}
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {reversivel(h) && (
                    <button onClick={() => voltarAte(h)} title="Voltar o tempo até antes desta linha"
                      className="text-[#c8a84b] hover:text-[#e0c060] text-xs">↶</button>
                  )}
                  <button onClick={() => apagarLinha(h.id)} title="Apagar só o registro (a data não muda)"
                    className="text-red-600 hover:text-red-600 text-xs">×</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
