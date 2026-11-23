import assert from 'node:assert/strict';
import test from 'node:test';
import {CELL_REGISTRY,cellAt,isWalkableCell,routeCells} from '../park/scene-map.js';

test('park cells register movement surfaces, anchors, exits, and colliders',()=>{
  assert.equal(CELL_REGISTRY.entrance.type,'entrance');
  assert.equal(CELL_REGISTRY['north-exit'].type,'exit');
  assert.equal(CELL_REGISTRY['gate-path'].type,'gate');
  assert.equal(CELL_REGISTRY['bench-west'].type,'benchAnchor');
  assert.equal(cellAt(1040,640).type,'mat');
  assert.equal(cellAt(1074,512).type,'blocked');
  assert.equal(cellAt(1760,295).id,'blocked-ne-hedge');
  assert.equal(cellAt(1725,1055).id,'blocked-se-hedge');
  assert.equal(isWalkableCell(760,920),true);
  assert.equal(isWalkableCell(1074,512),false);
  assert.equal(isWalkableCell(1760,295),false);
  assert.equal(isWalkableCell(1725,1055),false);
  assert.equal(isWalkableCell(NaN,920),false);
});

test('declared entrances route to exits and activity cells',()=>{
  for(const target of ['north-exit','east-exit','bench-west','mat','wave-point']){
    const route=routeCells('entrance',target);
    assert.equal(route[0].id,'entrance');
    assert.equal(route.at(-1).id,target);
  }
  assert.deepEqual(routeCells('crossing','north-curve').map(cell=>cell.id),['crossing','north-detour','north-curve']);
});
