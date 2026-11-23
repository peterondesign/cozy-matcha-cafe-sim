window.matchaPark.createActorStage = function createActorStage(THREE, modelFor, width=320, height=384) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width,height);
  renderer.toneMapping=THREE.NoToneMapping;
  renderer.toneMappingExposure=1.03;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-.95, .95, 1.28, -1.18, .1, 15);
  camera.position.set(2.7, 2.15, 4);
  camera.lookAt(0, .72, 0);
  scene.add(new THREE.HemisphereLight(0xfffaf1, 0xa8af98, 1.4));
  const light = new THREE.DirectionalLight(0xfff4de, 1.65);
  light.position.set(-3, 5, 4);
  scene.add(light);
  const bounce=new THREE.DirectionalLight(0xe0edff,.65);
  bounce.position.set(3,2,-4);
  scene.add(bounce);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const rounded = new THREE.CapsuleGeometry(.5,0,3,8);
  const sphere = new THREE.SphereGeometry(1, 10, 7);
  const ramp = new THREE.DataTexture(new Uint8Array([80, 155, 245]), 3, 1, THREE.RedFormat);
  ramp.needsUpdate = true;

  const materials = new Map();
  function mesh(parent, color, shape, x, y, z, sx, sy, sz) {
    if (!materials.has(color)) materials.set(color,new THREE.MeshToonMaterial({color, gradientMap:ramp}));
    const part = new THREE.Mesh(shape,materials.get(color));
    part.position.set(x, y, z);
    part.scale.set(sx, sy, sz);
    parent.add(part);
    return part;
  }

  function joint(parent, x, y) {
    const group = new THREE.Bone();
    group.position.set(x, y, 0);
    parent.add(group);
    return group;
  }

  // Build indexed bones once per outfit. Rigid skin weights keep small limbs crisp at park scale.
  function skinRig(root, pelvis) {
    const bones=[], parts=[], positions=[], normals=[], indices=[], weights=[], palette=[];
    root.updateMatrixWorld(true);
    pelvis.traverse(node=>{
      if (node.isBone) bones.push(node);
      if (node.isMesh) parts.push(node);
    });
    const geometry=new THREE.BufferGeometry();
    const point=new THREE.Vector3(), normalMatrix=new THREE.Matrix3();
    for (const part of parts) {
      const source=part.geometry;
      const geometryIndex=source.index;
      const count=geometryIndex?.count ?? source.attributes.position.count;
      const boneIndex=bones.indexOf(part.parent);
      if (!palette.includes(part.material)) palette.push(part.material);
      geometry.addGroup(positions.length/3,count,palette.indexOf(part.material));
      normalMatrix.getNormalMatrix(part.matrixWorld);
      for (let i=0;i<count;i++) {
        const index=geometryIndex ? geometryIndex.getX(i) : i;
        point.fromBufferAttribute(source.attributes.position,index).applyMatrix4(part.matrixWorld);
        positions.push(point.x,point.y,point.z);
        point.fromBufferAttribute(source.attributes.normal,index).applyNormalMatrix(normalMatrix);
        normals.push(point.x,point.y,point.z);
        indices.push(boneIndex,0,0,0);
        weights.push(1,0,0,0);
      }
      part.removeFromParent();
    }
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
    geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
    const skin=new THREE.SkinnedMesh(geometry,palette);
    skin.frustumCulled=false;
    root.add(skin);
    skin.bind(new THREE.Skeleton(bones));
  }

  const channel = (bone, property, axis) => `${bone}.${property}[${axis}]`;
  function clip(name,duration,poses) {
    const tracks=Object.entries(poses).map(([target,values])=>new THREE.NumberKeyframeTrack(
      target,values.map((_,i)=>i*duration/(values.length-1)),values,THREE.InterpolateSmooth));
    return new THREE.AnimationClip(name,duration,tracks);
  }
  const pose = (name,duration,options={}) => {
    const {height=[0,.012,0],swing=[0,0],bend=[0,0],arm=[0,0],spread=[0,0],
      elbow=[-.12,-.12],ankle=[0,0],legSpread=[0,0],twist=[0,0],sway=[0,0],turn=[0,0]}=options;
    const tracks={[channel('pelvis','position','y')]:height,
      [channel('pelvis','position','x')]:sway,[channel('pelvis','rotation','y')]:turn};
    for (const side of ['Left','Right']) {
      const mirror=side==='Left'?-1:1;
      const opposite=values=>values.length===5 && side==='Right' ? values.map((_,i)=>values[(i+2)%4]) : values;
      tracks[channel('hip'+side,'rotation','x')]=opposite(swing);
      tracks[channel('hip'+side,'rotation','z')]=legSpread.map(value=>value*mirror);
      tracks[channel('knee'+side,'rotation','x')]=opposite(bend);
      tracks[channel('ankle'+side,'rotation','x')]=opposite(ankle);
      tracks[channel('shoulder'+side,'rotation','x')]=opposite(arm);
      tracks[channel('shoulder'+side,'rotation','z')]=spread.map(value=>value*mirror);
      tracks[channel('elbow'+side,'rotation','x')]=opposite(elbow);
      tracks[channel('shoulder'+side,'rotation','y')]=twist.map(value=>value*mirror);
    }
    if (name==='Wave') {
      tracks[channel('shoulderRight','rotation','z')]=[.1,2.12,2.12,2.12,2.12,.1];
      tracks[channel('elbowRight','rotation','x')]=[-.1,-.52,-1.15,-.52,-1.15,-.1];
    }
    if (name==='Kick') {
      tracks[channel('hipRight','rotation','x')]=[0,.45,-1.07,-.65,0];
      tracks[channel('kneeRight','rotation','x')]=[0,.9,.12,.35,0];
    }
    return clip(name,duration,tracks);
  };
  const clips=[
    pose('Idle',2.4,{spread:[.09,.12,.09]}),
    pose('Walk',.96,{height:[.005,.018,.005,.018,.005],swing:[-.34,0,.36,0,-.34],
      bend:[.08,.4,.14,.06,.08],arm:[.19,0,-.21,0,.19],spread:[.08,.08]}),
    pose('ApronWalk',.86,{
      height:[.003,.025,.009,.028,.003],swing:[-.37,-.04,.4,.08,-.37],
      bend:[.11,.58,.17,.09,.11],ankle:[-.04,-.24,.14,.17,-.04],arm:[.22,-.03,-.27,-.09,.22],
      elbow:[-.18,-.3,-.51,-.27,-.18],spread:[-.035,.01,-.025,.015,-.035],
      sway:[-.022,0,.019,0,-.022],turn:[.075,0,-.082,0,.075]
    }),
    pose('Sit',3.2,{height:[-.34,-.332,-.34],swing:[-1.48,-1.48],bend:[1.55,1.55],arm:[.42,.46,.42],spread:[.08,.1,.08],elbow:[-1.22,-1.18,-1.22]}),
    pose('Meditate',3.8,{height:[-.59,-.58,-.59],swing:[-1.56,-1.56],bend:[2.45,2.45],
      legSpread:[.73,.73],arm:[-.55,-.55],spread:[.22,.22],elbow:[-.38,-.38]}),
    pose('Wave',1.6),
    pose('Kick',.81),
    pose('T-Pose',1,{spread:[Math.PI/2,Math.PI/2],elbow:[0,0],height:[0,0]})
  ];

  function humanoid(shirt, pants, skin, hair, outfit, resident) {
    const root = new THREE.Group();
    const pelvis=joint(root,0,0);
    pelvis.name='pelvis';
    mesh(pelvis,shirt,rounded,0,.86,0,.43,.54,.28);
    mesh(pelvis,skin,sphere,0,1.04,0,.083,.107,.074);
    mesh(pelvis,skin,sphere,0,1.235,0,.18,.207,.166);
    mesh(pelvis,hair,sphere,0,1.344,-.03,.194,.129,.171);
    mesh(pelvis,hair,sphere,0,1.247,-.112,.171,.171,.083);
    if (outfit==='apron') {
      mesh(pelvis,'#526e37',rounded,0,.755,.129,.29,.49,.095);
      mesh(pelvis,hair,sphere,.09,1.215,-.174,.085,.087,.078);
    }
    if (outfit==='cap') {
      mesh(pelvis,'#555a53',sphere,0,1.371,-.013,.196,.11,.169);
      mesh(pelvis,'#555a53',sphere,0,1.347,.128,.162,.025,.099);
      mesh(pelvis,'#8d634b',rounded,0,.826,-.143,.32,.38,.19);
    }
    if (outfit==='hat') {
      mesh(pelvis,'#b98443',sphere,0,1.36,.007,.247,.031,.22);
      mesh(pelvis,'#e4bc77',sphere,0,1.394,0,.168,.088,.15);
    }
    for (const side of [-1,1]) {
      const name=side<0?'Left':'Right';
      mesh(pelvis,'#442d25',sphere,side*.069,1.242,.154,.018,.023,.017);
      mesh(pelvis,skin,sphere,side*.168,1.225,-.01,.035,.054,.041);
      const leg=joint(pelvis,side*.094,.635);
      leg.name='hip'+name;
      mesh(leg,pants,rounded,0,-.136,0,.156,.324,.159);
      const knee=joint(leg,0,-.28);
      knee.name='knee'+name;
      mesh(knee,pants,rounded,0,-.112,0,.128,.266,.132);
      const foot=joint(knee,0,-.274);
      foot.name='ankle'+name;
      mesh(foot,'#543b2c',rounded,0,0,.043,.153,.115,.237);
      const shoulder=joint(pelvis,side*.209,1.003);
      shoulder.name='shoulder'+name;
      shoulder.rotation.z=side*Math.PI/2;
      mesh(shoulder,shirt,rounded,0,-.13,0,.12,.34,.12);
      const elbow=joint(shoulder,0,-.28);
      elbow.name='elbow'+name;
      mesh(elbow,shirt,rounded,0,-.11,0,.1,.26,.1);
      mesh(elbow,skin,sphere,0,-.26,0,.05,.07,.05);
    }
    skinRig(root,pelvis);
    const mixer=new THREE.AnimationMixer(root);
    const actions=Object.fromEntries(clips.map(animation=>[animation.name,mixer.clipAction(animation)]));
    for (const name of ['Wave','Kick']) {
      actions[name].setLoop(THREE.LoopOnce,1);
      actions[name].clampWhenFinished=true;
    }
    let retargeted;
    const name=outfit==='apron'?'barista':resident;
    const asset=modelFor?.(name);
    if (asset) {
      asset.traverse(node=>{
        if (!node.isMesh) return;
        const source=node.material;
        const paint=new THREE.MeshToonMaterial({map:source.map,gradientMap:ramp,color:0xfffcf7});
        paint.onBeforeCompile=shader=>{
          shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',
            '#include <map_fragment>\nfloat lum=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)); diffuseColor.rgb=max(vec3(0.),mix(vec3(lum),diffuseColor.rgb,1.14));');
        };
        if(source.map)source.map.anisotropy=renderer.capabilities.getMaxAnisotropy();
        paint.side=THREE.FrontSide;node.material=paint;
      });
      try {
        retargeted=window.matchaPark.retargetHumanoid(THREE,root,asset);
      } catch (error) {
        console.warn(`Using local rig for ${name} because the Meshy bones could not be mapped`,error);
      }
    }
    return {root,mixer,actions,skin:retargeted,apron:outfit==='apron'};
  }

  function dog(pale=false) {
    const root = new THREE.Group();
    root.scale.setScalar(pale?.73:.84);
    mesh(root, pale?'#e5dbbf':'#be875a', sphere, 0,.44,0,.22,.16,.39);
    mesh(root, pale?'#efead7':'#e6b383', sphere, 0,.58,.33,.17,.16,.19);
    mesh(root, '#866044', sphere, 0,.58,.49,.087,.058,.063);
    for (const side of [-1,1]) mesh(root, '#8d6044', sphere, side*.13,.63,.31,.065,.13,.07);
    for(const side of [-1,1]){mesh(root,'#322720',sphere,side*.082,.633,.473,.034,.038,.022);mesh(root,'#fff4d4',sphere,side*.082-.008,.645,.489,.009,.01,.009);mesh(root,'#f5dfbb',sphere,side*.055,.551,.49,.076,.055,.07)}
    mesh(root,'#352821',sphere,0,.588,.546,.054,.036,.036);
    mesh(root,'#698d70',sphere,0,.49,.255,.166,.055,.142);
    const tail = mesh(root, '#d99c63', sphere, 0,.55,-.39,.07,.28,.08);
    tail.rotation.x = -.8;
    const legs = [];
    for (const z of [-.24,.23]) for (const x of [-.115,.115]) {
      const leg = joint(root,x,.4);
      leg.position.z = z;
      mesh(leg, '#ba8459', box, 0,-.18,0,.085,.36,.09);
      legs.push(leg);
    }
    return {root,legs,tail};
  }

  function draw(actor,time,delta, poseOnly=false) {
    const {model,mode,stride,facing,sprite}=actor;
    const {root,mixer,actions}=model;
    if (mixer) {
      const name={sit:'Sit',rest:'Meditate',kick:'Kick',wave:model.skin?'Idle':'Wave',tpose:'T-Pose'}[mode]
        ?? (stride>.13?(model.apron?'ApronWalk':'Walk'):'Idle');
      const action=actions[name];
      if (model.current!==action) {
        model.current?.fadeOut(.16);
        action.reset().setEffectiveWeight(1).play();
        if (model.current) action.fadeIn(.16);
        model.current=action;
      }
      actions.Walk.setEffectiveTimeScale(.65+stride*.62);
      actions.ApronWalk.setEffectiveTimeScale(.77+stride*.33);
      mixer.update(delta);
      if(name==='Idle')for(const side of ['Left','Right']){const arm=root.getObjectByName('shoulder'+side),elbow=root.getObjectByName('elbow'+side);const beat=time*(1.5+actor.offset%4*.12)+actor.offset;arm.rotation.x=-.08-.1*Math.sin(beat)+.08*Math.cos(actor.offset);elbow.rotation.x=-.27-.16*Math.cos(beat*.55+(side==='Left'?2:0))-.16*(actor.offset%3);}

    } else {
      model.tail.rotation.z=.55*Math.sin(time*7);const cycle=Math.sin(time*13)*stride;
      root.position.y=Math.abs(cycle)*.028;
      model.legs.forEach((leg,i)=>leg.rotation.x=cycle*(i===0||i===3?1:-1)*.46);
    }
    if (model.heading===undefined) model.heading=facing;
    const turn=Math.atan2(Math.sin(facing-model.heading),Math.cos(facing-model.heading));
    model.heading+=turn*Math.min(1,delta*15);
    root.rotation.y=model.heading;
    const breath=Math.sin(time*1.9+actor.offset*1.37);
    const remaining=(actor.waveUntil||0)-time;
    const wave=remaining>0?Math.min(1,(1.85-remaining)*5,remaining*4):0;
    model.skin?.update(breath,wave,time,mode);
    if (poseOnly) return;
    if (renderer.domElement.width!==width) renderer.setSize(width,height,false);
    const display=model.skin?.display ?? root;
    scene.add(display);
    renderer.render(scene,camera);
    sprite.clearRect(0,0,sprite.canvas.width,sprite.canvas.height);
    sprite.drawImage(renderer.domElement,0,0);
    scene.remove(display);
  }

  // The counter looks straight out along the path. Keep the village rig and its pose.
  const counterCamera = new THREE.OrthographicCamera(-.5, .5, .92, -.78, .1, 12);
  const counterCanvas = document.createElement('canvas');
  counterCanvas.width = 416;
  counterCanvas.height = 520;
  const counterContext = counterCanvas.getContext('2d');
  function counterView(actor, progress) {
    const display = actor.model.skin?.display ?? actor.model.root;
    const heading = display.rotation.y;
    const t = THREE.MathUtils.smoothstep(progress, 0, 1);
    const height = THREE.MathUtils.lerp(1.82, .89, t);
    const center = THREE.MathUtils.lerp(.7, .78, t);
    counterCamera.zoom = .86 / height;
    counterCamera.updateProjectionMatrix();
    counterCamera.position.set(0, center + .055, 4);
    counterCamera.lookAt(0, center, 0);
    try {
      display.rotation.y = .09 * (1 - t);
      scene.add(display);
      if (renderer.domElement.width!==counterCanvas.width) renderer.setSize(counterCanvas.width, counterCanvas.height, false);
      renderer.render(scene, counterCamera);
      counterContext.clearRect(0, 0, counterCanvas.width, counterCanvas.height);
      counterContext.drawImage(renderer.domElement, 0, 0);
      return counterCanvas;
    } finally {
      scene.remove(display);
      display.rotation.y = heading;
    }
  }

  return {humanoid, dog, draw, counterView};
};
