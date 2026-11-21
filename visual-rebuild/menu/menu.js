const toast = document.getElementById('toast');
const audio = window.MatchaAudio;
const settings = document.getElementById('settings');
const mainMenu = document.getElementById('mainMenu');
const titleText = document.querySelector('.title-text');
const matcha = document.getElementById('matcha');
const musicVolume = document.getElementById('musicVolume');
const effectsVolume = document.getElementById('effectsVolume');

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

paintAudio();
document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
  const action = button.dataset.action;
  const label = button.getAttribute('aria-label') || button.textContent.trim();
  if (action === 'settings') { openSettings(); return; }
  if (settings.hidden && (action === 'resume' || action === 'close')) { location.href = '../counter/'; return; }
  if (!settings.hidden && action === 'close') { closeSettings(); return; }
  if (action === 'new') { document.getElementById('confirm').hidden = false; return; }
  notify(label + ' selected');
}));
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
  document.getElementById('playerName').textContent = audio.settings.name;
});
document.getElementById('confirmNo').addEventListener('click', () => { document.getElementById('confirm').hidden = true; });
document.getElementById('confirmYes').addEventListener('click', () => {
  localStorage.setItem('matchaVisualState', JSON.stringify({ coins: 120, satisfaction: 82, day: 1, minutes: 480, orderIndex: 0, served: 0 }));
  location.href = '../counter/';
});
