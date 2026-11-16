import { cinzel } from '../estilos';

const TAMANHOS = {
  sm: { w: 48, fonte: 18 },
  md: { w: 96, fonte: 34 },
  lg: { w: 200, fonte: 72 },
};

function iniciais(nome = '') {
  return String(nome).trim().split(/\s+/).slice(0, 2).map(p => (p[0] || '').toUpperCase()).join('');
}

export default function Retrato({ src, nome = '', tamanho = 'md', raridade, onClick }) {
  const t = TAMANHOS[tamanho] || TAMANHOS.md;
  const cor = raridade ? `var(--raridade-${raridade})` : 'var(--tav-ouro)';
  const Tag = onClick ? 'button' : 'div';
  const url = typeof src === 'string' && src ? src : null;
  const nomeTxt = typeof nome === 'string' ? nome : (nome?.name ?? '');

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      style={{
        width: t.w,
        height: Math.round(t.w * 1.25),
        padding: 3,
        flexShrink: 0,
        display: 'block',
        background: 'var(--tav-painel)',
        border: `1px solid ${cor}`,
        boxShadow: `0 0 0 2px var(--tav-fundo), 0 0 0 3px ${cor}55`,
        borderRadius: 2,
        cursor: onClick ? 'pointer' : 'default',
      }}>
      <div style={{
        position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
        background: 'var(--tav-fundo)', border: `1px solid ${cor}40`,
      }}>
        {/* as iniciais ficam atrás; a foto cobre quando carrega */}
        <span style={{
          ...cinzel, position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: t.fonte, color: cor, opacity: 0.6,
        }}>
          {iniciais(nomeTxt) || '?'}
        </span>
        {url && (
          <img src={url} alt={nomeTxt} loading="lazy"
            onError={e => { e.currentTarget.style.display = 'none'; }}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', background: 'var(--tav-fundo)',
            }} />
        )}
      </div>
    </Tag>
  );
}