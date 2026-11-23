import {CELL_REGISTRY,LANDMARKS,cellAt,routeCells,isWalkableCell,nearestLandmark} from './scene-map.js?v=7';
import {loadParkAssets} from './gltf-pipeline.js?v=2';
import {walkCycleFrame} from './animation.js';
import {VISITOR_PATHS,sampleVisitorPath,visitorTarget,findViewEntry} from './visitor-paths.js?v=6';
import {FOREGROUND_POLYGONS,occludesActor,polygonBounds} from './scene-occlusion.js?v=5';
import {resolveSprite,spriteFrame,facingDirection,playerActionKey} from '../shared/sprite-actions.js';

const canvas=document.querySelector('#park'), ctx=canvas.getContext('2d');
const figureCanvas=document.querySelector('#figures');
const characterCanvas=document.querySelector('#character-sprites'),characterCtx=characterCanvas.getContext('2d');
const status=document.querySelector('output');
const loading=document.querySelector('#park-loading'),loadingProgress=document.querySelector('#park-loading-progress');
const loadingLabel=document.querySelector('#park-loading-label');
function setLoadingProgress(value,label){loadingProgress.value=value;loadingLabel.textContent=label}
let loadingWork=0,backgroundError='';
function advanceLoading(amount,label){loadingWork+=amount;setLoadingProgress(loadingWork,label)}
async function load(file){const img=new Image();img.src=file;await img.decode();return img}
const compactForTouch=matchMedia('(pointer: coarse)').matches;
async function loadArtwork(file){
 const image=await load(file);
 if(!compactForTouch||image.width<=2048)return image;
 const compact=document.createElement('canvas');
 compact.width=2048;compact.height=1152;
 compact.getContext('2d').drawImage(image,0,0,compact.width,compact.height);
 return compact;
}
const spriteManifestUrl=new URL('../rigging-test/action-assets.json?v=2',import.meta.url);
const spriteImages=new Map();
async function loadSpriteSheet(url,sheet,action,character){
 const image=await load(url);
 if(image.width%sheet.columns||image.height%sheet.rows)throw new Error(`Invalid sprite dimensions: ${action}:${character}`);
 const cellWidth=image.width/sheet.columns,cellHeight=image.height/sheet.rows;
 const scale=Math.min(1,(compactForTouch?192:320)/cellWidth);
 const compact=document.createElement('canvas');
 compact.width=Math.round(cellWidth*scale)*sheet.columns;
 compact.height=Math.round(cellHeight*scale)*sheet.rows;
 compact.getContext('2d').drawImage(image,0,0,compact.width,compact.height);
 return compact;
}
async function loadCharacterSprites(manifest,character,walkingOnly=false){
 const sprites=new Map();
 const actions=[...new Set([...Object.keys(manifest),'walk_left'])];
 await Promise.all(actions.map(async action=>{
  if(walkingOnly&&!action.startsWith('walk_'))return;
  const sprite=resolveSprite(manifest,action,character);
  if(!sprite)return;
  if(!sprite.sheet)throw new Error(`Park sprite ${action}:${character} must be a sprite sheet.`);
  if(!/^[^/\\]+\.png$/i.test(sprite.file))throw new Error(`Invalid park sprite source: ${sprite.file}`);
  const url=new URL(`sprites/${sprite.file.replace(/\.png$/i,'.webp')}`,import.meta.url).href;
  if(!spriteImages.has(url))spriteImages.set(url,loadSpriteSheet(url,sprite.sheet,action,character));
  const image=await spriteImages.get(url);
  sprites.set(action,{...sprite,image});
 }));
 return sprites;
}
const T=globalThis.MatchaThree;
if(!T)throw new Error('The park 3D renderer could not load.');
const initialNight=clockNightMix(MatchaWorld.clock.read().minutes??480)>=.5;
const artPromise=loadArtwork(initialNight?'world-night.webp':'world-day.webp').then(image=>{
 advanceLoading(40,'Loading park artwork');return image;
}).catch(error=>{status.textContent='Park artwork could not load. Refresh to retry.';throw error});
const buildingImages=new Map();
let buildingPath=MatchaShop.asset(MatchaShop.read().selected,MatchaShop.read().activeDecor);
async function loadBuilding(path){
 if(!buildingImages.has(path))buildingImages.set(path,load(path));
 try{return await buildingImages.get(path)}
 catch(error){buildingImages.delete(path);throw error}
}
const buildingPromise=loadBuilding(buildingPath);
const spritesPromise=(async()=>{
 const response=await fetch(spriteManifestUrl);
 if(!response.ok)throw new Error(`Sprite manifest: HTTP ${response.status}`);
 const manifest=await response.json();
 advanceLoading(3,'Preparing characters');
 const playerSprites=await loadCharacterSprites(manifest,'barista');
 advanceLoading(54,'Loading characters');
 return {manifest,playerSprites};
})().catch(error=>{
 status.textContent='Character sprites could not load. Refresh to retry.';
 throw error;
});
const [initialArt,{manifest,playerSprites},initialBuilding]=await Promise.all([artPromise,spritesPromise,buildingPromise]);
let buildingImage=initialBuilding;
let day=initialNight?null:initialArt,night=initialNight?initialArt:null;
const visitorSprites=new Array(6);
const foreground=FOREGROUND_POLYGONS.map(spec=>({...spec,...polygonBounds(spec.points)}));
function prepareForeground(spec){
 try{
  const mask=document.createElement('canvas');
  mask.width=spec.w;mask.height=spec.h;
  const maskCtx=mask.getContext('2d');
  maskCtx.filter='blur(2px)';
  maskCtx.beginPath();
  spec.points.forEach(([px,py],index)=>index?maskCtx.lineTo(px-spec.x,py-spec.y):maskCtx.moveTo(px-spec.x,py-spec.y));
  maskCtx.closePath();maskCtx.lineWidth=2;maskCtx.stroke();maskCtx.fill();
  for(const [name,art] of [['dayLayer',day||night],['nightLayer',night||day]]){
   const layer=document.createElement('canvas');
   layer.width=spec.w;layer.height=spec.h;
   const layerCtx=layer.getContext('2d');
   layerCtx.drawImage(art,spec.x*art.width/2048,spec.y*art.height/1152,
    spec.w*art.width/2048,spec.h*art.height/1152,0,0,spec.w,spec.h);
   layerCtx.globalCompositeOperation='destination-in';
   layerCtx.drawImage(mask,0,0);
   spec[name]=layer;
  }
 }catch(error){
  status.textContent='Park foreground could not load. Refresh to retry.';
  throw error;
 }
}
let blend=0,blendTarget=0,x=824,y=859,last=0,testAction='normal',actionAt=0,walkVel=0,faceX=0,faceY=1,hanaFacingLeft=false,lastClickFeedback=-Infinity,lastClickX=0,lastClickY=0;
async function readBuildingSelection(){
 const shop=MatchaShop.read();
 const path=MatchaShop.asset(shop.selected,shop.activeDecor);
 if(path===buildingPath)return;
 buildingPath=path;
 try{
  const image=await loadBuilding(path);
  if(path===buildingPath)buildingImage=image;
 }catch(error){
  if(path===buildingPath){
   backgroundError='Café artwork could not load. Refresh to retry.';
   status.textContent=backgroundError;
  }
  console.error('Café artwork could not load.',error);
 }
}
window.addEventListener('storage',readBuildingSelection);
window.addEventListener('matcha-shop',readBuildingSelection);
const hintEl=document.querySelector('#hint');
const playerMarker=document.querySelector('#player-marker');
const waveReward=document.querySelector('#wave-reward');
let clickGoal=null,nearSpot=null,view={cx:0,cy:0,zoom:1},blockedUntil=0;
let parkDog=null;
let animationTime=0;
let hanaWalkDistance=0;
let hanaDirection='down';
let waveFacing='down';
let rewardAt=-Infinity;
let trafficCheckAt=0;
function currentFacing(){return hanaDirection==='side'?(hanaFacingLeft?'left':'right'):hanaDirection}
function currentSprite(){
 const action=playerActionKey(testAction,null,waveFacing);
 return playerSprites.get(action||`walk_${currentFacing()}`)||
  (testAction==='wave'?playerSprites.get('wave_down'):null)||null;
}
function actionDuration(fallback){
 const sheet=currentSprite()?.sheet;
 return sheet&&sheet.playback==='once'?sheet.frames/sheet.fps*1000:fallback;
}
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
}
syncClockLighting();
blend=blendTarget;
window.addEventListener('storage',syncClockLighting);
window.addEventListener('matcha-stock',syncClockLighting);
window.addEventListener('matcha-clock',syncClockLighting);
function setAction(next){
 testAction=next;
 actionAt=animationTime;
}
const keys=new Set(), touches=new Map();
const mapping={w:'up',a:'left',s:'down',d:'right',ArrowUp:'up',ArrowLeft:'left',ArrowDown:'down',ArrowRight:'right'};
onkeydown=e=>{
 if(e.target instanceof Element&&e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
 if(e.key.toLowerCase()==='c'){
  if(!e.repeat)callDog();
  return;
 }
 if(e.key.toLowerCase()==='e'){
  e.preventDefault();
  if(!e.repeat&&nearSpot)nearSpot.go();
  return;
 }
 if(e.target instanceof Element&&e.target.closest('button,summary'))return;
 const k=mapping[e.key]||mapping[e.key.toLowerCase()];if(k){e.preventDefault();keys.add(k)}
};
onkeyup=e=>keys.delete(mapping[e.key]||mapping[e.key.toLowerCase()]);
onblur=()=>{keys.clear();touches.clear()};
for(const b of document.querySelectorAll('[data-key]')){
 b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);touches.set(e.pointerId,b.dataset.key)};
 b.onlostpointercapture=e=>touches.delete(e.pointerId);
}
function allowed(a,b){
 return isWalkableCell(a,b);
}
try{
 const savedPosition=JSON.parse(localStorage.getItem('matcha-park-pause-position')||localStorage.getItem('matcha-garden-player-position')||'null');
 localStorage.removeItem('matcha-park-pause-position');
 localStorage.removeItem('matcha-garden-player-position');
 if(savedPosition&&allowed(savedPosition.x,savedPosition.y)){
  x=savedPosition.x;y=savedPosition.y;
  if(['up','down','side'].includes(savedPosition.direction))hanaDirection=savedPosition.direction;
  hanaFacingLeft=savedPosition.facingLeft===true;
 }
}catch(error){console.warn('Park position could not be restored.',error)}
window.addEventListener('matcha-pause',()=>localStorage.setItem('matcha-park-pause-position',JSON.stringify({x,y,direction:hanaDirection,facingLeft:hanaFacingLeft})));
function closestSpot(){
 if(testAction==='wave')return null;
 const landmark=nearestLandmark(x,y);
 let best=null;
 const cafeNearby=Math.hypot(450-x,590-y)<140;
 const gardenLandmark=landmark?.id==='garden';
 const cafeLandmark=landmark?.id==='cafe';
 if(cafeNearby&&!gardenLandmark){
  best={id:'cafe',x:450,y:590,r:140,label:'Enter Café',go:()=>{
   const position=JSON.stringify({x,y,direction:hanaDirection,facingLeft:hanaFacingLeft});
   localStorage.setItem('matcha-park-pause-position',position);
   location.href='../menu/';
  }};
 }else if(landmark&&(gardenLandmark||cafeLandmark)){
  best={...landmark,...(gardenLandmark?{x,y:y-25}:{}),go:()=>{
   const position=JSON.stringify({x,y,direction:hanaDirection,facingLeft:hanaFacingLeft});
   if(gardenLandmark){
    localStorage.setItem('matcha-garden-return','../park/');
    localStorage.setItem('matcha-garden-player-position',position);
   }else localStorage.setItem('matcha-park-pause-position',position);
   location.href=landmark.href;
  }};
 }
 const pal=visitors.find(person=>person.active&&Math.hypot(person.x-x,person.y-y)<78);
 if(pal&&!gardenLandmark&&!cafeNearby){
  const d=Math.hypot(pal.x-x,pal.y-y);
  if(!best||d<Math.hypot(best.x-x,best.y-y))best={id:'wave-'+pal.guest,x:pal.x,y:pal.y-8,r:78,label:'Wave to '+pal.guest,go:()=>{
   if(testAction==='wave')return;
   faceX=pal.x-x;faceY=pal.y-y;waveFacing=facingDirection(faceX,faceY);
   hanaDirection=waveFacing==='left'||waveFacing==='right'?'side':waveFacing;hanaFacingLeft=waveFacing==='left';
   setAction('wave');
  }};
 }
 return best;
}
function drawCharacters({cx,cy,cw,ch,w,h,dpr,zoom,travel}){
 if(characterCanvas.width!==Math.round(w*dpr)||characterCanvas.height!==Math.round(h*dpr)){
  characterCanvas.width=Math.round(w*dpr);characterCanvas.height=Math.round(h*dpr);
 }
 characterCtx.setTransform(dpr*zoom,0,0,dpr*zoom,-cx*dpr*zoom,-cy*dpr*zoom);
 characterCtx.clearRect(cx-2,cy-2,cw+4,ch+4);
 if(travel>0)hanaWalkDistance+=travel;
 else hanaWalkDistance=0;
 const actors=[{x,y,player:true},...visitors.filter(person=>person.visibility>0)].sort((a,b)=>a.y-b.y);
 for(const actor of actors){
  if(actor.x<cx-180||actor.x>cx+cw+180||actor.y<cy-20||actor.y>cy+ch+220)continue;
  const action=actor.player?playerActionKey(testAction,null,waveFacing):null;
  const sprite=actor.player?currentSprite():actor.sprites.get(`walk_${facingDirection(actor.vx,actor.vy)}`);
  if(!sprite){
   if(actor.player)drawForeground(actor,{left:x-120,right:x+120,top:y-170,bottom:y+15});
   continue;
  }
  const {sheet,image,flipX}=sprite;
  const frame=actor.player
   ?action?spriteFrame(sheet,Math.max(0,animationTime-actionAt))
    :travel>0?walkCycleFrame(hanaWalkDistance,sheet.frames,130):sheet.idleFrame
   :walkCycleFrame(actor.distance,sheet.frames,130);
  const cellWidth=image.width/sheet.columns,cellHeight=image.height/sheet.rows;
  const sourceX=frame%sheet.columns*cellWidth,sourceY=Math.floor(frame/sheet.columns)*cellHeight;
  const height=actor.player?116:116*npcSettings.height/100;
  const scale=height/(cellHeight*sheet.heightFraction),destWidth=cellWidth*scale,destHeight=cellHeight*scale;
  characterCtx.save();
  characterCtx.globalAlpha=actor.player?1:actor.opacity;
  characterCtx.translate(actor.x,0);
  characterCtx.scale(flipX?-1:1,1);
  characterCtx.drawImage(image,sourceX,sourceY,cellWidth,cellHeight,
   -sheet.anchor[0]*destWidth,actor.y-sheet.anchor[1]*destHeight,destWidth,destHeight);
  characterCtx.restore();
  const left=actor.x-(flipX?1-sheet.anchor[0]:sheet.anchor[0])*destWidth;
  const top=actor.y-sheet.anchor[1]*destHeight;
  drawForeground(actor,{left,right:left+destWidth,top,bottom:top+destHeight});
 }
}
function drawForeground(actor,bounds){
 for(const spec of foreground){
  if(!occludesActor(spec,actor,bounds))continue;
  if(!spec.dayLayer)prepareForeground(spec);
  characterCtx.save();
  characterCtx.beginPath();
  characterCtx.rect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top);
  characterCtx.clip();
  let layer=blend<.001?spec.dayLayer:blend>.999?spec.nightLayer:null;
  if(!layer){
   if(!spec.blendLayer){
    spec.blendLayer=document.createElement('canvas');
    spec.blendLayer.width=spec.w;spec.blendLayer.height=spec.h;
   }
   if(spec.blendValue!==blend){
    const blendCtx=spec.blendLayer.getContext('2d');
    blendCtx.clearRect(0,0,spec.w,spec.h);
    blendCtx.globalCompositeOperation='source-over';blendCtx.globalAlpha=1-blend;
    blendCtx.drawImage(spec.dayLayer,0,0);
    blendCtx.globalCompositeOperation='lighter';blendCtx.globalAlpha=blend;
    blendCtx.drawImage(spec.nightLayer,0,0);
    blendCtx.globalAlpha=1;blendCtx.globalCompositeOperation='source-over';
    spec.blendValue=blend;
   }
   layer=spec.blendLayer;
  }
  characterCtx.drawImage(layer,spec.x,spec.y);
  characterCtx.restore();
 }
}
function worldFromEvent(event){
 const box=canvas.getBoundingClientRect();
 return {x:view.cx+(event.clientX-box.left)/view.zoom,y:view.cy+(event.clientY-box.top)/view.zoom};
}
canvas.addEventListener('pointerdown',event=>{
 if(event.button)return;
 const point=worldFromEvent(event);
 lastClickFeedback=performance.now();
 lastClickX=point.x;
 lastClickY=point.y;
 if(!allowed(point.x,point.y)){
  clickGoal=null;blockedUntil=performance.now()+1500;
  status.textContent=nearestLandmark(x,y)?.id==='garden'?'Press E or tap Enter Garden':'Cannot walk there';
  return;
 }
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
 if(testAction==='wave'&&animationTime-actionAt>=actionDuration(1600)){
  const state=MatchaWorld.clock.read();
  const gems=state.gems??0;
  if(!Number.isFinite(gems))throw new Error('Invalid gem balance.');
  state.gems=gems+1;
  localStorage.setItem('matchaVisualState',JSON.stringify(state));
  window.dispatchEvent(new Event('matcha-stock'));
  waveReward.textContent='+1 gem';
  rewardAt=animationTime;
  setAction('normal');
 }
 const active=new Set([...keys,...touches.values()]);
 let dx=Number(active.has('right'))-Number(active.has('left')),dy=Number(active.has('down'))-Number(active.has('up'));
 let len=Math.hypot(dx,dy);const stairs=x>475&&x<737&&y>388&&y<484;
 if(len)clickGoal=null;
 const busy=testAction==='wave';
 const want=busy||!len&&!clickGoal?0:stairs?96:80;
 const ease=want>walkVel?260:340;
 if(walkVel<want)walkVel=Math.min(want,walkVel+ease*dt);
 else walkVel=Math.max(want,walkVel-ease*dt);
 const speed=walkVel,beforeX=x,beforeY=y;
 for(const person of visitors){
  person.visibility=Math.max(0,Math.min(1,person.visibility+(person.active?1:-1)*dt*1.5));
  if(person.visibility===0)continue;
  const previousLeg=Math.floor(person.distance/person.path.length);
  person.distance+=npcSettings.speed*dt;
  if(Math.floor(person.distance/person.path.length)!==previousLeg){
   const next=visitorNames.map((name,index)=>(person.character+index+1)%visitorNames.length)
    .find(index=>visitorSprites[index]&&!visitors.some(other=>other!==person&&other.character===index));
   person.character=next;
   person.guest=visitorNames[next];
   person.sprites=visitorSprites[next];
  }
  Object.assign(person,sampleVisitorPath(person.path,person.distance));
  person.opacity*=person.visibility;
  person.y+=npcSettings.offset;
  person.moving=npcSettings.speed>0;
 }
 if(!len&&clickGoal&&speed>8){
  const gx=clickGoal.x-x,gy=clickGoal.y-y,gd=Math.hypot(gx,gy);
  if(gd<14)clickGoal=null;
  else {dx=gx/gd;dy=gy/gd;len=1}
 }
 if(len&&speed>4&&!busy){
  const mx=dx*dt*speed/(len||1),my=dy*dt*speed*.82/(len||1);
  if(allowed(x+mx,y))x+=mx;
  if(allowed(x,y+my))y+=my;
  faceX=dx;faceY=dy;
  hanaDirection=Math.abs(dx)>Math.abs(dy)?'side':dy<0?'up':'down';
  if(Math.abs(dx)>.05)hanaFacingLeft=dx<0;
  if(clickGoal&&Math.hypot(clickGoal.x-x,clickGoal.y-y)<14)clickGoal=null;
 }
 stepDog(dt);
 const travel=Math.hypot(x-beforeX,y-beforeY);
 if(clickGoal&&speed>4&&dt>0&&!travel){clickGoal=null;blockedUntil=now+1500}
 if(clickGoal)status.textContent='Walking there';
 else status.textContent=backgroundError||((len&&!travel&&!busy||now<blockedUntil)?(nearestLandmark(x,y)?.id==='garden'?'Press E or tap Enter Garden':'Cannot walk there'):stairs?'Stone steps':'');
 nearSpot=closestSpot();
 if(hintEl){
  hintEl.hidden=!nearSpot;
  if(nearSpot)hintEl.querySelector('b').textContent='E · '+nearSpot.label;
 }
 const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio,compactForTouch?1.25:2);
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
 const zoom=Math.max(w/2048,h/1152),cw=w/zoom,ch=h/zoom;
 const cx=Math.max(0,Math.min(2048-cw,x-cw/2)),cy=Math.max(0,Math.min(1152-ch,y-ch/2));
 view={cx,cy,zoom};
 if(now>=trafficCheckAt&&npcSettings.speed>0){
  trafficCheckAt=now+1000;
  const bounds={cx,cy,cw,ch};
  const onScreen=person=>person.x>=cx&&person.x<=cx+cw&&person.y>=cy&&person.y<=cy+ch;
  const activeVisitors=visitors.filter(person=>person.active);
  for(const person of activeVisitors){
   if(onScreen(person)||person.approachView&&
      Math.hypot(person.approachView.cx-cx,person.approachView.cy-cy)>Math.min(cw,ch)/4)person.approachView=null;
  }
  if(!activeVisitors.some(person=>onScreen(person)&&person.opacity>.05)&&!activeVisitors.some(person=>person.approachView)){
   for(const person of activeVisitors){
    if(person.x>=cx-150&&person.x<=cx+cw+150&&person.y>=cy-150&&person.y<=cy+ch+150)continue;
    const distance=findViewEntry(person.path,bounds,npcSettings.offset);
    if(distance===null)continue;
    person.distance=distance;
    Object.assign(person,sampleVisitorPath(person.path,distance));
    person.y+=npcSettings.offset;
    person.approachView=bounds;
    break;
   }
  }
 }
 playerMarker.style.left=(x-cx)*zoom+'px';
 playerMarker.style.top=(y-130-cy)*zoom+'px';
 const rewardProgress=(animationTime-rewardAt)/1400;
 waveReward.hidden=rewardProgress>=1;
 if(!waveReward.hidden){
  waveReward.style.left=(x-cx)*zoom+'px';
  waveReward.style.top=(y-150-cy)*zoom-22*rewardProgress+'px';
  waveReward.style.opacity=String(Math.min(1,(1-rewardProgress)*3));
 }
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 blend=reduce?blendTarget:blend+(blendTarget-blend)*(1-Math.exp(-dt*1.6));
 ctx.setTransform(dpr*zoom,0,0,dpr*zoom,-cx*dpr*zoom,-cy*dpr*zoom);
 ctx.globalAlpha=1;ctx.drawImage(day||night,0,0,2048,1152);
 if(blend>0.001){ctx.globalAlpha=blend;ctx.drawImage(night||day,0,0,2048,1152);ctx.globalAlpha=1}
 if(buildingImage){
  const width=720,height=360;
  const left=450-(width/2);
  const top=520-height;
  ctx.globalAlpha=1-blend*0.15;
  ctx.drawImage(buildingImage,left,top,width,height);
  if(blend>0.1){
   ctx.globalAlpha=blend*0.25;
   const gradient=ctx.createLinearGradient(top,0,top+40,0);
   gradient.addColorStop(0,'#1a141000');
   gradient.addColorStop(0.3,'#1a1410');
   gradient.addColorStop(1,'#1a1410');
   ctx.fillStyle=gradient;
   ctx.fillRect(left,top,width,Math.min(40,height));
   ctx.globalAlpha=blend*0.25;
   ctx.fillStyle='#1a1410';
   ctx.fillRect(left,top+40,width,height-40);
  }
  ctx.globalAlpha=1;
 }
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
 ctx.save();
 ctx.lineJoin='round';ctx.lineCap='round';
 const outlinePulse=reduce?0.65:0.65+0.35*Math.sin(now/700);
 const gold=ctx.createLinearGradient(0,200,0,950);
 gold.addColorStop(0,'#fff1a7');gold.addColorStop(.5,'#e7ad3e');gold.addColorStop(1,'#fff0a0');
 ctx.strokeStyle=gold;ctx.lineWidth=3+outlinePulse;
 ctx.shadowColor='#ffd873';ctx.shadowBlur=7+outlinePulse*7;
 ctx.globalAlpha=.72+outlinePulse*.25;
 for(const landmark of LANDMARKS){
  if(!landmark.outline)continue;
  ctx.beginPath();
  landmark.outline.forEach(([px,py],index)=>index?ctx.lineTo(px,py):ctx.moveTo(px,py));
  ctx.closePath();ctx.stroke();
 }
 ctx.restore();
 ctx.fillStyle='#322e2828';
 ctx.beginPath();ctx.ellipse(x,y+2,9,3.2,0,0,7);ctx.fill();
 if(parkDog?.active){
  ctx.fillStyle='#322e2830';ctx.beginPath();ctx.ellipse(parkDog.x,parkDog.y+3,17,5,0,0,7);ctx.fill();
 }
 for(const person of visitors){
  if(!person.visibility||person.x<cx-100||person.x>cx+cw+100||person.y<cy-20||person.y>cy+ch+180)continue;
  ctx.fillStyle='#322e2828';
  ctx.globalAlpha=person.opacity;
  ctx.beginPath();ctx.ellipse(person.x,person.y+2,11,3.6,0,0,7);ctx.fill();
  if(Math.hypot(person.x-x,person.y-y)>54){
   ctx.textAlign='center';ctx.font='700 13px Georgia,serif';
   const labelY=person.y-116*npcSettings.height/100-9;
   ctx.lineWidth=3;ctx.strokeStyle='#5a3d1ecc';ctx.strokeText(person.guest,person.x,labelY);
   ctx.fillStyle='#fff6dc';ctx.fillText(person.guest,person.x,labelY);
  }
  ctx.globalAlpha=1;
 }
 if(clickGoal){
  const pulse=0.65+Math.sin(now/180)*0.35;
  ctx.strokeStyle=`rgba(120,153,75,0.6)`;
  ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(clickGoal.x,clickGoal.y,34*pulse,16*pulse,0,0,7);ctx.stroke();
  ctx.fillStyle=`rgba(120,153,75,0.2)`;
  ctx.beginPath();ctx.ellipse(clickGoal.x,clickGoal.y,16,7,0,0,7);ctx.fill();
 }
 if(now-lastClickFeedback<300&&lastClickFeedback>=0){
  const scale=1-(now-lastClickFeedback)/300;
  ctx.globalAlpha=0.4*scale;ctx.strokeStyle='#78994b';ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(lastClickX,lastClickY,42*scale,21*scale,0,0,7);ctx.stroke();
 }
 if(nearSpot){
  ctx.strokeStyle='#ffe27acc';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.ellipse(nearSpot.x,nearSpot.y,22,9,0,0,7);ctx.stroke();
 }
 if(hintEl&&!hintEl.hidden&&nearSpot){
  hintEl.style.left=(nearSpot.x-cx)*zoom+'px';
  hintEl.style.top=(nearSpot.y-cy)*zoom+'px';
 }
 drawFigures({cx,cy,cw,ch,w,h,dpr,zoom,blend,travel,walkVel,now,dt});
 if(!currentSprite())ensureRenderer();
 drawCharacters({cx,cy,cw,ch,w,h,dpr,zoom,travel});
 if(!loading.hidden){
  setLoadingProgress(100,'Park ready');loading.hidden=true;
  setTimeout(()=>{loadRemainingVisitors();loadOtherArtwork()},0);
 }
 requestAnimationFrame(tick)
}
const npcSettings={count:2,speed:85,height:85,offset:0};
const visitorNames=['Sota','Hana','Mio','Ken','Ren','Aya'];
const visitors=visitorNames.slice(0,2).map((guest,id)=>{
 const path=VISITOR_PATHS[id%VISITOR_PATHS.length];
 const distance=path.length*(id+2)/7;
 return {id,guest,character:id,path,distance,sprites:null,active:false,visibility:0,
  moving:true,...sampleVisitorPath(path,distance)};
});
function syncTraffic(){
 npcSettings.count=visitorTarget(MatchaWorld.clock.read().minutes??480);
 visitors.forEach((person,index)=>{
  person.active=index<npcSettings.count&&Boolean(person.sprites);
  if(!npcSettings.count)person.visibility=0;
 });
}
async function loadRemainingVisitors(){
 try{
  for(const [index,character] of ['01','02','03','04','05','06'].entries()){
   if(index>=visitors.length)await new Promise(resolve=>setTimeout(resolve,3000));
   visitorSprites[index]=await loadCharacterSprites(manifest,character,true);
   if(index<visitors.length){visitors[index].sprites=visitorSprites[index];syncTraffic()}
  }
 }catch(error){
  console.error('Additional park visitor sprites could not load.',error);
  backgroundError='Some visitors could not load. Refresh to retry.';
 }
}
async function loadOtherArtwork(){
 try{
  const image=await loadArtwork(initialNight?'world-day.webp':'world-night.webp');
  if(initialNight)day=image;else night=image;
  for(const spec of foreground){
   delete spec.dayLayer;delete spec.nightLayer;delete spec.blendValue;
  }
 }catch(error){
  console.error('Additional park artwork could not load.',error);
  backgroundError='Park lighting artwork could not load. Refresh to retry.';
 }
}
window.addEventListener('matcha-clock',syncTraffic);
syncTraffic();
function callDog(owner=player){
 ensureRenderer();
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
window.MatchaParkScene=Object.freeze({
 cells:CELL_REGISTRY,cellAt,routeCells,lighting:()=>blend,
 playerState:()=>({x,y,action:testAction,sprite:currentSprite()?.file}),
 visitors:()=>visitors.map(person=>({
  guest:person.guest,active:person.active,x:person.x,y:person.y,
  moving:person.moving,distance:person.distance
 })),
 dogState:()=>parkDog&&{active:parkDog.active,x:parkDog.x,y:parkDog.y,owner:parkDog.owner.guest||'player'}
});
const player={player:true,customer:'barista'};
let renderer,scene,camera,actors=[],drawFigures=()=>{};
let rendererLoading=null;
function ensureRenderer(){
 if(!rendererLoading)rendererLoading=initializeRenderer();
}
async function initializeRenderer(){
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
  const modelId='barista';
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
 let rendererDpr=0,rendererWidth=0,rendererHeight=0,rendered3d=false;
 drawFigures=({cx,cy,cw,ch,w,h,dpr,blend:dim,travel,dt})=>{
  if(currentSprite()&&!parkDog?.active){
   if(rendered3d){renderer.clear();rendered3d=false}
   return;
  }
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
   if((isPlayer&&currentSprite())||(!isPlayer&&!person.active)){actor.root.visible=false;continue}
   actor.root.visible=true;
   const px=isPlayer?x:person.x,py=isPlayer?y:person.y;
   const busy=isPlayer?testAction==='wave':person.waveUntil&&animationTime<person.waveUntil;
   const moving=!busy&&(isPlayer?travel>0:!!person.moving);
   const dogWalking=person.goalState==='WALK_DOG'&&Boolean(person.actionUntil)&&animationTime<person.actionUntil;
   const mode=busy?'wave':dogWalking?'walk-dog'
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
   let desiredYaw=isPlayer&&testAction==='wave'?Math.atan2(faceX,faceY):
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
  rendered3d=true;
 };
}catch(error){
 backgroundError='Local 3D character rigs could not load. Refresh to retry.';
 status.textContent=backgroundError;
 console.error(backgroundError,error);
}
}
setLoadingProgress(98,'Starting the park');
last=performance.now();
requestAnimationFrame(tick);
