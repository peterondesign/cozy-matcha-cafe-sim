const canvas=document.querySelector('canvas'), ctx=canvas.getContext('2d');
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
let blend=0,blendTarget=0,x=824,y=859,direction=0,flip=false,stride=0,last=0,faceX=0,faceY=1,testAction='normal',actionAt=0,seated=false,walkVel=0,benchYaw=0,matYaw=yogaMat.yaw;
const hintEl=document.querySelector('#hint');
let clickGoal=null,nearSpot=null,view={cx:0,cy:0,zoom:1},faceYaw=0;
function seatedNow(){return testAction==='sit-bench'||testAction==='sit-mat'||testAction==='stretch-mat'}
function setAction(next){
 testAction=next;
 actionAt=performance.now();
 seated=next==='sit-bench'||next==='sit-mat'||next==='stretch-mat';
 if(next==='up-bench'||next==='up-mat'||next==='normal'||next==='wave')seated=false;
}
function standUp(){
 if(!seatedNow())return;
 const from=testAction;
 setAction(from==='sit-bench'?'up-bench':'up-mat');
 setTimeout(()=>setAction('normal'),520);
}
function nearPoint(spot,range=70){return Math.hypot(spot.x-x,spot.y-y)<range}
function nearestBench(){
 let best=benches[0],bestD=1e9;
 for(const bench of benches){const d=Math.hypot(bench.x-x,bench.y-y);if(d<bestD){bestD=d;best=bench}}
 return best;
}
const keys=new Set(), touches=new Map();
const mapping={w:'up',a:'left',s:'down',d:'right',ArrowUp:'up',ArrowLeft:'left',ArrowDown:'down',ArrowRight:'right'};
onkeydown=e=>{const k=mapping[e.key]||mapping[e.key.toLowerCase()];if(k){e.preventDefault();keys.add(k)}};
onkeyup=e=>keys.delete(mapping[e.key]||mapping[e.key.toLowerCase()]);
onblur=()=>{keys.clear();touches.clear()};
for(const b of document.querySelectorAll('[data-key]')){
 b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);touches.set(e.pointerId,b.dataset.key)};
 b.onlostpointercapture=e=>touches.delete(e.pointerId);
}
document.querySelector('#light').onclick=e=>{blendTarget=blendTarget>.5?0:1;e.target.textContent=blendTarget?'Day':'Night'};
const trunks=[[1074,512,22],[220,200,70],[430,90,55],[1604,250,40],[80,400,50],[860,1088,48]];
function allowed(a,b){
 if(a<60||a>1990||b<70||b>1120)return false;
 if(a>1520&&b<520)return false;
 if(a>1460&&b>990)return false;
 for(const [tx,ty,tr] of trunks){if(Math.hypot(a-tx,b-ty)<tr)return false}
 return true;
}
try{
 const savedPosition=JSON.parse(localStorage.getItem('matcha-garden-player-position')||'null');
 localStorage.removeItem('matcha-garden-player-position');
 if(savedPosition&&allowed(savedPosition.x,savedPosition.y)){x=savedPosition.x;y=savedPosition.y}
}catch{}
function clearOf(a,b,self,pad=32){
 if(!self)return true;
 for(const person of visitors){
  if(person===self)continue;
  if(Math.hypot(person.x-a,person.y-b)<pad)return false;
 }
 return true;
}
const spots=[
 {id:'garden',x:760,y:920,r:110,label:'Enter Garden',go:()=>{localStorage.setItem('matcha-garden-return','../park/');localStorage.setItem('matcha-garden-player-position',JSON.stringify({x,y}));location.href='../garden/'}},
 {id:'mat',x:yogaMat.x,y:yogaMat.y,r:92,label:'Sit on yoga mat',kind:'sit',go:()=>setAction('sit-mat')},
 ...benches.map(bench=>({id:bench.id,x:bench.x,y:bench.y,r:78,label:'Sit on bench',kind:'sit',go:()=>{const b=nearestBench();x=b.sitX;y=b.sitY;benchYaw=b.yaw;setAction('sit-bench')}})),
 {id:'shop',x:1660,y:580,r:96,label:'Village Grocer',go:()=>{location.href='grocer.html'}}
];
function closestSpot(){
 if(seatedNow())return null;
 let best=null,bestD=1e9;
 for(const spot of spots){
  const d=Math.hypot(spot.x-x,spot.y-y);
  if(d<spot.r&&d<bestD){best=spot;bestD=d}
 }
 const pal=visitors.find(person=>Math.hypot(person.x-x,person.y-y)<78);
 if(pal){
  const d=Math.hypot(pal.x-x,pal.y-y);
  if(d<bestD)best={id:'wave-'+pal.guest,x:pal.x,y:pal.y-8,r:78,label:'Wave to '+pal.guest,go:()=>{setAction('wave');pal.waveUntil=performance.now()+2800;setTimeout(()=>setAction('normal'),1600)}};
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
function yawFrom(fx,fy){
 return Math.atan2(fx, fy)+Math.PI;
}
function tick(now){
 const dt=Math.min(.04,(now-last)/1000);last=now;
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
 const stroll=20;
 for(const person of visitors){
  if(person.waveUntil&&now<person.waveUntil){person.vx=0;person.vy=0;person.moving=false;continue}
  if(person.dir==null)person.dir=1;
  const goal=person.route[person.at];
  if(!goal){person.vx=0;person.vy=0;person.moving=false;continue}
  const gx=goal[0]-person.x,gy=goal[1]-person.y;
  const dist=Math.hypot(gx,gy);
  const step=stroll*dt;
  if(dist<=step+6){
   person.x=goal[0];person.y=goal[1];
   person.vx=0;person.vy=0;person.moving=false;person.stuck=0;
   let next=person.at+person.dir;
   if(next<0||next>=person.route.length){person.dir*=-1;next=person.at+person.dir}
   person.at=Math.max(0,Math.min(person.route.length-1,next));
   continue;
  }
  const ux=gx/dist,uy=gy/dist;
  const nx=person.x+ux*step,ny=person.y+uy*step;
  const sideX=person.x-uy*step*2,sideY=person.y+ux*step*2;
  if(allowed(nx,ny)&&clearOf(nx,ny,person)){person.x=nx;person.y=ny;person.vx=ux;person.vy=uy;person.moving=true;person.stuck=0}
  else if(allowed(person.x,ny)&&clearOf(person.x,ny,person)){person.y=ny;person.vy=uy;person.vx=0;person.moving=true;person.stuck=0}
  else if(allowed(nx,person.y)&&clearOf(nx,person.y,person)){person.x=nx;person.vx=ux;person.vy=0;person.moving=true;person.stuck=0}
  else if(allowed(sideX,sideY)&&clearOf(sideX,sideY,person,26)){person.x=sideX;person.y=sideY;person.vx=-uy;person.vy=ux;person.moving=true;person.stuck=0}
  else {
   person.stuck=(person.stuck||0)+dt;
   person.vx=0;person.vy=0;person.moving=false;
   if(person.stuck>0.9){person.dir*=-1;person.stuck=0}
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
  direction=Math.abs(dx)>Math.abs(dy)?1:dy<0?2:0;flip=direction===1&&dx<0;faceX=dx;faceY=dy;
  if(clickGoal&&Math.hypot(clickGoal.x-x,clickGoal.y-y)<14)clickGoal=null;
 }
 const travel=Math.hypot(x-beforeX,y-beforeY);stride+=travel/12;
 if(clickGoal)status.textContent='Walking there';
 else status.textContent=len&&!travel&&!sitting?'Cannot walk there':stairs?'Stone steps':'';
 const nearFriend=visitors.find(person=>Math.hypot(person.x-x,person.y-y)<86);
 if(testAction==='wave'&&nearFriend&&(!nearFriend.waveUntil||now>nearFriend.waveUntil))nearFriend.waveUntil=now+2800;
 nearSpot=closestSpot();
 if(hintEl){
  hintEl.hidden=!nearSpot;
  if(nearSpot)hintEl.querySelector('b').textContent=nearSpot.label;
 }
 const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio,2);
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
 const zoom=Math.max(w/2048,h/1152),cw=w/zoom,ch=h/zoom;
 const cx=Math.max(0,Math.min(2048-cw,x-cw/2)),cy=Math.max(0,Math.min(1152-ch,y-ch/2));
 view={cx,cy,zoom};
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 blend=reduce?blendTarget:blend+Math.sign(blendTarget-blend)*Math.min(Math.abs(blendTarget-blend),dt/20);
 ctx.setTransform(dpr*zoom,0,0,dpr*zoom,-cx*dpr*zoom,-cy*dpr*zoom);
 ctx.globalAlpha=1;ctx.drawImage(day,0,0,2048,1152);
 ctx.globalAlpha=blend;ctx.drawImage(night,0,0,2048,1152);ctx.globalAlpha=1;
 ctx.drawImage(matArt,yogaMat.x-yogaMat.w/2,yogaMat.y-yogaMat.h/2,yogaMat.w,yogaMat.h);
 const onMatNow=testAction==='sit-mat'||testAction==='stretch-mat'||testAction==='up-mat';
 ctx.fillStyle=onMatNow?'#2a24184a':'#322e2828';
 ctx.beginPath();ctx.ellipse(x,y+(onMatNow?6:2),onMatNow?16:9,onMatNow?6:3.2,0,0,7);ctx.fill();
 for(const person of visitors){
  const tone=person.file==='hiker'?'#3d8a86':person.file==='grocer'?'#8a6bb0':'#d4895a';
  ctx.fillStyle=tone+'cc';
  ctx.beginPath();ctx.ellipse(person.x,person.y+2,11,3.6,0,0,7);ctx.fill();
  ctx.fillStyle=tone;
  ctx.beginPath();ctx.ellipse(person.x,person.y-38,9,11,0,0,7);ctx.fill();
  ctx.beginPath();ctx.ellipse(person.x,person.y-18,12,16,0,0,7);ctx.fill();
  ctx.fillStyle='#f3d2b8';
  ctx.beginPath();ctx.ellipse(person.x,person.y-52,7,8,0,0,7);ctx.fill();
  if(Math.hypot(person.x-x,person.y-y)>54){
   ctx.fillStyle='#fff6dccc';ctx.strokeStyle='#5a3d1ecc';ctx.lineWidth=2;
   ctx.font='700 13px Georgia,serif';ctx.textAlign='center';
   ctx.strokeText(person.guest,person.x,person.y-58);
   ctx.fillText(person.guest,person.x,person.y-58);
  }
 }
 const starY=y-(82+42*y/1152)-28;
 ctx.drawImage(starArt,x-12,starY,24,24);
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
 drawFigures({cx,cy,cw,ch,w,h,dpr,zoom,blend,travel,walkVel});
 if(canopy&&canopyCtx){
  if(canopy.width!==canvas.width||canopy.height!==canvas.height){canopy.width=canvas.width;canopy.height=canvas.height}
  canopyCtx.setTransform(dpr*zoom,0,0,dpr*zoom,-cx*dpr*zoom,-cy*dpr*zoom);
  canopyCtx.clearRect(cx-2,cy-2,cw+4,ch+4);
  const bodies=[{x,y},...visitors];
  for(const spec of overlayData){
   if(!spec.img)continue;
   const behind=bodies.some(body=>body.x>spec.x&&body.x<spec.x+spec.w&&body.y>spec.y&&body.y<spec.sortY);
   if(!behind)continue;
   canopyCtx.drawImage(spec.img,spec.x,spec.y,spec.w,spec.h);
  }
 }
 requestAnimationFrame(tick)
}
const gate=[[430,1040],[520,1036],[640,990],[760,920],[800,760],[790,640],[820,540],[1080,490],[1220,440],[1340,300],[1480,240]];
const bridge=[[1760,860],[1680,900],[1500,980],[1280,1040],[1160,1072],[1000,1000],[840,900],[760,920],[640,990],[520,1036]];
const visitors=[
 {file:'walker',guest:'Hana',x:760,y:900,vx:0,vy:0,route:gate,at:3,dir:1,walk:'walk-femme'},
 {file:'hiker',guest:'Ren',x:1080,y:980,vx:0,vy:0,route:bridge,at:2,dir:1,walk:'walk-hiker'},
 {file:'grocer',guest:'Yuki',x:900,y:700,vx:0,vy:0,route:[[900,700],[1040,640],[1180,560],[1080,490],[820,540]],at:0,dir:1,walk:'walk-femme'},
 {file:'walker',guest:'Mio',x:780,y:760,vx:0,vy:0,route:[[780,760],[790,580],[680,500],[790,580],[800,760]],at:0,dir:1,walk:'walk-femme'},
 {file:'hiker',guest:'Ken',x:1180,y:900,vx:0,vy:0,route:bridge,at:4,dir:-1,walk:'walk-hiker'},
 {file:'grocer',guest:'Jun',x:920,y:820,vx:0,vy:0,route:[[920,820],[860,780],[800,860],[760,920],[640,990]],at:0,dir:1,walk:'walk-femme'},
 {file:'walker',guest:'Sota',x:860,y:560,vx:0,vy:0,route:[[860,560],[790,560],[820,500],[1080,460],[1220,400]],at:0,dir:1,walk:'walk-femme'}
];
let drawFigures=()=>{};
const T=globalThis.MatchaThree;
if(T){
 const viewEl=document.querySelector('#figures');
 const renderer=new T.WebGLRenderer({canvas:viewEl,alpha:true,antialias:true});
 renderer.setClearColor(0x000000,0);
 renderer.outputColorSpace=T.SRGBColorSpace||T.sRGBEncoding;
 const scene=new T.Scene();
 const hemi=new T.HemisphereLight(0xfff8ea,0x7a9164,2.1);
 scene.add(hemi);
 const sun=new T.DirectionalLight(0xfff7ea,1.8);sun.position.set(-40,80,60);scene.add(sun);
 const camera=new T.OrthographicCamera(0,1,1,0,-800,800);
 const people=[];
 const loader=new T.GLTFLoader();
 const motions=['walk','walk-femme','walk-hiker','walk-dog','sit-bench','sit-mat','stretch-mat','wave'];
 const library={};
 for(const name of motions)loader.load('characters/test/motion/'+name+'.glb',motion=>{if(motion.animations[0])library[name]=motion.animations[0]});
 function spawnActor(who,root){
  const box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3());
  const holder=new T.Group();
  const fit=110/size.y;
  root.scale.setScalar(fit);
  root.position.set(-(box.min.x+size.x/2)*fit,-box.min.y*fit,-(box.min.z+size.z/2)*fit);
  root.traverse(node=>{
   if(node.isBone)node.userData.rest=node.quaternion.clone();
   if(!node.isMesh)return;
   const src=Array.isArray(node.material)?node.material[0]:node.material;
   const map=src&&src.map;
   if(map){
    if(map.colorSpace!=null)map.colorSpace=T.SRGBColorSpace||map.colorSpace;
    map.generateMipmaps=false;
    map.needsUpdate=true;
   }
   node.material=new T.MeshBasicMaterial({
    map,
    color:0xffffff,
    side:T.DoubleSide,
    depthTest:false,
    depthWrite:false
   });
   node.frustumCulled=false;
  });
  const group=new T.Group();
  group.visible=true;
  group.frustumCulled=false;
  holder.rotation.y=0;
  group.add(holder);holder.add(root);scene.add(group);
  const actor={group,holder,who,rig:null,playing:'',walkName:who.walk||(who.file==='hiker'?'walk-hiker':'walk-femme')};
  if(root.getObjectByName('mixamorigHips')){
   actor.mixer=new T.AnimationMixer(root);
   actor.hips=root.getObjectByName('mixamorigHips');
   actor.hips.userData.restPos=actor.hips.position.clone();
  }
  people.push(actor);
  return actor;
 }
 function playClip(person,mode,clipName,reverse,rate){
  const clip=library[clipName]||library[person.walkName]||library.walk;
  if(!clip||!person.mixer)return;
  person.playing=mode;
  person.mixer.stopAllAction();
  const loop=mode==='walk'||mode==='walk-femme'||mode==='walk-hiker'||mode==='walk-dog'||mode==='stretch-mat';
  const act=person.mixer.clipAction(clip);
  act.enabled=true;
  act.setLoop(loop?2201:T.LoopOnce,loop?Infinity:1);
  act.clampWhenFinished=!loop;
  act.reset();
  const walk=mode==='walk'||mode==='walk-femme'||mode==='walk-hiker'||mode==='walk-dog';
  act.timeScale=reverse?-1:walk?(rate||0.88):1;
  act.paused=false;
  act.weight=1;
  act.play();
  if(reverse)act.time=clip.duration;
  if(mode==='stand'){act.paused=true;act.time=Math.min(.32,clip.duration*.16);act.weight=1}
  person.act=act;
 }
 const cast=[{file:'barista',player:true,walk:'walk-femme'},...visitors];
 cast.forEach((who,index)=>{
  loader.load('characters/test/'+who.file+'-uthana.glb?npc='+index,gltf=>spawnActor(who,gltf.scene));
 });
 const footV=new T.Vector3();
 const footBones=['mixamorigLeftToeBase','mixamorigRightToeBase','mixamorigLeftFoot','mixamorigRightFoot'];
 let motionClock=performance.now();
 drawFigures=({cx,cy,cw,ch,w,h,dpr,blend:dim,travel,walkVel:vel})=>{
 try{
  const now=performance.now(),motionDt=Math.min(.05,(now-motionClock)/1000);motionClock=now;
  renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);
  camera.left=cx;camera.right=cx+cw;camera.top=1152-cy;camera.bottom=1152-(cy+ch);camera.position.set(0,0,400);camera.lookAt(0,0,0);camera.updateProjectionMatrix();
  const playerH=82+42*y/1152;
  people.sort((a,b)=>(a.who.player?y:a.who.y)-(b.who.player?y:b.who.y));
  for(const person of people){
   const visitorBusy=person.who.waveUntil&&now<person.who.waveUntil;
   const moving=person.who.player?travel>0.35:!!person.who.moving&&!visitorBusy;
   const px=person.who.player?x:person.who.x,py=person.who.player?y:person.who.y;
   const hNow=person.who.player?playerH:82+42*py/1152;
   person.group.position.set(px,1152-py,0);
   person.group.scale.setScalar(hNow/88);
   person.group.renderOrder=py;
   person.group.traverse(node=>{if(node.isMesh)node.renderOrder=py});
   const fx=person.who.player?faceX:person.who.vx,fy=person.who.player?faceY:person.who.vy;
   const sx=Math.abs(fx||0),sy=Math.abs(fy||0);
   const seatedPose=person.who.player&&(testAction==='sit-bench'||testAction==='up-bench'||testAction==='sit-mat'||testAction==='up-mat'||testAction==='stretch-mat');
   if(sx+sy>0.02&&!seatedPose)person.holder.rotation.set(0,yawFrom(fx,fy),0);
   if(person.mixer){
    const mine=person.who.player?testAction:(visitorBusy?'wave':'normal');
    const onBench=person.who.player&&(mine==='sit-bench'||mine==='up-bench');
    const onMat=person.who.player&&(mine==='sit-mat'||mine==='up-mat'||mine==='stretch-mat');
    if(onBench&&person.playing!==mine){
     const best=nearestBench();
     x=best.sitX;y=best.sitY;benchYaw=best.yaw;
    }
    if(onMat&&person.playing!==mine){x=yogaMat.x;y=yogaMat.y+10;matYaw=yogaMat.yaw}
    if(person.who.player)person.group.position.set(x,1152-y,0);
    if(onBench)person.holder.rotation.set(0,benchYaw,0);
    if(onMat)person.holder.rotation.set(0,matYaw,0);
    const idleWalk=person.walkName==='walk-hiker'?(library['walk-hiker']?'walk-hiker':'walk'):(person.walkName||'walk-femme');
    const mode=mine==='normal'?(moving?idleWalk:'stand'):mine;
    const clipName=mode==='stand'?idleWalk:mode==='up-bench'?'sit-bench':mode==='up-mat'?'sit-mat':mode;
    const rate=0.7+0.45*Math.min(1,(vel||0)/148);
    if(person.playing!==mode)playClip(person,mode,clipName,mine.startsWith('up-'),rate);
    else if(person.act&&(mode==='walk'||mode==='walk-femme'||mode==='walk-hiker')&&person.who.player)person.act.timeScale=rate;
    person.mixer.update(motionDt);
    person.group.visible=true;
    if(person.hips&&person.hips.userData.restPos){
     person.hips.position.x=person.hips.userData.restPos.x;
     person.hips.position.z=person.hips.userData.restPos.z;
    }
    person.group.updateWorldMatrix(true,true);
    let low=Infinity;
    for(const name of footBones){
     const bone=person.group.getObjectByName(name);
     if(!bone)continue;
     bone.getWorldPosition(footV);
     if(footV.y<low)low=footV.y;
    }
    const anchorY=person.who.player?y:py;
    if(low<Infinity&&Math.abs(1152-anchorY-low)<80)person.group.position.y+=1152-anchorY-low+(onMat?8:onBench?4:0);
    if(!Number.isFinite(person.group.position.x))person.group.position.x=px;
    if(!Number.isFinite(person.group.position.y))person.group.position.y=1152-py;
   }
  }
  hemi.intensity=2.1-dim*0.7;
  sun.intensity=1.8-dim*0.6;
  renderer.render(scene,camera);
 }catch(error){if(status)status.textContent=error.message}
 };
}
last=performance.now();
requestAnimationFrame(tick);
