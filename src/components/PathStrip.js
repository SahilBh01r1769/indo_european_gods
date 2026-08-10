import { STATE_KEYS } from '../utils/store.js';

export class PathStrip {
  constructor(store, generator) {
    this.store = store;
    this.generator = generator;
    this.container = null;
  }

  mount(container) {
    this.container = container;

    this.container?.querySelector('#path-strip-close')?.addEventListener('click', () => {
      this.hide();
    });

    this.store.subscribe(STATE_KEYS.ACTIVE_PATH, pathIds => {
      if (pathIds && pathIds.length > 0) {
        this.container.style.display = 'flex';
        this.container.querySelector('#path-strip-text').innerHTML = pathIds
          .map((id, i) => {
            const isLast = i === pathIds.length - 1;
            return (
              `<span class="path-node" data-deity="${id}">${id}</span>` +
              (isLast ? '' : '<span class="path-arrow">→</span>')
            );
          })
          .join('');

        this.container.querySelectorAll('.path-node').forEach(node => {
          node.addEventListener('click', () => {
            this.generator?.loadDeity(node.dataset.deity, { resetGraph: true });
          });
        });
      } else {
        this.container.style.display = 'none';
      }
    });
  }

  hide() {
    if (!this.container) return;
    this.container.style.display = 'none';
    this.store.set(STATE_KEYS.PATH_FROM, null);
    this.store.set(STATE_KEYS.PATH_TO, null);
    this.store.set(STATE_KEYS.ACTIVE_PATH, []);
    this.store.set(STATE_KEYS.MODE, 'explore');
    document.getElementById('path-btn')?.classList.remove('btn-active');
    window.dispatchEvent(new CustomEvent('path:found', { detail: null }));
  }
}
