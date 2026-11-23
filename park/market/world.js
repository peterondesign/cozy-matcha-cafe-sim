// All distances are metres. Packages use the same meshes on shelves and in the cart.
function marketShelfStock(sections) {
  const original=[],extra=[];
  for(const [,side,z,ids] of sections) {
    for(let col=0;col<8;col++)for(let row=0;row<3;row++){
      const args=[ids[(col+row*2)%ids.length],side*2.75,.272+row*.67,z+(col-3.5)*.4,side];
      (col<6?original:extra).push(args);
    }
  }
  // Keep the original shelf units first so a paused basket's saved indices remain valid.
  return original.concat(extra);
}
// Bake each product model to the sprite footprint: bottom on the shelf, centred, 0.43 m tall at most.
async function loadGoodsModel(loader,T,id) {
  const gltf=await loader.loadAsync(`goods/models/${id}.glb`);
  let mesh=null;
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(o=>{if(!mesh&&o.isMesh)mesh=o;});
  if(!mesh)throw new Error('Model has no mesh');
  const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
  if(!geometry.attributes.normal)geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const {min,max}=geometry.boundingBox,size=max.clone().sub(min),scale=.43/Math.max(size.x,size.y,size.z);
  geometry.translate(-(min.x+max.x)/2,-min.y,-(min.z+max.z)/2);
  geometry.scale(scale,scale,scale);
  // Trellis writes only a base colour. glTF then defaults the goods to fully metallic,
  // which renders them black with no environment map. Match the timber: matte, non-metal.
  const source=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
  const material=source.clone();
  material.metalness=0;material.roughness=.78;material.color.set(0xffffff);
  if(material.map)material.map.colorSpace=T.SRGBColorSpace;
  material.needsUpdate=true;
  return {geometry,material};
}
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
  const [wood,weave,cloth,...icons]=await Promise.all([
    texture('market/cedar.webp'),texture('market/wicker.webp',2,1),
    texture('market/linen.webp'),
    ...MatchaPantry.ITEMS.map(i=>texture(MatchaPantry.icon(i[0])))
  ]);
  const clerkFrames=await Promise.all(Array.from({length:8},(_,i)=>
    texture(`../counter/customers/03/frame_${String(i+1).padStart(2,'0')}.png`)));
  const gltfLoader=new T.GLTFLoader();
  // A product whose model fails to load keeps its painted sprite.
  const goodsModels=new Map((await Promise.all(MatchaPantry.ITEMS.map(async([id])=>{
    try{return [id,await loadGoodsModel(gltfLoader,T,id)];}
    catch(error){console.warn('Grocer model unavailable:',id,error);return null;}
  }))).filter(Boolean));
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(64,1,.04,65);
  scene.add(camera);
  const sky=new T.HemisphereLight(0xfff6df,0xe4c39a,2.45);
  const sun=new T.DirectionalLight(0xfff1c4,2.15);sun.position.set(-2.2,7.4,4.6);scene.add(sky,sun);
  const doorway=new T.DirectionalLight(0xfff7e4,1.15);doorway.position.set(0,3.4,9.2);scene.add(doorway);
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
  const outside=mat(wood,0xe6c79e);
  part(box,timber,0,-.10,-.3,9,.18,18);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
  const sg=shadowCanvas.getContext('2d'),falloff=sg.createRadialGradient(64,64,4,64,64,64);
  falloff.addColorStop(0,'rgba(63,38,20,.36)');falloff.addColorStop(1,'rgba(63,38,20,0)');sg.fillStyle=falloff;sg.fillRect(0,0,128,128);
  const shade=new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false});
  // Timber walls keep the shelves and goods visually prominent.
  part(flat,outside,0,2.3,-10,17,8,1);
  for(const side of [-1,1]){
    part(flat,outside,side*5.1,2.25,0,22,6.7,1,-side*Math.PI/2);
    part(box,timber,side*4.2,.57,0,.16,1.15,18);
    for(let z=-8;z<=8;z+=2){
      part(box,darkWood,side*4.18,2.39,z,.16,4.8,.13);
      part(box,timber,side*4.18,3,z,.08,.08,2.03);
    }
  }
  // Framed entrance behind the player.
  part(flat,outside,0,2.6,9.8,16,7.5,1,Math.PI);
  for(const x of [-3.12,3.12])part(box,'#efce9a',x,4.78,0,2.12,.13,18);
  for(const x of [-2.05,2.05])part(box,darkWood,x,4.7,0,.12,.14,18);
  for(const x of [-3.8,-1.42,1.42,3.8])part(box,timber,x,2.15,8.4,.15,4.3,.15);
  part(box,darkWood,0,3.2,8.4,8.5,.24,.23);
  part(flat,plaque('Village garden'),0,2.78,8.39,1.65,.38,1,Math.PI);
  const skylight=mat(wood,0xe5ca9e);
  part(flat,skylight,0,6.7,0,24,27,1,0,0,Math.PI/2);
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
  const goods=new Map(MatchaPantry.ITEMS.map(([id],i)=>[id,new T.MeshBasicMaterial({
    map:icons[i],transparent:true,alphaTest:.08,side:T.DoubleSide
  })]));
  function model(id,put){
    const glb=goodsModels.get(id);
    if(glb){put(glb.geometry,glb.material,0,0,0,1,1,1,0);return;}
    const material=goods.get(id),image=material.map.image;
    const scale=.43/Math.max(image.width,image.height);
    put(flat,material,0,image.height*scale/2,0,image.width*scale,image.height*scale,1,0);
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
  // Filtered light through the rafters softens the wooden floor.
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
    for(let col=0;col<8;col++){
      const id=ids[(col+2)%ids.length],item=MatchaPantry.item(id);
      part(flat,plaque(item[1]+'  ·  '+item[3], '#53432a',61),x-side*.542,.86,z+(col-3.5)*.4,.36,.093,1,turn);
    }
  }
  for(const args of marketShelfStock(sections))stock(...args);
  // Low wooden counter, register, noren and a shopkeeper behind the till.
  part(box,timber,.65,.53,-6.7,4.5,1.06,1.0);
  part(box,darkWood,.65,1.10,-6.7,4.75,.13,1.16);
  part(box,linen,.65,.70,-6.178,1.14,.78,.03);
  part(box,'#4f5549',-.54,1.29,-6.55,.37,.25,.29);
  part(box,'#d4af64',.26,1.19,-6.37,.43,.04,.29);
  const keeper=new T.Mesh(flat,new T.MeshBasicMaterial({map:clerkFrames[0],transparent:true,alphaTest:.08}));
  function setKeeperFrame(index){
    const frame=clerkFrames[index];
    keeper.material.map=frame;
    keeper.scale.set(2.2*frame.image.width/frame.image.height,2.2,1);
  }
  setKeeperFrame(0);keeper.position.set(1.18,1.24,-7.22);scene.add(keeper);
  part(box,darkWood,.65,3.24,-6.8,4.9,.105,.105);
  for(let i=0;i<5;i++)part(box,linen,.65+(i-2)*.90,2.99,-6.8,.87,.48,.04);
  part(flat,plaque('Checkout'),.65,2.55,-6.78,1.5,.34,1);
  for(const [x,z] of [[-2,-6.5],[3.55,-5.8],[-3.8,6.3],[3.5,6.1]]){
    part(tin,'#b67950',x,.23,z,.54,.46,.54);
    for(let i=0;i<22;i++){const a=rand()*6.28,r=rand()*.28;part(leaf,i%2?'#7f9a54':'#637c43',x+Math.cos(a)*r,.46+rand()*.64,z+Math.sin(a)*r,.13,.46,.17,a,(rand()-.5)*1.2);}
  }
  for(const b of batches.values()){
    const inst=new T.InstancedMesh(b.shape,b.m,b.poses.length);b.poses.forEach((m,i)=>inst.setMatrixAt(i,m));scene.add(inst);
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
  const cartGoods=new T.Group();cart.add(cartGoods);
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
    cartGoods.clear();
    bag.slice(-9).forEach((u,i)=>{const o=packageMesh(u.id);o.scale.setScalar(.53);o.position.set((i%3-1)*.19,.105+Math.floor(i/6)*.12,(Math.floor(i/3)%2-.5)*.21);o.rotation.y=(i%3-1)*.28;cartGoods.add(o);o.visible=!flight.some(f=>f.unit===u);});
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
    sunlight.opacity=1-t;
    skylight.color.copy(dayRoof).lerp(nightRoof,t);outside.color.copy(dayWindow).lerp(nightWindow,t);
    sky.color.copy(daySky).lerp(nightSky,t);sky.intensity=2.45+(1.15-2.45)*t;
    sun.color.copy(daySun).lerp(nightSun,t);sun.intensity=2.15+(0.55-2.15)*t;
    doorway.color.copy(daySun).lerp(nightSun,t);doorway.intensity=1.15*(1-t);
    if(!scene.background||!scene.background.isColor)scene.background=dayGround.clone();
    scene.background.copy(dayGround).lerp(nightGround,t);
  }
  function animate(dt,bag){
    idleTime+=dt;
    const frame=reducedMotion.matches?0:Math.floor(idleTime*3)%14;
    setKeeperFrame(frame<8?frame:14-frame);
    if(dusk!==duskTarget){
      dusk=reducedMotion.matches?duskTarget:dusk+(duskTarget-dusk)*(1-Math.exp(-dt*1.6));
      if(Math.abs(dusk-duskTarget)<.001)dusk=duskTarget;
      applyDusk(dusk);
    }
    for(let i=flight.length-1;i>=0;i--){const f=flight[i],o=cartGoods.children[bag.slice(-9).indexOf(f.unit)];
      f.t=Math.min(1,f.t+dt*2.8);
      if(!o||f.t===1){if(o)o.visible=true;scene.remove(f.o);flight.splice(i,1);continue;}
      f.o.position.lerpVectors(f.start,o.getWorldPosition(temp),f.t);f.o.position.y+=Math.sin(Math.PI*f.t)*.30;f.o.scale.setScalar(1-.47*f.t);
    }
  }
  function lighting(night){
    duskTarget=typeof night==='number'?Math.max(0,Math.min(1,night)):night?1:0;
    if(!duskSet){dusk=duskTarget;duskSet=true;applyDusk(dusk);}
  }
  return {scene,camera,renderer,cart,sections,units,pick,aim,basket,lift,setPicked,animate,lighting};
}
