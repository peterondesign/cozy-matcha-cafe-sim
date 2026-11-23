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
let blend=0,blendTarget=0,x=824,y=859,last=0,testAction='normal',actionAt=0,walkVel=0,faceX=0,faceY=1;
const hintEl=document.querySelector('#hint');
let clickGoal=null,nearSpot=null,view={cx:0,cy:0,zoom:1};
function seatedNow(){return testAction==='sit-bench'||testAction==='sit-mat'||testAction==='stretch-mat'}
function setAction(next){
 testAction=next;
 actionAt=performance.now();
 if(next==='sit-bench'){
  const b=nearestBench();
  x=b.sitX;y=b.sitY;
 }
 if(next==='sit-mat'||next==='stretch-mat'){x=yogaMat.x;y=yogaMat.y+10}
}
function standUp(){
 if(!seatedNow())return;
 const from=testAction;
 setAction(from==='sit-bench'?'up-bench':'up-mat');
 setTimeout(()=>setAction('normal'),520);
}
function nearestBench(){
 let best=benches[0],bestD=1e9;
 for(const bench of benches){const d=Math.hypot(bench.x-x,bench.y-y);if(d<bestD){bestD=d;best=bench}}
 return best;
}
const keys=new Set(), touches=new Map();
const mapping={w:'up',a:'left',s:'down',d:'right',ArrowUp:'up',ArrowLeft:'left',ArrowDown:'down',ArrowRight:'right'};
onkeydown=e=>{
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
function tick(now){
 const dt=Math.min(.04,(now-last)/1000);last=now;
 if(testAction==='sit-mat'&&now-actionAt>3600){testAction='stretch-mat';actionAt=now}
 else if(testAction==='stretch-mat'&&now-actionAt>4800){testAction='sit-mat';actionAt=now}
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
  if(person.restUntil){
   if(now<person.restUntil){person.vx=0;person.vy=0;person.moving=false;continue}
   person.restUntil=0;
   person.restedThisStop=true;
  }
  if(person.dir==null)person.dir=1;
  const goal=person.route[person.at];
  if(!goal){person.vx=0;person.vy=0;person.moving=false;continue}
  const gx=goal[0]-person.x,gy=goal[1]-person.y;
  const dist=Math.hypot(gx,gy);
  const step=stroll*dt;
  if(dist<=step+6){
   person.x=goal[0];person.y=goal[1];
   person.vx=0;person.vy=0;person.moving=false;person.stuck=0;
   if(person.purpose==='bench'&&person.at===person.restAt&&!person.restedThisStop){
    person.restUntil=now+person.restDuration;
    continue;
   }
   let next=person.at+person.dir;
   if(next<0||next>=person.route.length){person.dir*=-1;next=person.at+person.dir}
   person.at=Math.max(0,Math.min(person.route.length-1,next));
   if(person.at!==person.restAt)person.restedThisStop=false;
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
  faceX=dx;faceY=dy;
  if(clickGoal&&Math.hypot(clickGoal.x-x,clickGoal.y-y)<14)clickGoal=null;
 }
 const travel=Math.hypot(x-beforeX,y-beforeY);
 if(clickGoal)status.textContent='Walking there';
 else status.textContent=len&&!travel&&!sitting?'Cannot walk there':stairs?'Stone steps':'';
 const nearFriend=visitors.find(person=>Math.hypot(person.x-x,person.y-y)<86);
 if(testAction==='wave'&&nearFriend&&(!nearFriend.waveUntil||now>nearFriend.waveUntil))nearFriend.waveUntil=now+2800;
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
 blend=reduce?blendTarget:blend+Math.sign(blendTarget-blend)*Math.min(Math.abs(blendTarget-blend),dt/20);
 ctx.setTransform(dpr*zoom,0,0,dpr*zoom,-cx*dpr*zoom,-cy*dpr*zoom);
 ctx.globalAlpha=1;ctx.drawImage(day,0,0,2048,1152);
 ctx.globalAlpha=blend;ctx.drawImage(night,0,0,2048,1152);ctx.globalAlpha=1;
 ctx.drawImage(matArt,yogaMat.x-yogaMat.w/2,yogaMat.y-yogaMat.h/2,yogaMat.w,yogaMat.h);
 const onMatNow=testAction==='sit-mat'||testAction==='stretch-mat'||testAction==='up-mat';
 ctx.fillStyle=onMatNow?'#2a24184a':'#322e2828';
 ctx.beginPath();ctx.ellipse(x,y+(onMatNow?6:2),onMatNow?16:9,onMatNow?6:3.2,0,0,7);ctx.fill();
 for(const person of visitors){
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
 {customer:'02',guest:'Hana',purpose:'bench',x:760,y:900,vx:0,vy:0,route:[...gate,[1440,220],[1360,190],[1226,158]],at:3,dir:1,restDuration:6500},
 {customer:'04',guest:'Ren',purpose:'pass',x:1080,y:980,vx:0,vy:0,route:bridge,at:2,dir:1},
 {customer:'05',guest:'Yuki',purpose:'pass',x:900,y:700,vx:0,vy:0,route:[[900,700],[1040,640],[1180,560],[1080,490],[820,540]],at:0,dir:1},
 {customer:'03',guest:'Mio',purpose:'bench',x:780,y:760,vx:0,vy:0,route:[[780,760],[790,580],[680,500],[800,430],[1000,360],[1200,300],[1378,138]],at:0,dir:1,restDuration:7200},
 {customer:'07',guest:'Ken',purpose:'pass',x:1180,y:900,vx:0,vy:0,route:bridge,at:4,dir:-1},
 {customer:'08',guest:'Jun',purpose:'bench',x:920,y:820,vx:0,vy:0,route:[[920,820],[860,780],[800,860],[760,920],[640,990],[800,950],[1000,840],[1200,700],[1400,500],[1440,360],[1470,152]],at:0,dir:1,restDuration:5800},
 {customer:'01',guest:'Sota',purpose:'pass',x:860,y:560,vx:0,vy:0,route:[[860,560],[790,560],[820,500],[1080,460],[1220,400]],at:0,dir:1}
];
for(const person of visitors){
 if(person.purpose==='bench'){
  person.restAt=person.route.length-1;
  const bench=benches[visitors.filter(v=>v.purpose==='bench').indexOf(person)];
  person.route[person.restAt]=[bench.sitX,bench.sitY];
 }
}
const T=globalThis.MatchaThree;
if(!T)throw new Error('The park 3D renderer could not load.');
const player={player:true,customer:'10'};
let renderer,scene,camera,actors=[],drawFigures=()=>{};
try{
 const customerIds=[...new Set([player,...visitors].map(person=>person.customer))];
 const frames=new Map();
 await Promise.all(customerIds.flatMap(customer=>[1,2,3,4,5,6].map(async frame=>{
  const file=`../counter/customers/${customer}/frame_${String(frame).padStart(2,'0')}.png`;
  const image=new Image();
  image.src=file;
  await image.decode();
  const texture=new T.CanvasTexture(image);
  texture.needsUpdate=true;
  texture.colorSpace=T.SRGBColorSpace||T.sRGBEncoding;
  frames.set(`${customer}:${frame}`,texture);
 })));
 renderer=new T.WebGLRenderer({canvas:figureCanvas,alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setClearColor(0x000000,0);
 renderer.outputColorSpace=T.SRGBColorSpace||T.sRGBEncoding;
 scene=new T.Scene();
 camera=new T.OrthographicCamera(0,1,1,0,.1,1200);
 camera.position.set(0,0,500);camera.lookAt(0,0,0);
 const geometry=new T.PlaneGeometry(1,1);
 function addActor(who){
  const initialTexture=frames.get(`${who.customer}:1`);
  const material=new T.MeshBasicMaterial({map:initialTexture,transparent:true,alphaTest:.02,depthWrite:false,side:T.DoubleSide});
  const model=new T.Mesh(geometry,material);
  model.frustumCulled=false;
  scene.add(model);
  const actor={who,model,material,frame:1};
  actors.push(actor);
 }
 addActor(player);
 visitors.forEach(addActor);
 let rendererDpr=0,rendererWidth=0,rendererHeight=0;
 drawFigures=({cx,cy,cw,ch,w,h,dpr,blend:dim,travel,now,dt})=>{
  if(rendererDpr!==dpr||rendererWidth!==w||rendererHeight!==h){
   renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);
   rendererDpr=dpr;rendererWidth=w;rendererHeight=h;
  }
  camera.left=cx;camera.right=cx+cw;camera.top=1152-cy;camera.bottom=1152-(cy+ch);
  camera.updateProjectionMatrix();
  const ordered=[player,...visitors].sort((a,b)=>(a.player?y:a.y)-(b.player?y:b.y));
  for(const person of ordered){
   const actor=actors.find(entry=>entry.who===person);
   if(!actor)continue;
   const isPlayer=person.player;
   const px=isPlayer?x:person.x,py=isPlayer?y:person.y;
   const busy=isPlayer?testAction==='wave':person.waveUntil&&now<person.waveUntil;
   const resting=isPlayer?seatedNow()||testAction==='up-bench'||testAction==='up-mat':!!person.restUntil;
   const moving=!busy&&(isPlayer?travel>0.35:!!person.moving&&!resting);
   const mode=busy?'wave':resting
    ?(isPlayer?testAction:person.purpose==='bench'?'sit-bench':'sit-mat')
    :moving?(person.walk||'walk'):null;
   const frame=mode==='wave'?6:mode&&mode.startsWith('walk')
    ?1+Math.floor(now/135)%6
    :1+Math.floor(now/700)%2;
   if(actor.frame!==frame){
    actor.material.map=frames.get(`${person.customer}:${frame}`);
    actor.material.needsUpdate=true;
    actor.frame=frame;
   }
   const height=(isPlayer?112:102)+36*py/1152;
   const sitting=mode==='sit-bench'||mode==='sit-mat'||mode==='stretch-mat';
   const figureHeight=height*(sitting?.76:1);
   const image=actor.material.map.image;
   actor.model.scale.set(image.width/image.height*figureHeight,figureHeight,1);
   if((isPlayer?faceX:person.vx)<-.1)actor.model.scale.x*=-1;
   actor.model.position.x=px;
   actor.model.position.y=1152-py+figureHeight/2;
   actor.model.position.z=0;
   actor.model.renderOrder=Math.round(py);
   actor.material.color.setScalar(1-dim*.16);
  }
  renderer.render(scene,camera);
 };
}catch(error){
 status.textContent='3D character assets could not load. Refresh to retry.';
 throw error;
}
last=performance.now();
requestAnimationFrame(tick);
