import assert from 'node:assert/strict';
import {closeSync, openSync, readFileSync, readSync} from 'node:fs';
import test from 'node:test';
import {facingDirection, playerActionKey, resolveSprite, spriteFrame} from '../shared/sprite-actions.js';

const sheet = {file:'hana.png',columns:4,rows:4,frames:6,fps:10};

test('resolves individual characters and mirrors only declared views or walk left', () => {
  const manifest = {
    walk_right: {'02':sheet, '03':{...sheet,file:'mio.png'}},
    wave_right: {'02':sheet},
    wave_left: {'02':{mirrorOf:'wave_right'}}
  };
  assert.equal(resolveSprite(manifest,'walk_left','03').file,'mio.png');
  assert.equal(resolveSprite(manifest,'walk_left','03').flipX,true);
  assert.equal(resolveSprite(manifest,'wave_left','02').flipX,true);
  assert.equal(resolveSprite(manifest,'wave_left','03'),null);
  assert.equal(resolveSprite(manifest,'walk_right','01'),null);
  assert.throws(()=>resolveSprite({a:{'02':{mirrorOf:'b'}},b:{'02':{mirrorOf:'a'}}},'a','02'),/cycle/);
  assert.throws(()=>resolveSprite({a:{'02':{mirrorOf:'missing'}}},'a','02'),/source/);
});

test('validates frame layouts, anchors, and one-shot action playback', () => {
  const resolve = value => resolveSprite({sit_down_mat:{'02':value}},'sit_down_mat','02');
  assert.equal(resolve(sheet).sheet.playback,'once');
  assert.throws(()=>resolve({...sheet,frames:17}),/Invalid sprite sheet/);
  assert.throws(()=>resolve({...sheet,anchor:[1.1,0]}),/Invalid sprite sheet/);
  assert.throws(()=>resolve({...sheet,playback:'loop'}),/play once/);
  assert.throws(()=>resolve({...sheet,heightFraction:0}),/Invalid sprite sheet/);
  assert.equal(resolveSprite({seated_mat:{'02':sheet}},'seated_mat','02').sheet.playback,'hold');
});

test('one-shot actions hold their last frame while loops wrap and holds stay still', () => {
  const once = resolveSprite({wave_down:{'02':sheet}},'wave_down','02').sheet;
  assert.deepEqual([0,100,500,600,5000].map(t=>spriteFrame(once,t)),[0,1,5,5,5]);
  const loop = {...once,playback:'loop'};
  assert.deepEqual([0,500,600,700].map(t=>spriteFrame(loop,t)),[0,5,0,1]);
  assert.equal(spriteFrame({...once,playback:'hold'},5000),0);
  assert.throws(()=>spriteFrame(once,-1),RangeError);
});

test('selects scene-specific bench and mat actions and target-facing waves', () => {
  assert.equal(playerActionKey('sit-start-bench','bench-w','down'),'sit_down_bench_west');
  assert.equal(playerActionKey('sit-bench','bench-n','down'),'seated_bench_north');
  assert.equal(playerActionKey('up-bench','bench-e','down'),'stand_up_bench_east');
  assert.equal(playerActionKey('stretch-mat','bench-w','down'),'stretch_mat');
  assert.equal(playerActionKey('wave','bench-w',facingDirection(-8,2)),'wave_left');
  assert.equal(facingDirection(1,-8),'up');
  assert.equal(facingDirection(1,8),'down');
  assert.equal(playerActionKey('normal','bench-w','down'),null);
  assert.throws(()=>playerActionKey('sit-bench','missing','down'),/Unknown bench/);
});

test('new visitor sheets resolve with transparent, evenly divided frames', () => {
  const manifest=JSON.parse(readFileSync(new URL('../rigging-test/action-assets.json',import.meta.url),'utf8'));
  for(const character of ['01','03','04','05','06']){
    for(const action of ['walk_down','walk_up','walk_right']){
      const sprite=resolveSprite(manifest,action,character);
      assert.ok(sprite,`${character} ${action}`);
      const file=new URL(`../rigging-test/${sprite.file}`,import.meta.url);
      const fd=openSync(file,'r'),header=Buffer.alloc(26);
      try { assert.equal(readSync(fd,header,0,header.length,0),header.length); }
      finally { closeSync(fd); }
      assert.equal(header.readUInt32BE(16)%sprite.sheet.columns,0);
      assert.equal(header.readUInt32BE(20)%sprite.sheet.rows,0);
      assert.equal(header[25],6);
      assert.equal(sprite.sheet.frames,16);
    }
    assert.equal(resolveSprite(manifest,'walk_left',character).flipX,true);
  }
  const wave=resolveSprite(manifest,'wave_down','01');
  assert.equal(resolveSprite(manifest,'walk_up','06').file,'aya_walk_up_v2.png');
  assert.equal(wave.file,'sato_wave.png');
  assert.equal(spriteFrame(wave.sheet,10000),wave.sheet.frames-1);
  assert.equal(resolveSprite(manifest,'wave_up','01'),null);
});

test('barista supplies all walking directions and a one-shot wave', () => {
  const manifest=JSON.parse(readFileSync(new URL('../rigging-test/action-assets.json',import.meta.url),'utf8'));
  for(const action of ['walk_down','walk_up','walk_right','walk_left','wave_down']){
    const sprite=resolveSprite(manifest,action,'barista');
    assert.ok(sprite);
    const image=readFileSync(new URL(`../rigging-test/${sprite.file}`,import.meta.url));
    assert.deepEqual([image.readUInt32BE(16),image.readUInt32BE(20),image[25]],[3840,2160,6]);
    assert.equal(sprite.sheet.frames,16);
    if(action==='walk_left')assert.equal(sprite.flipX,true);
    if(action==='wave_down')assert.equal(sprite.sheet.playback,'once');
  }
});

test('park sprites have compact WebP sheets for every registered walking or player action', () => {
  const manifest=JSON.parse(readFileSync(new URL('../rigging-test/action-assets.json',import.meta.url),'utf8'));
  for(const [action,entries] of Object.entries(manifest)){
    for(const character of ['barista','01','02','03','04','05','06']){
      if(character!=='barista'&&!action.startsWith('walk_'))continue;
      if(!entries[character])continue;
      const sprite=resolveSprite(manifest,action,character);
      if(!sprite?.sheet)continue;
      const file=new URL(`../park/sprites/${sprite.file.replace(/\.png$/i,'.webp')}`,import.meta.url);
      const fd=openSync(file,'r'),header=Buffer.alloc(12);
      try { assert.equal(readSync(fd,header,0,header.length,0),header.length); }
      finally { closeSync(fd); }
      assert.equal(header.toString('ascii',0,4),'RIFF');
      assert.equal(header.toString('ascii',8,12),'WEBP');
    }
  }
});
