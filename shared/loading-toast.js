/**
 * Loading toast notification system
 * Shows user feedback when assets are loading
 */

class LoadingToast {
  constructor() {
    this.toastEl = null;
    this.progressEl = null;
    this.labelEl = null;
    this.isShowing = false;
  }

  /**
   * Initialize the loading toast UI
   */
  ensureUI() {
    if (this.toastEl) return;

    // Create container
    const container = document.createElement('div');
    container.className = 'loading-toast-container';
    container.id = 'loading-toast-container';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    container.innerHTML = `
      <div class="loading-toast">
        <div class="loading-toast-content">
          <span class="loading-toast-spinner"></span>
          <div class="loading-toast-text">
            <p class="loading-toast-label" id="loading-toast-label">Loading assets…</p>
            <p class="loading-toast-detail" id="loading-toast-detail"></p>
          </div>
        </div>
        <progress class="loading-toast-progress" id="loading-toast-progress" max="100" value="0"></progress>
      </div>
    `;

    document.body.appendChild(container);
    this.toastEl = container;
    this.labelEl = document.getElementById('loading-toast-label');
    this.detailEl = document.getElementById('loading-toast-detail');
    this.progressEl = document.getElementById('loading-toast-progress');
  }

  /**
   * Show loading toast with label
   */
  show(label = 'Loading assets…') {
    this.ensureUI();
    this.labelEl.textContent = label;
    this.toastEl.classList.add('show');
    this.isShowing = true;
  }

  /**
   * Update progress
   */
  setProgress(current, total, detail = '') {
    this.ensureUI();
    const percent = Math.min(100, Math.round((current / total) * 100));
    this.progressEl.value = percent;
    if (detail) {
      this.detailEl.textContent = detail;
    }
  }

  /**
   * Hide loading toast
   */
  hide() {
    if (this.toastEl) {
      this.toastEl.classList.remove('show');
      this.isShowing = false;
    }
  }

  /**
   * Show completion message briefly
   */
  async showComplete(message = 'Ready!', duration = 1000) {
    this.show(message);
    await new Promise(resolve => setTimeout(resolve, duration));
    this.hide();
  }

  /**
   * Show error message
   */
  showError(message = 'Loading failed') {
    this.ensureUI();
    this.labelEl.textContent = message;
    this.toastEl.classList.add('error');
    this.toastEl.classList.add('show');
  }
}

// Global singleton
globalThis.LoadingToast = new LoadingToast();

export default globalThis.LoadingToast;
