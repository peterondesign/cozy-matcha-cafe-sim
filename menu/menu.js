(() => { try {
import('../shared/asset-preloader.js?v=3').then(m => m.startAssetPreloading()).catch(error => console.error('Game preloader failed.', error));

const toast = document.getElementById('toast');
const audio = window.MatchaAudio;
const settings = document.getElementById('settings');
const mainMenu = document.getElementById('mainMenu');
const titleText = document.querySelector('.title-text');
const matcha = document.getElementById('matcha');
const musicVolume = document.getElementById('musicVolume');
const effectsVolume = document.getElementById('effectsVolume');

function paintFooter() {
  const state = MatchaPantry.load();
  document.getElementById('playerName').textContent = audio?.settings.name || 'Player';
  document.getElementById('levelValue').textContent = 'Level ' + Math.floor((Number(state.served) || 0) / 10);
  const avatar = `layers/avatars/avatar-${audio?.settings.avatar || 1}.png?v=2`;
  document.querySelector('.footer .avatar').src = avatar;
  const accountAvatar = document.getElementById('accountAvatar');
  if (accountAvatar) accountAvatar.src = avatar;
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
  paintAvatarGrid();
}
window.addEventListener('matcha-audio',()=>{
  musicVolume.value=audio.settings.music;
  musicVolume.style.setProperty('--fill',audio.settings.music+'%');
  document.getElementById('musicOff').classList.toggle('on',audio.settings.musicMuted);
  document.getElementById('musicOn').classList.toggle('on',!audio.settings.musicMuted);
});
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
  recipes: 'The book is open to Iced Matcha Latte.',
  leaderboard: 'Café service stats'
};
function restockLink() {
  let link = document.getElementById('restockLink');
  if (!link) {
    link = document.createElement('a');
    link.id = 'restockLink';
    link.className = 'restock';
    link.href = '../grocer/';
    link.innerHTML = '<img src="../park/goods/restock.png" alt="Restock">';
    document.getElementById('shelfBack').before(link);
  }
  return link;
}
function paintInventory() {
  const body = document.getElementById('shelfBody');
  const state = MatchaPantry.load();
  body.innerHTML = `<div class="stock-grid">${MatchaPantry.ITEMS.map(([id, name]) => {
    const qty = state.stock[id];
    const low = qty <= MatchaPantry.LOW;
    const percent = Math.min(100, Math.round(qty / MatchaPantry.FULL_STOCK * 100));
    return `<article class="stock-card"><img src="${MatchaPantry.icon(id)}" alt=""><div><b>${name}</b><small>${qty} in stock</small><div class="meter${low ? ' low' : ''}" role="progressbar" aria-label="${name} stock" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" aria-valuetext="${qty} in stock; full at ${MatchaPantry.FULL_STOCK}"><span style="width:${percent}%"></span></div></div></article>`;
  }).join('')}</div>`;
  restockLink().hidden = false;
}
function paintLeaderboard() {
  const body = document.getElementById('shelfBody');
  const state = MatchaWorld.clock.read();
  const served = Number(state.served || 0);
  const coinsGained = Number(state.coinsGained ?? state.coins ?? 120);
  const history = state.statsHistory || {};
  const now = Date.now();
  const servedAt = Array.isArray(history.servedAt) ? history.servedAt : [];

  const last24Hours = servedAt.filter(timestamp => now - Number(timestamp) <= 24 * 60 * 60 * 1000).length || Number(history.last24Hours ?? served);
  const last7Days = servedAt.filter(timestamp => now - Number(timestamp) <= 7 * 24 * 60 * 60 * 1000).length || Number(history.last7Days ?? served);

  // Sample leaderboard data - in production this would come from a backend
  const players24h = [
    { rank: 1, name: 'Matcha Master', served: Math.max(last24Hours, 42), avatar: 2 },
    { rank: 2, name: 'Café Champion', served: Math.max(last24Hours - 5, 37), avatar: 3 },
    { rank: 3, name: 'You', served: last24Hours, isYou: true, avatar: audio.settings.avatar },
    { rank: 4, name: 'Tea Lover', served: Math.max(last24Hours - 15, 27), avatar: 8 },
    { rank: 5, name: 'Barista Pro', served: Math.max(last24Hours - 20, 22), avatar: 10 }
  ].sort((a, b) => b.served - a.served).map((p, i) => ({ ...p, rank: i + 1 }));

  const players7d = [
    { rank: 1, name: 'Matcha Master', served: Math.max(last7Days, 280), avatar: 2 },
    { rank: 2, name: 'Café Champion', served: Math.max(last7Days - 30, 250), avatar: 3 },
    { rank: 3, name: 'You', served: last7Days, isYou: true, avatar: audio.settings.avatar },
    { rank: 4, name: 'Tea Lover', served: Math.max(last7Days - 80, 200), avatar: 8 },
    { rank: 5, name: 'Barista Pro', served: Math.max(last7Days - 100, 180), avatar: 10 }
  ].sort((a, b) => b.served - a.served).map((p, i) => ({ ...p, rank: i + 1 }));

  const renderTable = (players) => `
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th>Served</th>
          <th>Coins</th>
        </tr>
      </thead>
      <tbody>
        ${players.map(p => `
          <tr class="${p.isYou ? 'you' : ''}">
            <td>#${p.rank}</td>
            <td><span class="leaderboard-player"><img src="layers/avatars/avatar-${p.avatar}.png?v=2" alt="">${p.name}</span></td>
            <td>${p.served}</td>
            <td>${(p.served * 12).toLocaleString('en-US')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  body.innerHTML = `
    <p class="leaderboard-note">Other players are examples; online rankings are not connected.</p>
    <div class="leaderboard-tabs">
      <button class="active" data-tab="24h">Last 24 Hours</button>
      <button data-tab="7d">Last 7 Days</button>
    </div>
    <div data-tab-content="24h">${renderTable(players24h)}</div>
    <div data-tab-content="7d" hidden>${renderTable(players7d)}</div>
  `;

  // Add tab switching
  body.querySelectorAll('.leaderboard-tabs button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      body.querySelectorAll('.leaderboard-tabs button').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      body.querySelectorAll('[data-tab-content]').forEach(el => el.hidden = true);
      body.querySelector(`[data-tab-content="${e.target.dataset.tab}"]`).hidden = false;
    });
  });
}
function openShelf(action) {
  mainMenu.hidden = true;
  matcha.hidden = true;
  settings.hidden = true;
  shelf.hidden = false;
  titleText.textContent = action[0].toUpperCase() + action.slice(1);
  const text = document.getElementById('shelfText');
  const body = document.getElementById('shelfBody');
  text.hidden = action !== 'recipes';
  body.hidden = !['inventory', 'leaderboard', 'upgrades'].includes(action);
  if (action === 'inventory') paintInventory();
  else if (action === 'leaderboard') paintLeaderboard();
  else if (action === 'upgrades') paintUpgrades();
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
  if (action === 'upgrades') { openUpgradeShelf(); return; }
  if (shelves[action]) { openShelf(action); return; }
  if (action === 'resume') { location.href = MatchaWorld.resumeUrl(); return; }
  if (action === 'close') {
    if (!settings.hidden) closeSettings();
    else if (shelf && !shelf.hidden) closeShelf();
    else location.href = MatchaWorld.resumeUrl();
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
document.getElementById('syncExport').addEventListener('click', async () => {
  const words = ['matcha','garden','teapot','whisk','sakura','mochi','cafe','tiger','bamboo','clover','mint','lantern','meadow','cup','porch','blossom'];
  const payload = JSON.stringify({ s: audio.settings, v: MatchaWorld.clock.read(), b: readShopState() });
  const bytes = new TextEncoder().encode(payload);
  const code = 'MATCHA-' + Array.from(bytes).map(byte => words[byte >> 4] + '-' + words[byte & 15]).join('-');
  const status = document.getElementById('accountStatus');
  try {
    await navigator.clipboard.writeText(code);
    status.textContent = 'Progress code copied to clipboard.';
  } catch (error) {
    const input = document.getElementById('syncCode');
    input.hidden = false;
    input.value = code;
    input.select();
    status.textContent = 'Copy the selected progress code.';
  }
});
document.getElementById('syncImport').addEventListener('click', () => {
  const input = document.getElementById('syncCode');
  input.hidden = false;
  input.focus();
  if (!input.value.trim()) {
    document.getElementById('accountStatus').textContent = 'Paste a progress code, then press Enter.';
    return;
  }
  try {
    const words = ['matcha','garden','teapot','whisk','sakura','mochi','cafe','tiger','bamboo','clover','mint','lantern','meadow','cup','porch','blossom'];
    if (!input.value.trim().toUpperCase().startsWith('MATCHA-')) throw new Error('Invalid code');
    const parts = input.value.trim().slice(7).split('-');
    if (parts.length % 2) throw new Error('Invalid code');
    const bytes = [];
    for (let i = 0; i < parts.length; i += 2) {
      const high = words.indexOf(parts[i].toLowerCase());
      const low = words.indexOf(parts[i + 1].toLowerCase());
      if (high < 0 || low < 0) throw new Error('Invalid code');
      bytes.push((high << 4) | low);
    }
    const data = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes)));
    if (data.s) Object.assign(audio.settings, data.s);
    else if (data.settings) Object.assign(audio.settings, data.settings);
    audio.saveSettings();
    if (data.v) localStorage.setItem('matchaVisualState', JSON.stringify(data.v));
    else if (data.visual) localStorage.setItem('matchaVisualState', JSON.stringify(data.visual));
    if (data.b) saveShopState(data.b);
    else if (data.shop) saveShopState(data.shop);
    paintFooter();
    paintAudio();
    document.getElementById('accountStatus').textContent = 'Progress imported.';
  } catch (error) {
    document.getElementById('accountStatus').textContent = 'That progress code is not valid.';
  }
});
document.getElementById('syncCode').addEventListener('keydown', event => {
  if (event.key === 'Enter') document.getElementById('syncImport').click();
});
function paintAvatarGrid() {
  const grid = document.getElementById('avatarGrid');
  grid.innerHTML = Array.from({ length: 20 }, (_, i) => {
    const number = i + 1;
    return `<button class="avatar-choice${audio.settings.avatar === number ? ' selected' : ''}" type="button" data-avatar="${number}" aria-label="Avatar ${number}" aria-pressed="${audio.settings.avatar === number}">
      <img src="layers/avatars/avatar-${number}.png?v=2" alt="">
    </button>`;
  }).join('');
  grid.querySelectorAll('[data-avatar]').forEach(button => button.addEventListener('click', () => {
    audio.settings.avatar = Number(button.dataset.avatar);
    audio.saveSettings();
    grid.querySelectorAll('[data-avatar]').forEach(choice => {
      choice.classList.toggle('selected', choice === button);
      choice.setAttribute('aria-pressed', String(choice === button));
    });
    paintFooter();
  }));
}

const SHOP_KEY = MatchaShop.KEY;
const readShopState = MatchaShop.read;
const saveShopState = MatchaShop.save;
function openUpgradeShelf() {
  mainMenu.hidden = true;
  matcha.hidden = true;
  settings.hidden = true;
  shelf.hidden = false;
  titleText.textContent = 'Building';
  paintUpgrades();
}
function readBalance() {
  const state = MatchaWorld.clock.read();
  return Number(state.gems ?? 2000);
}
function spendGems(amount) {
  const state = MatchaWorld.clock.read();
  const balance = Number(state.gems ?? 2000);
  if (balance < amount) return false;
  state.gems = balance - amount;
  localStorage.setItem('matchaVisualState', JSON.stringify(state));
  window.dispatchEvent(new Event('storage'));
  return true;
}
function paintUpgrades(tab = 'shop') {
  const text = document.getElementById('shelfText');
  const body = document.getElementById('shelfBody');
  text.hidden = true;
  body.hidden = false;
  restockLink().hidden = true;
  const shop = readShopState();
  const structures = MatchaShop.SIZES;
  const decor = MatchaShop.DECOR;
  const items = tab === 'shop' ? structures : decor;
  body.innerHTML = `
    <span class="gem-note">✦ ${readBalance().toLocaleString('en-US')} gems</span>
    <div class="upgrade-tabs">
      <button type="button" class="${tab === 'shop' ? 'active' : ''}" data-upgrade-tab="shop">Buildings</button>
      <button type="button" class="${tab === 'decor' ? 'active' : ''}" data-upgrade-tab="decor">Decorations</button>
    </div>
    <div class="upgrade-grid">${items.map(item => {
      const unlocked = tab === 'shop' ? shop.unlocked.includes(item.id) : shop.decor.includes(item.id);
      const selected = tab === 'shop' ? shop.selected === item.id : shop.activeDecor.includes(item.id);
      const stateLabel = selected ? 'Selected' : unlocked ? 'Unlocked' : `✦ ${item.price}`;
      const previewSize = tab === 'shop' ? item.id : shop.selected;
      const previewDecor = tab === 'shop' ? shop.activeDecor :
        shop.activeDecor.includes(item.id) ? shop.activeDecor : [...shop.activeDecor, item.id];
      const preview = `<span class="upgrade-preview" data-size="${previewSize}"><img src="${MatchaShop.asset(previewSize, previewDecor)}" alt="${item.name} preview"></span>`;
      return `<button class="upgrade-card${unlocked ? '' : ' locked'}${selected ? ' selected' : ''}" type="button" data-buy="${tab}:${item.id}" data-price="${item.price}" aria-pressed="${selected}">
        <span class="state">${stateLabel}</span>
        ${preview}
        <span class="upgrade-name">${item.name}</span>
        <span class="upgrade-meta">${tab === 'shop' ? 'Café size' : 'Tap to toggle'}</span>
      </button>`;
    }).join('')}</div>`;
  body.querySelectorAll('[data-upgrade-tab]').forEach(button => button.addEventListener('click', () => paintUpgrades(button.dataset.upgradeTab)));
  body.querySelectorAll('[data-buy]').forEach(button => button.addEventListener('click', () => {
    const [kind, id] = button.dataset.buy.split(':');
    const price = Number(button.dataset.price);
    const state = readShopState();
    if (kind === 'shop') {
      if (!state.unlocked.includes(id)) {
        const previousIndex = structures.findIndex(item => item.id === id) - 1;
        const previous = structures[previousIndex];
        if (!previous || !state.unlocked.includes(previous.id)) {
          notify('Unlock the previous shop tier first.');
          return;
        }
        if (!spendGems(price)) { notify('Not enough gems.'); return; }
        state.unlocked.push(id);
      }
      state.selected = id;
      saveShopState(state);
      notify(`${structures.find(item => item.id === id).name} selected`);
      paintUpgrades('shop');
      return;
    }
    if (!state.decor.includes(id)) {
      if (!spendGems(price)) { notify('Not enough gems.'); return; }
      state.decor.push(id);
      state.activeDecor.push(id);
      notify('Decoration unlocked and selected');
    } else {
      const active = state.activeDecor.includes(id);
      state.activeDecor = active ? state.activeDecor.filter(item => item !== id) : [...state.activeDecor, id];
      notify(active ? 'Decoration removed' : 'Decoration selected');
    }
    saveShopState(state);
    paintUpgrades('decor');
  }));
}
document.getElementById('confirmNo').addEventListener('click', () => { document.getElementById('confirm').hidden = true; });
document.getElementById('confirmYes').addEventListener('click', () => {
  MatchaWorld.reset();
  localStorage.setItem('matchaVisualState', JSON.stringify({ coins: 120, gems: 2000, day: 1, minutes: 480, orderIndex: 0, served: 0 }));
  location.href = '../counter/';
});
window.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.repeat) return;
  event.preventDefault();
  if (!document.getElementById('confirm').hidden) document.getElementById('confirm').hidden = true;
  else if (!settings.hidden) closeSettings();
  else if (!shelf.hidden) closeShelf();
  else location.href = MatchaWorld.resumeUrl();
}, true);
window.openSettings = openSettings;
window.menuBoot = 'end';
} catch (error) { window.menuBoot = error.message; }
})();
