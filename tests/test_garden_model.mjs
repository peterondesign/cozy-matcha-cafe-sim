import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=readFileSync(new URL('../garden/garden-model.js',import.meta.url),'utf8');
const Garden=vm.runInNewContext(source+'; Garden');
const crop=Garden.crops.find(c=>c.id==='strawberries');
const minute=Garden.minute;

test('care windows and missed care affect growth until watered',()=>{
  const bed=Garden.plant(crop,0);
  assert.equal(Garden.inspect(bed,24*minute).status,'healthy');
  assert.equal(Garden.inspect(bed,25*minute).status,'approaching');
  assert.equal(Garden.inspect(bed,30*minute).status,'available');
  assert.equal(Garden.inspect(bed,35*minute).status,'missed');
  const before=Garden.inspect(bed,50*minute);
  const lost=Garden.inspect(bed,55*minute);
  assert.ok(lost.growth<before.growth);
  assert.ok(lost.lostProgress>0);
  assert.equal(Garden.tend(bed,55*minute),true);
  assert.equal(Garden.inspect(bed,55*minute).growth,lost.growth);
  assert.equal(Garden.inspect(bed,56*minute).status,'healthy');
  assert.equal(Garden.inspect(bed,56*minute).growth,lost.growth+minute);
});

test('scrubbing sets exact progress, resets care and supports harvest readiness',()=>{
  const bed=Garden.plant(crop,0);
  Garden.seek(bed,42,55*minute);
  assert.equal(Garden.inspect(bed,55*minute).growthProgress,42);
  assert.equal(bed.nextCareAt,85*minute);
  Garden.seek(bed,100,56*minute);
  assert.equal(Garden.inspect(bed,56*minute).status,'ready');
  assert.equal(Garden.inspect(bed,156*minute).lostProgress,0);
  Garden.seek(bed,0,157*minute);
  assert.equal(Garden.inspect(bed,157*minute).growthProgress,0);
  assert.throws(()=>Garden.seek(bed,101,157*minute),/between 0 and 100/);
  const honey=Garden.plant(Garden.crops.find(c=>c.id==='honey'),0);
  Garden.seek(honey,50,minute);
  assert.equal(honey.nextCareAt,null);
});
