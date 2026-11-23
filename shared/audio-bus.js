const SETTINGS_KEY = 'matchaSettings';
const AUDIO_ROOT = new URL('../audio/', document.currentScript.src);
const MUSIC = [
  'Music Cafe.mp3',
  'Music Cafe 2.mp3',
  'Music Cafe 3.mp3',
  'park-ambience-v01.mp3'
].map(file => new URL(file,AUDIO_ROOT).href);
const EFFECTS = {
  whisk: new URL('matcha-whisk-foley-v01.mp3',AUDIO_ROOT).href,
  ice: new URL('sift.mp3',AUDIO_ROOT).href,
  milk: new URL('pour.mp3',AUDIO_ROOT).href,
  finish: new URL('clink.mp3',AUDIO_ROOT).href,
  serve: new URL('whisk.mp3',AUDIO_ROOT).href
};

function loadSettings() {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  return {
    music: Number(saved.music ?? 70),
    effects: Number(saved.effects ?? 80),
    musicMuted: Boolean(saved.musicMuted),
    effectsMuted: Boolean(saved.effectsMuted),
    name: saved.name || 'Player',
    avatar: Number(saved.avatar || 1)
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
  window.dispatchEvent(new Event('matcha-audio'));
}
function playMusic() {
  if (musicVolume() === 0 || !music.paused) return;
  if (!music.src) {
    music.src = MUSIC[track];
    music.addEventListener('ended', () => {
      track = (track + 1) % MUSIC.length;
      music.src = MUSIC[track];
      playMusic();
    });
  }
  music.volume = musicVolume();
  music.play().catch(error => {
    if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') console.error('Music could not play.',error);
    window.dispatchEvent(new Event('matcha-audio'));
  });
}
function playEffect(name) {
  const src = EFFECTS[name];
  if (!src || effectsVolume() === 0) return;
  const clip = new Audio(src);
  clip.volume = effectsVolume();
  clip.play().catch(error => {
    if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') console.error('Sound effect could not play.',error);
  });
}

music.addEventListener('play',()=>window.dispatchEvent(new Event('matcha-audio')));
music.addEventListener('pause',()=>window.dispatchEvent(new Event('matcha-audio')));
window.addEventListener('storage',event=>{
  if(event.key===SETTINGS_KEY) {
    Object.assign(settings,loadSettings());
    music.volume=musicVolume();
    if(music.volume===0) music.pause();
    else if(music.paused) playMusic();
    window.dispatchEvent(new Event('matcha-audio'));
  }
});
window.MatchaAudio = { settings, saveSettings, playMusic, playEffect, isPlaying:()=>!music.paused, EFFECTS, MUSIC };
function startOnGesture(event) {
  if(!event.target.closest?.('[data-music-toggle]')) playMusic();
}
document.addEventListener('pointerdown',startOnGesture);
document.addEventListener('keydown',startOnGesture);
