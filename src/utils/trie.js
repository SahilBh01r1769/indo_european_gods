/**
 * Trie (Prefix Tree) Data Structure
 * CS Fundamental: O(L) insert and search where L = word length
 * Used for lightning-fast deity/epithet autocomplete
 */

class TrieNode {
  constructor() {
    /** @type {Object<string, TrieNode>} */
    this.children = {};
    /** @type {Array<{id: string, name: string, epithet: string, pantheon: string}>} */
    this.deities = []; // Deities that have this prefix
    this.isEndOfWord = false;
  }
}

export class Trie {
  constructor() {
    this.root = new TrieNode();
    this.size = 0;
  }

  /**
   * Insert a deity into the trie
   * @param {Object} deity - Deity object with id, epithet, pantheon
   * @param {string} text - The text to index (name or epithet)
   */
  insert(deity, text) {
    if (!text) return;
    
    const normalized = text.toLowerCase().trim();
    let node = this.root;

    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];
      
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      
      node = node.children[char];
      
      // Add deity reference at every prefix level for autocomplete
      if (!node.deities.some(d => d.id === deity.id)) {
        node.deities.push({
          id: deity.id,
          name: deity.id,
          epithet: deity.epithet || '',
          pantheon: deity.pantheon
        });
      }
    }

    node.isEndOfWord = true;
    this.size++;
  }

  /**
   * Search for all deities matching a prefix
   * @param {string} prefix - User's search input
   * @returns {Array} Matching deities sorted by relevance
   */
  search(prefix) {
    if (!prefix || prefix.trim() === '') return [];
    
    const normalized = prefix.toLowerCase().trim();
    let node = this.root;

    // Traverse to the prefix node
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];
      if (!node.children[char]) {
        return []; // No matches
      }
      node = node.children[char];
    }

    // Return all deities at this prefix, sorted by relevance
    return this._sortResults(node.deities, normalized);
  }

  /**
   * Get fuzzy matches (allows 1 character difference)
   * @param {string} query 
   * @returns {Array}
   */
  fuzzySearch(query) {
    const results = [];
    const normalized = query.toLowerCase().trim();
    this._fuzzyHelper(this.root, normalized, 0, 1, results, '');
    return results.slice(0, 10); // Limit results
  }

  /**
   * @private
   */
  _fuzzyHelper(node, query, index, maxEdits, results, currentPath) {
    if (maxEdits < 0) return;

    if (index === query.length) {
      if (node.deities.length > 0) {
        results.push(...node.deities.map(d => ({ ...d, matchPath: currentPath })));
      }
      return;
    }

    // Exact match - no edit cost
    const char = query[index];
    if (node.children[char]) {
      this._fuzzyHelper(node.children[char], query, index + 1, maxEdits, results, currentPath + char);
    }

    // Try edits only if we have budget
    if (maxEdits > 0) {
      for (const [key, child] of Object.entries(node.children)) {
        if (key !== char) {
          // Substitution
          this._fuzzyHelper(child, query, index + 1, maxEdits - 1, results, currentPath + key);
        }
      }
    }
  }

  /**
   * @private
   * Sort results: exact matches first, then by pantheon diversity
   */
  _sortResults(deities, query) {
    return [...deities]
      .map(d => {
        let score = 0;
        const name = d.name.toLowerCase();
        const epithet = d.epithet.toLowerCase();
        
        // Exact name match is highest priority
        if (name === query) score += 100;
        else if (name.startsWith(query)) score += 50;
        else if (epithet.includes(query)) score += 25;
        else score += 10;
        
        return { ...d, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Limit dropdown to 8 results
  }

  /**
   * Build trie from deities array
   * @param {Array} deities 
   */
  static buildFromDeities(deities) {
    const trie = new Trie();
    
    deities.forEach(deity => {
      // Index by name
      trie.insert(deity, deity.id);
      
      // Index by epithet words
      if (deity.epithet) {
        deity.epithet.split(/[\s,]+/).forEach(word => {
          if (word.length > 2) {
            trie.insert(deity, word);
          }
        });
      }
      
      // Index by pantheon
      trie.insert(deity, deity.pantheon);
      
      // Index by top traits
      if (deity.traits) {
        Object.entries(deity.traits)
          .filter(([_, val]) => val > 0.7)
          .forEach(([trait]) => trie.insert(deity, trait));
      }
    });

    return trie;
  }
}

export default Trie;
