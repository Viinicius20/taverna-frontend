import { useRef, useEffect } from 'react';

const L = 480, A = 640; 

export default function RetratoCanvas({ src, nome, subtitulo }) {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    let vivo = true;

    function moldura() {
      const v = ctx.createRadialGradient(L / 2, A / 2.2, L * 0.25, L / 2, A / 2, A * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(0,0,0,0.75)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, L, A);

      const f = ctx.createLinearGradient(0, A * 0.68, 0, A);
      f.addColorStop(0, 'rgba(15,14,12,0)');
      f.addColorStop(1, 'rgba(15,14,12,0.95)');
      ctx.fillStyle = f; ctx.fillRect(0, A * 0.68, L, A * 0.32);

      ctx.strokeStyle = '#c8a84b'; ctx.lineWidth = 2; ctx.strokeRect(10, 10, L - 20, A - 20);
      ctx.strokeStyle = 'rgba(200,168,75,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(18, 18, L - 36, A - 36);

      ctx.fillStyle = '#c8a84b';
      [[10, 10], [L - 10, 10], [10, A - 10], [L - 10, A - 10]].forEach(([x, y]) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
        ctx.fillRect(-6, -6, 12, 12); ctx.restore();
      });

      ctx.textAlign = 'center';
      ctx.fillStyle = '#f0e8d8';
      ctx.font = "700 30px 'Cinzel', serif";
      ctx.fillText((nome || '').toUpperCase(), L / 2, A - 62, L - 60);
      ctx.fillStyle = '#c8a84b';
      ctx.font = "400 17px 'Crimson Pro', serif";
      ctx.fillText(subtitulo || '', L / 2, A - 36, L - 60);
    }

    async function desenhar(img) {
      try { await document.fonts.load("700 30px 'Cinzel'"); } catch {}
      if (!vivo) return;
      ctx.fillStyle = '#0f0e0c'; ctx.fillRect(0, 0, L, A);

      if (img) {
        const s = Math.max(L / img.width, A / img.height);
        const w = img.width * s, h = img.height * s;
        ctx.drawImage(img, (L - w) / 2, (A - h) / 2.4, w, h);
      } else {
        ctx.fillStyle = 'rgba(200,168,75,0.25)';
        ctx.font = '120px serif'; ctx.textAlign = 'center';
        ctx.fillText('⚔', L / 2, A / 2);
      }
      moldura();
    }

    if (!src) { desenhar(null); return () => { vivo = false; }; }

    const img = new Image();
    img.crossOrigin = 'anonymous';           
    img.onload = () => desenhar(img);
    img.onerror = () => desenhar(null);
    img.src = src;

    return () => { vivo = false; };
  }, [src, nome, subtitulo]);

  function baixar() {
    try {
      ref.current.toBlob(b => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = `${nome || 'personagem'}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
    } catch {
      alert('Não foi possível exportar esta imagem.');
    }
  }

  return (
    <div>
      <canvas ref={ref} width={L} height={A} className="w-full h-auto block" aria-label={`Retrato de ${nome}`} />
      <button onClick={baixar}
        className="mt-2 w-full border border-[#c8a84b30] text-[#8a7e68] py-1 text-xs hover:text-[#c8a84b] transition-colors">
        ⬇ Baixar retrato
      </button>
    </div>
  );
}