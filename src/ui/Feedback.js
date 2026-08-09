export class FeedbackUI {
  constructor() {
    this.toastEl  = document.getElementById('toast');
    this.loaderEl = document.getElementById('loading-indicator');
    this.statusEl = document.getElementById('status-bar');
    this._timer   = null;
  }

  toast(msg) {
    if (!this.toastEl) return;
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.toastEl.classList.remove('show'), 2800);
  }

  showLoading(visible) {
    if (!this.loaderEl) return;
    this.loaderEl.style.display = visible ? 'block' : 'none';
  }

  setStatus(msg) {
    if (!this.statusEl) return;
    this.statusEl.textContent = msg;
  }
}
