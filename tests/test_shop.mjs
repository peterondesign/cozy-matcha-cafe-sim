import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../shared/shop.js', import.meta.url), 'utf8');

function setup(saved) {
  const store = new Map(saved ? [['matchaShopState', JSON.stringify(saved)]] : []);
  const localStorage = {getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value)};
  const window = {dispatchEvent() {}};
  vm.runInNewContext(source, {localStorage, window, Event: class {}, console});
  return {shop: window.MatchaShop, store};
}

test('all café sizes and decoration combinations resolve to actual artwork', () => {
  const {shop} = setup();
  for (const size of shop.SIZES) {
    for (let mask = 0; mask < 8; mask++) {
      const active = ['s', 'l', 'g'].filter((_, bit) => mask & (1 << bit));
      const path = shop.asset(size.id, active);
      assert.equal(existsSync(new URL(path, new URL('../park/', import.meta.url))), true, path);
    }
  }
});

test('legacy purchases and selections map to new sizes and decoration groups', () => {
  const {shop} = setup({
    selected: 'kiosk', tier: 4, unlocked: ['cart', 'stall', 'pavilion', 'kiosk'],
    decor: ['seating', 'lantern', 'lights', 'planter']
  });
  const state = shop.read();
  assert.equal(state.selected, 'large');
  assert.deepEqual([...state.unlocked], ['small', 'medium', 'large']);
  assert.deepEqual([...state.decor].sort(), ['g', 'l', 's']);
  assert.deepEqual([...state.activeDecor].sort(), ['g', 'l', 's']);
});

test('selected decorations remain separate from unlocked decorations after saving', () => {
  const {shop, store} = setup({selected:'medium', unlocked:['small','medium'], decor:['s','g'], activeDecor:['g']});
  const state = shop.read();
  assert.deepEqual([...state.activeDecor], ['g']);
  assert.equal(shop.variant(state.activeDecor), 'g');
  state.activeDecor.push('s');
  shop.save(state);
  assert.equal(JSON.parse(store.get('matchaShopState')).activeDecor.length, 2);
  assert.equal(shop.variant(shop.read().activeDecor), 'sg');
});
