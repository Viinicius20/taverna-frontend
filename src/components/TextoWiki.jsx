const COR = { npc: '#c8a84b', local: '#7ab8d4', faccao: '#8a4a8a' };
const ICONE = { npc: '🧑', local: '📍', faccao: '🏛' };

export default function TextoWiki({ texto = '', paginas = [], entidades = [], onAbrir }) {
  const partes = [];
  const re = /\[\[([^\]]+)\]\]/g;
  let ultimo = 0;
  let m;
  while ((m = re.exec(texto)) !== null) {
    if (m.index > ultimo) partes.push({ link: false, v: texto.slice(ultimo, m.index) });
    partes.push({ link: true, v: m[1].trim() });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) partes.push({ link: false, v: texto.slice(ultimo) });

  return (
    <p className="text-[#a09880] text-sm leading-relaxed whitespace-pre-wrap">
      {partes.map((p, i) => {
        if (!p.link) return <span key={i}>{p.v}</span>;
        const nome = p.v.toLowerCase();
        const pag = paginas.find(x => x.titulo.toLowerCase() === nome);
        if (pag) {
          return (
            <button key={i} type="button" onClick={() => onAbrir && onAbrir(pag.id)}
              className="underline text-[#c8a84b] hover:text-[#e0c060]">{p.v}</button>
          );
        }
        const ent = entidades.find(x => x.nome.toLowerCase() === nome);
        if (ent) return <span key={i} style={{ color: COR[ent.tipo] }}>{ICONE[ent.tipo]} {p.v}</span>;
        return <span key={i}>{p.v}</span>;
      })}
    </p>
  );
}