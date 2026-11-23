import {CELL_REGISTRY,cellAt,nearestNavigationCell,routeCells,isWalkableCell} from './scene-map.js';
import {loadParkAssets} from './gltf-pipeline.js';

const canvas=document.querySelector('#park'), ctx=canvas.getContext('2d');
const figureCanvas=document.querySelector('#figures');
const canopy=document.querySelector('#canopy'), canopyCtx=canopy?canopy.getContext('2d'):null;
const status=document.querySelector('output');
async function load(file){const img=new Image();img.src=file;await img.decode();return img}
const [day,night,matArt,starArt]=await Promise.all(['world-day.jpg','world-night.jpg','yoga-mat.png','player-star.png'].map(load)).catch(error=>{status.textContent='Park artwork could not load. Refresh to retry.';throw error});
const overlayData=await fetch('overlays/manifest.json').then(r=>r.json()).catch(()=>[]);
for(const spec of overlayData)spec.img=await load(spec.file);
const benches=[
 {id:'bench-w',x:1226,y:136,yaw:0.72,sitX:1226,sitY:158},
 {id:'bench-n',x:1378,y:118,yaw:0.08,sitX:1378,sitY:138},
 {id:'bench-e',x:1470,y:132,yaw:-0.38,sitX:1470,sitY:152}
];
const yogaMat={x:1040,y:640,yaw:0.12,w:196,h:92};
const gardenShortcut=document.createElement('a');gardenShortcut.href='../garden/';gardenShortcut.textContent='Garden';gardenShortcut.style.cssText='background:#dce9b4;color:#49351f;border:3px double #9e7b48;border-radius:13px;padding:8px;text-decoration:none;font:bold 15px Georgia';document.querySelector('header')?.append(gardenShortcut);
let blend=0,blendTarget=0,x=824,y=859,last=0,testAction='normal',actionAt=0,walkVel=0,faceX=0,faceY=1,benchYaw=0;
const hintEl=document.querySelector('#hint');
let clickGoal=null,nearSpot=null,view={cx:0,cy:0,zoom:1};
let parkDog=null;
let animationTime=0;
function clockNightMix(minutes){
 const value=Number(minutes),minuteOfDay=((Number.isFinite(value)?value:480)%1440+1440)%1440;
 const hour=minuteOfDay/60;
 const smooth=(a,b,value)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t)};
 const dawn=smooth(5,7,hour),dusk=smooth(17,19,hour);
 return 1-Math.min(dawn,1-dusk);
}
function syncClockLighting(){
 let state={};
 try{state=JSON.parse(localStorage.getItem('matchaVisualState')||'{}')||{}}
 catch(error){console.warn('Park clock state could not be read.',error)}
 blendTarget=clockNightMix(state.minutes??480);
 document.querySelector('matcha-hud')?.refresh();
}
syncClockLighting();
window.addEventListener('storage',syncClockLighting);
window.addEventListener('matcha-stock',syncClockLighting);
setInterval(syncClockLighting,1000);
function seatedNow(){return testAction==='sit-bench'||testAction==='sit-start-bench'||testAction==='sit-mat'||testAction==='sit-start-mat'||testAction==='stretch-mat'}
function setAction(next){
 testAction=next==='sit-bench'?'sit-start-bench':next==='sit-mat'?'sit-start-mat':next;
 actionAt=animationTime;
 if(next==='sit-bench'){
  const b=nearestBench();
  x=b.sitX;y=b.sitY;
 }
 if(next==='sit-mat'||next==='stretch-mat'){x=yogaMat.x;y=yogaMat.y+10}
}
function standUp(){
 if(!seatedNow())return;
 const from=testAction;
 setAction(from.includes('bench')?'up-bench':'up-mat');
}
function nearestBench(){
 let best=benches[0],bestD=1e9;
 for(const bench of benches){const d=Math.hypot(bench.x-x,bench.y-y);if(d<bestD){bestD=d;best=bench}}
 return best;
}
const keys=new Set(), touches=new Map();
const mapping={w:'up',a:'left',s:'down',d:'right',ArrowUp:'up',ArrowLeft:'left',ArrowDown:'down',ArrowRight:'right'};
onkeydown=e=>{
 if(e.key.toLowerCase()==='c'){
  if(!e.repeat)callDog(player);
  return;
 }
 if(e.key.toLowerCase()==='e'){
  e.preventDefault();
  if(!e.repeat&&nearSpot)nearSpot.go();
  return;
 }
 const k=mapping[e.key]||mapping[e.key.toLowerCase()];if(k){e.preventDefault();keys.add(k)}
};
onkeyup=e=>keys.delete(mapping[e.key]||mapping[e.key.toLowerCase()]);
onblur=()=>{keys.clear();touches.clear()};
for(const b of document.querySelectorAll('[data-key]')){
 b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);touches.set(e.pointerId,b.dataset.key)};
 b.onlostpointercapture=e=>touches.delete(e.pointerId);
}
document.querySelector('#call-dog').addEventListener('click',()=>callDog(player));
function allowed(a,b){
 return isWalkableCell(a,b);
}
try{
 const savedPosition=JSON.parse(localStorage.getItem('matcha-garden-player-position')||'null');
 localStorage.removeItem('matcha-garden-player-position');
 if(savedPosition&&allowed(savedPosition.x,savedPosition.y)){x=savedPosition.x;y=savedPosition.y}
}catch{}
function clearOf(a,b,self,pad=32){
 if(!self)return true;
 for(const person of visitors){
  if(person===self||!person.active)continue;
  const nextDistance=Math.hypot(person.x-a,person.y-b);
  if(nextDistance>=pad)continue;
  const currentDistance=Math.hypot(person.x-self.x,person.y-self.y);
  if(nextDistance<=currentDistance+0.001)return false;
 }
 return true;
}
const spots=[
 {id:'garden',x:760,y:920,r:230,label:'Enter Garden',go:()=>{localStorage.setItem('matcha-garden-return','../park/');localStorage.setItem('matcha-garden-player-position',JSON.stringify({x,y}));location.href='../garden/'}},
 {id:'mat',x:yogaMat.x,y:yogaMat.y,r:92,label:'Sit on yoga mat',kind:'sit',go:()=>setAction('sit-mat')},
 ...benches.map(bench=>({id:bench.id,x:bench.x,y:bench.y,r:78,label:'Sit on bench',kind:'sit',go:()=>{const b=nearestBench();x=b.sitX;y=b.sitY;benchYaw=b.yaw;setAction('sit-bench')}})),
 {id:'shop',x:1660,y:580,r:96,label:'Village Grocer',go:()=>{location.href='../grocer/'}}
];
function closestSpot(){
 if(seatedNow())return null;
 const garden=spots[0];
 if(Math.hypot(garden.x-x,garden.y-y)<garden.r)return garden;
 let best=null,bestD=1e9;
 for(const spot of spots){
  const d=Math.hypot(spot.x-x,spot.y-y);
  if(d<spot.r&&d<bestD){best=spot;bestD=d}
 }
 const pal=visitors.find(person=>person.active&&Math.hypot(person.x-x,person.y-y)<78);
 if(pal){
  const d=Math.hypot(pal.x-x,pal.y-y);
  if(d<bestD)best={id:'wave-'+pal.guest,x:pal.x,y:pal.y-8,r:78,label:'Wave to '+pal.guest,go:()=>{setAction('wave');pal.waveUntil=animationTime+2800}};
 }
 return best;
}
function worldFromEvent(event){
 const box=canvas.getBoundingClientRect();
 return {x:view.cx+(event.clientX-box.left)/view.zoom,y:view.cy+(event.clientY-box.top)/view.zoom};
}
canvas.addEventListener('pointerdown',event=>{
 if(event.button)return;
 const point=worldFromEvent(event);
 if(seatedNow())standUp();
 if(!allowed(point.x,point.y)){status.textContent='Cannot walk there';return}
 clickGoal={x:point.x,y:point.y,at:performance.now()};
 status.textContent='Walking there';
});
hintEl?.addEventListener('click',event=>{
 event.stopPropagation();
 const spot=closestSpot();
 if(spot)spot.go();
});
function tick(now){
 const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
 animationTime+=dt*1000;
 if((testAction==='sit-start-bench'||testAction==='sit-start-mat')&&animationTime-actionAt>320){
  testAction=testAction==='sit-start-bench'?'sit-bench':'sit-mat';actionAt=animationTime;
 }
 if((testAction==='up-bench'||testAction==='up-mat')&&animationTime-actionAt>520)setAction('normal');
 if(testAction==='wave'&&animationTime-actionAt>1600)setAction('normal');
 if(testAction==='sit-mat'&&animationTime-actionAt>3600){testAction='stretch-mat';actionAt=animationTime}
 else if(testAction==='stretch-mat'&&animationTime-actionAt>4800){testAction='sit-mat';actionAt=animationTime}
 const active=new Set([...keys,...touches.values()]);
 let dx=Number(active.has('right'))-Number(active.has('left')),dy=Number(active.has('down'))-Number(active.has('up'));
 let len=Math.hypot(dx,dy);const stairs=x>475&&x<737&&y>388&&y<484;
 if(len)clickGoal=null;
 if((len||clickGoal)&&seatedNow())standUp();
 const sitting=seatedNow()||testAction==='up-bench'||testAction==='up-mat';
 const want=sitting||!len&&!clickGoal?0:stairs?96:148;
 const ease=want>walkVel?260:340;
 if(walkVel<want)walkVel=Math.min(want,walkVel+ease*dt);
 else walkVel=Math.max(want,walkVel-ease*dt);
 const speed=walkVel,beforeX=x,beforeY=y;
 const stroll=46;
 for(const person of visitors){
  if(!person.active){
   if(animationTime>=person.respawnAt)respawnVisitor(person);
   else continue;
  }
  if(person.actionUntil){
   if(animationTime<person.actionUntil){
    if(person.goalState==='WALK_DOG'){
     person.dogWalkAngle+=dt*.75*person.dogWalkDirection;
     const radius=30,center=person.dogWalkCenter;
     const targetX=center.x+Math.cos(person.dogWalkAngle)*radius;
     const targetY=center.y+Math.sin(person.dogWalkAngle)*radius;
     const dx=targetX-person.x,dy=targetY-person.y,distance=Math.hypot(dx,dy)||1;
     const step=Math.min(stroll*dt,distance),nx=person.x+dx/distance*step,ny=person.y+dy/distance*step;
     if(allowed(nx,ny)&&clearOf(nx,ny,person,36)){
      person.x=nx;person.y=ny;person.vx=dx/distance;person.vy=dy/distance;person.moving=true;
     }else{
      person.dogWalkDirection*=-1;person.moving=false;person.vx=0;person.vy=0;
     }
    }else{
     person.vx=0;person.vy=0;person.moving=false;
    }
    continue;
   }
   finishVisitorAction(person);
  }
  const goal=person.route[person.at];
  if(!goal){
   person.vx=0;person.vy=0;person.moving=false;person.stuck=(person.stuck||0)+dt;
   if(person.stuck>.5){routeVisitorAroundObstacle(person);person.stuck=0}
   continue;
  }
  const gx=goal[0]-person.x,gy=goal[1]-person.y;
  const dist=Math.hypot(gx,gy);
  const step=stroll*dt;
  if(dist<=step+6){
   person.x=goal[0];person.y=goal[1];
   person.vx=0;person.vy=0;person.moving=false;person.stuck=0;
   if(person.at===person.route.length-1){
    if(person.goalState==='TRANSIT_TO_EXIT'||person.goalState==='EXITING'){
     person.active=false;
     person.respawnAt=animationTime+3500+person.id*700;
     if(parkDog?.owner===person)parkDog.active=false;
    }else beginVisitorAction(person,animationTime);
    continue;
   }
   person.at++;
   continue;
  }
  let ux=gx/dist,uy=gy/dist;
  let separateX=0,separateY=0;
  for(const other of visitors){
   if(other===person||!other.active)continue;
   const sx=person.x-other.x,sy=person.y-other.y,sd=Math.hypot(sx,sy);
   if(sd<54){
    if(sd>0.001){
     const force=(54-sd)/54;
     separateX+=sx/sd*force;separateY+=sy/sd*force;
    }else{
     const low=Math.min(person.id,other.id),high=Math.max(person.id,other.id);
     const angle=(low*31+high*17)*2.399963;
     const direction=person.id<other.id?-1:1;
     separateX+=Math.cos(angle)*direction;separateY+=Math.sin(angle)*direction;
    }
   }
  }
  const steeringX=ux+separateX*1.35,steeringY=uy+separateY*1.35,steeringLength=Math.hypot(steeringX,steeringY)||1;
  ux=steeringX/steeringLength;uy=steeringY/steeringLength;
  const side=(person.id%2?1:-1)*(person.detourSign||1);
  const candidates=[
   [ux,uy],
   [(ux-uy*.8*side),(uy+ux*.8*side)],
   [(ux+uy*.8*side),(uy-ux*.8*side)],
   [ux,-uy],[0,uy],[ux,0]
  ];
  let moved=false;
  for(const [cx,cy] of candidates){
   const length=Math.hypot(cx,cy)||1,nx=person.x+cx/length*step,ny=person.y+cy/length*step;
   if(allowed(nx,ny)&&clearOf(nx,ny,person,36)){
    person.x=nx;person.y=ny;person.vx=cx/length;person.vy=cy/length;person.moving=true;person.stuck=0;moved=true;break;
   }
  }
  if(!moved){
   person.stuck=(person.stuck||0)+dt;
   person.vx=0;person.vy=0;person.moving=false;
   if(person.stuck>.45){
    const nudge=person.stuck>.9?Math.min(step*3,30):Math.min(step*1.5,16);
    const nx=person.x-uy*nudge*side,ny=person.y+ux*nudge*side;
    if(allowed(nx,ny)&&clearOf(nx,ny,person,36)){
     person.x=nx;person.y=ny;person.vx=-uy*side;person.vy=ux*side;person.moving=true;person.stuck=0;
    }
    if(person.stuck>1.2){routeVisitorAroundObstacle(person);person.stuck=0}
   }
  }
 }
 if(!len&&clickGoal&&speed>8){
  const gx=clickGoal.x-x,gy=clickGoal.y-y,gd=Math.hypot(gx,gy);
  if(gd<14)clickGoal=null;
  else {dx=gx/gd;dy=gy/gd;len=1}
 }
 if(len&&speed>4&&!sitting){
  const mx=dx*dt*speed/(len||1),my=dy*dt*speed*.82/(len||1);
  if(allowed(x+mx,y))x+=mx;
  if(allowed(x,y+my))y+=my;
  faceX=dx;faceY=dy;
  if(clickGoal&&Math.hypot(clickGoal.x-x,clickGoal.y-y)<14)clickGoal=null;
 }
 stepDog(dt);
 const travel=Math.hypot(x-beforeX,y-beforeY);
 if(clickGoal)status.textContent='Walking there';
 else status.textContent=len&&!travel&&!sitting?'Cannot walk there':stairs?'Stone steps':'';
 const nearFriend=visitors.find(person=>person.active&&Math.hypot(person.x-x,person.y-y)<86);
 if(testAction==='wave'&&nearFriend&&(!nearFriend.waveUntil||animationTime>nearFriend.waveUntil))nearFriend.waveUntil=animationTime+2800;
 nearSpot=closestSpot();
 if(hintEl){
  hintEl.hidden=!nearSpot;
  if(nearSpot)hintEl.querySelector('b').textContent='E · '+nearSpot.label;
 }
 const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio,2);
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
 const zoom=Math.max(w/2048,h/1152),cw=w/zoom,ch=h/zoom;
 const cx=Math.max(0,Math.min(2048-cw,x-cw/2)),cy=Math.max(0,Math.min(1152-ch,y-ch/2));
 view={cx,cy,zoom};
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 blend=reduce?blendTarget:blend+(blendTarget-blend)*(1-Math.exp(-dt*1.6));
 ctx.setTransform(dpr*zoom,0,0,dpr*zoom,-cx*dpr*zoom,-cy*dpr*zoom);
 ctx.globalAlpha=1;ctx.drawImage(day,0,0,2048,1152);
 ctx.globalAlpha=blend;ctx.drawImage(night,0,0,2048,1152);ctx.globalAlpha=1;
 if(blend>.02){
  const lamps=[[996,124],[866,927],[1114,821],[632,576],[654,1082]];
  ctx.globalCompositeOperation='screen';
  for(const [lampX,lampY] of lamps){
   const glow=ctx.createRadialGradient(lampX,lampY,2,lampX,lampY,48);
   glow.addColorStop(0,`rgba(255,218,132,${blend*.24})`);
   glow.addColorStop(1,'rgba(255,196,96,0)');
   ctx.fillStyle=glow;ctx.beginPath();ctx.arc(lampX,lampY,48,0,Math.PI*2);ctx.fill();
  }
  ctx.globalCompositeOperation='source-over';
 }
 ctx.drawImage(matArt,yogaMat.x-yogaMat.w/2,yogaMat.y-yogaMat.h/2,yogaMat.w,yogaMat.h);
 const onMatNow=testAction==='sit-mat'||testAction==='sit-start-mat'||testAction==='stretch-mat'||testAction==='up-mat';
 ctx.fillStyle=onMatNow?'#2a24184a':'#322e2828';
 ctx.beginPath();ctx.ellipse(x,y+(onMatNow?6:2),onMatNow?16:9,onMatNow?6:3.2,0,0,7);ctx.fill();
 if(parkDog?.active){
  ctx.fillStyle='#322e2830';ctx.beginPath();ctx.ellipse(parkDog.x,parkDog.y+3,17,5,0,0,7);ctx.fill();
 }
 for(const person of visitors){
  if(!person.active)continue;
  ctx.fillStyle='#322e2828';
  ctx.beginPath();ctx.ellipse(person.x,person.y+2,11,3.6,0,0,7);ctx.fill();
  if(Math.hypot(person.x-x,person.y-y)>54){
   ctx.textAlign='center';ctx.font='700 13px Georgia,serif';
   ctx.lineWidth=3;ctx.strokeStyle='#5a3d1ecc';ctx.strokeText(person.guest,person.x,person.y-125);
   ctx.fillStyle='#fff6dc';ctx.fillText(person.guest,person.x,person.y-125);
  }
 }
 if(clickGoal){
  const pulse=0.65+Math.sin(now/180)*0.35;
  ctx.strokeStyle=`rgba(255,214,90,${0.45+pulse*0.5})`;
  ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(clickGoal.x,clickGoal.y,34*pulse,16*pulse,0,0,7);ctx.stroke();
  ctx.fillStyle=`rgba(255,226,122,${0.22+pulse*0.22})`;
  ctx.beginPath();ctx.ellipse(clickGoal.x,clickGoal.y,16,7,0,0,7);ctx.fill();
 }
 if(nearSpot){
  ctx.strokeStyle='#ffe27acc';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.ellipse(nearSpot.x,nearSpot.y,22,9,0,0,7);ctx.stroke();
 }
 if(hintEl&&!hintEl.hidden&&nearSpot){
  hintEl.style.left=(nearSpot.x-cx)*zoom+'px';
  hintEl.style.top=(nearSpot.y-cy)*zoom+'px';
 }
 const starY=y-(106+36*y/1152)-28;
 ctx.drawImage(starArt,x-12,starY,24,24);
 drawFigures({cx,cy,cw,ch,w,h,dpr,zoom,blend,travel,walkVel,now,dt});
 if(canopy&&canopyCtx){
  if(canopy.width!==canvas.width||canopy.height!==canvas.height){canopy.width=canvas.width;canopy.height=canvas.height}
  canopyCtx.setTransform(dpr*zoom,0,0,dpr*zoom,-cx*dpr*zoom,-cy*dpr*zoom);
  canopyCtx.clearRect(cx-2,cy-2,cw+4,ch+4);
  const bodies=[{x,y},...visitors.filter(person=>person.active)];
  for(const spec of overlayData){
   if(!spec.img)continue;
   const behind=bodies.some(body=>body.x>spec.x&&body.x<spec.x+spec.w&&body.y>spec.y&&body.y<spec.sortY);
   if(!behind)continue;
   canopyCtx.drawImage(spec.img,spec.x,spec.y,spec.w,spec.h);
  }
 }
 requestAnimationFrame(tick)
}
const visitors=[
 {customer:'02',guest:'Hana',purpose:'action',x:760,y:900,vx:0,vy:0},
 {customer:'04',guest:'Ren',purpose:'transit',x:1080,y:980,vx:0,vy:0},
 {customer:'05',guest:'Yuki',purpose:'transit',x:900,y:700,vx:0,vy:0},
 {customer:'03',guest:'Mio',purpose:'transit',x:780,y:760,vx:0,vy:0},
 {customer:'07',guest:'Ken',purpose:'transit',x:1180,y:900,vx:0,vy:0},
 {customer:'08',guest:'Jun',purpose:'action',x:920,y:820,vx:0,vy:0},
 {customer:'01',guest:'Sota',purpose:'transit',x:860,y:560,vx:0,vy:0}
];

