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
      this.container.style.display = 'none';
      this.store.set(STATE_KEYS.PATH_FROM, null);
      this.store.set(STATE_KEYS.PATH_TO, null);
      this.store.set(STATE_KEYS.ACTIVE_PATH, []);
      this.store.set(STATE_KEYS.PATH_SEARCH_PENDING, null);
    });

    // Show "Search All" button when path not found in current view
    this.store.subscribe(STATE_KEYS.PATH_SEARCH_PENDING, pending => {
      if (pending) {
        this.container.style.display = 'flex';
        this.container.querySelector('#path-strip-text').innerHTML = `
          <span>No path in current view.</span>
          <button id="search-all-btn" class="btn btn-sm btn-accent">Search All Deities</button>
        `;
        
        document.getElementById('search-all-btn')?.addEventListener('click', () => {
          if (this.generator) {
            this.generator.findPathGlobal(pending.fromId, pending.toId);
          }
          this.store.set(STATE_KEYS.PATH_SEARCH_PENDING, null);
        });
      }
    });

    // Show the path when found
    this.store.subscribe(STATE_KEYS.ACTIVE_PATH, pathIds => {
      if (pathIds && pathIds.length > 0) {
        this.container.style.display = 'flex';
        const html = pathIds.map((id, i) => {
          const isLast = i === pathIds.length - 1;
          return `<span class="path-node" data-deity="${id}">${id}</span>${isLast ? '' : '<span class="path-arrow">→</span>'}`;
        }).join('');
        
        this.container.querySelector('#path-strip-text').innerHTML = html;
        
        this.container.querySelectorAll('.path-node').forEach(node => {
          node.addEventListener('click', () => {
            if (this.generator) {
              this.generator.loadDeity(node.dataset.deity, { resetGraph: false });
            }
          });
        });
      } else if (!this.store.get(STATE_KEYS.PATH_SEARCH_PENDING)) {
        this.container.style.display = 'none';
      }
    });
  }
}
