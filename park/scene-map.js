const cells = [
  {id:'entrance',type:'entrance',x:760,y:920,clearance:128,neighbors:['west-path','gate-path','south-path']},
  {id:'west-path',type:'path',x:520,y:1036,clearance:72,neighbors:['entrance']},
  {id:'gate-path',type:'gate',x:800,y:760,clearance:112,neighbors:['entrance','garden-path','lawn-path']},
  {id:'garden-path',type:'path',x:790,y:640,clearance:72,neighbors:['gate-path','crossing']},
  {id:'lawn-path',type:'path',x:980,y:610,clearance:72,neighbors:['gate-path']},
  {id:'crossing',type:'path',x:820,y:540,clearance:76,neighbors:['garden-path','north-detour','north-west']},
  {id:'north-detour',type:'path',x:1040,y:420,clearance:76,neighbors:['crossing','north-curve']},
  {id:'north-west',type:'path',x:760,y:500,clearance:72,neighbors:['crossing']},
  {id:'north-curve',type:'path',x:1080,y:490,clearance:76,neighbors:['north-detour','plaza']},
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
  {id:'wave-point',type:'grass',x:900,y:700,clearance:54,neighbors:['garden-path','lawn-path']},
  {id:'west-lawn',type:'grass',x:300,y:680,clearance:180,neighbors:[]},
  {id:'east-lawn',type:'grass',x:1370,y:700,clearance:190,neighbors:[]},
  {id:'blocked-tree-1',type:'blocked',x:1085,y:456,radius:22},
  {id:'blocked-tree-2',type:'blocked',x:60,y:320,radius:25},
  {id:'blocked-tree-3',type:'blocked',x:380,y:140,radius:25},
  {id:'blocked-tree-4',type:'blocked',x:1710,y:255,radius:20},
  {id:'blocked-tree-5',type:'blocked',x:140,y:535,radius:20},
  {id:'blocked-tree-6',type:'blocked',x:830,y:1140,radius:25},
  {id:'blocked-north-tree',type:'blocked',x:825,y:225,radius:22},
  {id:'blocked-north-cherry',type:'blocked',x:1110,y:155,radius:20},
  {id:'blocked-northeast-tree',type:'blocked',x:1500,y:125,radius:20},
  {id:'blocked-east-tree',type:'blocked',x:1950,y:220,radius:20},
  {id:'blocked-bench-west',type:'blocked',polygon:[[1212,132],[1312,124],[1316,151],[1214,168]]},
  {id:'blocked-bench-east',type:'blocked',polygon:[[1445,137],[1535,151],[1535,178],[1445,163]]},
  {id:'blocked-garden',type:'blocked',polygon:[[0,630],[190,548],[345,570],[590,650],[640,705],[680,780],[710,805],[710,855],[675,875],[645,935],[300,875],[0,790]]},
  {id:'blocked-shop',type:'blocked',polygon:[[1640,350],[1680,340],[1900,376],[2048,280],[2048,500],[1900,565],[1660,470]]},
  {id:'blocked-water-west',type:'blocked',polygon:[[1500,1120],[1675,1040],[1750,1065],[1680,1152],[1500,1152]]},
  {id:'blocked-water-north',type:'blocked',polygon:[[1810,960],[1840,940],[1880,915],[1920,897],[1960,885],[2010,878],[2048,875],[2048,1003],[1990,999],[1950,990],[1910,966],[1870,953],[1840,950]]},
  {id:'blocked-water-south',type:'blocked',polygon:[[1675,1105],[1750,1065],[1810,1070],[1870,1095],[1905,1110],[1905,1152],[1675,1152]]},
  {id:'blocked-water-east',type:'blocked',polygon:[[1960,980],[2048,950],[2048,1060],[1980,1090]]},
  {id:'blocked-east-fence',type:'blocked',polygon:[[1588,962],[1600,970],[1800,832],[1790,820]]},
  {id:'blocked-lamp-north',type:'blocked',x:980,y:220,radius:16},
  {id:'blocked-lamp-crossing',type:'blocked',x:860,y:500,radius:16},
  {id:'blocked-lamp-garden',type:'blocked',x:640,y:718,radius:16},
  {id:'blocked-lamp-south',type:'blocked',x:930,y:902,radius:16}
];

export const CELL_REGISTRY = Object.freeze(Object.fromEntries(
  cells.map(cell => [cell.id,Object.freeze({...cell,neighbors:Object.freeze(cell.neighbors||[])})])
));

export const LANDMARKS = [
  {id:'garden',x:700,y:905,r:135,perimeterRadius:110,label:'Enter Garden',href:'../garden/',
   outline:[[0,600],[190,540],[345,565],[600,640],[640,705],[680,780],[710,805],[710,855],[675,875],[645,935],[490,925],[0,805]]},
  {id:'grocer',x:1805,y:565,r:125,label:'Village Grocer',href:'../grocer/',
   outline:[[1648,280],[1805,165],[1810,158],[1840,163],[1980,215],[2048,245],[2048,500],[1900,565],[1660,470],[1650,350],[1620,335],[1620,315],[1648,305]]},
  {id:'cafe',x:450,y:590,r:140}
];

export function nearestLandmark(x,y) {
  let nearest=null,distance=Infinity;
  for(const landmark of LANDMARKS){
    const d=landmark.perimeterRadius
      ? distanceToPolygon(landmark.outline,x,y)
      : Math.hypot(landmark.x-x,landmark.y-y);
    if(d<(landmark.perimeterRadius||landmark.r)&&d<distance){nearest=landmark;distance=d}
  }
  return nearest;
}

function distanceToPolygon(points,x,y) {
  if(containsPolygon(points,x,y))return 0;
  let nearest=Infinity;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const [ax,ay]=points[j], [bx,by]=points[i];
    const dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy;
    const t=length?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/length)):0;
    nearest=Math.min(nearest,Math.hypot(x-ax-t*dx,y-ay-t*dy));
  }
  return nearest;
}

function containsPolygon(points,x,y) {
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const [ax,ay]=points[j], [bx,by]=points[i];
    const cross=(x-ax)*(by-ay)-(y-ay)*(bx-ax);
    if(Math.abs(cross)<1e-8&&x>=Math.min(ax,bx)&&x<=Math.max(ax,bx)&&y>=Math.min(ay,by)&&y<=Math.max(ay,by))return true;
    if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
  }
  return inside;
}

export function cellAt(x,y) {
  for (const cell of Object.values(CELL_REGISTRY)) {
    if (cell.type!=='blocked') continue;
    if (cell.radius && Math.hypot(x-cell.x,y-cell.y)<cell.radius) return cell;
    if (cell.width && Math.abs(x-cell.x)<cell.width/2 && Math.abs(y-cell.y)<cell.height/2) return cell;
    if (cell.polygon && containsPolygon(cell.polygon,x,y)) return cell;
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
