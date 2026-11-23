const cells = [
  {id:'entrance',type:'entrance',x:760,y:920,clearance:128,neighbors:['west-path','gate-path','south-path']},
  {id:'west-path',type:'path',x:520,y:1036,clearance:72,neighbors:['entrance']},
  {id:'gate-path',type:'gate',x:800,y:760,clearance:112,neighbors:['entrance','garden-path','mat-path']},
  {id:'garden-path',type:'path',x:790,y:640,clearance:72,neighbors:['gate-path','crossing']},
  {id:'mat-path',type:'path',x:980,y:610,clearance:72,neighbors:['gate-path','mat']},
  {id:'mat',type:'mat',x:1040,y:640,yaw:.12,clearance:64,neighbors:['mat-path']},
  {id:'crossing',type:'path',x:820,y:540,clearance:76,neighbors:['garden-path','north-curve','north-west']},
  {id:'north-west',type:'path',x:760,y:500,clearance:72,neighbors:['crossing']},
  {id:'north-curve',type:'path',x:1080,y:490,clearance:76,neighbors:['crossing','plaza']},
  {id:'plaza',type:'path',x:1220,y:440,clearance:84,neighbors:['north-curve','north-turn','bench-west']},
  {id:'north-turn',type:'path',x:1340,y:300,clearance:72,neighbors:['plaza','north-exit','bench-north']},
  {id:'north-exit',type:'exit',x:1480,y:240,clearance:92,neighbors:['north-turn','bench-east']},
  {id:'bench-west',type:'benchAnchor',x:1226,y:158,yaw:.72,clearance:46,neighbors:['plaza']},
  {id:'bench-north',type:'benchAnchor',x:1378,y:138,yaw:.08,clearance:46,neighbors:['north-turn']},
  {id:'bench-east',type:'benchAnchor',x:1470,y:152,yaw:-.38,clearance:46,neighbors:['north-exit']},
  {id:'south-path',type:'path',x:1000,y:1000,clearance:84,neighbors:['entrance','south-bridge']},
  {id:'south-bridge',type:'path',x:1160,y:1072,clearance:72,neighbors:['south-path','east-bridge']},
  {id:'east-bridge',type:'path',x:1500,y:980,clearance:84,neighbors:['south-bridge','east-curve']},
  {id:'east-curve',type:'path',x:1680,y:900,clearance:84,neighbors:['east-bridge','east-exit']},
  {id:'east-exit',type:'exit',x:1760,y:860,clearance:92,neighbors:['east-curve']},
  {id:'wave-point',type:'grass',x:900,y:700,clearance:54,neighbors:['garden-path','mat-path']},
  {id:'west-lawn',type:'grass',x:300,y:680,clearance:180,neighbors:[]},
  {id:'east-lawn',type:'grass',x:1370,y:700,clearance:190,neighbors:[]},
  {id:'blocked-tree-1',type:'blocked',x:1074,y:512,radius:22},
  {id:'blocked-tree-2',type:'blocked',x:220,y:200,radius:70},
  {id:'blocked-tree-3',type:'blocked',x:430,y:90,radius:55},
  {id:'blocked-tree-4',type:'blocked',x:1604,y:250,radius:40},
  {id:'blocked-tree-5',type:'blocked',x:80,y:400,radius:50},
  {id:'blocked-tree-6',type:'blocked',x:860,y:1088,radius:48},
  {id:'blocked-ne-hedge',type:'blocked',x:1760,y:295,width:480,height:450},
  {id:'blocked-se-hedge',type:'blocked',x:1725,y:1055,width:530,height:130}
];

export const CELL_REGISTRY = Object.freeze(Object.fromEntries(
  cells.map(cell => [cell.id,Object.freeze({...cell,neighbors:Object.freeze(cell.neighbors||[])})])
));

export function cellAt(x,y) {
  for (const cell of Object.values(CELL_REGISTRY)) {
    if (cell.type!=='blocked') continue;
    if (cell.radius && Math.hypot(x-cell.x,y-cell.y)<cell.radius) return cell;
    if (cell.width && Math.abs(x-cell.x)<cell.width/2 && Math.abs(y-cell.y)<cell.height/2) return cell;
  }
  let nearest=null,nearestDistance=Infinity;
  for (const cell of Object.values(CELL_REGISTRY)) {
    if (cell.type==='blocked'||!cell.clearance) continue;
    const distance=Math.hypot(x-cell.x,y-cell.y);
    if(distance<cell.clearance&&distance<nearestDistance){nearest=cell;nearestDistance=distance}
  }
  return nearest||{id:'grass-default',type:'grass',x,y,clearance:0};
}

export function nearestNavigationCell(x,y) {
  let nearest=CELL_REGISTRY.entrance,nearestDistance=Infinity;
  for (const cell of Object.values(CELL_REGISTRY)) {
    if (!cell.neighbors?.length||cell.type==='blocked') continue;
    const distance=Math.hypot(x-cell.x,y-cell.y);
    if(distance<nearestDistance){nearest=cell;nearestDistance=distance}
  }
  return nearest;
}

export function routeCells(fromId,toId) {
  if(!CELL_REGISTRY[fromId]||!CELL_REGISTRY[toId]) throw new Error(`Unknown park cell route: ${fromId} -> ${toId}`);
  const queue=[fromId],previous=new Map([[fromId,null]]);
  while(queue.length){
    const id=queue.shift();
    if(id===toId)break;
    const neighbors=new Set([
      ...CELL_REGISTRY[id].neighbors,
      ...Object.values(CELL_REGISTRY).filter(cell=>cell.neighbors?.includes(id)).map(cell=>cell.id)
    ]);
    for(const neighbor of neighbors){
      if(previous.has(neighbor))continue;
      previous.set(neighbor,id);
      queue.push(neighbor);
    }
  }
  if(!previous.has(toId))throw new Error(`No park route between ${fromId} and ${toId}`);
  const route=[];
  for(let id=toId;id!==null;id=previous.get(id))route.push(CELL_REGISTRY[id]);
  return route.reverse();
}

export function isWalkableCell(x,y) {
  if(!Number.isFinite(x)||!Number.isFinite(y))return false;
  if(x<60||x>1990||y<70||y>1120)return false;
  return cellAt(x,y).type!=='blocked';
}
