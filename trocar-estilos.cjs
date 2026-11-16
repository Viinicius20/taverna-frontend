const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const ESTILOS = path.join(SRC, 'estilos');
const APLICAR = process.argv.includes('--aplicar');

const DECLS = {
  cinzel: /^const cinzel\s*=\s*\{\s*fontFamily:\s*"'Cinzel', serif"\s*\};?[ \t]*\r?\n?/m,
  crimson: /^const crimson\s*=\s*\{\s*fontFamily:\s*"'Crimson Pro', serif"\s*\};?[ \t]*\r?\n?/m,
};

function arquivos(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : arquivos(p);
    return /\.(jsx?|tsx?)$/.test(e.name) ? [p] : [];
  });
}

let alterados = 0;

for (const arq of arquivos(SRC)) {
  if (/estilos\.(js|ts)$/.test(arq)) continue;

  let texto = fs.readFileSync(arq, 'utf8');
  const original = texto;
  const importar = [];

  for (const [nome, re] of Object.entries(DECLS)) {
    if (!re.test(texto)) continue;
    texto = texto.replace(re, '');
    // só importa se o nome ainda é usado no arquivo
    if (new RegExp(`\\b${nome}\\b`).test(texto)) importar.push(nome);
  }

  if (texto === original) continue;

  if (importar.length) {
    let rel = path.relative(path.dirname(arq), ESTILOS).split(path.sep).join('/');
    if (!rel.startsWith('.')) rel = './' + rel;
    texto = `import { ${importar.join(', ')} } from '${rel}';\n` + texto;
  }

  alterados++;
  console.log(`${APLICAR ? 'alterado' : 'alteraria'}: ${path.relative(__dirname, arq)}  (${importar.join(', ') || 'só removeu'})`);
  if (APLICAR) fs.writeFileSync(arq, texto);
}

console.log(`\n${alterados} arquivo(s). ${APLICAR ? 'Aplicado.' : 'Simulação: rode com --aplicar para gravar.'}`);