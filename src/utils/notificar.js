export function notificar(msg, tipo = 'info') {
  window.dispatchEvent(new CustomEvent('taverna-toast', {
    detail: { msg: String(msg), tipo, id: Date.now() + Math.random() },
  }));
}

export function instalarAlertGlobal() {
  window.alert = (m) => {
    const texto = String(m);
    const tipo = /^(erro|falha|não foi|nenhum|escolha)/i.test(texto) ? 'erro' : 'sucesso';
    notificar(texto, tipo);
  };
}