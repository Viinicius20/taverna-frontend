export function limparMarkdown(texto) {
  if (!texto) return '';
  return texto.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
}