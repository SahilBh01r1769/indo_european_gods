import { App } from './App.js';
import { store } from '../utils/store.js';

function boot() {
  const app = new App(store);
  app.start();
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
