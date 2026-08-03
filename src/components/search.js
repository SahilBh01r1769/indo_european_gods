/**
 * Enhanced Search Component with Trie-based Autocomplete
 * Visual: Animated dropdown with pantheon badges and fuzzy matching
 */

import { Trie } from '../utils/trie.js';
import { store, STATE_KEYS } from '../utils/store.js';

export class SearchBar {
  constructor(container) {
    this.container = container;
    this.trie = null;
    this.isOpen = false;
    this.selectedIndex = -1;
    this.results = [];
    
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="search-wrapper">
        <div class="search-input-group">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search deities, epithets, traits..."
            autocomplete="off"
            aria-label="Search deities"
            aria-expanded="false"
            role="combobox"
          />
          <kbd class="search-kbd">⌘K</kbd>
        </div>
        <div class="search-dropdown" role="listbox" hidden>
          <!-- Results injected here -->
        </div>
      </div>
    `;

    this.input = this.container.querySelector('.search-input');
    this.dropdown = this.container.querySelector('.search-dropdown');
    this.kbd = this.container.querySelector('.search-kbd');

    this.bindEvents();
    this.setupKeyboardShortcut();
  }

  /**
   * Initialize trie with deities data
   */
  buildIndex(deities) {
    this.trie = Trie.buildFromDeities(deities);
    console.log(`[Search] Trie built with ${this.trie.size} indexed terms`);
  }

  bindEvents() {
    // Debounced input handler
    let debounceTimer;
    this.input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.handleSearch(e.target.value);
      }, 100); // 100ms debounce for smooth typing
    });

    // Keyboard navigation
    this.input.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
          this.highlightResult();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
          this.highlightResult();
          break;
        case 'Enter':
          e.preventDefault();
          if (this.selectedIndex >= 0 && this.results[this.selectedIndex]) {
            this.selectResult(this.results[this.selectedIndex]);
          }
          break;
        case 'Escape':
          this.close();
          break;
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });
  }

  setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.input.focus();
      }
    });
  }

  handleSearch(query) {
    store.set(STATE_KEYS.SEARCH_QUERY, query);

    if (!query || query.length < 2) {
      this.close();
      return;
    }

    // Try exact prefix match first, then fuzzy
    let results = this.trie?.search(query) || [];
    if (results.length < 3) {
      const fuzzyResults = this.trie?.fuzzySearch(query) || [];
      // Merge without duplicates
      const ids = new Set(results.map(r => r.id));
      results = [...results, ...fuzzyResults.filter(r => !ids.has(r.id))];
    }

    this.results = results.slice(0, 8);
    this.renderResults();
    this.open();
  }

  renderResults() {
    if (this.results.length === 0) {
      this.dropdown.innerHTML = `
        <div class="search-empty">
          <span class="search-empty-icon">🔍</span>
          <p>No deities found for "${this.input.value}"</p>
        </div>
      `;
      return;
    }

    this.dropdown.innerHTML = this.results.map((result, index) => `
      <div 
        class="search-result ${index === this.selectedIndex ? 'selected' : ''}"
        data-index="${index}"
        role="option"
        aria-selected="${index === this.selectedIndex}"
      >
        <div class="search-result-main">
          <span class="search-result-name">${this.highlightMatch(result.name, this.input.value)}</span>
          <span class="search-result-epithet">${result.epithet}</span>
        </div>
        <span class="badge pantheon-${result.pantheon.toLowerCase()}">${result.pantheon}</span>
      </div>
    `).join('');

    // Add click handlers
    this.dropdown.querySelectorAll('.search-result').forEach(el => {
      el.addEventListener('click', () => {
        const index = parseInt(el.dataset.index);
        this.selectResult(this.results[index]);
      });
    });
  }

  highlightMatch(text, query) {
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  highlightResult() {
    this.dropdown.querySelectorAll('.search-result').forEach((el, i) => {
      el.classList.toggle('selected', i === this.selectedIndex);
      el.setAttribute('aria-selected', i === this.selectedIndex);
    });
    
    // Scroll into view
    const selected = this.dropdown.querySelector('.selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }

  selectResult(result) {
    store.set(STATE_KEYS.SELECTED_DEITY, result.id);
    this.input.value = result.name;
    this.close();
    
    // Trigger graph focus on deity
    const event = new CustomEvent('deity-selected', { detail: { id: result.id } });
    document.dispatchEvent(event);
  }

  open() {
    this.isOpen = true;
    this.selectedIndex = -1;
    this.dropdown.hidden = false;
    this.input.setAttribute('aria-expanded', 'true');
    this.dropdown.classList.add('animate-fade-in');
  }

  close() {
    this.isOpen = false;
    this.dropdown.hidden = true;
    this.input.setAttribute('aria-expanded', 'false');
  }
}

export default SearchBar;
