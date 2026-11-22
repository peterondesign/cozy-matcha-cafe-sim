(() => { try {
const toast = document.getElementById('toast');
const audio = window.MatchaAudio;
const settings = document.getElementById('settings');
const mainMenu = document.getElementById('mainMenu');
const titleText = document.querySelector('.title-text');
const matcha = document.getElementById('matcha');
const musicVolume = document.getElementById('musicVolume');
const effectsVolume = document.getElementById('effectsVolume');

function paintFooter() {
  const state = JSON.parse(localStorage.getItem('matchaVisualState') || '{}') || {};
  const fields = {
    playerName: audio?.settings.name || 'Player',
    dayValue: 'Day ' + (state.day || 1),
    levelValue: 'Level ' + (1 + Math.max(0, Math.floor(Number(state.served) || 0))),
    coinValue: Number(state.coins ?? 120).toLocaleString('en-US')
  };
  const compact = document.querySelectorAll('.stats span');
  Object.entries(fields).forEach(([id, value], index) => {
    document.getElementById(id).textContent = value;
    compact[index].textContent = value;
  });
}
paintFooter();
window.addEventListener('pageshow', paintFooter);
window.addEventListener('storage', paintFooter);

function paintAudio() {
  musicVolume.value = audio.settings.music;
  effectsVolume.value = audio.settings.effects;
  musicVolume.style.setProperty('--fill', audio.settings.music + '%');
  effectsVolume.style.setProperty('--fill', audio.settings.effects + '%');
  document.getElementById('musicOff').classList.toggle('on', audio.settings.musicMuted);
  document.getElementById('musicOn').classList.toggle('on', !audio.settings.musicMuted);
  document.getElementById('effectsOff').classList.toggle('on', audio.settings.effectsMuted);
  document.getElementById('effectsOn').classList.toggle('on', !audio.settings.effectsMuted);
  document.getElementById('playerName').textContent = audio.settings.name;
  document.getElementById('playerNameInput').value = audio.settings.name;
}
function openSettings() {
  mainMenu.hidden = true;
  matcha.hidden = true;
  settings.hidden = false;
  titleText.textContent = 'Settings';
  paintAudio();
}
function closeSettings() {
  settings.hidden = true;
  mainMenu.hidden = false;
  matcha.hidden = false;
  titleText.textContent = 'Pause';
}
function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove('show'), 1400);
}

const shelf = document.getElementById('shelf');
const shelves = {
  inventory: 'The bag is packed. New tools show up here as the cart grows.',
  upgrades: 'The workbench is clear. Upgrades will hang on this wall.',
  recipes: 'The book is open to Iced Matcha Latte.',
  leaderboard: 'The board is waiting for the first full day.'
};
function restockLink() {
  let link = document.getElementById('restockLink');
  if (!link) {
    link = document.createElement('a');
    link.id = 'restockLink';
    link.className = 'restock';
    link.href = '../new-game/park/grocer.html';
    link.innerHTML = '<img src="../new-game/park/goods/restock.png" alt="Restock">';
    document.getElementById('shelfBack').before(link);
  }
  return link;
}
function paintInventory() {
  const body = document.getElementById('shelfBody');
  const state = MatchaPantry.load();
  body.innerHTML = `<div class="stock-grid">${MatchaPantry.ITEMS.map(([id, name, cap]) => {
    const qty = state.stock[id];
    const low = qty <= MatchaPantry.LOW;
    return `<article class="stock-card"><img src="${MatchaPantry.icon(id)}" alt=""><div><b>${name}</b><small>${qty} in stock</small><div class="meter${low ? ' low' : ''}"><span style="width:${Math.min(100, Math.round(qty / cap * 100))}%"></span></div></div></article>`;
  }).join('')}</div>`;
  restockLink().hidden = false;
}
function openShelf(action) {
  mainMenu.hidden = true;
  matcha.hidden = true;
  settings.hidden = true;
  shelf.hidden = false;
  titleText.textContent = action[0].toUpperCase() + action.slice(1);
  const text = document.getElementById('shelfText');
  const body = document.getElementById('shelfBody');
  text.hidden = action === 'inventory';
  body.hidden = action !== 'inventory';
  if (action === 'inventory') paintInventory();
  else { text.textContent = shelves[action]; body.replaceChildren(); restockLink().hidden = true; }
}
function closeShelf() {
  shelf.hidden = true;
  mainMenu.hidden = false;
  matcha.hidden = false;
  titleText.textContent = 'Pause';
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'settings') { openSettings(); return; }
  if (action === 'new') { document.getElementById('confirm').hidden = false; return; }
  if (shelves[action]) { openShelf(action); return; }
  if (action === 'resume') { location.href = '../counter/'; return; }
  if (action === 'park') { location.href = '../new-game/park/'; return; }
  if (action === 'close') {
    if (!settings.hidden) closeSettings();
    else if (shelf && !shelf.hidden) closeShelf();
    else location.href = '../counter/';
  }
});
document.getElementById('shelfBack').addEventListener('click', closeShelf);
try { paintAudio(); } catch (error) { /* audio settings still load on the next visit */ }
document.getElementById('settingsBack').addEventListener('click', closeSettings);
document.querySelectorAll('[data-cat]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-cat]').forEach(item => item.classList.toggle('primary', item === button));
  document.getElementById('audioPanel').hidden = button.dataset.cat !== 'audio';
  document.getElementById('accountPanel').hidden = button.dataset.cat !== 'account';
}));
musicVolume.addEventListener('input', () => {
  audio.settings.music = Number(musicVolume.value);
  audio.settings.musicMuted = audio.settings.music === 0;
  audio.saveSettings();
  paintAudio();
});
effectsVolume.addEventListener('input', () => {
  audio.settings.effects = Number(effectsVolume.value);
  audio.settings.effectsMuted = audio.settings.effects === 0;
  audio.saveSettings();
  paintAudio();
});
effectsVolume.addEventListener('change', () => audio.playEffect('clink'));
document.getElementById('musicOff').addEventListener('click', () => { audio.settings.musicMuted = true; audio.saveSettings(); paintAudio(); });
document.getElementById('musicOn').addEventListener('click', () => { audio.settings.musicMuted = false; audio.saveSettings(); paintAudio(); });
document.getElementById('effectsOff').addEventListener('click', () => { audio.settings.effectsMuted = true; audio.saveSettings(); paintAudio(); });
document.getElementById('effectsOn').addEventListener('click', () => { audio.settings.effectsMuted = false; audio.saveSettings(); paintAudio(); audio.playEffect('clink'); });
document.getElementById('playerNameInput').addEventListener('input', event => {
  audio.settings.name = event.target.value.trim() || 'Player';
  audio.saveSettings();
  paintFooter();
});
document.getElementById('confirmNo').addEventListener('click', () => { document.getElementById('confirm').hidden = true; });
document.getElementById('confirmYes').addEventListener('click', () => {
  localStorage.setItem('matchaVisualState', JSON.stringify({ coins: 120, satisfaction: 82, day: 1, minutes: 480, orderIndex: 0, served: 0 }));
  location.href = '../counter/';
});
window.openSettings = openSettings;
window.menuBoot = 'end';
} catch (error) { window.menuBoot = error.message; }
})();
