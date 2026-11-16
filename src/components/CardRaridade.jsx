import { normalizarRaridade, ROTULO_RARIDADE } from '../utils/raridade';

const cinzel = { fontFamily: "'Cinzel', serif" };

export default function CardRaridade({ nome = '', raridade, imagem, subtitulo, descricao, onClick }) {
  const nivel = normalizarRaridade(raridade);
  const cor = `var(--raridade-${nivel})`;
  const brilho = nivel === 'epico' || nivel === 'lendario';
  const url = typeof imagem === 'string' && imagem ? imagem : null;
  const nomeTxt = typeof nome === 'string' ? nome : (nome?.name ?? '');
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className="text-left w-full"
      style={{
        display: 'block',
        background: 'var(--tav-painel)',
        border: `1px solid ${cor}`,
        borderRadius: 2,
        padding: 4,
        boxShadow: brilho ? `0 0 14px ${cor}55` : 'none',
        cursor: onClick ? 'pointer' : 'default',
      }}>
      <div style={{ border: `1px solid ${cor}40` }}>
        <div style={{
          position: 'relative', width: '100%', aspectRatio: '1 / 1',
          background: 'var(--tav-fundo)', overflow: 'hidden',
        }}>
          <span style={{
            ...cinzel, position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 48, color: cor, opacity: 0.35,
          }}>
            {(nomeTxt.trim()[0] || '?').toUpperCase()}
          </span>
          {url && (
            <img src={url} alt={nomeTxt} loading="lazy"
              onError={e => { e.currentTarget.style.display = 'none'; }}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>

        <div style={{ padding: '10px 12px' }}>
          <p style={{ ...cinzel, color: 'var(--tav-texto)' }} className="text-sm font-semibold break-words">
            {nomeTxt}
          </p>
          <p style={{ ...cinzel, color: cor }} className="text-xs tracking-[2px] mt-1">
            {ROTULO_RARIDADE[nivel].toUpperCase()}
          </p>
          {subtitulo && (
            <p className="text-xs mt-1" style={{ color: 'var(--tav-texto-suave)' }}>{subtitulo}</p>
          )}
          {descricao && (
            <p className="text-xs mt-2 break-words" style={{
              color: 'var(--tav-texto-suave)', display: '-webkit-box',
              WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {descricao}
            </p>
          )}
        </div>
      </div>
    </Tag>
  );
}