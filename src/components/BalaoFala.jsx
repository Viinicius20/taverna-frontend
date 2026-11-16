import { cinzel } from '../estilos';
import Retrato from './Retrato';


export default function BalaoFala({ nome, avatar, fala }) {
  return (
    <div className="flex items-end gap-3">
      <Retrato src={avatar} nome={nome} tamanho="sm" />
      <div className="relative flex-1 min-w-0">
        <div className="px-4 py-3" style={{
          background: 'var(--tav-painel)', border: '1px solid var(--tav-borda)', borderRadius: 2,
        }}>
          <p style={{ ...cinzel, color: 'var(--tav-ouro)' }} className="text-xs tracking-[2px] mb-1">
            {nome}
          </p>
          <p className="text-sm italic break-words" style={{ color: 'var(--tav-texto)' }}>
            “{fala}”
          </p>
        </div>
        <span aria-hidden="true" style={{
          position: 'absolute', left: -7, bottom: 14, width: 12, height: 12,
          background: 'var(--tav-painel)',
          borderLeft: '1px solid var(--tav-borda)', borderBottom: '1px solid var(--tav-borda)',
          transform: 'rotate(45deg)',
        }} />
      </div>
    </div>
  );
}