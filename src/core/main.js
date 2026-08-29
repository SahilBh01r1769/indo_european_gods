import { App } from './App.js';
import { store } from '../utils/store.js';

function boot() {
  new App(store).start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
