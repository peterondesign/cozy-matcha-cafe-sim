/**
 * Simple Profile Connection UI
 * - Shows your profile code
 * - Easy copy button
 * - Simple input to sync profile across devices
 */

class ProfileConnector {
  constructor() {
    this.createUI();
  }

  createUI() {
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'profile-sync-modal';
    modal.className = 'profile-sync-modal';
    modal.innerHTML = `
      <div class="profile-sync-card">
        <button class="profile-sync-close" aria-label="Close profile sync">&times;</button>
        
        <h2>Your Profile Code</h2>
        <p class="profile-sync-subtitle">Same code, every device 🎮</p>
        
        <!-- Show your code -->
        <div class="profile-sync-section">
          <h3>Your Code (Copy This)</h3>
          <div class="profile-sync-code-display">
            <div class="profile-sync-code" id="profile-code">
              <span class="profile-code-text" id="profile-code-text">mint-tea-42</span>
            </div>
            <button class="profile-sync-copy-btn" id="profile-copy-btn" aria-label="Copy profile code">
              <span class="copy-icon">📋</span>
              <span class="copy-text">Copy</span>
            </button>
          </div>
          <p class="profile-sync-hint">📱 Use this code on any device</p>
        </div>
        
        <!-- Input to sync profile -->
        <div class="profile-sync-section">
          <h3>Paste Someone Else's Code</h3>
          <div class="profile-sync-input-group">
            <input 
              type="text" 
              id="profile-sync-input" 
              class="profile-sync-input" 
              placeholder="paste-code-here-99"
              aria-label="Enter profile code to sync"
            />
            <button class="profile-sync-load-btn" id="profile-load-btn" aria-label="Load profile">
              <span class="load-icon">↓</span>
              Load
            </button>
          </div>
          <p class="profile-sync-hint">⬇️ Loads their progress</p>
        </div>
        
        <!-- Status messages -->
        <div class="profile-sync-status" id="profile-sync-status" hidden>
          <div class="profile-sync-status-message"></div>
        </div>
        
        <div class="profile-sync-info">
          <p>💡 <strong>How it works:</strong></p>
          <ul>
            <li>Copy your code, share with friends</li>
            <li>Open game on another device</li>
            <li>Paste their code to play their progress</li>
            <li>Your code saves automatically</li>
          </ul>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.modal = modal;
    this.setupEventListeners();
  }

  setupEventListeners() {
    const closeBtn = this.modal.querySelector('.profile-sync-close');
    const copyBtn = this.modal.querySelector('#profile-copy-btn');
    const loadBtn = this.modal.querySelector('#profile-load-btn');
    const input = this.modal.querySelector('#profile-sync-input');
    
    closeBtn?.addEventListener('click', () => this.hide());
    
    copyBtn?.addEventListener('click', async () => {
      const code = document.querySelector('#profile-code-text')?.textContent;
      if (!code) return;
      
      try {
        await navigator.clipboard.writeText(code);
        this.showStatus('✓ Copied to clipboard!', 'success', 2000);
        copyBtn.classList.add('copied');
        setTimeout(() => copyBtn.classList.remove('copied'), 2000);
      } catch (error) {
        this.showStatus('Could not copy. Try manually selecting the code.', 'error', 3000);
      }
    });
    
    loadBtn?.addEventListener('click', async () => {
      const code = input?.value?.trim();
      if (!code) {
        this.showStatus('⚠️ Please paste a code first', 'warning', 2000);
        return;
      }
      
      await this.loadProfile(code);
    });
    
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loadBtn?.click();
      }
    });
  }

  async loadProfile(code) {
    const btn = this.modal.querySelector('#profile-load-btn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Loading...';
    
    try {
      if (!window.MatchaLeaderboard?.enabled()) {
        this.showStatus('❌ Cloud sync not available', 'error', 3000);
        return;
      }
      
      // Pull the profile data
      const profileData = await window.MatchaLeaderboard.pull(code);
      
      if (!profileData) {
        this.showStatus('❌ Code not found. Check if it\'s correct.', 'error', 3000);
        return;
      }
      
      // Update local storage with the pulled data
      const saveKey = 'matchaVisualState';
      localStorage.setItem(saveKey, JSON.stringify(profileData.state || {}));
      
      // Update audio settings if profile has them
      if (profileData.display_name || profileData.avatar) {
        const audioSettings = JSON.parse(localStorage.getItem('matchaSettings') || '{}');
        audioSettings.name = profileData.display_name || audioSettings.name;
        audioSettings.avatar = profileData.avatar || audioSettings.avatar;
        localStorage.setItem('matchaSettings', JSON.stringify(audioSettings));
      }
      
      // Update the player ID so their saves go to this profile
      if (window.MatchaLeaderboard.setPlayerId) {
        window.MatchaLeaderboard.setPlayerId(code);
      }
      
      this.showStatus(`✓ Loaded ${profileData.display_name || 'their'} profile! Refresh to see it.`, 'success', 3000);
      
    } catch (error) {
      console.error('Profile load error:', error);
      this.showStatus(`❌ Error: ${error.message}`, 'error', 3000);
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  showStatus(message, type = 'info', duration = 2000) {
    const statusEl = this.modal.querySelector('#profile-sync-status');
    const msgEl = statusEl.querySelector('.profile-sync-status-message');
    
    msgEl.textContent = message;
    statusEl.className = `profile-sync-status profile-sync-status-${type}`;
    statusEl.hidden = false;
    
    if (duration > 0) {
      setTimeout(() => {
        statusEl.hidden = true;
      }, duration);
    }
  }

  show() {
    this.modal.classList.add('show');
    // Update the code display in case it changed
    const code = window.MatchaLeaderboard?.playerId?.();
    if (code) {
      this.modal.querySelector('#profile-code-text').textContent = code;
    }
  }

  hide() {
    this.modal.classList.remove('show');
  }

  toggle() {
    if (this.modal.classList.contains('show')) {
      this.hide();
    } else {
      this.show();
    }
  }
}

// Global instance
globalThis.ProfileConnector = new ProfileConnector();

export default globalThis.ProfileConnector;
