// All distances are metres. Packages use the same meshes on shelves and in the cart.
async function buildMarket(canvas) {
  const T = MatchaThree;
  const renderer = new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));

  async function texture(path,x=1,y=1) {
    const image=new Image(); image.src=path; await image.decode();
    const tex=new T.CanvasTexture(image); tex.colorSpace=T.SRGBColorSpace;
    tex.wrapS=tex.wrapT=1000 /* RepeatWrapping */; tex.repeat.set(x,y);
    tex.anisotropy=Math.min(6,renderer.capabilities.getMaxAnisotropy()); return tex;
  }
  const [wood,tiles,weave,cloth,day,night,clerk,flowers,clouds,...icons]=await Promise.all([
    texture('market/cedar.webp'),texture('market/tiles.webp',3,5),texture('market/wicker.webp',2,1),
    texture('market/linen.webp'),texture('../../counter/park-day.webp'),texture('../../counter/park-night.webp'),texture('../../counter/customers/02/frame_06.png'),texture('market/blossom.webp'),texture('market/skylight.webp'),
    ...MatchaPantry.ITEMS.map(i=>texture(MatchaPantry.icon(i[0])))
  ]);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(64,1,.04,65);
  scene.add(camera);
  const sky=new T.HemisphereLight(0xfff0d3,0xc69c79,1.75);
  const sun=new T.DirectionalLight(0xffe3aa,1.55);sun.position.set(-4,6,3);scene.add(sky,sun);
  const palettes=new Map(), box=new T.BoxGeometry(), ball=new T.SphereGeometry(.5,12,10),
    tin=new T.CylinderGeometry(.5,.5,1,20), flat=new T.PlaneGeometry(), leaf=new T.SphereGeometry(.5,6,4);
  function color(hex){if(!palettes.has(hex))palettes.set(hex,new T.MeshStandardMaterial({color:hex}));return palettes.get(hex);}
  const mat=(map,tint=0xffffff)=>new T.MeshStandardMaterial({map,color:tint});
  const timber=mat(wood),darkWood=mat(wood,0xa97d59),reeds=mat(weave),linen=mat(cloth);
  const pose=new T.Object3D(), batches=new Map();
  function part(shape,material,x,y,z,w,h,d,ry=0,rz=0,rx=0,parent=null){
    const m=typeof material==='string'?color(material):material;
    pose.position.set(x,y,z);pose.rotation.set(rx,ry,rz,'YXZ');pose.scale.set(w,h,d);pose.updateMatrix();
    if(parent){const mesh=new T.Mesh(shape,m);mesh.applyMatrix4(pose.matrix);parent.add(mesh);return mesh;}
    const key=shape.uuid+m.uuid;
    if(!batches.has(key))batches.set(key,{shape,m,poses:[]});
    batches.get(key).poses.push(pose.matrix.clone());
  }
  function plaque(text,accent='#53663d',size=43){
    const c=document.createElement('canvas');c.width=640;c.height=144;const g=c.getContext('2d');
    g.fillStyle='#fff0d0';g.fillRect(0,0,c.width,c.height);
    g.strokeStyle='#91693f';g.lineWidth=7;g.strokeRect(5,5,630,134);g.lineWidth=2;g.strokeRect(13,13,614,118);
    g.textAlign='center';g.textBaseline='middle';g.fillStyle=accent;g.font='bold '+size+'px Georgia';g.fillText(text,320,74,586);
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return new T.MeshBasicMaterial({map:tex});
  }
  const outside=new T.MeshBasicMaterial({map:day});
  part(box,mat(tiles),0,-.10,-.3,9,.18,18);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
  const sg=shadowCanvas.getContext('2d'),falloff=sg.createRadialGradient(64,64,4,64,64,64);
  falloff.addColorStop(0,'rgba(63,38,20,.36)');falloff.addColorStop(1,'rgba(63,38,20,0)');sg.fillStyle=falloff;sg.fillRect(0,0,128,128);
  const shade=new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false});
  // Continuous windows give the garden parallax beyond the timber frame.
  part(flat,outside,0,2.3,-10,17,8,1);
  for(const side of [-1,1]){
    part(flat,outside,side*5.1,2.25,0,22,6.7,1,-side*Math.PI/2);
    part(box,timber,side*4.2,.57,0,.16,1.15,18);
    for(let z=-8;z<=8;z+=2){
      part(box,darkWood,side*4.18,2.39,z,.16,4.8,.13);
      part(box,timber,side*4.18,3,z,.08,.08,2.03);
    }
  }
  // A glass ridge with a view of the sky and a framed entrance behind the player.
  part(flat,outside,0,2.6,9.8,16,7.5,1,Math.PI);
  for(const x of [-3.12,3.12])part(box,'#efce9a',x,4.78,0,2.12,.13,18);
  for(const x of [-2.05,2.05])part(box,darkWood,x,4.7,0,.12,.14,18);
  for(const x of [-3.8,-1.42,1.42,3.8])part(box,timber,x,2.15,8.4,.15,4.3,.15);
  part(box,darkWood,0,3.2,8.4,8.5,.24,.23);
  part(flat,plaque('Village garden'),0,2.78,8.39,1.65,.38,1,Math.PI);
  const skylight=new T.MeshBasicMaterial({map:clouds});
  part(flat,skylight,0,6.7,0,24,27,1,0,0,Math.PI/2);
  const blooms=new T.MeshBasicMaterial({map:flowers,transparent:true,alphaTest:.34,side:T.DoubleSide});
  for (const z of [-6.6,-3,.6,4.2,7.3]){
    for(const side of [-1,1]){
      part(flat,blooms,side*2.76,3.32,z,2.60,1.38,1,-side*.58,side*.13);
      part(flat,blooms,side*3.0,3.24,z+.6,2.4,1.09,1,-side*1.3,-side*.18);
    }
  }
  for(let z=-8;z<=8;z+=2.65){
    part(box,darkWood,0,4.56,z,8.6,.26,.22);
    for(const side of [-1,1])part(box,timber,side*3.77,4.15,z,.16,1.26,.16,0,-side*.72);
  }
  for(const x of [-3.85,0,3.85])part(box,darkWood,x,2.24,-7.95,.18,4.6,.18);
  part(box,timber,0,3.85,-7.95,8.6,.13,.16);
  let seed=37;function rand(){seed=(seed*16807)%2147483647;return seed/2147483647;}
  for(let z=-6.6;z<7;z+=3.85){
    part(box,'#63472f',0,4.24,z,.025,.6,.025);
    part(ball,'#ffde96',0,3.78,z,.58,.78,.58);
    for(const y of [3.43,4.13])part(tin,darkWood,0,y,z,.32,.07,.32);
    for(let k=0;k<5;k++){const angle=k*.48-.96;part(tin,'#e3b879',0,3.78+Math.sin(angle)*.38,z,Math.cos(angle)*.58,.012,Math.cos(angle)*.58);}
  }
  const sections=[
    ['Tea & infusions',-1,4.0,['matcha','tea-leaves','syrup','vanilla']],
    ['Orchard fruit',1,4.0,['berries','blueberries','peach']],
    ['Dairy & oat',-1,.4,['oat','milk','coconut','juice']],
    ['Cold cabinet',1,.4,['ice','water']],
    ['Garden fruit',-1,-3.2,['pineapple','banana','mango','watermelon','fresh-coconut']],
    ['Baking pantry',1,-3.2,['honey','syrup','vanilla']]
  ];
  const unitLabels=new Map();
  MatchaPantry.ITEMS.forEach(([id,name],i)=>{
    const c=document.createElement('canvas');c.width=192;c.height=224;const g=c.getContext('2d');
    g.fillStyle='#f8e8c6';g.fillRect(0,0,192,224);g.strokeStyle='#a68857';g.lineWidth=2;g.strokeRect(6,6,180,212);
    g.textAlign='center';g.fillStyle='#646e47';g.font='bold 15px Georgia';g.fillText('VILLAGE  GROCER',96,31);
    const im=icons[i].image,scale=Math.min(134/im.width,113/im.height);
    g.drawImage(im,96-im.width*scale/2,100-im.height*scale/2,im.width*scale,im.height*scale);
    g.fillStyle='#513c27';g.font='bold 23px Georgia';g.fillText(name,96,189,166);
    const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;unitLabels.set(id,new T.MeshBasicMaterial({map:tx}));
  });
  const fruit={'peach':'#ec9e74','mango':'#dda64a','watermelon':'#73904d','fresh-coconut':'#a58964','pineapple':'#dfa747'};
  function model(id,put){
    const p=(geo,m,x,y,z,w,h,d,r=0)=>put(geo,m,x,y,z,w,h,d,r);
    if(id==='banana'){
      for(let k=0;k<3;k++)for(let j=0;j<5;j++){
        const a=j*.49-.98;p(ball,'#f1c451',j*.068-.14,.085+.15*(1-Math.cos(a)),k*.073-.07,.13,.10,.095,a);
      }
    }else if(fruit[id]){
      p(ball,fruit[id],0,.19,0,.38,id==='pineapple'?.47:.36,.36);
      if(id==='pineapple')for(let k=0;k<5;k++)p(leaf,'#719351',(k-2)*.035,.44,0,.08,.24,.10,-(k-2)*.26);
      else p(leaf,'#6b8743',.04,.37,0,.13,.04,.08,-.3);
    }else if(id==='berries'||id==='blueberries'){
      p(box,reeds,0,.08,0,.42,.16,.31);for(let j=0;j<6;j++){
        const x=(j%3-1)*.115,z=(Math.floor(j/3)-.5)*.12;
        p(ball,id==='berries'?'#cf5241':'#5b567c',x,.183,z,.135,.15,.14);
        if(id==='berries')p(leaf,'#65864c',x,.26,z,.095,.025,.08);
      }
    }else{
      const carton=['milk','coconut','oat','ice','tea-leaves'].includes(id), bottle=['juice','syrup','vanilla','water','honey'].includes(id);
      const palette={matcha:'#a1ac69',milk:'#f4e6c7',oat:'#edd4a2',ice:'#bcd5dc','tea-leaves':'#d9cda6',water:'#bed6d7',coconut:'#e5dcbb',vanilla:'#98643d',juice:'#e7a84e',honey:'#d59038',syrup:'#ce9660'};
      p(carton?box:tin,palette[id],0,.205,0,.31,.41,.28);
      p(carton?box:tin,bottle?'#ddc497':id==='matcha'?'#73824a':'#bac2a0',0,.43,0,bottle?.15:.32,bottle?.11:.055,bottle?.15:.29);
      p(flat,unitLabels.get(id),0,.21,.152,.22,.252,1);
    }
  }
  const units=[], picks=[], hidden=new T.Matrix4().makeScale(0,0,0), geomBins=new Map();
  function stock(id,x,y,z,side) {
    const unit={id,x,y,z,parts:[],picked:false},turn=-side*Math.PI/2;
    part(flat,shade,x,y+.002,z,.50,.44,1,0,0,-Math.PI/2);
    model(id,(g,m,px,py,pz,w,h,d,r=0)=>{
      m=typeof m==='string'?color(m):m;
      pose.position.set(x+pz*Math.sin(turn),y+py,z-px*Math.sin(turn));pose.rotation.set(0,turn,r,'YXZ');pose.scale.set(w,h,d);pose.updateMatrix();
      const key=g.uuid+m.uuid;if(!geomBins.has(key))geomBins.set(key,{g,m,entries:[]});
      geomBins.get(key).entries.push({unit,matrix:pose.matrix.clone()});
    }); units.push(unit);
  }
  // Filtered light through the rafters breaks up the repeating tile texture.
  const lightMap=document.createElement('canvas');lightMap.width=512;lightMap.height=768;
  const lg=lightMap.getContext('2d');lg.translate(250,380);lg.rotate(-.42);
  for(let i=-4;i<=4;i++){
    const gradient=lg.createLinearGradient(-260,0,260,0);
    gradient.addColorStop(0,'rgba(255,226,144,0)');gradient.addColorStop(.45,'rgba(255,238,175,.36)');gradient.addColorStop(1,'rgba(255,229,160,.04)');
    lg.fillStyle=gradient;lg.fillRect(-340,i*104,680,58);
  }
  for(let i=0;i<150;i++){
    lg.fillStyle='rgba(120,91,42,.08)';lg.beginPath();lg.ellipse(-235+rand()*240,-450+rand()*800,6+rand()*13,4+rand()*6,rand()*3,0,Math.PI*2);lg.fill();
  }
  const sunlight=new T.MeshBasicMaterial({map:new T.CanvasTexture(lightMap),transparent:true,depthWrite:false});
  part(flat,sunlight,0,.004,-.3,8.4,15.5,1,0,0,-Math.PI/2);
  for(const [title,side,z,ids] of sections){
    const x=side*3.0,turn=-side*Math.PI/2;
    part(flat,shade,x,.001,z,2.45,4.50,1,0,0,-Math.PI/2);
    part(box,timber,x+side*.46,1.25,z,.11,2.5,3.4);
    for(const end of [-1.67,1.67])part(box,timber,x,1.24,z+end,1.02,2.5,.11);
    for(const y of [.22,.89,1.56,2.24]){
      part(box,timber,x,y,z,1.0,.096,3.4);
      part(box,darkWood,x-side*.50,y-.035,z,.065,.09,3.4);
    }
    part(flat,plaque(title),x-side*.52,2.53,z,2.0,.45,1,turn);
    for(let col=0;col<6;col++)for(let row=0;row<3;row++){
      stock(ids[(col+row*2)%ids.length],x-side*.25,.272+row*.67,z+(col-2.5)*.52,side);
    }
    for(let col=0;col<6;col++){
      const id=ids[(col+2)%ids.length],item=MatchaPantry.item(id);
      part(flat,plaque(item[1]+'  ·  '+item[3], '#53432a',61),x-side*.542,.86,z+(col-2.5)*.52,.41,.093,1,turn);
    }
    for(let k=0;k<16;k++){
      const lz=z+(rand()-.5)*3.4,ly=2.37+rand()*.12,lx=x-side*.30+rand()*.32;
      part(leaf,k%3?'#80964d':'#a2ac62',lx,ly,lz,.17,.08,.24,rand()*6);
      if(k%5===0)for(let j=0;j<4;j++)part(ball,'#eab3a1',lx+.048*Math.cos(j*1.57),ly+.04,lz+.048*Math.sin(j*1.57),.075,.03,.075);
    }
  }
  // Low wooden counter, register, noren and a shopkeeper behind the till.
  part(box,timber,.65,.53,-6.7,4.5,1.06,1.0);
  part(box,darkWood,.65,1.10,-6.7,4.75,.13,1.16);
  part(box,linen,.65,.70,-6.178,1.14,.78,.03);
  part(box,'#4f5549',-.54,1.29,-6.55,.37,.25,.29);
  part(box,'#d4af64',.26,1.19,-6.37,.43,.04,.29);
  const keeper=new T.Mesh(flat,new T.MeshBasicMaterial({map:clerk,transparent:true,alphaTest:.08}));keeper.scale.set(1.1,2.2,1);keeper.position.set(1.18,1.24,-7.22);scene.add(keeper);
  part(box,darkWood,.65,3.24,-6.8,4.9,.105,.105);
  for(let i=0;i<5;i++)part(box,linen,.65+(i-2)*.90,2.99,-6.8,.87,.48,.04);
  part(flat,plaque('Checkout'),.65,2.55,-6.78,1.5,.34,1);
  for(const [x,z] of [[-2,-6.5],[3.55,-5.8],[-3.8,6.3],[3.5,6.1]]){
    part(tin,'#b67950',x,.23,z,.54,.46,.54);
    for(let i=0;i<22;i++){const a=rand()*6.28,r=rand()*.28;part(leaf,i%2?'#7f9a54':'#637c43',x+Math.cos(a)*r,.46+rand()*.64,z+Math.sin(a)*r,.13,.46,.17,a,(rand()-.5)*1.2);}
  }
  const nightVeil=new T.MeshBasicMaterial({map:day,transparent:true,opacity:0,depthWrite:false});
  outside.map=night;
  for(const b of batches.values()){
    const inst=new T.InstancedMesh(b.shape,b.m,b.poses.length);b.poses.forEach((m,i)=>inst.setMatrixAt(i,m));scene.add(inst);
    if(b.m===outside){const veil=new T.InstancedMesh(b.shape,nightVeil,b.poses.length);b.poses.forEach((m,i)=>veil.setMatrixAt(i,m));scene.add(veil);}
  }
  for(const {g,m,entries} of geomBins.values()){
    const mesh=new T.InstancedMesh(g,m,entries.length);mesh.userData.units=entries.map(e=>e.unit);
    entries.forEach(({unit,matrix},i)=>{mesh.setMatrixAt(i,matrix);unit.parts.push({mesh,i,matrix});});scene.add(mesh);picks.push(mesh);
  }
  const cart=new T.Group();camera.add(cart);
  const rail=(m,x,y,z,w,h,d,rz=0)=>part(box,m,x,y,z,w,h,d,0,rz,0,cart);
  rail(reeds,0,0,0,.68,.045,.53);
  for(const side of [-1,1]){
    rail(reeds,side*.34,.138,0,.036,.28,.56,-side*.085);
    rail(timber,side*.355,.283,0,.043,.037,.58);
    rail(reeds,0,.136,side*.27,.68,.26,.033);
    rail(timber,0,.28,side*.28,.73,.036,.042);
    rail(darkWood,side*.27,.20,.34,.034,.20,.036);
    for(const z of [-.19,.19])part(ball,'#4f493d',side*.27,-.09,z,.07,.17,.17,0,0,0,cart);
  }
  part(tin,timber,0,.30,.35,.055,.69,.055,0,Math.PI/2,0,cart);
  const goods=new T.Group();cart.add(goods);
  function packageMesh(id){
    const obj=new T.Group();model(id,(g,m,x,y,z,w,h,d,r)=>part(g,m,x,y,z,w,h,d,0,r,0,obj));return obj;
  }
  const ray=new T.Raycaster(), pointer=new T.Vector2(), flight=[], temp=new T.Vector3();
  function pick(nx,ny){
    ray.far=2.65;ray.setFromCamera(pointer.set(nx,ny),camera);
    return ray.intersectObjects(picks,false).map(h=>h.object.userData.units[h.instanceId]).find(u=>!u.picked);
  }
  function setPicked(u,value){u.picked=value;for(const p of u.parts){p.mesh.setMatrixAt(p.i,value?hidden:p.matrix);p.mesh.instanceMatrix.needsUpdate=true;}}
  function basket(bag){
    goods.clear();
    bag.slice(-9).forEach((u,i)=>{const o=packageMesh(u.id);o.scale.setScalar(.53);o.position.set((i%3-1)*.19,.105+Math.floor(i/6)*.12,(Math.floor(i/3)%2-.5)*.21);o.rotation.y=(i%3-1)*.28;goods.add(o);o.visible=!flight.some(f=>f.unit===u);});
  }
  function lift(u,bag,instant){setPicked(u,true);if(!instant){const o=packageMesh(u.id);scene.add(o);flight.push({o,unit:u,t:0,start:new T.Vector3(u.x,u.y,u.z)});}basket(bag);}
  const halo=new T.Mesh(new T.CircleGeometry(.235,36),new T.MeshBasicMaterial({color:0xffdc83,side:T.DoubleSide}));halo.rotation.x=-Math.PI/2;halo.visible=false;scene.add(halo);
  function aim(u){halo.visible=!!u;if(u)halo.position.set(u.x,u.y+.008,u.z);}
  let idleTime=0;
  let dusk=0,duskTarget=0,duskSet=false;
  const daySky=new T.Color(0xfff0d3),nightSky=new T.Color(0xb3c2e1),daySun=new T.Color(0xffe3aa),nightSun=new T.Color(0xffbd7a);
  const dayWindow=new T.Color(0xffffff),nightWindow=new T.Color(0xb2c1de),dayRoof=new T.Color(0xffffff),nightRoof=new T.Color(0x393854);
  const dayGround=new T.Color(0xf9eaca),nightGround=new T.Color(0x55596c);
  function applyDusk(t){
    nightVeil.opacity=t;sunlight.opacity=1-t;
    skylight.color.copy(dayRoof).lerp(nightRoof,t);outside.color.copy(dayWindow).lerp(nightWindow,t);
    sky.color.copy(daySky).lerp(nightSky,t);sky.intensity=1.75+(0.92-1.75)*t;
    sun.color.copy(daySun).lerp(nightSun,t);sun.intensity=1.55+(0.82-1.55)*t;
    if(!scene.background||!scene.background.isColor)scene.background=dayGround.clone();
    scene.background.copy(dayGround).lerp(nightGround,t);
  }
  function animate(dt,bag){
    idleTime+=dt; keeper.position.y=1.24+(Math.sin(idleTime*2)*.006); keeper.rotation.z=Math.sin(idleTime*.8)*.008;
    if(dusk!==duskTarget){const step=matchMedia('(prefers-reduced-motion: reduce)').matches?1:dt/20;dusk+=Math.sign(duskTarget-dusk)*Math.min(Math.abs(duskTarget-dusk),step);applyDusk(dusk);}
    for(let i=flight.length-1;i>=0;i--){const f=flight[i],o=goods.children[bag.slice(-9).indexOf(f.unit)];
      f.t=Math.min(1,f.t+dt*2.8);
      if(!o||f.t===1){if(o)o.visible=true;scene.remove(f.o);flight.splice(i,1);continue;}
      f.o.position.lerpVectors(f.start,o.getWorldPosition(temp),f.t);f.o.position.y+=Math.sin(Math.PI*f.t)*.30;f.o.scale.setScalar(1-.47*f.t);
    }
  }
  function lighting(dark){duskTarget=dark?1:0;if(!duskSet){dusk=duskTarget;duskSet=true;applyDusk(dusk);}}
  return {scene,camera,renderer,cart,sections,pick,aim,basket,lift,setPicked,animate,lighting};
}
