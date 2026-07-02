import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Pede permissão de notificação e salva assinatura no backend
async function configurarPush() {
  try {
    // Busca a chave pública VAPID do backend
    // O browser precisa dela pra criar a assinatura do dispositivo
    const res = await fetch(`${process.env.REACT_APP_API_URL}/push/vapid-public-key`);
    const { public_key } = await res.json();

    // Pede permissão pro usuário
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Espera o service worker estar pronto
    const registration = await navigator.serviceWorker.ready;

    // Cria a assinatura do dispositivo usando a chave pública
    // Isso é único por dispositivo — cada celular/PC tem uma assinatura diferente
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // obrigatório — toda notificação precisa ser visível pro usuário
      applicationServerKey: public_key
    });

    // Busca o usuário salvo no localStorage
    const user = JSON.parse(localStorage.getItem('taverna_user'));
    if (!user) return;

    // Salva a assinatura no backend
    await fetch(`${process.env.REACT_APP_API_URL}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, subscription })
    });

    console.log('Push notification configurado!');
  } catch (e) {
    console.error('Erro ao configurar push:', e);
  }
}

// Roda após o service worker ser registrado
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('Service worker registrado!');
    configurarPush();
  },
  onUpdate: () => {
    console.log('Nova versão disponível.');
  }
});

reportWebVitals();