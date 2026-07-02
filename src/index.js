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
    const API_URL = process.env.REACT_APP_API_URL || 'https://taverna-backend-eq3b.onrender.com';
    
    const res = await fetch(`${API_URL}/push/vapid-public-key`);
    const { public_key } = await res.json();

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permissão negada');
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(public_key)
    });

    console.log('Subscription criada:', JSON.stringify(subscription));

    const user = JSON.parse(localStorage.getItem('taverna_user'));
    if (!user) {
      console.log('Usuário não encontrado no localStorage');
      return;
    }

    const saveRes = await fetch(`${API_URL}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, subscription })
    });

    console.log('Subscription salva:', await saveRes.json());
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