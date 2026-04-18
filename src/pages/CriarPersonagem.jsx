import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const cinzel = { fontFamily: "'Cinzel', serif" };
const crimson = { fontFamily: "'Crimson Pro', serif" };

export default function CriarPersonagem() {
  const navigate = useNavigate();
  const [aba, setAba] = useState('ia'); // ia | pdf
  const [step, setStep] = useState('form'); // form | gerando | ficha
  const [descricao, setDescricao] = useState('');
  const [sistema, setSistema] = useState('D&D 5e');
  const [ficha, setFicha] = useState(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfNome, setPdfNome] = useState('');

  async function gerarPersonagem() {
    if (!descricao.trim()) return;
    setStep('gerando');
    setErro('');
    try {
      const res = await api.post('/create-character', {
        description: descricao,
        system: sistema,
        campaign_context: '',
      });
      setFicha(res.data.data);
      setStep('ficha');
    } catch {
      setErro('Erro ao gerar personagem. Verifique se o backend está rodando.');
      setStep('form');
    }
  }

  function selecionarPdf(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPdfFile(file);
    setPdfNome(file.name);
  }

  async function importarPdf() {
    if (!pdfFile) return;
    setStep('gerando');
    setErro('');
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      const res = await api.post(`/upload-pdf?system=${encodeURIComponent(sistema)}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFicha(res.data.data);
      setStep('ficha');
    } catch {
      setErro('Erro ao importar PDF. Verifique se o arquivo é uma ficha de RPG válida.');
      setStep('form');
    }
  }

  function editarCampo(campo, valor) {
    setFicha(prev => ({ ...prev, [campo]: valor }));
  }

  function editarAtributo(attr, valor) {
    setFicha(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [attr]: Number(valor) }
    }));
  }

  async function salvarPersonagem() {
    setSalvando(true);
    try {
      await api.post('/create-character', {
        description: `Personagem salvo: ${ficha.name}`,
        system: sistema,
      });
      navigate('/personagens');
    } catch {
      setErro('Erro ao salvar.');
    }
    setSalvando(false);
  }

  function resetar() {
    setStep('form');
    setFicha(null);
    setErro('');
    setPdfFile(null);
    setPdfNome('');
  }

  const attrLabel = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };
  const sistemas = ['D&D 5e', 'Tormenta20', 'Pathfinder 2e', 'Call of Cthulhu', 'Outro'];

  return (
    <div className="min-h-screen bg-[#0f0e0c] text-[#e8e0d0]" style={crimson}>

      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#c8a84b20]">
        <span style={cinzel} className="text-[#c8a84b] text-lg tracking-widest font-bold cursor-pointer"
          onClick={() => navigate('/')}>
          ⚔ TAVERNA
        </span>
        <button onClick={() => navigate('/')}
          className="text-[#6a6050] text-sm hover:text-[#c8a84b] transition-colors" style={cinzel}>
          ← Voltar
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">

        <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[4px] mb-2 opacity-70">CRIAÇÃO DE PERSONAGEM</p>
        <h1 style={cinzel} className="text-3xl text-[#f0e8d8] font-bold mb-2">Novo Personagem</h1>
        <p className="text-[#7a7060] mb-8 font-light">Crie do zero com IA ou importe uma ficha em PDF.</p>

        {/* ABAS */}
        {step === 'form' && (
          <div className="flex gap-px mb-8 border border-[#c8a84b20] w-fit">
            {[{ id: 'ia', label: '✦ Criar com IA' }, { id: 'pdf', label: '◈ Importar PDF' }].map(({ id, label }) => (
              <button key={id} onClick={() => { setAba(id); setErro(''); }}
                className="px-6 py-3 text-sm tracking-widest transition-colors"
                style={{ ...cinzel, background: aba === id ? '#c8a84b' : '#161410', color: aba === id ? '#0f0e0c' : '#6a6050' }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* FORM */}
        {step === 'form' && (
          <div className="flex flex-col gap-6">

            <div>
              <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] block mb-2">SISTEMA</label>
              <select value={sistema} onChange={e => setSistema(e.target.value)}
                className="bg-[#161410] border border-[#c8a84b30] text-[#e8e0d0] px-4 py-3 w-full focus:outline-none focus:border-[#c8a84b60]"
                style={{ ...cinzel, fontSize: '0.85rem', borderRadius: '2px' }}>
                {sistemas.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {aba === 'ia' && (
              <>
                <div>
                  <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] block mb-2">DESCRIÇÃO DO PERSONAGEM</label>
                  <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
                    placeholder="Ex: guerreiro lvl 5 meio elfo que tem o background assombrado e é da família Silva, prefere combate defensivo e carrega um escudo de família..."
                    rows={5}
                    className="bg-[#161410] border border-[#c8a84b30] text-[#e8e0d0] px-4 py-3 w-full focus:outline-none focus:border-[#c8a84b60] resize-none placeholder-[#3a3528]"
                    style={{ fontSize: '1rem', borderRadius: '2px', lineHeight: '1.7' }} />
                  <p className="text-[#3a3528] text-xs mt-2" style={cinzel}>Quanto mais detalhes, melhor a ficha gerada.</p>
                </div>
                {erro && <p className="text-red-400 text-sm">{erro}</p>}
                <button onClick={gerarPersonagem} disabled={!descricao.trim()}
                  className="bg-[#c8a84b] text-[#0f0e0c] px-8 py-3 text-sm tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30 disabled:cursor-not-allowed self-start"
                  style={{ ...cinzel, borderRadius: '2px' }}>
                  Gerar com IA →
                </button>
              </>
            )}

            {aba === 'pdf' && (
              <>
                <div>
                  <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px] block mb-2">ARQUIVO PDF</label>
                  <label className="flex flex-col items-center justify-center border border-dashed border-[#c8a84b30] bg-[#161410] py-12 cursor-pointer hover:border-[#c8a84b60] hover:bg-[#1c1a16] transition-all"
                    style={{ borderRadius: '2px' }}>
                    <input type="file" accept=".pdf" onChange={selecionarPdf} className="hidden" />
                    <span className="text-3xl mb-3">◈</span>
                    {pdfNome ? (
                      <>
                        <p style={cinzel} className="text-[#c8a84b] text-sm tracking-widest mb-1">{pdfNome}</p>
                        <p className="text-[#4a4030] text-xs">Clique para trocar o arquivo</p>
                      </>
                    ) : (
                      <>
                        <p style={cinzel} className="text-[#6a6050] text-sm tracking-widest mb-1">Clique para selecionar o PDF</p>
                        <p className="text-[#3a3528] text-xs">D&D Beyond, Tormenta, Pathfinder e outros</p>
                      </>
                    )}
                  </label>
                </div>

                {pdfNome && (
                  <div className="border border-[#c8a84b15] bg-[#c8a84b05] px-4 py-3">
                    <p className="text-[#6a6050] text-sm font-light">
                      ✦ A IA vai ler o PDF e extrair todos os dados da ficha automaticamente.
                    </p>
                  </div>
                )}

                {erro && <p className="text-red-400 text-sm">{erro}</p>}

                <button onClick={importarPdf} disabled={!pdfFile}
                  className="bg-[#c8a84b] text-[#0f0e0c] px-8 py-3 text-sm tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-30 disabled:cursor-not-allowed self-start"
                  style={{ ...cinzel, borderRadius: '2px' }}>
                  Importar PDF →
                </button>
              </>
            )}
          </div>
        )}

        {/* GERANDO */}
        {step === 'gerando' && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-12 h-12 border border-[#c8a84b40] border-t-[#c8a84b] rounded-full animate-spin" />
            <p style={cinzel} className="text-[#c8a84b] text-sm tracking-widest">
              {aba === 'pdf' ? 'LENDO O PDF...' : 'GERANDO PERSONAGEM...'}
            </p>
            <p className="text-[#3a3528] text-sm font-light">
              {aba === 'pdf' ? 'A IA está extraindo os dados da ficha' : 'A IA está criando sua ficha completa'}
            </p>
          </div>
        )}

        {/* FICHA */}
        {step === 'ficha' && ficha && (
          <div className="flex flex-col gap-8">

            <div className="border border-[#c8a84b20] bg-[#c8a84b08] px-4 py-3">
              <p className="text-[#8a7840] text-sm font-light">
                ✦ {aba === 'pdf' ? 'Ficha importada!' : 'Ficha gerada!'} Edite qualquer campo abaixo antes de salvar.
              </p>
            </div>

            {/* Infos básicas */}
            <div className="border border-[#c8a84b20] bg-[#161410]">
              <div className="px-6 py-4 border-b border-[#c8a84b15]">
                <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">INFORMAÇÕES BÁSICAS</p>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                {[
                  { label: 'NOME', campo: 'name' },
                  { label: 'RAÇA', campo: 'race' },
                  { label: 'CLASSE', campo: 'class' },
                  { label: 'ANTECEDENTE', campo: 'background' },
                  { label: 'ALINHAMENTO', campo: 'alignment' },
                ].map(({ label, campo }) => (
                  <div key={campo}>
                    <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">{label}</label>
                    <input value={ficha[campo] || ''} onChange={e => editarCampo(campo, e.target.value)}
                      className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full focus:outline-none focus:border-[#c8a84b50] text-sm"
                      style={{ borderRadius: '2px' }} />
                  </div>
                ))}
                <div>
                  <label style={cinzel} className="text-[#c8a84b] text-xs tracking-[2px] block mb-1">NÍVEL</label>
                  <input type="number" min={1} max={20} value={ficha.level || 1}
                    onChange={e => editarCampo('level', Number(e.target.value))}
                    className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] px-3 py-2 w-full focus:outline-none focus:border-[#c8a84b50] text-sm"
                    style={{ borderRadius: '2px' }} />
                </div>
              </div>
            </div>

            {/* Atributos */}
            {ficha.attributes && (
              <div className="border border-[#c8a84b20] bg-[#161410]">
                <div className="px-6 py-4 border-b border-[#c8a84b15]">
                  <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">ATRIBUTOS</p>
                </div>
                <div className="p-6 grid grid-cols-6 gap-3">
                  {Object.entries(ficha.attributes).map(([attr, val]) => (
                    <div key={attr} className="flex flex-col items-center gap-2">
                      <label style={cinzel} className="text-[#c8a84b] text-xs tracking-widest">
                        {attrLabel[attr] || attr.toUpperCase()}
                      </label>
                      <input type="number" min={1} max={30} value={val}
                        onChange={e => editarAtributo(attr, e.target.value)}
                        className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#e8e0d0] text-center text-xl font-light w-full py-3 focus:outline-none focus:border-[#c8a84b50]"
                        style={{ borderRadius: '2px' }} />
                      <span className="text-[#4a4030] text-xs" style={cinzel}>
                        {Math.floor((val - 10) / 2) >= 0 ? '+' : ''}{Math.floor((val - 10) / 2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Perícias */}
            {ficha.skills && Object.keys(ficha.skills).length > 0 && (
              <div className="border border-[#c8a84b20] bg-[#161410]">
                <div className="px-6 py-4 border-b border-[#c8a84b15]">
                  <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">PERÍCIAS</p>
                </div>
                <div className="p-6 grid grid-cols-2 gap-2">
                  {Object.entries(ficha.skills).map(([skill, val]) => (
                    <div key={skill} className="flex items-center justify-between py-1 border-b border-[#c8a84b08]">
                      <span className="text-[#8a8070] text-sm capitalize">{skill}</span>
                      <span style={cinzel} className="text-[#c8a84b] text-sm">{val >= 0 ? '+' : ''}{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            {ficha.features && ficha.features.length > 0 && (
              <div className="border border-[#c8a84b20] bg-[#161410]">
                <div className="px-6 py-4 border-b border-[#c8a84b15]">
                  <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">HABILIDADES & FEATURES</p>
                </div>
                <div className="p-6 flex flex-wrap gap-2">
                  {ficha.features.map((f, i) => (
                    <span key={i} className="border border-[#c8a84b25] bg-[#c8a84b08] text-[#c8a84b] px-3 py-1 text-xs"
                      style={{ ...cinzel, borderRadius: '2px', letterSpacing: '0.5px' }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Inventário */}
            {ficha.inventory && ficha.inventory.length > 0 && (
              <div className="border border-[#c8a84b20] bg-[#161410]">
                <div className="px-6 py-4 border-b border-[#c8a84b15]">
                  <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">INVENTÁRIO</p>
                </div>
                <div className="p-6 flex flex-wrap gap-2">
                  {ficha.inventory.map((item, i) => (
                    <span key={i} className="border border-[#c8a84b15] text-[#6a6050] px-3 py-1 text-sm"
                      style={{ borderRadius: '2px' }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* História */}
            {ficha.background_story && (
              <div className="border border-[#c8a84b20] bg-[#161410]">
                <div className="px-6 py-4 border-b border-[#c8a84b15]">
                  <p style={cinzel} className="text-[#c8a84b] text-xs tracking-[3px]">HISTÓRIA</p>
                </div>
                <div className="p-6">
                  <textarea value={ficha.background_story} onChange={e => editarCampo('background_story', e.target.value)}
                    rows={4}
                    className="bg-[#0f0e0c] border border-[#c8a84b20] text-[#a09880] px-4 py-3 w-full focus:outline-none focus:border-[#c8a84b50] resize-none"
                    style={{ fontSize: '1rem', borderRadius: '2px', lineHeight: '1.7' }} />
                </div>
              </div>
            )}

            {erro && <p className="text-red-400 text-sm">{erro}</p>}

            <div className="flex gap-4">
              <button onClick={salvarPersonagem} disabled={salvando}
                className="bg-[#c8a84b] text-[#0f0e0c] px-8 py-3 text-sm tracking-widest font-bold hover:bg-[#e0c060] transition-colors disabled:opacity-50"
                style={{ ...cinzel, borderRadius: '2px' }}>
                {salvando ? 'Salvando...' : 'Salvar Personagem'}
              </button>
              <button onClick={resetar}
                className="border border-[#c8a84b40] text-[#c8a84b] px-8 py-3 text-sm tracking-widest hover:bg-[#c8a84b10] transition-colors"
                style={{ ...cinzel, borderRadius: '2px' }}>
                {aba === 'pdf' ? 'Importar Outro' : 'Gerar Novamente'}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}