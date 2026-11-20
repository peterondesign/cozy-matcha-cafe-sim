// A single walkable aisle, with the package faces themselves used for picking.
window.buildGroceryInterior = function(THREE, renderer, items, keeper, sheet) {
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#f6ead2');
  scene.fog=new THREE.FogExp2('#f2e7cc',.034);
  const camera=new THREE.PerspectiveCamera(64,1,.045,38);
  camera.rotation.order='YXZ';
  scene.add(camera,new THREE.HemisphereLight(0xfffbec,0xf4e8c9,2.25));
  const sun=new THREE.DirectionalLight(0xffefd0,1.55);
  sun.position.set(-4,8,5);scene.add(sun);
  const cube=new THREE.BoxGeometry(),tin=new THREE.CylinderGeometry(.5,.5,1,24);
  const sphere=new THREE.SphereGeometry(.5,14,8);
  const taper=new THREE.CylinderGeometry(.29,.5,1,20);
  const fold=new THREE.CylinderGeometry(.25,.5,1,4,1,false,Math.PI/4);
  function region(x,y,w,h){
    const c=document.createElement('canvas');c.width=w;c.height=h;
    c.getContext('2d').drawImage(sheet,x,y,w,h,0,0,w,h);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;
  }
  const timber=region(512,288,448,128);
  const boards=new Set(['#ac825b','#a67c53','#bc9469','#8a6044','#b99568','#835c40','#8b694d']);
  const materials=new Map(), batches=new Map(), pickable=[];
  const dummy=new THREE.Object3D();
  function paint(color) {
    if(!materials.has(color)) materials.set(color,new THREE.MeshStandardMaterial({color:boards.has(color)?new THREE.Color(color).lerp(new THREE.Color(0xffffff),.45):color,map:boards.has(color)?timber:null,roughness:.94}));
    return materials.get(color);
  }
  function shape(geo,mat,x,y,z,w,h,d,turn=0,id=null) {
    const key=geo.uuid+mat.uuid;
    if(!batches.has(key)) batches.set(key,{geo,mat,parts:[],ids:[]});
    dummy.position.set(x,y,z);dummy.rotation.set(0,turn,0);dummy.scale.set(w,h,d);dummy.updateMatrix();
    const batch=batches.get(key);
    batch.parts.push(dummy.matrix.clone());batch.ids.push(id);
  }
  const box=(color,x,y,z,w,h,d)=>shape(cube,paint(color),x,y,z,w,h,d);
  function label(width,height,draw) {
    const c=document.createElement('canvas');c.width=width;c.height=height;
    const ctx=c.getContext('2d');
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    draw(ctx,()=>{texture.needsUpdate=true});
    return new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
  }
  const plane=new THREE.PlaneGeometry();
  function sign(text,small,bg='#596d47',fg='#fff1cf') {
    return label(512,144,ctx=>{
      ctx.fillStyle=bg;ctx.fillRect(0,0,512,144);ctx.strokeStyle=fg;ctx.lineWidth=2;
      ctx.strokeRect(9,9,494,126);ctx.fillStyle=fg;ctx.textAlign='center';
      ctx.font='bold 48px Georgia';ctx.fillText(text,256,76,463);
      ctx.font='bold 20px Trebuchet MS';ctx.fillText(small,256,110,470);
    });
  }
  // Walnut shelving, alternating glazed tiles, and afternoon light from the till windows.
  box('#baa382',0,-.12,-1.4,12,.2,28);
  for(let x=-5;x<5;x++)for(let z=-14;z<11;z++)
    box((x+z)%2?'#e4d6af':'#f1e6c8',x+.5,-.025,z+.5,.988,.05,.988);
  shape(cube,new THREE.MeshBasicMaterial({color:'#f7eed5'}),0,3.7,-1.4,12,.18,27);
  for(let z=-12;z<=8;z+=4)box('#dbccae',0,3.59,z,8.1,.14,.10);
  for(const side of [-1,1]){
    box('#ede1bf',side*4.1,1.8,-1.4,.2,3.65,26);
    box('#91a27b',side*4,3.23,-1.4,.09,.15,26);
  }
  box('#e4d8b5',0,1.82,-12.55,9,3.65,.2);
  box('#d8c8a6',0,1.8,9.25,9,3.65,.2);
  const scenery=region(0,288,512,316);
  const garden=new THREE.MeshBasicMaterial({map:scenery});
  for(const end of [-1,1]){
    const z=end===1?9.08:-12.35;
    shape(plane,garden,0,1.88,z,7.6,2.7,1,end===1?Math.PI:0);
    for(const x of [-3.8,-1.9,0,1.9,3.8])box('#9d8666',x,1.88,z-end*.045,.075,2.8,.085);
    box('#9d8666',0,2.6,z-end*.06,7.6,.075,.085);
  }
  for(const z of [-10.4,-6.9,-3.2,.5,4.2,7.9]){
    box('#cbbb99',0,3.61,z,2.3,.06,.34);box('#fff9db',0,3.56,z,2.16,.08,.26);
  }
  box('#8b694d',0,.48,-11.08,4.6,.96,.85);
  for(let x=-2.1;x<2.21;x+=.36)box('#b99568',x,.48,-10.64,.34,.85,.035);
  box('#835c40',0,.99,-11.05,4.78,.12,1.02);
  box('#819176',1.3,1.2,-11,.43,.38,.31);
  shape(plane,sign('Village Grocer','CHECKOUT'),0,2.9,-12.15,3.45,.97,1);
  shape(plane,sign('Garden entrance','VILLAGE GREEN'),0,2.9,8.90,3.45,.97,1,Math.PI);
  const clerk=new THREE.Group();clerk.add(keeper.display);
  clerk.position.set(1.37,.015,-.90);clerk.rotation.y=.97;clerk.scale.setScalar(1.16);scene.add(clerk);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.40,32),new THREE.MeshBasicMaterial({color:'#68543e',transparent:true,opacity:.18,depthWrite:false}));
  shadow.position.set(1.37,.007,-.9);shadow.rotation.x=-Math.PI/2;scene.add(shadow);
  // Herb pots and the striped canvas valance frame the register.
  for(let stripe=-8;stripe<=8;stripe++)box(stripe%2?'#e9d5a3':'#8d9c71',stripe*.36,2.68,-11.81,.36,.16,.36);
  for(const x of [-1.65,1.9]){
    shape(tin,paint('#b17953'),x,1.18,-10.93,.24,.25,.24);
    for(let i=0;i<8;i++){
      const ang=i*2.4;
      shape(sphere,paint(i%2?'#718653':'#94a465'),x+Math.sin(ang)*.12,1.37+(i%3)*.06,-10.93+Math.cos(ang)*.11,.17,.16,.15);
    }
  }
  const finish=['#7d9955','#c47c6b','#cda879','#a4bcca','#95bdce','#7eabb1','#c39552','#90684c','#8983a9','#9baf78','#6f8f55','#e0b15a','#e2c15a','#d5a054','#e39b6a','#d45d5d','#e07a32','#8fbf8a','#7eabb1'];
  const departments=['Tea & infusions','Orchard fruit','Dairy & oat','Cold cabinet','Garden fruit','Baking pantry'];
  const bays=[[0,10,13],[1,8,12,14],[2,3,9,17],[4,5,18],[11,15,16],[6,7]];
  const packages=new Map(),shelfUnits=[];
  function packageLabel(item,color,index) {
    const [,name,,price]=item;
    return label(256,320,ctx=>{
      ctx.fillStyle=color;ctx.fillRect(0,0,256,320);ctx.fillStyle='#fbefd4';ctx.fillRect(11,12,234,296);
      ctx.textAlign='center';ctx.fillStyle='#72613e';ctx.font='bold 14px Georgia';ctx.fillText('V I L L A G E   G R O C E R',128,42);
      ctx.fillStyle='#584b35';ctx.font='bold 26px Georgia';ctx.fillText(name,128,254,215);
      ctx.fillStyle=color;ctx.fillRect(11,271,234,37);ctx.fillStyle='#fffbe7';ctx.font='bold 17px Trebuchet MS';ctx.fillText(price+' COIN'+(price===1?'':'S'),128,295);
      if(item[0]==='honey'){
        ctx.fillStyle='#d5a054';ctx.beginPath();ctx.roundRect(72,83,112,113,20);ctx.fill();
        ctx.fillStyle='#677d4e';ctx.fillRect(76,70,104,25);
        ctx.fillStyle='#fff2c7';ctx.textAlign='center';ctx.font='bold 25px Georgia';ctx.fillText('HONEY',128,152);
      }else if(index<10)ctx.drawImage(sheet,index%5*192,Math.floor(index/5)*144,192,144,33,58,190,162);
      else{
        ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(48,68,160,156,22);ctx.fill();
        ctx.fillStyle='#fff8e4';ctx.textAlign='center';ctx.font='bold 22px Georgia';
        ctx.fillText(name.toUpperCase(),128,158,148);
      }
    });
  }
  for(const [i,item] of items.entries())packages.set(item[0],packageLabel(item,finish[i],i));
  // Parts use the same local coordinates on the shelf, in flight and in the cart.
  function packageParts(index,part){
    const [id]=items[index], color=finish[index];
    let width=.34,height=.46,depth=.31,labelHeight=.32;
    if(id==='berries'||id==='blueberries'){
      height=.22;labelHeight=.15;
      part(cube,paint('#b78e60'),0,.102,0,.37,.204,.34);
      part(cube,paint('#d2b484'),0,.207,0,.39,.045,.36);
      for(let k=0;k<9;k++){
        const px=(k%3-1)*.10,pz=(Math.floor(k/3)-1)*.09,py=.255+.02*Math.sin(k);
        part(sphere,paint(id==='berries'?(k%2?'#c95643':'#dd7353'):(k%2?'#655977':'#7f7792')),px,py,pz,.119,.13,.112);
        if(id==='berries')part(sphere,paint('#84935d'),px,py+.061,pz,.065,.02,.055);
      }
      depth=.37;
    }else if(id==='matcha'){
      width=.36;depth=.36;
      part(tin,paint(color),0,.20,0,.35,.40,.35);
      part(tin,paint('#65774d'),0,.02,0,.36,.027,.36);
      part(tin,paint('#c5c48f'),0,.41,0,.37,.047,.37);
      part(tin,paint('#97a36a'),0,.44,0,.32,.013,.32);
    }else if(['vanilla','water','syrup','milk','honey','juice'].includes(id)){
      const small=id==='vanilla',milk=id==='milk';width=small?.23:.30;depth=width;
      height=small?.35:.51;labelHeight=small?.19:.28;
      const mat=paint(milk?'#eee5c6':id==='water'?'#9ababb':(id==='syrup'||id==='honey')?'#c89449':'#855b41');
      part(tin,mat,0,height*.39,0,width,height*.78,depth);
      part(taper,mat,0,height*.84,0,width,height*.15,depth);
      part(tin,mat,0,height*.97,0,width*.55,height*.16,depth*.55);
      part(tin,paint(milk?'#b7c2ab':'#a18b64'),0,height*1.07,0,width*.59,.043,depth*.59);
    }else{
      height=id==='ice'?.39:.49;
      part(cube,paint(color),0,height*.5,0,width,height,depth);
      part(fold,paint('#eae3ca'),0,height+.046,0,width*1.41,.095,depth*1.41);
      part(cube,paint(color),0,height+.101,0,width*.68,.027,.038);
    }
    part(plane,packages.get(id),0,height*.48,depth*.5+.004,width*.86,labelHeight,1);
  }
  function putPackage(i,side,y,z){
    const turn=-side*Math.PI/2,x=side*2.34;
    const unit={id:items[i][0],index:i,x,y,z,turn,instances:[],picked:false};
    shelfUnits.push(unit);
    packageParts(i,(geo,mat,px,py,pz,w,h,d)=>{
      shape(geo,mat,x+pz*Math.sin(turn),y+py,z+px*-Math.sin(turn),w,h,d,turn,unit);
    });
  }
  for(let bay=0;bay<6;bay++){
    const z=6.4-bay*2.56;
    for(const side of [-1,1]){
      const dept=bay,ids=bays[dept],turn=-side*Math.PI/2;
      box('#ac825b',side*2.91,1.19,z,.13,2.37,2.49);
      for(const offset of [-1.22,1.22])box('#a67c53',side*2.57,1.15,z+offset,.8,2.31,.075);
      for(const y of [.26,.99,1.72,2.38]){
        box('#bc9469',side*2.53,y,z,.88,.10,2.52);
        box('#8a6044',side*2.076,y-.035,z,.035,.085,2.50);
      }
      shape(plane,sign(departments[dept],'AISLE  0'+(bay+1)),side*2.075,2.40,z,1.62,.40,1,turn);
      for(let row=0;row<3;row++){
        for(let col=0;col<5;col++)putPackage(ids[(col+row)%ids.length],side,.314+row*.73,z+(col-2)*.43);
      }

    }
  }
  for(const {geo,mat,parts,ids} of batches.values()){
    const mesh=new THREE.InstancedMesh(geo,mat,parts.length);parts.forEach((m,i)=>mesh.setMatrixAt(i,m));
    scene.add(mesh);
    if(ids.some(Boolean)){
      mesh.userData.ids=ids;pickable.push(mesh);
      ids.forEach((unit,i)=>{if(unit)unit.instances.push({mesh,i,matrix:parts[i]})});
    }
  }
  // The cart stays just in front of the player's viewpoint.
  const cart=new THREE.Group();camera.add(cart);cart.position.set(0,-.72,-.86);
  function rail(color,x,y,z,w,h,d){
    const m=new THREE.Mesh(cube,paint(color));m.position.set(x,y,z);m.scale.set(w,h,d);cart.add(m);return m;
  }
  for(const x of [-.32,.32]){
    rail('#6e7867',x,.08,0,.018,.02,.42);
    for(let i=0;i<5;i++)rail('#929b83',x,-.04,-.18+i*.09,.01,.22,.01);
    rail('#969d88',x,-.14,0,.016,.016,.42);
  }
  for(const z of [-.2,.2]){
    rail('#76816e',0,.08,z,.66,.024,.018);
    for(let i=-3;i<=3;i++)rail('#98a18a',i*.09,-.04,z,.01,.2,.01);
    rail('#8f9b82',0,-.14,z,.64,.016,.016);
  }
  for(let i=-3;i<=3;i++)rail('#a3a797',i*.09,-.135,0,.01,.012,.4);
  rail('#52694b',0,.09,.2,.7,.05,.05);
  rail('#91a569',0,.11,.2,.64,.024,.048);
  const goods=new THREE.Group();cart.add(goods);
  const ray=new THREE.Raycaster();ray.far=4.8;
  function pick(x,y) {
    ray.setFromCamera(new THREE.Vector2(x,y),camera);
    const hit=ray.intersectObjects(pickable,false).find(h=>!h.object.userData.ids[h.instanceId]?.picked);
    return hit?.object.userData.ids[hit.instanceId]??null;
  }
  const hiddenMatrix=new THREE.Matrix4().makeScale(0,0,0);
  function hideUnit(unit,hidden){
    unit.picked=hidden;
    for(const {mesh,i,matrix} of unit.instances){
      mesh.setMatrixAt(i,hidden?hiddenMatrix:matrix);
      mesh.instanceMatrix.needsUpdate=true;
    }
  }
  const flights=new Map();
  function cartPack(unit){
    const pack=new THREE.Group();
    packageParts(unit.index,(geo,mat,x,y,z,w,h,d)=>{
      const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(w,h,d);pack.add(m);
    });
    return pack;
  }
  function placeInBasket(pack,i){
    pack.position.set((i%4-1.5)*.20,-.19+Math.floor(i/4)*.035,-.13+Math.floor(i/4)*.24);
    pack.rotation.set(-.13,.13*(i%3-1),.08*(i%2?1:-1));pack.scale.setScalar(.55);
  }
  function showBasket(units){
    goods.clear();
    units.slice(-8).forEach((unit,i)=>{
      const pack=cartPack(unit);placeInBasket(pack,i);goods.add(pack);
      if(flights.has(unit))pack.visible=false;
    });
  }
  function lift(unit){hideUnit(unit,true)}
  function reset(){
    for(const unit of shelfUnits)if(unit.picked)hideUnit(unit,false);
    for(const {pack} of flights.values())scene.remove(pack);
    flights.clear();goods.clear();
  }
  function animate(time,dt,units){
    keeper.update(time,dt);
    for(const [unit,f] of flights){
      const pile=goods.children[units.slice(-8).indexOf(unit)];
      if(!pile){scene.remove(f.pack);flights.delete(unit);continue}
      f.elapsed+=dt;const t=Math.min(1,f.elapsed/.46),ease=t*t*(3-2*t);
      f.pack.position.lerpVectors(f.origin,pile.getWorldPosition(new THREE.Vector3()),ease);
      f.pack.position.y+=Math.sin(Math.PI*t)*.25;
      f.pack.quaternion.slerp(pile.getWorldQuaternion(new THREE.Quaternion()),ease);
      f.pack.scale.setScalar(1-.45*ease);
      if(t===1){scene.remove(f.pack);pile.visible=true;flights.delete(unit)}
    }
  }
  return {scene,camera,cart,keeper,pick,showBasket,lift,restore:unit=>hideUnit(unit,false),reset,animate};
};
