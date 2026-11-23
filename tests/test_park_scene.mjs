import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {walkCycleFrame} from '../park/animation.js';
import {CELL_REGISTRY,cellAt,isWalkableCell,nearestLandmark,routeCells} from '../park/scene-map.js';
import {VISITOR_PATHS,sampleVisitorPath,visitorTarget,findViewEntry} from '../park/visitor-paths.js';
import {FOREGROUND_POLYGONS,occludesActor,polygonBounds} from '../park/scene-occlusion.js';

test('park cells register movement surfaces, anchors, exits, and colliders',()=>{
  assert.equal(CELL_REGISTRY.entrance.type,'entrance');
  assert.equal(CELL_REGISTRY['north-exit'].type,'exit');
  assert.equal(CELL_REGISTRY['gate-path'].type,'gate');
  assert.equal(CELL_REGISTRY['bench-west'].type,'benchAnchor');
  assert.notEqual(cellAt(1040,640).type,'mat');
  assert.equal(cellAt(1074,456).type,'blocked');
  assert.equal(cellAt(1760,470).id,'blocked-shop');
  assert.equal(cellAt(300,700).id,'blocked-garden');
  assert.equal(cellAt(1590,1100).id,'blocked-water-west');
  assert.equal(isWalkableCell(760,920),true);
  assert.equal(isWalkableCell(1074,456),false);
  assert.equal(isWalkableCell(1074,512),true);
  assert.equal(isWalkableCell(825,225),false);
  assert.equal(isWalkableCell(1110,155),false);
  assert.equal(isWalkableCell(825,270),true);
  assert.equal(isWalkableCell(1760,470),false);
  assert.equal(isWalkableCell(1760,295),true);
  assert.equal(isWalkableCell(1805,560),true);
  assert.equal(isWalkableCell(700,880),true);
  assert.equal(isWalkableCell(1982,1108),true);
  assert.equal(isWalkableCell(1250,150),false);
  assert.equal(isWalkableCell(1480,155),false);
  assert.equal(isWalkableCell(1250,190),true);
  assert.equal(isWalkableCell(300,700),false);
  assert.equal(isWalkableCell(1590,1100),false);
  assert.equal(isWalkableCell(1725,1055),true);
  assert.equal(isWalkableCell(1660,580),true);
  assert.equal(isWalkableCell(1200,700),true);
  assert.equal(isWalkableCell(500,500),true);
  assert.equal(isWalkableCell(NaN,920),false);
});

test('foreground objects occlude only overlapping actors behind their sort line',()=>{
  const shop=FOREGROUND_POLYGONS.find(item=>item.id==='shop');
  const spec={...shop,...polygonBounds(shop.points)};
  const bounds={left:1700,right:1800,top:250,bottom:400};
  assert.equal(occludesActor(spec,{x:1700,y:400},bounds),true);
  assert.equal(occludesActor(spec,{x:1700,y:500},bounds),false);
  assert.equal(occludesActor(spec,{x:1850,y:500},bounds),true);
  assert.equal(occludesActor(spec,{x:1850,y:560},bounds),false);
  assert.equal(occludesActor(spec,{x:1700,y:400},{left:200,right:300,top:250,bottom:400}),false);
});

test('garden and grocer interactions are reachable from their entrances',()=>{
  assert.equal(nearestLandmark(700,905).id,'garden');
  assert.equal(nearestLandmark(1805,560).id,'grocer');
  assert.equal(nearestLandmark(1200,700),null);
  assert.equal(isWalkableCell(700,905),true);
  assert.equal(isWalkableCell(1805,560),true);
});

test('declared entrances route to exits and activity cells',()=>{
  for(const target of ['north-exit','east-exit','bench-west','lawn-path','wave-point']){
    const route=routeCells('entrance',target);
    assert.equal(route[0].id,'entrance');
    assert.equal(route.at(-1).id,target);
  }
  assert.deepEqual(routeCells('crossing','north-curve').map(cell=>cell.id),['crossing','north-detour','north-curve']);
});

