// Cloud account for the shift. The pill stays quiet until this browser has progress worth keeping.
(() => {
const saveHud = document.querySelector('#saveHud');
const saveCard = document.querySelector('#saveCard');
const saveForm = document.querySelector('#saveForm');
const savePill = document.querySelector('#savePill');
const saveLead = document.querySelector('#saveLead');
const saveNote = document.querySelector('#saveNote');
const saveEmail = document.querySelector('#saveEmail');
const savePassword = document.querySelector('#savePassword');
const saveConfirm = document.querySelector('#saveConfirm');
const saveConfirmLabel = document.querySelector('#saveConfirmLabel');
const saveSubmit = document.querySelector('#saveSubmit');
const saveSwitch = document.querySelector('#saveSwitch');
const saveForgot = document.querySelector('#saveForgot');
const saveLater = document.querySelector('#saveLater');
const saveReveal = document.querySelector('#saveReveal');
const savePasswordLabel = document.querySelector('#savePasswordLabel');
const params = new URLSearchParams(location.search);
const autostart = params.has('autostart');
const recoveryToken = params.get('recovery') || '';

let accountEmail = null;
let mode = recoveryToken ? 'reset' : 'signin';
let open = false;
let collapsedAt = null;
let syncing = false;
let saveError = '';

window.matchaCloud = {push, flush:pushNow, nudge, email: () => accountEmail};

function progressBlob() {
  return window.matchaProgress?.blob() || {served: state.served, coins: state.coins, owned: [], savedAt: 0};
}

function onShift() {
  return state.phase === 'play' || state.phase === 'waiting' || state.phase === 'park' || state.phase === 'win';
}

function meaningful(blob) {
  return blob.served > 0 || blob.coins !== 125 || (blob.owned || []).length > 0;
}

function dismissedServed() {
  const value = sessionStorage.getItem('cozy-save-nudge');
  return value === null ? -1 : Number(value);
}

function pillOnly() {
  return state.phase === 'play' || state.phase === 'win';
}

function render() {
  if (!saveHud || autostart) return;
  if (collapsedAt !== null && state.served > collapsedAt) collapsedAt = null;
  const blob = progressBlob();
  const guestWithProgress = !accountEmail && (meaningful(blob) || mode === 'reset');
  const show = Boolean(accountEmail) || guestWithProgress;
  saveHud.hidden = !show;
  if (!show) return;
  const earned = state.served > 0 || window.matchaResume || mode === 'reset';
  const auto = mode === 'reset' && !accountEmail;
  const expand = open || auto;
  saveCard.hidden = !expand;
  savePill.setAttribute('aria-expanded', expand ? 'true' : 'false');
  document.querySelector('#savePillText').textContent = saveError
    ? 'Couldn’t save'
    : accountEmail
      ? (syncing ? 'Saving shift…' : accountEmail)
      : 'Save your shift';
  const titles = {
    signin: 'Sign in to keep this shift — coins, pantry, and the garden stay with you.',
    signup: 'Create an account with your email. Your password is stored encrypted, and this shift is saved to it.',
    forgot: 'Enter your email and we will send a link to choose a new password.',
    reset: 'Choose a new password for your cafe account.',
    account: `Signed in as ${accountEmail}. This browser’s shift is saved to your account.`
  };
  saveLead.textContent = titles[mode] || titles.signin;
  const signing = mode === 'signin' || mode === 'signup';
  saveSubmit.hidden = mode === 'account';
  saveEmail.hidden = mode === 'reset';
  saveEmail.closest('label').hidden = mode === 'reset' || mode === 'account';
  savePasswordLabel.hidden = mode === 'forgot' || mode === 'account';
  saveConfirmLabel.hidden = mode !== 'reset' && mode !== 'signup';
  savePassword.autocomplete = mode === 'signin' ? 'current-password' : 'new-password';
  saveSubmit.textContent = mode === 'signup' ? 'Create account and save' : mode === 'forgot' ? 'Email me a reset link' : mode === 'reset' ? 'Save new password' : 'Sign in and save';
  saveSwitch.hidden = !signing;
  saveSwitch.textContent = mode === 'signup' ? 'I already have a shift' : 'Create an account';
  saveForgot.hidden = mode !== 'signin';
  saveLater.hidden = mode === 'reset';
  saveLater.textContent = mode === 'account' ? 'Sign out' : 'Not now';
  const askEmail = mode === 'signin' || mode === 'signup' || mode === 'forgot';
  const askPassword = mode === 'signin' || mode === 'signup' || mode === 'reset';
  saveEmail.disabled = !askEmail;
  saveEmail.required = askEmail;
  savePassword.disabled = !askPassword;
  savePassword.required = askPassword;
  saveConfirm.disabled = mode !== 'signup' && mode !== 'reset';
  saveConfirm.required = mode === 'signup' || mode === 'reset';
}

function nudge() { render(); }

function note(text, tone) {
  saveNote.textContent = text || '';
  saveNote.dataset.tone = tone || '';
}

async function api(path, options) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: {'Content-Type': 'application/json'},
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The cafe could not save just now.');
  return data;
}

async function refreshSession() {
  try {
    const data = await api('/api/session');
    accountEmail = data.email || null;
    if (accountEmail) await reconcile();
  } catch {
    accountEmail = null;
  }
  render();
}

async function reconcile() {
  const remote = await api('/api/save');
  const local = progressBlob();
  const remoteProgress = remote.progress;
  if ((remoteProgress?.savedAt || 0) > (local.savedAt || 0)) {
    if (state.phase === 'play' || state.phase === 'win') return;
    window.matchaProgress?.apply(remoteProgress);
    return;
  }
  await pushNow();
}

let pushTimer;
function push() {
  if (!accountEmail) { nudge(); return; }
  clearTimeout(pushTimer);
  syncing = true;
  nudge();
  pushTimer = setTimeout(() => { pushNow().finally(() => { syncing = false; nudge(); }); }, 900);
}

async function pushNow() {
  if (!accountEmail || !window.matchaProgress) return;
  try {
    const blob = window.matchaProgress.blob();
    await api('/api/save', {method: 'PUT', body: JSON.stringify({progress: blob})});
    saveError = '';
  } catch (error) {
    saveError = error.message;
  }
}

savePill?.addEventListener('click', () => {
  if (mode === 'reset' && !accountEmail) return;
  const expanded = savePill.getAttribute('aria-expanded') === 'true';
  open = !expanded;
  collapsedAt = expanded ? state.served : null;
  if (open && accountEmail) mode = 'account';
  if (open && !accountEmail && mode === 'account') mode = 'signin';
  note('');
  render();
});

saveSwitch?.addEventListener('click', () => {
  mode = mode === 'signup' ? 'signin' : 'signup';
  note('');
  render();
});

saveForgot?.addEventListener('click', () => {
  mode = 'forgot';
  note('');
  render();
});

saveReveal?.addEventListener('click', () => {
  const hidden = savePassword.type === 'password';
  savePassword.type = hidden ? 'text' : 'password';
  if (saveConfirm) saveConfirm.type = savePassword.type;
  saveReveal.textContent = hidden ? 'Hide password' : 'Show password';
  savePassword.focus();
});

saveLater?.addEventListener('click', async () => {
  if (mode === 'account') {
    await api('/api/logout', {method: 'POST', body: '{}'}).catch(() => {});
    accountEmail = null;
    mode = 'signin';
    open = false;
    note('');
    render();
    return;
  }
  sessionStorage.setItem('cozy-save-nudge', String(state.served));
  collapsedAt = state.served;
  open = false;
  note('');
  render();
});

saveForm?.addEventListener('submit', async event => {
  event.preventDefault();
  saveSubmit.disabled = true;
  note('');
  try {
    if (mode === 'forgot') {
      const data = await api('/api/forgot', {method: 'POST', body: JSON.stringify({email: saveEmail.value})});
      note(data.message || 'Check your inbox for the reset link.', 'good');
      return;
    }
    if (mode === 'reset' || mode === 'signup') {
      if (savePassword.value !== saveConfirm.value) {
        note('Those passwords do not match yet.', 'bad');
        return;
      }
    }
    if (mode === 'reset') {
      const data = await api('/api/reset', {method: 'POST', body: JSON.stringify({token: recoveryToken, password: savePassword.value})});
      accountEmail = data.email || saveEmail.value;
      mode = 'account';
      open = true;
      history.replaceState(null, '', location.pathname);
      note('Password updated. This shift will stay with your account.', 'good');
      await reconcile();
      return;
    }
    const path = mode === 'signup' ? '/api/signup' : '/api/login';
    const data = await api(path, {method: 'POST', body: JSON.stringify({email: saveEmail.value, password: savePassword.value})});
    accountEmail = data.email || saveEmail.value.trim().toLowerCase();
    mode = 'account';
    open = true;
    savePassword.value = '';
    saveConfirm.value = '';
    note('Signed in. Your shift is saved to this account.', 'good');
    await reconcile();
  } catch (error) {
    const offline = error.message === 'Failed to fetch';
    note(offline ? 'Start the cafe server with node server/cafe.mjs so this shift can be saved.' : error.message, 'bad');
  } finally {
    saveSubmit.disabled = false;
    render();
  }
});

refreshSession();
})();
