const worldHudUrl = document.currentScript?.src;
const worldRoot = new URL('../', worldHudUrl || location.href);
const worldPages = ['counter/', 'park/', 'park/grocer.html', 'park/shelf-access.html', 'garden/'];
const resumeKey = 'matcha-resume-location';
const worldPaths = worldPages.flatMap(path => {
  const pathname = new URL(path, worldRoot).pathname;
  return pathname.endsWith('/') ? [pathname, pathname + 'index.html'] : [pathname];
});
const clockKey = 'matchaVisualState';
const clockRunning = worldPaths.includes(location.pathname);
let clockActive = clockRunning;
let clockLast = Date.now();
function readClockState() {
  const state = JSON.parse(localStorage.getItem(clockKey) || '{}') || {};
  if ('satisfaction' in state) {
    if (state.gems == null) state.gems = state.satisfaction;
    delete state.satisfaction;
    localStorage.setItem(clockKey, JSON.stringify(state));
  }
  if (state.gems == null) {
    state.gems = 2000;
    localStorage.setItem(clockKey, JSON.stringify(state));
  }
  return state;
}
function advanceWorldClock(extraMinutes = 0) {
  const now = Date.now();
  const state = readClockState();
  const elapsed = clockActive ? Math.max(0, now - clockLast) : 0;
  clockLast = now;
  const milliseconds = (state.clockRemainderMs ?? 0) + elapsed;
  const wholeMinutes = Math.floor(milliseconds / 1000) + extraMinutes;
  state.clockRemainderMs = milliseconds % 1000;
  const total = (state.minutes ?? 480) + wholeMinutes;
  state.minutes = total % 1440;
  state.day = (state.day ?? 1) + Math.floor(total / 1440);
  localStorage.setItem(clockKey, JSON.stringify(state));
  if (wholeMinutes) window.dispatchEvent(new Event('matcha-clock'));
  return state;
}
function stopWorldClock() {
  if (!clockActive) return;
  advanceWorldClock();
  clockActive = false;
}
function resumeWorldClock() {
  const state = readClockState();
  if (Number.isFinite(state.clockPausedAt)) {
    state.gardenPausedMs = (state.gardenPausedMs ?? 0) + Math.max(0, Date.now() - state.clockPausedAt);
    delete state.clockPausedAt;
    localStorage.setItem(clockKey, JSON.stringify(state));
  }
  clockLast = Date.now();
  clockActive = true;
}
if (clockRunning) {
  resumeWorldClock();
  setInterval(() => { if (clockActive) advanceWorldClock(); }, 1000);
  window.addEventListener('pagehide', stopWorldClock);
  window.addEventListener('pageshow', () => {
    if (!clockActive) resumeWorldClock();
  });
}
window.MatchaWorld = {
  clock: {
    read: readClockState,
    advance: advanceWorldClock,
    gardenNow: () => Date.now() - (readClockState().gardenPausedMs ?? 0)
  },
  resumeUrl() {
    const saved = localStorage.getItem(resumeKey);
    if (saved) {
      try {
        const url = new URL(saved, worldRoot);
        if (url.origin === worldRoot.origin && worldPaths.includes(url.pathname)) return url.href;
      } catch (error) {
        console.warn('Saved game location could not be read.', error);
      }
    }
    return new URL('counter/', worldRoot).href;
  },
  reset() {
    localStorage.removeItem(resumeKey);
    localStorage.removeItem('matcha-park-pause-position');
    localStorage.removeItem('matcha-grocer-pause-position');
    localStorage.removeItem('matcha-shelf-pause-position');
    localStorage.removeItem('matcha-garden-player-position');
  }
};

