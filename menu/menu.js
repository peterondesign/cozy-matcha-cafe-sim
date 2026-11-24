(() => { try {
import('../shared/asset-preloader.js?v=3').then(m => m.startAssetPreloading()).catch(error => console.error('Game preloader failed.', error));
import('./recipes.js?v=2').then(m => window.MatchaRecipes = m).catch(error => console.error('Recipe module failed.', error));

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
  recipes: 'Browse all our delicious matcha drinks and their recipes.',
  leaderboard: 'Café service stats'
};
function restockLink() {
  let link = document.getElementById('restockLink');
  if (!link) {
    link = document.createElement('a');
    link.id = 'restockLink';
    link.className = 'row primary restock';
    link.href = '../grocer/';
    link.innerHTML = '<span>Restock</span>';
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
function currentStats() {
  const state = MatchaWorld.clock.read();
  return {
    player_id: window.MatchaLeaderboard?.playerId(),
    display_name: audio.settings.name || 'Player',
    avatar: audio.settings.avatar,
    day: state.day ?? 1,
    served: Number(state.served || 0),
    coins: Number(state.coinsGained ?? state.coins ?? 120),
    gems: state.gems ?? 0
  };
}
function paintLeaderboard() {
  const body = document.getElementById('shelfBody');
  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const you = { ...currentStats(), isYou: true };

  const renderTable = (players) => `
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th>Day</th>
          <th>Served</th>
          <th>Coins</th>
        </tr>
      </thead>
      <tbody>
        ${players.map((p, i) => `
          <tr class="${p.isYou ? 'you' : ''}">
            <td>#${i + 1}</td>
            <td><span class="leaderboard-player"><img src="layers/avatars/avatar-${Number(p.avatar) || 1}.png?v=2" alt="">${escapeHtml(p.display_name)}</span></td>
            <td>${Number(p.day) || 1}</td>
            <td>${Number(p.served) || 0}</td>
            <td>${(Number(p.coins) || 0).toLocaleString('en-US')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const showYou = (note) => {
    body.innerHTML = `<p class="leaderboard-note">${note}</p>${renderTable([you])}`;
  };

  if (!window.MatchaLeaderboard?.enabled()) {
    showYou('Local only. Add shared/supabase-config.js to see other players.');
    return;
  }

  body.innerHTML = '<p class="leaderboard-note">Loading rankings…</p>';
  (async () => {
    try {
      await MatchaLeaderboard.push(you);
      const rows = (await MatchaLeaderboard.top()) || [];
      const others = rows.filter(row => row.player_id !== you.player_id);
      const ranked = [...others, you].sort((a, b) => (Number(b.served) || 0) - (Number(a.served) || 0));
      body.innerHTML = `<p class="leaderboard-note">Live rankings, all players.</p>${renderTable(ranked)}`;
    } catch (error) {
      showYou('Could not reach the leaderboard. Showing your stats only.');
    }
  })();
}

function paintRecipes(detailId = null) {
  const body = document.getElementById('shelfBody');
  
  if (!window.MatchaRecipes || !window.MatchaRecipes.RECIPES) {
    body.innerHTML = '<p style="text-align: center; color: #7d684c;">Recipe module loading...</p>';
    return;
  }

  if (detailId) {
    const recipe = window.MatchaRecipes.getRecipe(detailId);
    if (!recipe) return;
    
    body.innerHTML = `
      <div class="recipe-detail">
        <button class="recipe-back-button" data-action="recipes-back">← Back to Recipes</button>
        
        <div class="recipe-detail-header">
          <div class="recipe-detail-image">
            <img src="${recipe.image}" alt="${recipe.name}" loading="lazy">
          </div>
          <div class="recipe-detail-info">
            <h2 class="recipe-detail-title">${recipe.name}</h2>
            <p class="recipe-detail-description">${recipe.description}</p>
            ${recipe.core ? '<span style="font-weight: 700; color: #6f853a;">✓ Core Recipe</span>' : ''}
          </div>
        </div>

        <section class="recipe-ingredients-section">
          <h3 class="recipe-section-title">Ingredients</h3>
          <ul class="recipe-ingredients-list">
            ${recipe.ingredients.map(ing => `
              <li class="recipe-ingredient">
                <div class="recipe-ingredient-icon">
                  <img src="${ing.icon}" alt="${ing.item}" loading="lazy">
                </div>
                <div class="recipe-ingredient-name">${ing.item}</div>
                ${ing.quantity ? `<div class="recipe-ingredient-quantity">${ing.quantity}${ing.unit ? ' ' + ing.unit : ''}</div>` : ''}
              </li>
            `).join('')}
          </ul>
        </section>

        <section class="recipe-steps-section">
          <h3 class="recipe-section-title" style="--section-emoji: '👩‍🍳';">Steps</h3>
          <ol class="recipe-steps-list">
            ${recipe.steps.map(step => `
              <li class="recipe-step">
                <div class="recipe-step-icon">
                  <img src="${step.icon}" alt="Step ${step.number}" loading="lazy">
                </div>
                <div class="recipe-step-content">
                  <p class="recipe-step-action"><strong>Step ${step.number}:</strong> ${step.action}</p>
                </div>
              </li>
            `).join('')}
          </ol>
        </section>
      </div>
    `;
    
    body.querySelector('[data-action="recipes-back"]').addEventListener('click', () => paintRecipes());
    return;
  }

  body.innerHTML = `
    <div class="recipe-grid">
      ${window.MatchaRecipes.RECIPES.map(recipe => `
        <button class="recipe-card" data-recipe-id="${recipe.id}">
          <img src="${recipe.image}" alt="${recipe.name}" loading="lazy">
          <div class="recipe-card-name">${recipe.name}</div>
          ${recipe.core ? '<div class="recipe-card-tag">Core</div>' : ''}
        </button>
      `).join('')}
    </div>
  `;

  body.querySelectorAll('.recipe-card').forEach(card => {
    card.addEventListener('click', () => paintRecipes(card.dataset.recipeId));
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
  body.hidden = !['inventory', 'leaderboard', 'upgrades', 'recipes'].includes(action);
  if (action === 'inventory') paintInventory();
  else if (action === 'leaderboard') paintLeaderboard();
  else if (action === 'recipes') paintRecipes();
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
  if (button.dataset.cat === 'account') syncNow();
}));
function setSyncStatus(text, tone = '') {
  const status = document.getElementById('syncStatus');
  status.textContent = text;
  status.className = `sync-status ${tone}`.trim();
}
async function syncNow() {
  document.getElementById('syncCode').value = MatchaLeaderboard.playerId();
  if (!MatchaLeaderboard.enabled()) {
    setSyncStatus('Offline: progress is saved on this device only.', 'warn');
    return;
  }
  setSyncStatus('Saving…');
  try {
    const ok = await MatchaLeaderboard.push(currentStats());
    setSyncStatus(ok ? 'Synced: progress is saved to the cloud.' : 'Could not save. Progress stays on this device.', ok ? 'ok' : 'warn');
  } catch (error) {
    setSyncStatus('Could not reach the cloud. Progress stays on this device.', 'warn');
  }
}
document.getElementById('syncCopy').addEventListener('click', async () => {
  const code = document.getElementById('syncCode').value;
  try {
    await navigator.clipboard.writeText(code);
    setSyncStatus('Code copied. Paste it on your other device.', 'ok');
  } catch (error) {
    document.getElementById('syncCode').select();
    setSyncStatus('Select the code and copy it manually.', 'warn');
  }
});
document.getElementById('syncLoad').addEventListener('click', async () => {
  const code = document.getElementById('syncInput').value.trim();
  if (!/^[A-Za-z0-9-]{6,64}$/.test(code)) {
    setSyncStatus('That code does not look right.', 'warn');
    return;
  }
  setSyncStatus('Loading…');
  try {
    const row = await MatchaLeaderboard.pull(code);
    if (!row) {
      setSyncStatus('No save found for that code.', 'warn');
      return;
    }
    MatchaLeaderboard.setPlayerId(code);
    audio.settings.name = row.display_name || 'Player';
    audio.settings.avatar = Number(row.avatar) || 1;
    audio.saveSettings();
    localStorage.setItem('matchaVisualState', JSON.stringify({
      ...MatchaWorld.clock.read(), coins: row.coins, coinsGained: row.coins, gems: row.gems, day: row.day, served: row.served
    }));
    location.reload();
  } catch (error) {
    setSyncStatus('Could not load that code. Check your connection.', 'warn');
  }
});
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
  return Number(state.gems ?? 0);
}
function spendGems(amount) {
  const state = MatchaWorld.clock.read();
  const balance = Number(state.gems ?? 0);
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
  localStorage.removeItem(MatchaShop.KEY);
  localStorage.setItem('matchaVisualState', JSON.stringify({ coins: 120, gems: 0, day: 1, minutes: 480, orderIndex: 0, served: 0 }));
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
