import { STATE_KEYS } from '../utils/store.js';

export class PathStrip {
  constructor(store) {
    this.store = store;
    this.container = null;
  }

  mount(container) {
    this.container = container;

    this.container?.querySelector('#path-strip-close')?.addEventListener('click', () => {
      this.hide();
    });

    window.addEventListener('path:found', (e) => {
      const path = e.detail;
      if (!path || !path.length) {
        this.container.style.display = 'flex';
        this.container.querySelector('#path-strip-text').textContent = 'No path found';
        return;
      }
      this.container.style.display = 'flex';
      this.container.querySelector('#path-strip-text').innerHTML =
        path.map((id, i) =>
          `<button class="path-node-btn" data-id="${id}">${id}</button>` +
          (i < path.length - 1 ? ' <span class="path-arrow">→</span> ' : '')
        ).join('');

      this.container.querySelectorAll('.path-node-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          window.dispatchEvent(new CustomEvent('path:focusNode', { detail: btn.dataset.id }));
        });
      });
    });
  }

  hide() {
    if (!this.container) return;
    this.container.style.display = 'none';
    this.store.set(STATE_KEYS.PATH_FROM, null);
    this.store.set(STATE_KEYS.PATH_TO, null);
    this.store.set(STATE_KEYS.MODE, 'explore');
    document.getElementById('path-btn')?.classList.remove('btn-active');
    window.dispatchEvent(new CustomEvent('path:found', { detail: null }));
  }
}