class MatchaHud extends HTMLElement {
  connectedCallback() {
    const scriptUrl = worldHudUrl || this.getAttribute('script-url') || location.href;
    const root = new URL('../counter/ui/', scriptUrl);
    const fields = [['coin','coins','coinCount'],['gem','satisfaction','gemCount'],['day','day','dayCount'],['time','time','timeCount']];
    this.className='top-hud';
    const labels={coin:'Coins',gem:'Gems',day:'Day',time:'Time'};
    this.innerHTML=fields.map(([type,icon,id])=>`<div class="pill ${type}" title="${labels[type]}"><img alt="${labels[type]}" src="${new URL(icon+'.png',root)}"><b id="${id}"></b></div>`).join('');
    this.refresh();
    const isWorld = worldPaths.includes(location.pathname);
    if (isWorld) {
      const rememberLocation = () => localStorage.setItem(resumeKey, location.pathname + location.search + location.hash);
      rememberLocation();
      const menu = document.createElement('a');
      menu.className = 'hud-menu';
      menu.href = new URL('menu/', worldRoot).href;
      menu.setAttribute('aria-label', 'Open menu');
      menu.title = 'Open menu (Esc)';
      menu.innerHTML = '<span aria-hidden="true">☰</span>';
      this.append(menu);
      const pause = event => {
        event.preventDefault();
        rememberLocation();
        stopWorldClock();
        const state = readClockState();
        state.clockPausedAt = Date.now();
        localStorage.setItem(clockKey, JSON.stringify(state));
        window.dispatchEvent(new Event('matcha-pause'));
        location.href = menu.href;
      };
      menu.addEventListener('click', pause);
      this.onEscape = event => {
        if (event.key !== 'Escape' || event.repeat || event.defaultPrevented ||
            event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
        const dialog = document.querySelector('dialog[open]');
        if (dialog) {
          event.preventDefault();
          dialog.close();
          return;
        }
        pause(event);
      };
      window.addEventListener('keydown', this.onEscape, true);
      this.rememberLocation = rememberLocation;
      window.addEventListener('pageshow', rememberLocation);
    }
    if (window.MatchaAudio) {
      const music=document.createElement('button');
      music.type='button';
      music.className='hud-music';
      music.dataset.musicToggle='';
      this.updateMusic=()=>{
        const audio=window.MatchaAudio;
        const muted=audio.settings.musicMuted || audio.settings.music===0;
        const label=muted?'Turn music on':typeof audio.isPlaying==='function' && !audio.isPlaying()?'Play music':'Mute music';
        music.textContent=muted?'♪̸':'♪';
        music.setAttribute('aria-label',label);
        music.setAttribute('aria-pressed',String(!muted));
        music.title=label;
      };
      music.addEventListener('click',()=>{
        const audio=window.MatchaAudio;
        if(audio.settings.musicMuted || audio.settings.music===0) {
          audio.settings.musicMuted=false;
          if(audio.settings.music===0) audio.settings.music=70;
          audio.saveSettings();
        } else if(typeof audio.isPlaying==='function' && !audio.isPlaying()) audio.playMusic();
        else { audio.settings.musicMuted=true; audio.saveSettings(); }
      });
      this.append(music);
      this.updateMusic();
      window.addEventListener('matcha-audio',this.updateMusic);
    }
    this.refresh();
    this.update=()=>this.refresh();
    window.addEventListener('pageshow',this.update);
    window.addEventListener('storage',this.update);
    window.addEventListener('matcha-stock',this.update);
    window.addEventListener('matcha-clock',this.update);
  }
  disconnectedCallback(){window.removeEventListener('pageshow',this.update);window.removeEventListener('storage',this.update);window.removeEventListener('matcha-stock',this.update);window.removeEventListener('matcha-clock',this.update);window.removeEventListener('matcha-audio',this.updateMusic);window.removeEventListener('keydown',this.onEscape,true);window.removeEventListener('pageshow',this.rememberLocation)}
  refresh(){
    const s=readClockState(),m=s.minutes??480,h=Math.floor(m/60)%24;
    const values=[(s.coins??120).toLocaleString('en-US'),(s.gems??0).toLocaleString('en-US'),s.day??1,(h%12||12)+':'+String(m%60).padStart(2,'0')+' '+(h>=12?'PM':'AM')];
    this.querySelectorAll('b').forEach((b,i)=>b.textContent=values[i]);
  }
}
customElements.define('matcha-hud',MatchaHud);