const actionKinds=['SIT_BENCH','SIT_MAT','WAVE','WALK_DOG'];
const actionCells={SIT_BENCH:['bench-west','bench-north','bench-east'],SIT_MAT:['mat'],WAVE:['wave-point'],WALK_DOG:['wave-point']};
function routeVisitorTo(person,targetCellId){
 const start=nearestNavigationCell(person.x,person.y);
 person.targetCellId=targetCellId;
 person.route=routeCells(start.id,targetCellId).map(cell=>[cell.x,cell.y]);
 person.at=Math.hypot(person.x-start.x,person.y-start.y)<20?1:0;
 if(person.at>=person.route.length)person.at=person.route.length-1;
}
function assignVisitorGoal(person){
 const exitId=person.spawnCount%2?'east-exit':'north-exit';
 person.exitCellId=exitId;
 if(person.transit){
  person.goalState='TRANSIT_TO_EXIT';
  routeVisitorTo(person,exitId);
  return;
 }
 person.currentAction=actionKinds[person.actionCycle%actionKinds.length];
 person.goalState=person.currentAction;
 const options=actionCells[person.currentAction];
 const targetId=options[person.actionCycle%options.length];
 routeVisitorTo(person,targetId);
}
function respawnVisitor(person){
 const entrance=CELL_REGISTRY.entrance;
 person.active=true;person.spawnCount++;
 person.x=entrance.x+(person.id-3)*20;person.y=entrance.y;
 person.vx=0;person.vy=0;person.moving=false;person.stuck=0;
 person.actionUntil=0;person.restUntil=0;person.waveUntil=0;
 if(!person.transit)person.actionCycle++;
 assignVisitorGoal(person);
}
function finishVisitorAction(person){
 person.actionUntil=0;person.restUntil=0;person.waveUntil=0;
 if(parkDog?.owner===person)parkDog.active=false;
 person.goalState='EXITING';
 routeVisitorTo(person,person.exitCellId);
}
function beginVisitorAction(person,now){
 const duration={SIT_BENCH:3600,SIT_MAT:4200,WAVE:2100,WALK_DOG:5200}[person.goalState];
 person.actionUntil=now+duration;
 person.facingYaw=CELL_REGISTRY[person.targetCellId].yaw||0;
 if(person.goalState==='SIT_BENCH'||person.goalState==='SIT_MAT')person.restUntil=person.actionUntil;
 if(person.goalState==='WAVE')person.waveUntil=person.actionUntil;
 if(person.goalState==='WALK_DOG'){
  person.dogWalkCenter={x:person.x,y:person.y};
  person.dogWalkAngle=0;
  person.dogWalkDirection=person.id%2?1:-1;
  callDog(person);
 }
}
function routeVisitorAroundObstacle(person){
 if(!person.targetCellId)return;
 person.detourSign=-(person.detourSign||1);
 const nearest=nearestNavigationCell(person.x,person.y);
 person.route=routeCells(nearest.id,person.targetCellId).map(cell=>[cell.x,cell.y]);
 person.at=Math.hypot(person.x-nearest.x,person.y-nearest.y)<20?1:0;
 if(person.at>=person.route.length)person.at=person.route.length-1;
}
function callDog(owner=player){
 const ownerX=owner.player?x:owner.x,ownerY=owner.player?y:owner.y;
 const facing=dogOwnerDirection(owner);
 parkDog={owner,x:ownerX-24,y:ownerY+24,heading:Math.atan2(-facing.y,facing.x),active:true};
 status.textContent='Calling dog';
 return {active:parkDog.active,x:parkDog.x,y:parkDog.y,owner:owner.guest||'player'};
}
function dogOwnerDirection(owner){
 let dx=owner.player?faceX:owner.vx,dy=owner.player?faceY:owner.vy;
 const length=Math.hypot(dx,dy);
 if(length>.08)return {x:dx/length,y:dy/length};
 const yaw=owner.facingYaw||0;
 return {x:Math.sin(yaw),y:Math.cos(yaw)};
}
function stepDog(dt){
 if(!parkDog?.active)return;
 const owner=parkDog.owner,ownerX=owner.player?x:owner.x,ownerY=owner.player?y:owner.y;
 const facing=dogOwnerDirection(owner),alpha=1-Math.exp(-dt*5.2);
 const targetX=ownerX-facing.x*32-facing.y*22;
 const targetY=ownerY-facing.y*32+facing.x*22;
 const moveX=targetX-parkDog.x,moveY=targetY-parkDog.y;
 parkDog.x+=(targetX-parkDog.x)*alpha;
 parkDog.y+=(targetY-parkDog.y)*alpha;
 const targetHeading=Math.hypot(moveX,moveY)>.1?Math.atan2(-moveY,moveX):Math.atan2(-facing.y,facing.x);
 const headingDelta=Math.atan2(Math.sin(targetHeading-parkDog.heading),Math.cos(targetHeading-parkDog.heading));
 parkDog.heading+=headingDelta*(1-Math.exp(-dt*8));
}
window.callParkDog=callDog;
for(const [id,person] of visitors.entries()){
 person.id=id;
 person.active=true;
 person.transit=person.purpose==='transit';
 person.actionCycle=id===5?3:0;
 person.spawnCount=0;
 person.stuck=0;
 assignVisitorGoal(person);
}
window.MatchaParkScene=Object.freeze({
 cells:CELL_REGISTRY,cellAt,routeCells,lighting:()=>blend,
 visitors:()=>visitors.map(person=>({
  guest:person.guest,transit:person.transit,goal:person.goalState,active:person.active,
  x:person.x,y:person.y,moving:person.moving,stuck:person.stuck
 })),
 dogState:()=>parkDog&&{active:parkDog.active,x:parkDog.x,y:parkDog.y,owner:parkDog.owner.guest||'player'}
});
const T=globalThis.MatchaThree;
if(!T)throw new Error('The park 3D renderer could not load.');
const player={player:true,customer:'10'};
let renderer,scene,camera,actors=[],drawFigures=()=>{};
try{
 const assets=await loadParkAssets(T);
 renderer=new T.WebGLRenderer({canvas:figureCanvas,alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setClearColor(0x000000,0);
 renderer.outputColorSpace=T.SRGBColorSpace||T.sRGBEncoding;
 scene=new T.Scene();
 camera=new T.OrthographicCamera(0,1,1,0,.1,1200);
 camera.position.set(0,0,500);camera.lookAt(0,0,0);
 const ambient=new T.HemisphereLight(0xfff0d7,0x697258,.85);
 const sunlight=new T.DirectionalLight(0xffe6be,1.25);
 sunlight.position.set(-180,300,420);
 scene.add(ambient,sunlight);
 const axes={x:new T.Vector3(1,0,0),y:new T.Vector3(0,1,0),z:new T.Vector3(0,0,1)};
 function childBones(bone){return bone.children.filter(child=>child.isBone)}
 function descendantCount(bone){return childBones(bone).reduce((count,child)=>count+1+descendantCount(child),0)}
 function mainChild(bone){return childBones(bone).sort((a,b)=>descendantCount(b)-descendantCount(a))[0]||null}
 function rigControls(rig){
  const root=rig.nodesByName.get('bone_0');
  if(!root)throw new Error('Local park rig has no articulated root bone.');
  const children=childBones(root);
  rig.root.updateMatrixWorld(true);
  const rootPosition=root.getWorldPosition(new T.Vector3());
  const spine=children.find(bone=>{
   const position=bone.getWorldPosition(new T.Vector3());
   return Math.abs(position.x-rootPosition.x)<.035&&position.y>rootPosition.y+.035;
  });
  if(!spine)throw new Error('Local park rig has no spine chain.');
  const spineMid=mainChild(spine),chest=spineMid&&mainChild(spineMid);
  if(!chest)throw new Error('Local park rig has no chest bone.');
  const arms=childBones(chest).filter(bone=>Math.abs(bone.position.x)>.02)
   .sort((a,b)=>a.position.x-b.position.x)
   .map(shoulder=>({side:Math.sign(shoulder.position.x),shoulder,upper:mainChild(shoulder),forearm:mainChild(mainChild(shoulder))}));
  const legs=children.filter(bone=>bone!==spine)
   .sort((a,b)=>a.position.x-b.position.x)
   .map(hip=>({side:Math.sign(hip.position.x),hip,knee:mainChild(hip),ankle:mainChild(mainChild(hip))}));
  return {root,spine,chest,arms,legs};
 }
 function applyPose(actor,mode,time,dt){
  const rotations=new Map(),positions=new Map(),controls=actor.controls;
  const rotate=(bone,axis,angle)=>{if(bone&&angle)rotations.set(bone,{axis:axes[axis],angle})};
  const stride=Math.sin(time*Math.PI*2/880);
  if(mode==='walk'||mode==='walk-dog'){
   controls.legs.forEach(({hip,knee,ankle,side})=>{
    const swing=stride*(side||1);
    rotate(hip,'x',swing*.34);
    rotate(knee,'x',Math.max(0,-swing)*.48);
    rotate(ankle,'x',Math.max(0,swing)*.16);
   });
   controls.arms.forEach(({shoulder,upper,forearm,side})=>{
    const swing=-stride*(side||1)*.24;
    rotate(shoulder,'x',swing);
    rotate(upper,'z',(side||1)*.1);
    rotate(forearm,'x',-.18);
   });
   positions.set(controls.root,{x:actor.rest.get(controls.root).position.x,y:actor.rest.get(controls.root).position.y+Math.abs(Math.sin(time*Math.PI*4/880))*.009,z:actor.rest.get(controls.root).position.z});
  }else if(mode==='sit-bench'||mode==='sit-mat'||mode==='stretch-mat'){
   controls.legs.forEach(({hip,knee,ankle,side})=>{
    const matMode=mode!=='sit-bench';
    rotate(hip,'x',matMode?-1.28:-1.02);
    rotate(hip,'z',matMode?(side||1)*.48:0);
    rotate(knee,'x',matMode?2.16:1.42);
    rotate(ankle,'x',matMode?-.55:-.18);
   });
   controls.arms.forEach(({shoulder,upper,forearm,side})=>{
    rotate(shoulder,'x',-.12);
    rotate(upper,'z',(side||1)*.16);
    rotate(forearm,'x',-.32);
   });
  }else if(mode==='wave'){
   const wave=Math.sin(time*15)*.22;
   controls.arms.forEach(({shoulder,upper,forearm,side})=>{
    if(side>0){rotate(shoulder,'z',1.25);rotate(upper,'x',-.18);rotate(forearm,'x',-.85+wave)}
    else{rotate(shoulder,'z',-.08);rotate(forearm,'x',-.12)}
   });
  }else{
   const breath=Math.sin(time*1.8);
   rotate(controls.chest,'x',breath*.025);
   controls.arms.forEach(({shoulder,forearm,side})=>{
    rotate(shoulder,'z',(side||1)*(.08+breath*.025));
    rotate(forearm,'x',-.12);
   });
   positions.set(controls.root,{x:actor.rest.get(controls.root).position.x,y:actor.rest.get(controls.root).position.y+breath*.004,z:actor.rest.get(controls.root).position.z});
  }
  const blend=1-Math.exp(-dt*10);
  for(const bone of actor.bones){
   const rest=actor.rest.get(bone),turn=rotations.get(bone);
   const target=rest.quaternion.clone();
   if(turn){
    const delta=bone.quaternion.clone().setFromAxisAngle(turn.axis,turn.angle);
    target.multiply(delta);
   }
   bone.quaternion.slerp(target,blend).normalize();
   const position=positions.get(bone)||rest.position;
   bone.position.lerp(position,blend);
  }
 }
 const dogGroup=new T.Group(),dogSphere=new T.SphereGeometry(1,12,8);
 const dogMaterials={
  coat:new T.MeshBasicMaterial({color:0xb9845c}),cream:new T.MeshBasicMaterial({color:0xf0d4a9}),
  ear:new T.MeshBasicMaterial({color:0x855b43}),eye:new T.MeshBasicMaterial({color:0x30251f}),
  collar:new T.MeshBasicMaterial({color:0x718c5d})
 };
 function dogPart(material,px,py,sx,sy){
  const mesh=new T.Mesh(dogSphere,material);
  mesh.position.set(px*1.18,py*1.18,0);mesh.scale.set(sx*1.18,sy*1.18,4.7);mesh.renderOrder=10;
  dogGroup.add(mesh);return mesh;
 }
 dogPart(dogMaterials.coat,0,0,17,9);
 dogPart(dogMaterials.cream,13,4,7,7);
 dogPart(dogMaterials.cream,19,1,5,3);
 dogPart(dogMaterials.ear,10,10,2.7,5);
 dogPart(dogMaterials.ear,16,10,2.7,5);
 dogPart(dogMaterials.eye,16,5,1.1,1.1);
 dogPart(dogMaterials.eye,16,2,1.1,1.1);
 dogPart(dogMaterials.collar,-2,7,7,2);
 const dogTail=dogPart(dogMaterials.coat,-18,5,3,8);
 const dogLegs=[dogPart(dogMaterials.ear,-11,-7,3,6),dogPart(dogMaterials.ear,-4,-7,3,6),
  dogPart(dogMaterials.ear,7,-7,3,6),dogPart(dogMaterials.ear,12,-7,3,6)];
 scene.add(dogGroup);dogGroup.visible=false;
 const leashGeometry=new T.BufferGeometry();
 leashGeometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(18),3));
 leashGeometry.setIndex(new T.Uint16BufferAttribute([0,1,2,2,1,3,2,3,4,4,3,5],1));
 const leash=new T.Mesh(leashGeometry,new T.MeshBasicMaterial({color:0x745a3d,transparent:true,opacity:.9,depthWrite:false,side:T.DoubleSide}));
 leash.frustumCulled=false;leash.visible=false;scene.add(leash);
 function drawDog(){
  if(!parkDog?.active){dogGroup.visible=false;leash.visible=false;return}
  const owner=parkDog.owner,ownerX=owner.player?x:owner.x,ownerY=owner.player?y:owner.y;
  const facing=dogOwnerDirection(owner),dogYaw=parkDog.heading||0;
  dogGroup.visible=true;leash.visible=true;
  dogGroup.position.set(parkDog.x,1152-parkDog.y+10,parkDog.y*.08+20);
  dogGroup.rotation.z=parkDog.heading||0;
  dogTail.rotation.z=Math.sin(animationTime*.012)*.38;
  dogLegs.forEach((leg,index)=>{leg.rotation.z=Math.sin(animationTime*.018+(index%2)*Math.PI)*.18});
  const handX=ownerX+facing.x*12-facing.y*7,handY=1152-ownerY+62;
  const collarX=parkDog.x+Math.cos(dogYaw)*8,collarY=1152-parkDog.y+10+Math.sin(dogYaw)*8;
  const centers=[[handX,handY],[ (handX+collarX)/2,(handY+collarY)/2-8 ],[collarX,collarY]];
  const points=leash.geometry.attributes.position;
  for(let i=0;i<centers.length;i++){
   const before=centers[Math.max(0,i-1)],after=centers[Math.min(centers.length-1,i+1)];
   const dx=after[0]-before[0],dy=after[1]-before[1],length=Math.hypot(dx,dy)||1;
   const ox=-dy/length*1.25,oy=dx/length*1.25;
   const z=((ownerY+parkDog.y)/2)*.08+15;
   points.setXYZ(i*2,centers[i][0]+ox,centers[i][1]+oy,z);
   points.setXYZ(i*2+1,centers[i][0]-ox,centers[i][1]-oy,z);
  }
  points.needsUpdate=true;leash.geometry.computeBoundingSphere();
 }
 function addActor(who){
  const modelId=who.player?'barista':['Hana','Yuki','Mio'].includes(who.guest)?'hiker':'walker';
  const rig=assets.models[modelId].createInstance();
  const bones=rig.skinMeshes[0].skeleton.bones;
  const root=new T.Group();
  root.add(rig.root);
  const displays=rig.skinMeshes.map(source=>{
   source.visible=false;
   const geometry=source.geometry.clone();
   const position=new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*3),3);
   geometry.setAttribute('position',position);
   const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({
    map:source.material.map,side:T.DoubleSide,transparent:source.material.transparent,
    opacity:source.material.opacity,alphaTest:source.material.alphaTest
   }));
   mesh.frustumCulled=false;
   root.add(mesh);
   return {source,mesh,position};
  });
  scene.add(root);
  const actor={
   who,root,rigRoot:rig.root,nodes:rig.nodesByName,bones,displays,rig,
   controls:rigControls(rig),rest:new Map(bones.map(bone=>[bone,{position:bone.position.clone(),quaternion:bone.quaternion.clone()}])),
   modelId
  };
  actors.push(actor);
 }
 addActor(player);
 visitors.forEach(addActor);
 let rendererDpr=0,rendererWidth=0,rendererHeight=0;
 drawFigures=({cx,cy,cw,ch,w,h,dpr,blend:dim,travel,dt})=>{
  if(rendererDpr!==dpr||rendererWidth!==w||rendererHeight!==h){
   renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);
   rendererDpr=dpr;rendererWidth=w;rendererHeight=h;
  }
  camera.left=cx;camera.right=cx+cw;camera.top=1152-cy;camera.bottom=1152-(cy+ch);
  camera.updateProjectionMatrix();
  sunlight.intensity=1.25-dim*.72;
  ambient.intensity=.85+dim*.15;
  for(const actor of actors){
   const person=actor.who;
   const isPlayer=person.player;
   if(!isPlayer&&!person.active){actor.root.visible=false;continue}
   actor.root.visible=true;
   const px=isPlayer?x:person.x,py=isPlayer?y:person.y;
   const busy=isPlayer?testAction==='wave':person.waveUntil&&animationTime<person.waveUntil;
   const resting=isPlayer?seatedNow()||testAction==='up-bench'||testAction==='up-mat':!!person.restUntil;
   const moving=!busy&&(isPlayer?travel>0.35:!!person.moving&&!resting);
   const requested=isPlayer?testAction:person.goalState;
   const sitMode=requested==='SIT_BENCH'?'sit-bench':requested==='SIT_MAT'?'sit-mat':requested==='WALK_DOG'?'walk-dog':null;
   const standing=isPlayer&&(testAction==='up-bench'||testAction==='up-mat');
   const playerSitMode=requested==='sit-start-bench'||requested==='sit-bench'?'sit-bench'
    :requested==='stretch-mat'?'stretch-mat':'sit-mat';
   const dogWalking=person.goalState==='WALK_DOG'&&Boolean(person.actionUntil)&&animationTime<person.actionUntil;
   const mode=busy?'wave':standing?'idle':resting?(isPlayer?playerSitMode:sitMode||'sit-mat')
    :dogWalking?'walk-dog'
    :moving?(parkDog?.active&&parkDog.owner===person?'walk-dog':'walk'):'idle';
   applyPose(actor,mode,animationTime/1000,dt);
   actor.rigRoot.updateMatrixWorld(true);
   for(const display of actor.displays){
    display.source.skeleton.update();
    const vertex=new T.Vector3(),count=display.position.count;
    for(let index=0;index<count;index++){
     display.source.getVertexPosition(index,vertex);
     display.position.setXYZ(index,vertex.x,vertex.y,vertex.z);
    }
    display.position.needsUpdate=true;
   }
   const height=(isPlayer?112:102)+36*py/1152;
   const scale=height/actor.rig.height;
   const vx=isPlayer?faceX:person.vx,vy=isPlayer?faceY:person.vy;
   let desiredYaw=isPlayer&&testAction==='sit-bench'?benchYaw:isPlayer&&(testAction==='sit-mat'||testAction==='sit-start-mat')?yogaMat.yaw:
    (moving?Math.atan2(vx,vy):person.facingYaw??actor.heading??0);
   if(!isPlayer&&moving)person.facingYaw=desiredYaw;
   if(actor.heading===undefined)actor.heading=desiredYaw;
   const yawDelta=Math.atan2(Math.sin(desiredYaw-actor.heading),Math.cos(desiredYaw-actor.heading));
   actor.heading+=yawDelta*(1-Math.exp(-dt*9));
   actor.root.scale.setScalar(scale);
   actor.root.rotation.y=actor.heading;
   actor.root.position.x=px-actor.rig.centerX*scale;
   actor.root.position.y=1152-py-actor.rig.minY*scale;
   actor.root.position.z=py*.08;
  }
  drawDog();
  renderer.render(scene,camera);
 };
}catch(error){
 status.textContent='Local 3D character rigs could not load. Refresh to retry.';
 throw error;
}
last=performance.now();
requestAnimationFrame(tick);
