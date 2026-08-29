import { Trie } from '../utils/trie.js';

export class SearchBar {
  constructor(store, generator) {
    this.store = store;
    this.generator = generator;
    this.trie = null;
    this.isOpen = false;
    this.selectedIndex = -1;
    this.results = [];
    this.input = null;
    this.dropdown = null;
  }

  mount(container) {
    container.innerHTML = `
      <div class="search-wrapper">
        <div class="search-input-group">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" class="search-input" placeholder="Search deities, epithets, traits..."
                 autocomplete="off" aria-label="Search deities" aria-expanded="false"
                 aria-controls="search-results" role="combobox" />
          <kbd class="search-kbd">/</kbd>
        </div>
        <div class="search-dropdown" id="search-results" role="listbox" hidden></div>
      </div>`;

    this.input = container.querySelector('.search-input');
    this.dropdown = container.querySelector('.search-dropdown');
    this.bindEvents();
  }

  buildIndex(deities) {
    this.trie = Trie.buildFromDeities(deities);
  }

  bindEvents() {
    this.input.addEventListener('input', () => this.onInput());
    this.input.addEventListener('keydown', e => this.onKeydown(e));
    this.input.addEventListener('blur', () => setTimeout(() => this.close(), 150));

    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.input.focus();
      }
    });
  }

  onInput() {
    const q = this.input.value.trim().toLowerCase();
    if (!q || !this.trie) {
      this.close();
      return;
    }

    let results = this.trie.search(q);
    if (!results.length && q.length >= 3) results = this.trie.fuzzySearch(q);

    const seen = new Set();
    this.results = results
      .filter(result => {
        if (seen.has(result.id)) return false;
        seen.add(result.id);
        return true;
      })
      .slice(0, 8);

    if (!this.results.length) {
      this.close();
      return;
    }

    this.isOpen = true;
    this.selectedIndex = -1;
    this.dropdown.hidden = false;
    this.input.setAttribute('aria-expanded', 'true');

    this.dropdown.innerHTML = this.results.map((d, i) => `
      <div class="search-result" id="search-result-${i}" role="option"
           aria-selected="false" data-index="${i}" data-id="${d.id}">
        <div class="search-result-main">
          <span class="search-result-name">${d.name || d.id}</span>
          ${d.epithet ? `<span class="search-result-epithet">${d.epithet}</span>` : ''}
        </div>
        <span class="sr-pantheon">${d.pantheon}</span>
      </div>
    `).join('');

    this.dropdown.querySelectorAll('.search-result').forEach(el => {
      el.addEventListener('mousedown', e => {
        e.preventDefault();
        this.select(el.dataset.id);
      });
    });
  }

  onKeydown(e) {
    if (e.key === 'Enter') {
      if (this.isOpen && this.selectedIndex >= 0 && this.results[this.selectedIndex]) {
        this.select(this.results[this.selectedIndex].id);
      } else if (this.input.value.trim()) {
        this.generator.loadDeity(this.input.value.trim(), { resetGraph: true });
        this.close();
      }
      return;
    }

    if (!this.isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % this.results.length;
      this.highlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + this.results.length) % this.results.length;
      this.highlight();
    } else if (e.key === 'Escape') {
      this.close();
    }
  }

  highlight() {
    this.dropdown.querySelectorAll('.search-result').forEach((el, i) => {
      const selected = i === this.selectedIndex;
      el.classList.toggle('selected', selected);
      el.setAttribute('aria-selected', String(selected));
      if (selected) this.input.setAttribute('aria-activedescendant', el.id);
    });
  }

  select(deityId) {
    this.input.value = deityId;
    this.generator.loadDeity(deityId, { resetGraph: true });
    this.close();
  }

  close() {
    this.isOpen = false;
    this.selectedIndex = -1;
    this.dropdown.hidden = true;
    this.input.setAttribute('aria-expanded', 'false');
    this.input.removeAttribute('aria-activedescendant');
  }
}
