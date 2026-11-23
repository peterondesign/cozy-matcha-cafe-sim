import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=readFileSync(new URL('../shared/audio-bus.js',import.meta.url),'utf8');
function setup() {
  const values=new Map(), listeners=new Map(), documentListeners=new Map(), clips=[];
  class Audio {
    constructor(src='') { this.src=src;this.paused=true;this.events=new Map();clips.push(this); }
    addEventListener(name,fn) { this.events.set(name,fn); }
    play() { this.paused=false;this.events.get('play')?.();return Promise.resolve(); }
    pause() { this.paused=true;this.events.get('pause')?.(); }
  }
  const window={
    addEventListener(name,fn){listeners.set(name,fn);},
    dispatchEvent(event){listeners.get(event.type)?.(event);}
  };
  const localStorage={
    getItem:key=>values.get(key)??null,
    setItem:(key,value)=>values.set(key,value)
  };
  const document={
    currentScript:{src:'https://example.test/game/shared/audio-bus.js'},
    addEventListener(name,fn){documentListeners.set(name,fn);}
  };
  vm.runInNewContext(source,{window,document,localStorage,Audio,URL,Event,console});
  return {audio:window.MatchaAudio,clips,values,listeners,documentListeners};
}

test('music starts on interaction, mutes persistently and uses the site base path',()=>{
  const {audio,clips,values,documentListeners}=setup();
  documentListeners.get('keydown')({target:{closest:()=>null}});
  assert.equal(audio.isPlaying(),true);
  assert.equal(clips[0].src,'https://example.test/game/audio/Music%20Cafe.mp3');
  audio.settings.musicMuted=true;
  audio.saveSettings();
  assert.equal(audio.isPlaying(),false);
  assert.equal(JSON.parse(values.get('matchaSettings')).musicMuted,true);
  documentListeners.get('pointerdown')({target:{closest:()=>null}});
  assert.equal(audio.isPlaying(),false);
});

test('music-toggle gestures do not start playback before the button handles them',()=>{
  const {audio,documentListeners}=setup();
  documentListeners.get('pointerdown')({target:{closest:()=>({})}});
  assert.equal(audio.isPlaying(),false);
  audio.playMusic();
  assert.equal(audio.isPlaying(),true);
});
