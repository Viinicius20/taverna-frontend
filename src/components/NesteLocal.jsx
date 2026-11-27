import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { cinzel } from '../estilos';
import { getCampanhaId } from '../utils/campanha';
import { registrosDoGancho } from '../utils/ganchosSessaoZero';
import usePolling from '../utils/usePolling';

const link = 'text-sm text-[#c8a84b] hover:underline';

function ListaLocal({ titulo, vazia, children }) {
  return (
    <section className="min-w-0 border-t border-[#c8a84b20] pt-3">
      <h3 style={cinzel} className="mb-2 text-xs text-[#c8a84b]">{titulo}</h3>
      {vazia ? (
        <p className="text-sm text-[#9a8e78]">Nada registrado aqui.</p>
      ) : (
        <ul className="space-y-2">{children}</ul>
      )}
    </section>
  );
}

export default function NesteLocal() {
  const campanha = getCampanhaId();
  const [localId, setLocalId] = useState(undefined);
  const [dados, setDados] = useState(null);
  const [revisao, setRevisao] = useState(0);
  const [erroLocal, setErroLocal] = useState(false);

  usePolling(() => {
    api.get(`/campanha-local/${campanha}`)
      .then(res => {
        setLocalId(res.data?.data ?? null);
        setErroLocal(false);
      })
      .catch(() => setErroLocal(true));
  }, 15000);

  useEffect(() => {
    if (!localId) return;
    let ativo = true;

    async function carregar() {
      const [atlas, encontros, mural, respostas] = await Promise.allSettled([
        api.get(`/atlas-mestre/${campanha}`),
        api.get('/encontros-preparados', { params: { local_id: localId } }),
        api.get('/rumores/mural'),
        api.get(`/sessao-zero/campanha/${campanha}/respostas`),
      ]);

      if (!ativo) return;

      const pins = atlas.status === 'fulfilled' ? atlas.value.data.data?.pins || [] : [];
      const local = pins.find(pin => String(pin.id) === String(localId));
      const npcs = local?.npcs || [];
      const npcsDoLocal = new Map(
        npcs.map(npc => [`/mestre?aba=npcs#npc-${npc.id}`, npc])
      );
      const ganchos = [];

      if (respostas.status === 'fulfilled') {
        for (const personagem of respostas.value.data.data || []) {
          for (const [campo, texto] of Object.entries(personagem.respostas || {})) {
            if (!texto) continue;
            const registros = registrosDoGancho({ personagemId: personagem.id, campo });
            const npc = registros.map(rota => npcsDoLocal.get(rota)).find(Boolean);
            if (npc) {
              ganchos.push({
                chave: `${personagem.id}:${campo}`,
                personagemId: personagem.id,
                nome: personagem.nome,
                texto,
                npc: npc.nome,
              });
            }
          }
        }
      }

      setDados({
        localId,
        revisao,
        local,
        ganchos,
        encontros: encontros.status === 'fulfilled' ? encontros.value.data.data || [] : [],
        rumores: mural.status === 'fulfilled'
          ? (mural.value.data.data || []).filter(r => String(r.local_id) === String(localId))
          : [],
        incompleto: [atlas, encontros, mural, respostas].some(r => r.status === 'rejected'),
      });
    }

    carregar();
    return () => { ativo = false; };
  }, [campanha, localId, revisao]);

  if (localId === null && !erroLocal) return null;

  const atual = dados?.localId === localId ? dados : null;
  const atualizando = Boolean(localId) && (!atual || atual.revisao !== revisao);
  const local = atual?.local;
  const hrefAtlas = `/atlas?local=${encodeURIComponent(localId || '')}`;
  const npcs = local?.npcs || [];
  const lendas = local?.lendas || [];

  return (
    <section className="mb-4 rounded-sm border border-[#c8a84b30] bg-[#161410] p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p style={cinzel} className="text-xs tracking-[3px] text-[#c8a84b]">NESTE LOCAL</p>
          {local && (
            <h2 style={cinzel} className="mt-1 text-lg text-[#e8e0d0]">{local.nome}</h2>
          )}
        </div>
        <div className="flex items-center gap-3">
          {local && <Link to={hrefAtlas} className={link}>Ver no Atlas</Link>}
          {localId && (
            <button
              type="button"
              disabled={atualizando}
              onClick={() => setRevisao(n => n + 1)}
              className="rounded-sm border border-[#c8a84b30] px-3 py-1 text-xs
                         text-[#c8a84b] hover:bg-[#c8a84b10] disabled:opacity-50"
            >
              {atualizando ? 'Atualizando…' : 'Atualizar'}
            </button>
          )}
        </div>
      </div>

      {erroLocal && (
        <p role="status" className="mb-2 text-sm text-red-400">
          Não foi possível verificar o local atual do grupo.
        </p>
      )}
      {!erroLocal && (localId === undefined || (!atual && localId)) && (
        <p className="text-sm text-[#9a8e78]">Carregando o local do grupo…</p>
      )}

      {atual?.incompleto && (
        <p role="status" className="mb-3 text-sm text-[#9a8e78]">
          Parte do conteúdo não carregou. Tente atualizar.
        </p>
      )}
      {atual && !local && !atual.incompleto && (
        <p className="text-sm text-[#9a8e78]">O local atual não foi encontrado no Atlas.</p>
      )}

      {atual && (
        <div className="grid gap-4 sm:grid-cols-2">
          <ListaLocal titulo="Encontros preparados" vazia={!atual.encontros.length}>
            {atual.encontros.map(encontro => (
              <li key={encontro.id}>
                <Link
                  to={`/mestre?aba=painel&encontro=${encodeURIComponent(encontro.id)}`}
                  className={link}
                >
                  {encontro.titulo}
                </Link>
              </li>
            ))}
          </ListaLocal>

          <ListaLocal titulo="NPCs do local" vazia={!npcs.length}>
            {npcs.map(npc => (
              <li key={npc.id}>
                <Link to={`/mestre?aba=npcs#npc-${npc.id}`} className={link}>
                  {npc.nome}
                </Link>
              </li>
            ))}
          </ListaLocal>

          <ListaLocal titulo="Rumores anotados" vazia={!atual.rumores.length}>
            {atual.rumores.map(rumor => (
              <li key={rumor.id} className="text-sm">
                <p className="break-words italic">“{rumor.texto}”</p>
                <p className="text-xs text-[#9a8e78]">— {rumor.fonte}</p>
              </li>
            ))}
            {!!atual.rumores.length && (
              <li><Link to="/quadro" className={link}>Abrir Quadro de Rumores</Link></li>
            )}
          </ListaLocal>

          <ListaLocal titulo="Lendas do local" vazia={!lendas.length}>
            {lendas.map(lenda => (
              <li key={lenda.id}>
                <Link to={hrefAtlas} className={link}>{lenda.titulo}</Link>
                <span className="ml-2 text-xs text-[#9a8e78]">
                  {!lenda.ativa ? 'Inativa' : lenda.descoberta ? 'Descoberta' : '? Por descobrir'}
                </span>
              </li>
            ))}
          </ListaLocal>

          <ListaLocal titulo="Ganchos pessoais" vazia={!atual.ganchos.length}>
            {atual.ganchos.map(gancho => (
              <li key={gancho.chave}>
                <Link
                  to="/mestre?aba=sessao#ganchos"
                  state={{ personagemGancho: gancho.personagemId }}
                  className={link}
                >
                  {gancho.nome} · {gancho.npc}
                </Link>
                <p className="break-words text-sm text-[#9a8e78]">{gancho.texto}</p>
              </li>
            ))}
          </ListaLocal>
        </div>
      )}
    </section>
  );
}