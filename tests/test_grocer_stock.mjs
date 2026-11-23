import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../park/market/world.js', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context);

test('expanded shelves retain paused basket indices and have eight goods per row', () => {
  const sections = [
    ['Tea', -1, 4, ['matcha', 'tea', 'syrup', 'vanilla']],
    ['Fruit', 1, -3.2, ['berries', 'peach', 'mango']]
  ];
  const stock = context.marketShelfStock(sections);
  const oldIds = sections.flatMap(([, , , ids]) =>
    Array.from({ length: 6 }, (_, col) =>
      Array.from({ length: 3 }, (_, row) => ids[(col + row * 2) % ids.length])
    ).flat()
  );
  assert.deepEqual(Array.from(stock.slice(0, oldIds.length), unit => unit[0]), oldIds);
  assert.equal(stock.length, sections.length * 8 * 3);
  for (const [, side, z] of sections) {
    for (let row = 0; row < 3; row++) {
      const units = stock.filter(unit =>
        unit[4] === side && Math.abs(unit[2] - (.272 + row * .67)) < 1e-6 &&
        Math.abs(unit[3] - z) < 1.6
      );
      assert.equal(units.length, 8);
      assert.equal(new Set(units.map(unit => unit[3])).size, 8);
    }
  }
});
