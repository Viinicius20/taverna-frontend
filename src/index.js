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

// Registra o service worker — isso que permite:
// 1. Instalar o site como app no celular
// 2. Funcionar offline básico (cache das páginas já visitadas)
// 3. Receber notificações em segundo plano (próximo passo)
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('Service worker registrado — app pode ser instalado!');
  },
  onUpdate: () => {
    console.log('Nova versão disponível — recarregue a página.');
  }
});

reportWebVitals();