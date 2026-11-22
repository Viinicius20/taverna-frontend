import CombatenteCard from '../combate/CombatenteCard';
import RolagemRapida from '../RolagemRapida';
import MesaFeed from '../MesaFeed';
import NotasSessao from '../NotasSessao';
import { cinzel } from '../../estilos';

const radius = { borderRadius: '2px' };

export default function SessaoMestre({ combate, onCondicoes, personagens }) {
  const {
    combatentes, turnoAtual, combateAtivo, setCombateAtivo,
    proximoTurno, atualizarCombatente, removerCombatente,
  } = combate;
  const atual = combatentes[turnoAtual];

  return (
    <div className="grid gap-4 lg:grid-cols-3">

      {/* Combate */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between border border-[#c8a84b20] bg-[#161410] px-4 py-3"
          style={radius}>
          <div>
            <p style={cinzel} className="text-[#8a7e68] text-xs tracking-[3px]">
              {combateAtivo ? 'TURNO DE' : 'COMBATE'}
            </p>
            <p style={cinzel} className="text-[#c8a84b] text-lg">
              {combateAtivo ? (atual?.nome ?? '—') : 'Não iniciado'}
            </p>
          </div>

          {combatentes.length > 0 && (combateAtivo ? (
            <button onClick={proximoTurno}
              className="bg-[#c8a84b] text-[#0f0e0c] px-5 py-3 text-xs font-bold hover:bg-[#e0c060] transition-colors"
              style={{ ...cinzel, ...radius }}>
              PRÓXIMO →
            </button>
          ) : (
            <button onClick={() => setCombateAtivo(true)}
              className="bg-[#b07050] text-[#f0e8d8] px-5 py-3 text-xs font-bold hover:bg-[#c08060] transition-colors"
              style={{ ...cinzel, ...radius }}>
              ⚔ INICIAR
            </button>
          ))}
        </div>

        {combatentes.length === 0 ? (
          <p className="text-[#8a7e68] text-sm text-center py-8">
            Monte o encontro na aba Painel.
          </p>
        ) : (
          combatentes.map((c, idx) => (
            <CombatenteCard key={c.id} c={c} compacto
              isAtivo={combateAtivo && idx === turnoAtual}
              onAtualizar={atualizarCombatente}
              onRemover={removerCombatente}
              onCondicoes={onCondicoes} />
          ))
        )}
      </div>

      {/* Rolagens e notas */}
      <div className="space-y-4">
        <RolagemRapida />
        <MesaFeed />
        <GanchosPessoais personagens={personagens} />
        <NotasSessao />
      </div>
    </div>
  );
}