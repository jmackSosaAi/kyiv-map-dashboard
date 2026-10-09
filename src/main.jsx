import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { runMigrations } from './utils/migrate';

// Migrate legacy kmd.* keys to kmd.v2.* before any state hook reads them.
runMigrations();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
