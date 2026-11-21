const SETTINGS_KEY = 'matchaSettings';
const MUSIC = [
  '/audio/Music%20Cafe.mp3',
  '/audio/Music%20Cafe%202.mp3',
  '/audio/Music%20Cafe%203.mp3',
  '/audio/park-ambience-v01.mp3'
];
const EFFECTS = {
  whisk: '/audio/matcha-whisk-foley-v01.mp3',
  ice: '/audio/sift.mp3',
  milk: '/audio/pour.mp3',
  finish: '/audio/clink.mp3',
  serve: '/audio/whisk.mp3'
};

function loadSettings() {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  return {
    music: Number(saved.music ?? 70),
    effects: Number(saved.effects ?? 80),
    musicMuted: Boolean(saved.musicMuted),
    effectsMuted: Boolean(saved.effectsMuted),
    name: saved.name || 'Player'
  };
}

const settings = loadSettings();
const music = new Audio();
music.loop = false;
let track = 0;

function musicVolume() {
  return settings.musicMuted ? 0 : settings.music / 100;
}
function effectsVolume() {
  return settings.effectsMuted ? 0 : settings.effects / 100;
}
function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  music.volume = musicVolume();
  if (music.volume === 0) music.pause();
  else if (music.paused) playMusic();
}
function playMusic() {
  if (musicVolume() === 0) return;
  if (!music.src) {
    music.src = MUSIC[track];
    music.addEventListener('ended', () => {
      track = (track + 1) % MUSIC.length;
      music.src = MUSIC[track];
      music.play().catch(() => {});
    });
  }
  music.volume = musicVolume();
  music.play().catch(() => {});
}
function playEffect(name) {
  const src = EFFECTS[name];
  if (!src || effectsVolume() === 0) return;
  const clip = new Audio(src);
  clip.volume = effectsVolume();
  clip.play().catch(() => {});
}

window.MatchaAudio = { settings, saveSettings, playMusic, playEffect, EFFECTS, MUSIC };
document.addEventListener('pointerdown', () => playMusic(), { once: true });
