// Esse arquivo gerencia o ciclo de vida do Service Worker
// O Service Worker é um script que roda em segundo plano, separado da página

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);
// isLocalhost — verifica se tá rodando no computador local (desenvolvimento)
// Em produção (Vercel) isso vai ser false

export function register(config) {
  // 'serviceWorker' in navigator — verifica se o browser suporta Service Worker
  // Todos os browsers modernos suportam, exceto alguns bem antigos
  if ('serviceWorker' in navigator) {
    
    // Espera a página carregar completamente antes de registrar
    // Por quê? Pra não competir com o carregamento inicial e deixar o site lento
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      // swUrl — o caminho do arquivo do service worker
      // O CRA gera esse arquivo automaticamente na pasta /public durante o build

      if (isLocalhost) {
        // Em desenvolvimento, verifica se o arquivo existe
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log('Rodando com service worker em modo desenvolvimento.');
        });
      } else {
        // Em produção, registra direto
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      // Fica verificando se tem atualização do service worker
      // Isso é importante — sem isso, o usuário pode ficar com versão antiga em cache
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Tem uma versão nova disponível
              // O config.onUpdate avisa o app que pode mostrar um banner "Atualizar"
              console.log('Nova versão disponível.');
              if (config && config.onUpdate) config.onUpdate(registration);
            } else {
              // Primeira instalação — conteúdo salvo em cache pra uso offline
              console.log('Conteúdo disponível offline.');
              if (config && config.onSuccess) config.onSuccess(registration);
            }
          }
        };
      };
    })
    .catch(error => {
      console.error('Erro ao registrar service worker:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  // Em desenvolvimento, verifica se o arquivo service-worker.js existe
  // Se não existir (ex: build não foi gerado), desregistra pra não causar problemas
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then(response => {
      const contentType = response.headers.get('content-type');
      if (response.status === 404 || (contentType != null && contentType.indexOf('javascript') === -1)) {
        navigator.serviceWorker.ready.then(registration => {
          registration.unregister().then(() => window.location.reload());
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('Sem conexão. App rodando em modo offline.');
    });
}

export function unregister() {
  // Função pra desativar o service worker se precisar
  // Útil pra debugar problemas de cache
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => registration.unregister())
      .catch(error => console.error(error.message));
  }
}