test('visitor routes move continuously and reverse at both ends',()=>{
  assert.equal(VISITOR_PATHS.length,2);
  for(const path of VISITOR_PATHS){
    const start=sampleVisitorPath(path,0);
    const forward=sampleVisitorPath(path,100);
    const backwards=sampleVisitorPath(path,path.length*2-100);
    assert.ok(Math.hypot(forward.x-start.x,forward.y-start.y)>0);
    assert.ok(Math.hypot(forward.x-backwards.x,forward.y-backwards.y)<1e-8);
    assert.ok(Math.abs(forward.vx+backwards.vx)<1e-8);
    assert.ok(Math.abs(forward.vy+backwards.vy)<1e-8);
    const before=sampleVisitorPath(path,path.length-.01);
    const after=sampleVisitorPath(path,path.length+.01);
    assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<.021);
    const loop=sampleVisitorPath(path,path.length*2);
    assert.ok(Math.hypot(loop.x-start.x,loop.y-start.y)<1e-8);
    assert.equal(start.opacity,0);
    assert.equal(sampleVisitorPath(path,path.length).opacity,0);
    assert.equal(sampleVisitorPath(path,200).opacity,1);
  }
  const store=sampleVisitorPath(VISITOR_PATHS[0],VISITOR_PATHS[0].length);
  const bridge=sampleVisitorPath(VISITOR_PATHS[1],VISITOR_PATHS[1].length);
  assert.ok(store.x>1750&&store.y<560);
  assert.ok(bridge.x>2048&&bridge.y>1152);
  assert.throws(()=>sampleVisitorPath(VISITOR_PATHS[0],-1),RangeError);
});

test('visible visitors stay outside solid footprints along their routes',()=>{
  for(const path of VISITOR_PATHS){
    for(let distance=0;distance<=path.length;distance+=5){
      const {x,y,opacity}=sampleVisitorPath(path,distance);
      if(x<60||x>1990||y<70||y>1120||opacity<.1)continue;
      assert.equal(isWalkableCell(x,y),true,`Blocked route at ${x.toFixed(0)},${y.toFixed(0)}`);
    }
  }
});

test('visitor traffic stops from 11pm until 6am',()=>{
  assert.deepEqual([0,359,360,540,1019,1020,1259,1260,1379,1380,1439,1440].map(visitorTarget),
    [0,0,2,2,2,2,2,1,1,0,0,0]);
});

test('a visitor can enter a viewport from outside without appearing on screen',()=>{
  const view={cx:400,cy:400,cw:1000,ch:600};
  const distance=findViewEntry(VISITOR_PATHS[0],view);
  assert.notEqual(distance,null);
  const start=sampleVisitorPath(VISITOR_PATHS[0],distance);
  assert.ok(start.x<view.cx-150||start.x>view.cx+view.cw+150||
    start.y<view.cy-150||start.y>view.cy+view.ch+150);
  assert.ok(Array.from({length:20},(_,i)=>sampleVisitorPath(VISITOR_PATHS[0],distance+(i+1)*30))
    .some(point=>point.x>=view.cx&&point.x<=view.cx+view.cw&&point.y>=view.cy&&point.y<=view.cy+view.ch));
  assert.equal(findViewEntry(VISITOR_PATHS[0],{cx:0,cy:0,cw:50,ch:50}),null);
});

test('Hana park walk animation uses the aligned ten-pose cycle',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../rigging-test/action-assets.json',import.meta.url),'utf8'));
  const animation=manifest.walk_right['02'];
  assert.equal(animation.file,'hana_walk_right_cycle.png');
  assert.deepEqual([animation.columns,animation.rows,animation.frames],[4,4,10]);

  const image=readFileSync(new URL(`../rigging-test/${animation.file}`,import.meta.url));
  assert.equal(image.readUInt32BE(16),5504);
  assert.equal(image.readUInt32BE(20),3072);
});

test('Hana walk cycle advances with movement and wraps without a dead tail',()=>{
  assert.deepEqual(
    [0,13,26,117,130,143,260].map(distance=>walkCycleFrame(distance,10,130)),
    [0,1,2,9,0,1,0]
  );
  assert.throws(()=>walkCycleFrame(-1,10,130),RangeError);
});

test('Hana directional sheets provide transparent sixteen-frame cycles',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../rigging-test/action-assets.json',import.meta.url),'utf8'));
  for(const direction of ['walk_up','walk_down']){
    const sheet=manifest[direction]['02'];
    assert.deepEqual([sheet.columns,sheet.rows,sheet.frames],[4,4,16]);
    const image=readFileSync(new URL(`../rigging-test/${sheet.file}`,import.meta.url));
    assert.deepEqual([image.readUInt32BE(16),image.readUInt32BE(20),image[25]],[5504,3072,6]);
    assert.equal(walkCycleFrame(129,16,130),15);
    assert.equal(walkCycleFrame(130,16,130),0);
  }
});
