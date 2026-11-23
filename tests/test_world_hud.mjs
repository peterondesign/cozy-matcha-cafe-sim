import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../shared/world-hud.js', import.meta.url), 'utf8');

function setup(path = '/game/park/') {
  const values = new Map();
  const listeners = new Map();
  let now = 0, timer;
  const location = new URL(path, 'https://example.test');
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
  class Element {
    constructor() { this.children = []; this.dataset = {}; }
    append(child) { this.children.push(child); }
    setAttribute() {}
    addEventListener(type, handler) { this[type] = handler; }
    querySelectorAll() { return []; }
  }
  const window = {
    addEventListener(type, fn) {
      const previous = listeners.get(type);
      listeners.set(type, previous ? (...args) => { previous(...args); fn(...args); } : fn);
    },
    removeEventListener() {},
    dispatchEvent(event) { this.lastEvent = event.type; listeners.get(event.type)?.(event); }
  };
  let Hud;
  const document = {
    currentScript: {src: 'https://example.test/game/shared/world-hud.js'},
    createElement: () => new Element(),
    querySelector: () => null
  };
  vm.runInNewContext(source, {
    document, window, location, localStorage: storage, URL, Event, console,
    Date: {now: () => now}, setInterval: fn => { timer = fn; },
    HTMLElement: Element,
    customElements: {define(name, constructor) { Hud = constructor; }}
  });
  return {window, storage, location, listeners, Hud, document, elapse(ms) { now += ms; timer?.(); }};
}

test('shared clock advances in game, rolls over at midnight and stops while paused', () => {
  const {storage, listeners, elapse} = setup();
  storage.setItem('matchaVisualState', JSON.stringify({minutes:1439,day:4,coins:99}));
  elapse(2500);
  let state=JSON.parse(storage.getItem('matchaVisualState'));
  assert.equal(state.minutes,1);
  assert.equal(state.day,5);
  assert.equal(state.coins,99);
  listeners.get('pagehide')();
  elapse(9000);
  state=JSON.parse(storage.getItem('matchaVisualState'));
  assert.equal(state.minutes,1);
  listeners.get('pageshow')();
  elapse(500);
  assert.equal(JSON.parse(storage.getItem('matchaVisualState')).minutes,2);
  const menu=setup('/game/menu/');
  menu.elapse(5000);
  assert.equal(menu.storage.getItem('matchaVisualState'),null);
});

test('garden time excludes time spent in the pause menu', () => {
  const {window, listeners, Hud, elapse} = setup('/game/garden/');
  const hud = new Hud();
  hud.connectedCallback();
  elapse(1000);
  const before = window.MatchaWorld.clock.gardenNow();
  hud.children[0].click({preventDefault() {}});
  elapse(10000);
  listeners.get('pageshow')();
  assert.equal(window.MatchaWorld.clock.gardenNow(),before);
  elapse(2000);
  assert.equal(window.MatchaWorld.clock.gardenNow(),before+2000);
});

test('resume preserves valid game routes and rejects external or unrelated routes', () => {
  const {window, storage} = setup();
  assert.equal(window.MatchaWorld.resumeUrl(), 'https://example.test/game/counter/');
  storage.setItem('matcha-resume-location', '/game/garden/?dev=1');
  assert.equal(window.MatchaWorld.resumeUrl(), 'https://example.test/game/garden/?dev=1');
  storage.setItem('matcha-resume-location', 'https://other.test/game/park/');
  assert.equal(window.MatchaWorld.resumeUrl(), 'https://example.test/game/counter/');
  storage.setItem('matcha-resume-location', '/game/menu/');
  assert.equal(window.MatchaWorld.resumeUrl(), 'https://example.test/game/counter/');
});

test('legacy satisfaction becomes gems without overwriting an existing balance', () => {
  const {window, storage} = setup();
  storage.setItem('matchaVisualState', JSON.stringify({satisfaction:82,coins:99}));
  assert.equal(window.MatchaWorld.clock.read().gems,82);
  assert.deepEqual(JSON.parse(storage.getItem('matchaVisualState')),{gems:82,coins:99});
  storage.setItem('matchaVisualState', JSON.stringify({satisfaction:60,gems:150}));
  assert.equal(window.MatchaWorld.clock.read().gems,150);
  assert.deepEqual(JSON.parse(storage.getItem('matchaVisualState')),{gems:150});
});

test('world HUD opens menu on Escape and remembers the active location', () => {
  const {window, storage, location, listeners, Hud} = setup('/game/park/?mode=test');
  const hud = new Hud();
  hud.connectedCallback();
  assert.equal(hud.children[0].className, 'hud-menu');
  assert.equal(storage.getItem('matcha-resume-location'), '/game/park/?mode=test');
  let prevented = false;
  listeners.get('keydown')({
    key: 'Escape', target: {closest: () => null},
    preventDefault() { prevented = true; }
  });
  assert.equal(prevented, true);
  assert.equal(window.lastEvent, 'matcha-pause');
  assert.equal(location.href, 'https://example.test/game/menu/');
});

test('Escape closes an open dialog before opening the menu', () => {
  const {window, listeners, Hud, document} = setup();
  new Hud().connectedCallback();
  let closed = false;
  document.querySelector = () => ({close() { closed = true; }});
  listeners.get('keydown')({
    key: 'Escape', target: {closest: () => null},
    preventDefault() {}
  });
  assert.equal(closed, true);
  assert.equal(window.lastEvent, undefined);
});

test('HUD paints stats even if an older cached audio bus lacks playback state', () => {
  const {window,Hud}=setup('/game/garden/');
  window.MatchaAudio={settings:{musicMuted:false,music:70},saveSettings(){},playMusic(){}};
  const hud=new Hud();
  let paints=0;
  hud.refresh=()=>paints++;
  hud.connectedCallback();
  assert.ok(paints>0);
  assert.equal(hud.children[1].className,'hud-music');
  assert.equal(hud.children[1].textContent,'♪');
});
