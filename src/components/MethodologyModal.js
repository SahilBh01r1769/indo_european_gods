export class MethodologyModal {
  constructor() {
    this.modal = null;
  }

  mount() {
    // Create modal element
    this.modal = document.createElement('div');
    this.modal.className = 'modal-backdrop';
    this.modal.innerHTML = `
      <div class="modal-box" style="max-width:700px;">
        <div class="modal-header">
          <div>
            <div class="modal-title">Methodology</div>
            <div class="modal-subtitle">How similarity calculations work</div>
          </div>
          <button class="btn btn-sm btn-ghost" id="methodology-close">✕</button>
        </div>
        <div class="modal-content">
          <div class="method-section">
            <h3 class="method-heading">
              <span class="method-heading-icon">📊</span>
              Trait Vectors
            </h3>
            <div class="method-body">
              <p>Each deity is represented as a 16-dimensional vector based on mythological traits like "storm god," "trickster," "healer," etc. Each trait has a value from 0 (absent) to 1 (core characteristic).</p>
              <p>For example, Apollo might have: archer=0.95, healer=0.9, solar=0.85, disease sender=0.85...</p>
            </div>
          </div>

          <div class="method-section">
            <h3 class="method-heading">
              <span class="method-heading-icon">📐</span>
              Cosine Similarity
            </h3>
            <div class="method-body">
              <p>Measures the angle between two trait vectors. Values range from 0 (completely different) to 1 (identical trait profiles).</p>
              <div class="method-formula">cos(θ) = (A · B) / (|A| × |B|)</div>
              <p>This is ideal for comparing the "shape" of mythological roles regardless of how many traits each deity has.</p>
            </div>
          </div>

          <div class="method-section">
            <h3 class="method-heading">
              <span class="method-heading-icon">🔄</span>
              Weighted Overlap
            </h3>
            <div class="method-body">
              <p>Alternative metric that measures trait overlap by comparing minimum and maximum values across all dimensions.</p>
              <div class="method-formula">overlap = Σmin(Ai, Bi) / Σmax(Ai, Bi)</div>
              <p>More sensitive to exact trait values than cosine similarity.</p>
            </div>
          </div>

          <div class="method-section">
            <h3 class="method-heading">
              <span class="method-heading-icon">🔗</span>
              Graph Construction
            </h3>
            <div class="method-body">
              <p>The network graph is built by:</p>
              <ol style="margin-left:20px;line-height:1.8;">
                <li>Selecting a center deity</li>
                <li>Computing similarity scores to all other deities</li>
                <li>Filtering by threshold (default 0.35)</li>
                <li>Taking top N connections (5 or 10)</li>
                <li>Clicking nodes expands the network by adding their connections</li>
              </ol>
            </div>
          </div>

          <div class="method-section">
            <h3 class="method-heading">
              <span class="method-heading-icon">📚</span>
              Academic Sources
            </h3>
            <div class="method-body">
              <p>Trait assignments based on comparative mythology research:</p>
              <ul style="margin-left:20px;line-height:1.8;font-size:11px;">
                <li><strong>West (2007)</strong> - Indo-European Poetry and Myth</li>
                <li><strong>Watkins (1995)</strong> - How to Kill a Dragon</li>
                <li><strong>Dumézil (1958)</strong> - Tripartite ideology</li>
                <li><strong>Mallory & Adams (2006)</strong> - PIE reconstruction</li>
              </ul>
            </div>
          </div>
        </div>
      </div>`;

    document.body.appendChild(this.modal);

    this.modal.querySelector('#methodology-close')?.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', e => {
      if (e.target === this.modal) this.close();
    });

    window.addEventListener('methodology:open', () => this.open());
  }

  open() {
    this.modal.classList.add('open');
  }

  close() {
    this.modal.classList.remove('open');
  }
}