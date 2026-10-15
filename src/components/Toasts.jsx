import { useState, useEffect } from 'react';

const cinzel = { fontFamily: "'Cinzel', serif" };
const COR = { sucesso: '#4a8a4a', erro: '#c84b4b', info: '#c8a84b' };

export default function Toasts() {
  const [itens, setItens] = useState([]);

  useEffect(() => {
    const aoReceber = e => {
      const t = e.detail;
      setItens(prev => [...prev.slice(-3), t]);
      setTimeout(() => setItens(prev => prev.filter(x => x.id !== t.id)), 4500);
    };
    window.addEventListener('taverna-toast', aoReceber);
    return () => window.removeEventListener('taverna-toast', aoReceber);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {itens.map(t => (
        <div key={t.id} onClick={() => setItens(prev => prev.filter(x => x.id !== t.id))}
          className="bg-[#161410] border px-4 py-3 text-sm text-[#e8e0d0] cursor-pointer whitespace-pre-line"
          style={{ ...cinzel, borderRadius: '2px', borderColor: COR[t.tipo] || COR.info,
                   boxShadow: `0 0 16px ${COR[t.tipo] || COR.info}30` }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}