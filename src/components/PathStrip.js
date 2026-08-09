import { STATE_KEYS } from '../utils/store.js';

export class PathStrip {
  constructor(store) {
    this.store = store;
    this.container = null;
  }

  mount(container) {
    this.container = container;

    this.container?.querySelector('#path-strip-close')?.addEventListener('click', () => {
      this.container.style.display = 'none';
      this.store.set(STATE_KEYS.PATH_FROM, null);
      this.store.set(STATE_KEYS.PATH_TO, null);
    });

    this.store.subscribe(STATE_KEYS.PATH_TO, to => {
      const from = this.store.get(STATE_KEYS.PATH_FROM);
      if (from && to) {
        this.container.style.display = 'flex';
        this.container.querySelector('#path-strip-text').textContent =
          `Path: ${from} → ${to}`;
      }
    });
  }
}