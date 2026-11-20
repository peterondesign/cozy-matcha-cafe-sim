(() => {
const {art, createActorStage} = window.matchaPark;

const nodes = [
  [466,520],[467,448],[468,372],[457,297],[519,300],[584,289],[658,292],[724,318],[792,351],
  [465,252],[503,204],[543,169],[606,137],[629,153],[726,162],[794,133],[787,91],[730,69],[648,70],[594,100],
  [418,239],[377,201],[337,193],[316,182],[301,169],[236,176],[252,198],
  [380,275],[307,259],[238,249],[163,243],[88,226],[21,208],[171,279],[174,288],
  [559,337],[618,376],[668,409],[739,409],
  [640,162],[700,172],[762,148],[798,108],[748,72],[688,58],[612,78],[588,122]
];
const trails = [
  [0,1,2,3,4,5,6,7,8],[3,9,10,11,12,13,14,15,16,17,18,19,12],
  [3,20,21,22,23,24,25,26],[3,27,28,29,30,31,32],[30,33,34],
  [4,35,36,37,38],[13,39,40,41,42,43,44,45,46,39]
];
const edges = trails.flatMap(trail => trail.slice(1).map((node,i)=>[trail[i],node]));
const distance = (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1]);

// Ground footprints are smaller than the painted silhouettes above them.
const footprints = [
  [[734,267],[806,238],[880,267],[893,310],[834,341],[779,339],[722,307]],
  [[35,346],[183,290],[282,343],[285,376],[152,431],[39,382]],
  [[164,141],[195,129],[221,143],[218,156],[190,163],[165,152]]
];
const blockers = [[705,100,40,18],[809,68,25,6],[629,141,25,6],[591,74,24,6],[786,139,23,6],
  [425,484,9,10],[511,484,9,10],[73,305,8,7],[386,107,8,7]];
function insidePolygon([x,y],polygon) {
  let inside=false;
  for (let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const [ax,ay]=polygon[i], [bx,by]=polygon[j];
    if ((ay>y)!==(by>y) && x<(bx-ax)*(y-ay)/(by-ay)+ax) inside=!inside;
  }
  return inside;
}
function walkable(point) {
  const [x,y]=point;
  return x>=12 && x<=948 && y>=20 && y<=528
    && !(Math.hypot((x-148)/28,(y-124)/12)<1)
    && !footprints.some(polygon=>insidePolygon(point,polygon))
    && !blockers.some(([cx,cy,rx,ry])=>((x-cx)/rx)**2+((y-cy)/ry)**2<1);
}
function clearSegment(from,to) {
  const steps=Math.max(1,Math.ceil(distance(from,to)/4));
  return Array.from({length:steps},(_,i)=>(i+1)/steps).every(fraction=>
    walkable([from[0]+(to[0]-from[0])*fraction,from[1]+(to[1]-from[1])*fraction]));
}
function openRoute(from,to) {
  if (clearSegment(from,to)) return [to];
  const step=12;
  const point=(x,y)=>[x*step,y*step];
  const around=([x,y])=>Array.from({length:9},(_,i)=>point(
    Math.round(x/step)+i%3-1,Math.round(y/step)+Math.floor(i/3)-1));
  const queue=around(from).filter(cell=>clearSegment(from,cell)).map(cell=>({cell,cost:distance(from,cell)}));
  const visited=new Set();
  while (queue.length) {
    queue.sort((a,b)=>b.cost+distance(b.cell,to)-a.cost-distance(a.cell,to));
    const node=queue.pop();
    const key=node.cell.join();
    if (visited.has(key)) continue;
    visited.add(key);
    if (clearSegment(node.cell,to)) {
      const path=[to];
      for (let current=node;current;current=current.parent) path.unshift(current.cell);
      const smooth=[];
      let start=from;
      while (path.length) {
        let farthest=path.length-1;
        while (farthest>0 && !clearSegment(start,path[farthest])) farthest--;
        [start]=path.splice(farthest,1);
        path.splice(0,farthest);
        smooth.push(start);
      }
      return smooth;
    }
    for (const cell of around(node.cell)) {
      if (!visited.has(cell.join()) && clearSegment(node.cell,cell)) {
        queue.push({cell,cost:node.cost+distance(node.cell,cell),parent:node});
      }
    }
  }
  return [];
}

function nearestEdge(point) {
  let best;
  for (const [a,b] of edges) {
    const [x,y] = nodes[a];
    const dx = nodes[b][0]-x, dy = nodes[b][1]-y;
    const fraction = Math.max(0,Math.min(1,((point[0]-x)*dx+(point[1]-y)*dy)/(dx*dx+dy*dy)));
    const projected = [x+dx*fraction,y+dy*fraction];
    const gap = distance(point,projected);
    if (!best || gap < best.gap) best = {a,b,point:projected,gap};
  }
  return best;
}

function route(from,to) {
  const start = nearestEdge(from), end = nearestEdge(to);
  if (start.a === end.a && start.b === end.b) return [start.point,end.point];
  const costs = new Map([[start.a,distance(from,nodes[start.a])],[start.b,distance(from,nodes[start.b])]]);
  const parents = new Map();
  const pending = new Set(nodes.keys());
  while (pending.size) {
    const node = [...pending].reduce((a,b)=>(costs.get(a)??Infinity)<(costs.get(b)??Infinity)?a:b);
    pending.delete(node);
    for (const [a,b] of edges) {
      const next = a === node ? b : b === node ? a : -1;
      if (!pending.has(next)) continue;
      const cost = (costs.get(node)??Infinity)+distance(nodes[node],nodes[next]);
      if (cost >= (costs.get(next)??Infinity)) continue;
      costs.set(next,cost);
      parents.set(next,node);
    }
  }
  const total = node => costs.get(node)+distance(nodes[node],end.point);
  let cursor = total(end.a)<total(end.b)?end.a:end.b;
  const result = [end.point];
  while (cursor !== undefined) {
    result.unshift(nodes[cursor]);
    cursor = parents.get(cursor);
  }
  return [start.point,...result];
}

window.matchaPark.createPark = function createPark(THREE, onCounter, modelFor) {
  const panel = document.querySelector('#park');
  const showBindPose=new URLSearchParams(location.search).has('bindPose');
  const map = panel.querySelector('svg.park-map');
  map.innerHTML = art+'<image class="park-painted" href="assets/park-painted.jpg" width="960" height="540" preserveAspectRatio="none"/><g id="park-marker"></g><g id="park-depth"></g><g id="park-labels"></g></g>';
  const depth = map.querySelector('#park-depth');
  const dayPlate=map.querySelector('image.park-painted');
  const nightPlate=dayPlate.cloneNode();
  nightPlate.setAttribute('href','assets/park-evening.jpg');
  nightPlate.setAttribute('class','park-evening');
  dayPlate.after(nightPlate);
  const labels = map.querySelector('#park-labels');
  const marker = map.querySelector('#park-marker');
  const toast=panel.querySelector('.park-toast');
  let messageUntil=0, speaker;
  function say(text,position) {
    speaker=position;
    toast.classList.toggle('speech',Boolean(position));
    toast.textContent=text;
    toast.hidden=false;
    messageUntil=time+(position?5:3.5);
  }
  function updateToast() {
    toast.hidden=time>=messageUntil;
    if (toast.hidden || !speaker) return;
    const [x,y]=speaker();
    const screen=new DOMPoint(x,y-52).matrixTransform(map.getScreenCTM());
    const inset=toast.offsetWidth/2+12;
    const visible=screen.x>=0 && screen.x<=innerWidth && screen.y<=innerHeight;
    toast.classList.toggle('speech',visible);
    if (!visible) return;
    toast.style.left=`${Math.max(inset,Math.min(innerWidth-inset,screen.x))}px`;
    toast.style.top=`${Math.max(120,screen.y)}px`;
  }
  const svg = (tag, attrs = {}) => {
    const element = document.createElementNS('http://www.w3.org/2000/svg',tag);
    for (const [name,value] of Object.entries(attrs)) element.setAttribute(name,value);
    return element;
  };
  const layers = [];
  let depthOrder = [];
  function layer(markup,x,y,sortY=y) {
    const element = svg('g',{transform:`translate(${x} ${y})`});
    element.innerHTML = markup;
    depth.append(element);
    const item = {element,y:sortY};
    layers.push(item);
    return item;
  }
  // Reuse the background pixels for props that can conceal a passing character.
  const foreground = [
    [140,'M641 112L644 72 638 46 645 32 653 26 656 16 670 11 673 0H734L740 12 751 16 763 30 769 41 766 55 770 64 760 76 732 77 716 95 737 102 742 113 727 124 693 127 662 121Z'],
    [339,'M690 309L691 286 712 274 724 246 766 224 809 207 839 219 860 238 865 246 886 251 900 266 900 304 884 321 850 340 824 345 781 348 743 334 703 323Z'],
    [489,'M403 491V432Q462 387 519 432V491H503V437Q462 400 420 437V491Z']
  ];
  const foregroundLayers=foreground.map(([y,outline],index)=>{
    const id=`park-foreground-${index}`;
    const clip=svg('clipPath',{id});
    clip.append(svg('path',{d:outline}));
    map.querySelector('defs').append(clip);
    return layer(`<image class="park-painted" href="assets/park-painted.jpg" width="960" height="540" preserveAspectRatio="none" clip-path="url(#${id})"/><image class="park-evening" href="assets/park-evening.jpg" width="960" height="540" preserveAspectRatio="none" clip-path="url(#${id})"/>`,0,0,y);
  });

  foregroundLayers[0].y=116;
  foregroundLayers[0].element.innerHTML='<image class="park-painted" href="assets/park-painted-tree.png" x="633" width="139" height="120"/><image class="park-evening" href="assets/park-evening-tree.png" x="633" width="139" height="120"/>';
  const groceryLayer=foregroundLayers[1];
  // Sort on the roofline so people on the path in front of the shop paint over the facade.
  groceryLayer.y=228;
  groceryLayer.element.dataset.prop='grocery';
  groceryLayer.element.classList.add('park-grocery');
  const groundMask=svg('mask',{id:'park-grocery-reveal',maskUnits:'userSpaceOnUse',
    x:684,y:200,width:224,height:153});
  const soften=svg('filter',{id:'park-grocery-edge'});
  soften.append(svg('feGaussianBlur',{stdDeviation:2}));
  groundMask.append(svg('path',{d:'M686 337L686 276L714 266L720 235L763 219L806 201L848 212L878 238L903 248L907 286L907 332L867 351L760 351Z',
    fill:'white',filter:'url(#park-grocery-edge)'}));
  map.querySelector('defs').append(soften,groundMask);
  const groceryGround=svg('image',{
    href:'assets/grocery-ground.jpg',x:684,y:200,width:224,height:153,
    mask:'url(#park-grocery-reveal)',class:'park-grocery-ground'
  });
  marker.append(groceryGround);
  const groceryOutline=map.querySelector('#park-foreground-1 path');
  let seed = 316;
  const random = () => (seed = seed * 16807 % 2147483647)/2147483647;
  const goal = svg('ellipse',{rx:9,ry:4,fill:'none',stroke:'#fff3cf','stroke-width':2,visibility:'hidden'});
  marker.append(goal);
  for (let i=0;i<13;i++) {
    const petal=svg('ellipse',{cx:650+random()*105,cy:35+random()*100,rx:2.5,ry:1.3,fill:'#ffe5dd',class:'petal',style:`animation-delay:-${random()*7}s`});
    labels.append(petal);
  }

  const ring = layer('<ellipse rx="11" ry="4.5" fill="#627a46" fill-opacity=".2" stroke="#fff1c1" stroke-width="1.1"/>',0,0);
  marker.append(svg('image',{class:'village-deck',href:'assets/stall/deck.png',x:42,y:18,width:392,height:224}));
  const stallImage=layer('<image class="village-cart" href="assets/stall/designer-cart.png" x="-46" y="-148" width="108" height="156"/>',148,136,136);
  const furnishings=[
    ['lights','lights',146,54,68,.65],['bunting','bunting',198,44,82,.70],['chimes','chimes',112,104,16,2.57],
    ['fern','fern',104,128,24,1.50],['flowers','flowers',126,150,28,1.20],['jars','jars',252,124,32,.94],
    ['mat','mat',178,158,36,.62],['tea-table','table',232,174,42,1.02],['seats','cushions',276,178,34,.78],
    ['sign','board',312,156,32,1.27],
    ['canopy','bunting',268,96,176,.70],['lantern-court','lights',330,72,128,.65],
    ['orchard-planters','flowers',58,208,74,1.20],['lounge','cushions',392,188,92,.78],
    ['grand-board','board',468,146,70,1.27]
  ].map(([id,file,x,y,w,aspect])=>{
    const height=Math.round(w*aspect);
    return [id,layer('<image href="assets/decor/'+file+'.png" x="'+(-w/2)+'" y="'+(-height)+'" width="'+w+'" height="'+height+'"/>',x,y).element];
  });
  const stallNode=stallImage.element.querySelector('image');
  function showStall(){
    for(const [id,el] of furnishings)el.style.display=document.body.dataset.upgrades.split(' ').includes(id)?'':'none';
    stallNode.setAttribute('href','assets/stall/designer-cart.png');
    stallNode.setAttribute('width',108);
    stallNode.setAttribute('height',156);
    stallNode.setAttribute('x',-46);
    stallNode.setAttribute('y',-148);
  }
  document.addEventListener('stall',showStall);
  showStall();
  const cartSign=layer('<rect x="-15" y="-6" width="30" height="12" rx="2" fill="#fff0be" stroke="#795636"/><text text-anchor="middle" y="3" fill="#553b2c" font-size="8">Closed</text>',152,112,148).element.querySelector('text');
  let staffed=false, service=null, guest=null, approachLength=0, switchAt=0;
  const servedOnVisit=new Set();
  function staff(value) {
    staffed=value;
    cartSign.textContent=value?'Open':'Closed';
    document.body.dataset.cart=value?'open':'closed';
  }
  function releaseGuest() {
    if (guest) {
      guest.speed=28;
      guest.path=route(guest.position,nodes[party.indexOf(guest)===1?13:33]);
      guest=null;
    }
    service=null;
  }
  const lights=svg('g',{class:'village-light'});
  const gradient=svg('radialGradient',{id:'village-glow'});
  for (const [offset,opacity] of [['0%',.9],['25%',.48],['100%',0]]) gradient.append(svg('stop',{offset,'stop-color':'#ffce76','stop-opacity':opacity}));
  map.querySelector('defs').append(gradient);
  for (const [x,y] of [[386,48],[75,251],[307,438],[598,431],[900,257],[738,268],[813,277],[862,265]]) {
    lights.append(svg('circle',{cx:x,cy:y,r:20,fill:'url(#village-glow)'}));
    lights.append(svg('ellipse',{cx:x,cy:y,rx:2.3,ry:3.1,fill:'#fff1bc'}));
  }
  labels.append(lights);
  const stage = createActorStage(THREE,modelFor);
  const actors = [];
  function actor(position,model,options={}) {
    const item = layer('<ellipse cy="1" rx="11" ry="4" fill="#415237" opacity=".23"/>',...position);
    const foreign = svg('foreignObject',{x:-36,y:-78,width:72,height:92});
    const canvas = document.createElement('canvas');
    canvas.width=320;
    canvas.height=384;
    canvas.style.cssText='width:100%;height:100%;display:block';
    foreign.append(canvas);
    item.element.dataset.model=model.skin?'meshy':'local';
    item.element.append(foreign);
    const character = {position:[...position],item,model,sprite:canvas.getContext('2d'),mode:'idle',
      path:[],facing:0,stride:0,speed:34,offset:actors.length,pause:0,waypoint:0,...options};
    actors.push(character);
    return character;
  }
  const player = actor(nodes[3],stage.humanoid('#f6e5bf','#60634a','#d8a477','#493027','apron'),{speed:68});
  player.item.element.setAttribute('data-player','');
  const walker = actor(nodes[10],stage.humanoid('#78848b','#524c53','#ce9c77','#39312f','cap','blue'),{patrol:[12,13,9,3,20,23,20,10]});
  const dogWalker = actor(nodes[33],stage.humanoid('#ad8956','#4e655a','#b77b52','#4c3025','hat','green'),{patrol:[30,31,32,31,30,33,34,33],speed:32});
  const dog = actor([171,306],stage.dog(),{speed:30});
  const eastWalker=actor([934,322],stage.humanoid('#a87b9f','#574865','#a56e52','#392925',null,'rose'),{speed:31});
  eastWalker.name='June';eastWalker.line='Pip likes the long way past the grocery.';
  const eastDog=actor([947,327],stage.dog(true),{speed:40});
  let eastStop=0;
  const eastTrail=[[881,357],[746,365],[662,315],[746,365],[881,357],[934,322]];
  const leash = svg('line',{stroke:'#674c39','stroke-width':1.4,'pointer-events':'none'});
  const leashLayer = {element:leash,y:0};
  layers.push(leashLayer);
  depth.append(leash);
  const elder=actor([581,81],stage.humanoid('#b68280','#706163','#d4a17c','#49362a',null,'elder'),{mode:'sit',facing:1.72});
  const copper=actor([774,149],stage.humanoid('#83985d','#8a6951','#e1b88b','#84654a',null,'copper'),{mode:'sit',facing:-1.55});
  const yogi=actor([580,229],stage.humanoid('#a87b9f','#574865','#a56e52','#392925',null,'rose'),{mode:'rest'});

  const kids = [
    actor(nodes[37],stage.humanoid('#5e8a69','#b78c59','#d4a177','#42312a',null,'blue'),{facing:1.1}),
    actor(nodes[38],stage.humanoid('#dfb66e','#688598','#996244','#372926',null,'rose'),{facing:-1.9})
  ];
  kids.forEach(kid=>kid.item.element.querySelector('foreignObject').setAttribute('transform','scale(.96)'));
  const football = layer('<defs><radialGradient id="ballLight" cx="32%" cy="20%" r="85%"><stop stop-color="#fffdf1"/><stop offset=".65" stop-color="#e5dcc4"/><stop offset="1" stop-color="#a19680"/></radialGradient><clipPath id="ballEdge"><circle r="6"/></clipPath></defs><g transform="translate(0 -5)"><circle r="6" fill="url(#ballLight)" stroke="#51483b" stroke-width=".7"/><g class="ball-panels" clip-path="url(#ballEdge)" fill="#49473d" stroke="#686256" stroke-width=".35"><path d="m0-2 2.2 1.5-.8 2.5h-2.8l-.8-2.5z M-6-2l2-2 1 2-2 2z M3-5l3 1-1 2-2-1z M3 4l2-1 1 3-4 1z M-4 3l2 1-1 3-3-2z"/><path fill="none" d="M0-2l1-3 2-1M2 0l3-1m-4 3 2 2m-5-3-2 2M-2-1l-2-1"/></g></g>',680,409);

  const dust = Array.from({length:5},()=> {
    const shape=svg('ellipse',{rx:3,ry:1.5,fill:'#ebca9c',opacity:0});
    marker.append(shape);
    return {shape,born:-1};
  });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let nextDust=0, dustIndex=0;
  let arrival, sitting=false, frame=0, last=0, time=0, rendered=-1;
  function walk(target,action) {
    const origin=sitting?sitting.exit:player.position;
    const approved=openRoute(origin,target);
    if (!approved.length) return false;
    if (sitting) player.position=origin;
    sitting=false;
    if (staffed) staff(false);
    arrival=action;
    player.path=approved;
    goal.setAttribute('cx',target[0]);
    goal.setAttribute('cy',target[1]);
    goal.setAttribute('visibility','visible');
    return true;
  }

  const interactions = [];
  const interact = panel.querySelector('#park-interact');
  const keys = new Set();
  const pointers = new Map();
  const directions = {
    KeyW:'up',ArrowUp:'up',KeyA:'left',ArrowLeft:'left',
    KeyS:'down',ArrowDown:'down',KeyD:'right',ArrowRight:'right'
  };
  const padButtons = [...panel.querySelectorAll('[data-direction]')];
  function clearMovement() {
    keys.clear();
    pointers.clear();
    padButtons.forEach(button=>button.classList.remove('pressed'));
  }
  for (const button of padButtons) {
    button.addEventListener('pointerdown',event=>{
      if (event.button!==0) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId,button.dataset.direction);
      button.classList.add('pressed');
    });
    const release=event=>{
      pointers.delete(event.pointerId);
      button.classList.toggle('pressed',[...pointers.values()].includes(button.dataset.direction));
    };
    for (const event of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(event,release);
    for (const event of ['keydown','keyup']) button.addEventListener(event,input=>{
      if (input.code!=='Space' && input.code!=='Enter') return;
      input.preventDefault();
      const id=button.dataset.direction+input.code;
      if (event==='keydown') pointers.set(id,button.dataset.direction);
      else pointers.delete(id);
      button.classList.toggle('pressed',[...pointers.values()].includes(button.dataset.direction));
    });
    button.addEventListener('blur',()=>{
      pointers.delete(button.dataset.direction+'Space');
      pointers.delete(button.dataset.direction+'Enter');
      button.classList.toggle('pressed',[...pointers.values()].includes(button.dataset.direction));
    });
  }
  let nearby;
  function useNearby() {
    if (!nearby) return;
    player.path=[];
    arrival=undefined;
    nearby.action();
  }
  interact.onclick=useNearby;
  const typing=event=>event.target.closest('input,textarea,select')||event.target.closest('#saveCard');
  addEventListener('keydown',event=>{
    if (typing(event)||document.querySelector("dialog[open]") || panel.hidden || event.altKey || event.ctrlKey || event.metaKey) return;
    if (directions[event.code]) {
      event.preventDefault();
      keys.add(event.code);
    }
    if (event.code==='KeyE' && !event.repeat && nearby) {event.preventDefault();useNearby();}
  });
  addEventListener('keyup',event=>{if(!typing(event))keys.delete(event.code)});
  addEventListener('blur',clearMovement);
  document.addEventListener('visibilitychange',()=>{if (document.hidden) clearMovement();});

  function addInteraction(name,position,action,node,owner,radius) {
    const attributes={class:'park-approach','aria-hidden':'true'};
    if (node!==undefined) Object.assign(attributes,{
      role:'button',tabindex:0,'aria-label':name,'data-place':name,'aria-hidden':'false'
    });
    const outline=svg('g',attributes);
    const [rx,ry]=radius||(node===undefined?[14,6]:[20,8]);
    outline.append(svg('ellipse',{rx,ry,class:'approach-ground'}));
    marker.append(outline);
    if (node!==undefined) {
      const activate=event=>{
        event.stopPropagation();
        if (walk(position(),action)) say(`Walking to ${name.toLowerCase()}…`);
      };
      outline.addEventListener('click',activate);
      outline.addEventListener('keydown',event=>{
        if (event.key==='Enter'||event.key===' ') {event.preventDefault();activate(event);}
      });
    }
    interactions.push({name,position,action,outline,owner,reach:radius?Math.max(32,rx):32});
    return outline;
  }
  const place=(name,node,action,radius)=>addInteraction(name,()=>nodes[node],action,node,undefined,radius);
  addInteraction('Café counter',()=>[248,150],()=>{if (!staffed) {staff(true);switchAt=time+1.05;onCounter(false);}},true,undefined,[78,32]).classList.add('cafe-open');
  place('Grocery shop',8,()=>window.openGrocery(),[51,20]);
  addInteraction('Garden',()=>[146,408],()=>window.openGarden(),true,undefined,[34,15]);
  const seatView=document.createElement('button');seatView.className='seat-view';seatView.textContent='Look around';seatView.hidden=true;panel.append(seatView);
  seatView.onclick=()=>{if(sitting)window.openSeatView(sitting,actors.filter(a=>a!==player))};
  const seats=[['Plaza bench',[636,158],[636,150],.17],['West bench',[607,86],[605,76],.98],['East bench',[813,89],[813,79],-.58],['South bench',[803,154],[803,145],-.42],['Yoga mat',[643,243],[644,228],.28]];
  for(const [name,exit,anchor,facing] of seats)addInteraction(name,()=>exit,()=>{
    player.position=[...anchor];player.facing=facing;sitting={name,exit,anchor,facing,mat:name.endsWith('mat')};say('Move to stand, or look around.');
  },true,undefined,name.endsWith('mat')?[18,8]:undefined);
  const villagers=[
    ['baker','Bea','I brought a loaf for the afternoon picnic.'],
    ['tailor','Ellis','I like watching the breeze catch those blossoms.'],
    ['florist','Hana','The camellias opened this morning.'],
    ['librarian','Theo','There’s a sunny reading spot by the plaza.'],
    ['skater','Remy','I take the long way home through here.'],
    ['seamstress','Iris','The light is just right for stitching today.'],
    ['gardener','Omar','The new shoots are coming along nicely.'],
    ['hiker','Kit','I can smell the tea from the gate.'],
    ['painter','Lou','I’m trying to mix that shade of green.'],
    ['postwoman','Mira','One last letter, then tea.']
  ];
  const secondVisitor=actor([-80,210],walker.model,{speed:30});
  const cast=new Map();
  const extraWalkers = [27,31].map(speed=>actor([-80,210],walker.model,{speed}));
  const people=[...extraWalkers,elder,copper,yogi,...kids,walker,secondVisitor,dogWalker,eastWalker];
  const residents=[
    [elder,'Mrs. Sato','This bench catches the morning sun.'],
    [copper,'Rowan','Stay a little. The breeze is lovely here.'],
    [yogi,'Amara','A slow breath and a quiet stretch.'],
    [kids[0],'Jun','Watch my next pass!'],[kids[1],'Nia','We’re keeping score in blossoms.'],
    [dogWalker,'Dev','Mochi always stops here to sniff the herbs.']
  ];
  for (const [person,name,line] of residents) Object.assign(person,{name,line});
  for (const person of people) addInteraction('Say hello',()=>person.position,()=>{
    person.waveUntil=time+1.85;
    const reward=window.greetResident(person.name);
    say(person.name+' · '+person.line+(reward?' · +1 satisfaction':''),()=>person.position);
  },undefined,person);
  addInteraction('Greet the dog',()=>dog.position,()=>say('Mochi gives your hand a gentle nudge.',()=>dog.position),undefined,dog);
  function visible(person,on) {
    person.away=!on;
    person.item.element.style.display=on?'':'none';
    person.path=[];
    person.stride=0;
  }
  let visit=0,nextVisitor=0,party=[],pauseUntil=0,outing='away';
  function villageHour(){return ((window.matchaClock?.get?.()??720)%1440)/60}
  function wanderers(){
    const hour=villageHour();
    if (hour<8 || hour>=19) return 0;
    if (hour>=11 && hour<16) return 3;
    return 1;
  }
  function sendHome(person){
    if (person.away || person.leaving) return;
    person.leaving=true;
    const exit=route(person.position,nodes[32]);
    person.path=[...(exit.length?exit:[nodes[32]]),[-90,220]];
  }
  function startOuting() {
    const count=wanderers();
    if (!count) {
      for (const person of [walker,secondVisitor,...extraWalkers,dogWalker,dog]) if (!person.away) sendHome(person);
      party=[];
      leash.style.display='none';
      outing='away';
      pauseUntil=time+8;
      return;
    }
    const dogDay=visit%3===0;
    visit++;
    servedOnVisit.clear();
    for (const person of [walker,secondVisitor,...extraWalkers,dogWalker,dog]) visible(person,false);
    leash.style.display=dogDay?'':'none';
    party=(dogDay?[dogWalker,...extraWalkers]:[walker,secondVisitor,...extraWalkers]).slice(0,count);
    visible(dog,dogDay);
    party.forEach((person,i)=>{
      visible(person,true);
      person.speed=dogDay?26:28+i*2;
      const start=i%2?[467,577+i*15]:[-65-i*22,209];
      person.position=[...start];
      if (person!==dogWalker) {
        const [,name,line]=villagers[nextVisitor%villagers.length];
        const skin=['rose','green','blue','copper'][nextVisitor++%4];
        if (!cast.has(skin)) cast.set(skin,stage.humanoid('#759376','#65554c','#bd9377','#46352e',null,skin));
        Object.assign(person,{name,line,model:cast.get(skin)});
      }
      const entry=i%2?nodes[0]:nodes[32];
      const destination=person===dogWalker?nodes[33]:nodes[[22,13,10,23][i]];
      person.path=[entry,...route(entry,destination)];
    });
    dog.position=[-77,216];
    outing='arrival';
  }
  const activityCast=new Map();
  let nextActivity = 24, activityNumber = 0;
  function activity(on) {
    const footballDay = activityNumber % 2 === 0;
    const group = on ? (footballDay ? kids : [yogi]) : [];
    for (const person of [...kids,yogi]) {
      if (group.includes(person) || person.away || person.leaving) continue;
      person.leaving=true;person.mode='idle';
      const exit=route(person.position,nodes[0]);
      person.path=[...(exit.length?exit:[nodes[0]]),[486,600]];
    }
    football.element.style.display=on && footballDay?'':'none';
    if (!on) return;
    group.forEach((person,i)=>{
      const [,name,line]=villagers[(Math.floor(activityNumber/2)*3+i+(footballDay?0:4))%villagers.length];
      const skin=['blue','rose','green','copper'][(activityNumber+i)%4];
      if(!activityCast.has(skin)) activityCast.set(skin,stage.humanoid(i?'#c99558':'#8a9e76','#625c4e','#bf926d','#49392f',null,skin));
      person.model=activityCast.get(skin);
      Object.assign(person,{name,line,mode:footballDay?'idle':'rest'});
      visible(person,true);
    });
  }
  activity(false);
  startOuting();
  function scheduleVisits() {
    const count=wanderers();
    const eastOut=count>=2;
    if (Boolean(eastWalker.away)===eastOut) {
      visible(eastWalker,eastOut);visible(eastDog,eastOut);
      if (eastOut) {eastWalker.position=[934,322];eastDog.position=[947,327];eastStop=0}
    }
    if (count && party.length>count && (outing==='rest'||outing==='arrival')) {
      party.slice(count).forEach(sendHome);
      party=party.slice(0,count);
    }
    if (guest) return;
    if (party.some(person=>person.path.length || time<(person.waveUntil||0))) return;
    if (staffed && (outing==='rest'||outing==='arrival') && !guest) {
      const person=party.filter(p=>!p.away && !servedOnVisit.has(p)).sort((a,b)=>distance(a.position,[252,198])-distance(b.position,[252,198]))[0];
      const path=person&&openRoute(person.position,[252,198]);
      if(path?.length){if(path.length>2)person.position=[...path[path.length-3]];person.path=path.slice(-2);person.speed=32;pauseUntil=time+.4}
    }
    if (outing==='arrival') {outing='rest';pauseUntil=time+1.4+random();}
    if (time<pauseUntil) return;
    if (outing==='rest') {
      outing='departure';
      pauseUntil=time+30;
      party.forEach((person,i)=>{
        const exit=i?nodes[0]:nodes[32];
        person.path=[...route(person.position,exit),i?[467,590]:[-90,211]];
      });
      if(dog && !dog.away) dog.path=[...route(dog.position,nodes[32]),[-90,220]];
    } else if (outing==='departure') {
      const departed=[...party,dog].filter(person=>!person.away);
      if (departed.some(person=>person.path.length)) return;
      for (const person of departed) visible(person,false);
      leash.style.display='none';
      outing='away';pauseUntil=time+1.1+random()*1.6;
    } else if (outing==='away') startOuting();
  }
  panel.querySelector('button').onclick=()=>marker.querySelector('[data-place="Café counter"]').dispatchEvent(new MouseEvent('click'));
  map.addEventListener('click',event=>{
    const point = new DOMPoint(event.clientX,event.clientY).matrixTransform(map.getScreenCTM().inverse());
    const target=[point.x,point.y];
    if (walkable(target)) walk(target);
  });

  function advance(character,dt) {
    const target=character.path[0];
    const gap=target ? distance(character.position,target):0;
    if (target && gap <= character.speed*dt) {
      character.position=[...target];
      character.path.shift();
    } else if (target) {
      const dx=target[0]-character.position[0], dy=target[1]-character.position[1];
      character.position[0]+=dx/gap*character.speed*dt;
      character.position[1]+=dy/gap*character.speed*dt;
      character.facing=Math.atan2(dx,dy*1.5)+.52;
    }
    character.stride+=(Number(Boolean(target))-character.stride)*Math.min(1,dt*10);
  }

  function moveLayer(item,[x,y],rise=0) {
    item.y=y;
    item.element.setAttribute('transform',`translate(${x} ${y-rise})`);
  }

  function moveWithKeys(dt) {
    const active=new Set([...Array.from(keys,code=>directions[code]),...pointers.values()]);
    const dx=Number(active.has('right'))-Number(active.has('left'));
    const dy=Number(active.has('down'))-Number(active.has('up'));
    if (!dx && !dy) return false;
    if (staffed) staff(false);
    player.path=[];
    if (sitting) player.position=sitting.exit;
    sitting=false;
    arrival=undefined;
    const speed=player.speed*dt/Math.hypot(dx,dy);
    const [x,y]=player.position;
    const candidates=[[x+dx*speed,y+dy*speed],[x+dx*speed,y],[x,y+dy*speed]];
    const allowed=candidates.find(point=>distance(point,player.position)>.001 && walkable(point));
    if (allowed) {
      player.position=allowed;
      player.facing=Math.atan2(allowed[0]-x,(allowed[1]-y)*1.5)+.52;
    }
    player.stride+=(Number(Boolean(allowed))-player.stride)*Math.min(1,dt*10);
    if(player.stride>.45 && time>(player.stepAt||0)){player.stepAt=time+.34;window.matchaSfx?.step()}
    return true;
  }

  let cameraBox;
  function updateCamera() {
    if (!map.clientWidth || !map.clientHeight) return;
    const aspect=map.clientWidth/map.clientHeight;
    const height=540;
    const width=aspect>=1.4?960:Math.min(960,height*aspect);
    const x=Math.max(0,Math.min(960-width,player.position[0]-width/2));
    const y=Math.max(0,Math.min(540-height,player.position[1]-height/2));
    const nextBox=`${x} ${y} ${width} ${height}`;
    if (nextBox===cameraBox) return;
    map.setAttribute('viewBox',nextBox);
    cameraBox=nextBox;
  }

  function tick(now) {
    frame=requestAnimationFrame(tick);
    const delta=Math.min(.045,(now-last)/1000);
    last=now;
    if(document.querySelector('dialog[open]:not(.seat-pov)')) {clearMovement();return;}
    time+=delta;
    for (const person of [...kids,yogi,walker,secondVisitor,...extraWalkers,dogWalker,eastWalker]) if (person.leaving && !person.path.length) {visible(person,false);person.leaving=false;if(person===dogWalker){visible(dog,false);leash.style.display='none'}}
    if (wanderers()<3 && ![...kids,yogi].every(person=>person.away||person.leaving)) activity(false);
    if(!panel.hidden && wanderers()>=3 && time>=nextActivity && ![...kids,yogi].some(person=>person.leaving)){
      const begin=yogi.away && kids[0].away;
      activity(begin);
      if(!begin) activityNumber++;
      nextActivity=time+(begin?12+random()*6:65+random()*45);
    }
    scheduleVisits();
    for (const npc of party) npc.mode=time<(npc.waveUntil||0)?'wave':'idle';
    const [hx,hy]=dogWalker.position;
    dog.path=[[hx+18*Math.sin(dogWalker.facing),hy+13]];
    if (distance(dog.position,dog.path[0])<3) dog.path=[];
    if(!eastWalker.away && !eastWalker.path.length){eastWalker.path=openRoute(eastWalker.position,eastTrail[eastStop]);eastStop=(eastStop+1)%eastTrail.length}
    if(!eastDog.away && distance(eastDog.position,eastWalker.position)>18)eastDog.path=[[eastWalker.position[0]+10,eastWalker.position[1]+6]];
    const manual=moveWithKeys(delta);
    actors.forEach(character=>{
      if (character.away || (character===player && manual)) return;
      if (character.mode!=='wave') advance(character,delta);
      else character.stride*=Math.max(0,1-delta*10);
    });
    if (staffed && service) {
      if (!guest) {
        guest=party.find(person=>!person.away && !servedOnVisit.has(person) && person.path.length &&
          person.position[0]>12 && person.position[0]<948 && person.position[1]<526);
        if (guest) {
          const path=openRoute(guest.position,[252,198]);
          if (path.length) {
            guest.path=path;
            approachLength=Math.max(1,distance(guest.position,[252,198]));
            servedOnVisit.add(guest);
          } else guest=null;
        }
      }
      if (guest && (panel.hidden || !switchAt)) {
        const progress=Math.max(0,1-distance(guest.position,[252,198])/approachLength);
        stage.draw(guest,time,delta,true);
        const counterFrame=stage.counterView(guest, guest.path.length ? progress : 1);
        service.approach(guest,progress,counterFrame);
        if (guest.path.length && time>(guest.stepAt||0)){guest.stepAt=time+.32;window.matchaSfx?.step()}
        if (!guest.path.length) {
          const done=service.arrived;
          service=null;
          const portrait=document.createElement('canvas');
          portrait.width=256;portrait.height=320;
          portrait.getContext('2d').drawImage(counterFrame,0,0,256,320);
          done(guest,portrait.toDataURL('image/webp',.82));
        }
      }
    }
    if (switchAt && time>=switchAt) {
      switchAt=0;close();onCounter(true);
    }
    if (!panel.hidden) window.matchaParkSpot=[Math.round(player.position[0]),Math.round(player.position[1])];
    if (panel.hidden) return;
    if (!player.path.length) {
      goal.setAttribute('visibility','hidden');
      const action=arrival;
      arrival=undefined;
      action?.();
      if (panel.hidden) return;
    }
    let range=Infinity;
    const previousNearby=nearby;
    nearby=undefined;
    for (const target of interactions) {
      target.outline.style.display=target.owner?.away?'none':'';
      if (target.owner?.away) continue;
      const position=target.position();
      const gap=distance(player.position,position);
      target.outline.setAttribute('transform',`translate(${position.join(' ')})`);
      target.outline.classList.toggle('in-range',gap<target.reach);
      if (gap<target.reach && gap<range) { nearby=target;range=gap; }
    }
    if (previousNearby!==nearby) {
      interact.hidden=!nearby;
      if (nearby) {
        interact.querySelector('span').textContent=nearby.owner?.name?'Hello, '+nearby.owner.name:nearby.name;
        interact.setAttribute('aria-label',`Interact: ${nearby.name}`);
      }
    }
    updateCamera();
    if(nearby){const [x,y]=nearby.position();const pos=new DOMPoint(x,y-58).matrixTransform(map.getScreenCTM());interact.style.left=Math.max(interact.offsetWidth/2+8,Math.min(innerWidth-interact.offsetWidth/2-8,pos.x))+'px';interact.style.top=Math.max(78,pos.y-interact.offsetHeight-8)+'px'}
    updateToast();
    seatView.hidden=!sitting;player.mode=sitting?(sitting.mat?'rest':'sit'):'idle';
    if (!reducedMotion.matches && player.stride>.65 && time>nextDust) {
      const puff=dust[dustIndex++%dust.length];
      puff.born=time;
      puff.shape.setAttribute('cx',player.position[0]+Math.sin(time*17)*6);
      puff.shape.setAttribute('cy',player.position[1]+4);
      nextDust=time+.16;
    }
    dust.forEach(({shape,born})=>shape.setAttribute('opacity',Math.max(0,.55-(time-born)*1.8)));
    const phase=time%4.8;
    const turn=phase<2.4?0:1;
    const segment=phase%2.4;
    const travel=Math.min(1,Math.max(0,(segment-.405)/.92));
    kids.forEach((kid,i)=>kid.mode=i===turn && segment<.81?'kick':'idle');
    const start=kids[turn].position[0], end=kids[1-turn].position[0];
    football.element.querySelector(".ball-panels").setAttribute("transform","rotate("+((turn?1:-1)*travel*280)+")");
    moveLayer(football,[start+Math.sign(end-start)*9+(end-start-Math.sign(end-start)*18)*travel,412],Math.sin(travel*Math.PI)*7);
    const rise=Math.max(0,Math.min(8,(179-player.position[1])*.38))*(player.position[0]>265 && player.position[0]<317?1:0);
    moveLayer(ring,player.position,rise);
    ring.y-=.1;
    for (const character of actors) moveLayer(character.item,character.position,character===player?rise:0);
    leash.setAttribute('x1',hx+Math.sin(dogWalker.facing)*7);
    leash.setAttribute('y1',hy-19);
    leash.setAttribute('x2',dog.position[0]);
    leash.setAttribute('y2',dog.position[1]-13);
    leashLayer.y=Math.min(hy,dog.position[1])-.1;
    const [playerX,playerY]=player.position;
    stallImage.element.classList.toggle('player-behind-cart',playerX>102&&playerX<200&&playerY<144&&playerY>30);

    const behind=playerX>680 && playerX<910 && playerY>207 && playerY<groceryLayer.y
      && [playerY-39,playerY-23,playerY-8].some(y=>
        [-10,0,10].some(dx=>groceryOutline.isPointInFill(new DOMPoint(playerX+dx,y))));
    for (const element of [groceryLayer.element,groceryGround]) {
      element.classList.toggle('player-behind',behind);
    }
    layers.sort((a,b)=>a.y-b.y);
    if (layers.some((item,i)=>item!==depthOrder[i])) {
      layers.forEach(({element})=>depth.append(element));
      depthOrder=[...layers];
    }
    if (time-rendered>=1/30) {
      for (const character of actors) {
        if (character.away) continue;
        if (showBindPose && character.model.mixer) character.mode='tpose';
        const elapsed=time-(character.lastDraw??time);
        const moving=time<(character.waveUntil||0) || character.stride>.005 || character.mode==='kick' || character.mode==='wave';
        if (moving || character.lastMode!==character.mode || elapsed>=.12) {
          stage.draw(character,time,Math.min(elapsed,.15));
          character.lastDraw=time;
          character.lastMode=character.mode;
        }
      }
      rendered=time;
    }
  }

  function close() {

    panel.hidden=true;
    clearMovement();
    interact.hidden=true;
    nearby=undefined;
    toast.hidden=true;
    messageUntil=0;
    player.path=[];
    arrival=undefined;
    goal.setAttribute('visibility','hidden');
  }

  function run() {
    if (frame) return;
    last=performance.now();
    frame=requestAnimationFrame(tick);
  }
  return {
    shopkeeper() {
      const holder=new THREE.Group();
      const roster=['green','blue','rose','copper','baker','florist'];
      const lines=['The sencha is on the left.','Take the berries while they are bright.','I just set out the oat milk.','The matcha tins are at the front.','Call if you cannot reach a shelf.'];
      let index=0, actor;
      function lengthen(root){
        root.traverse(node=>{
          if(!node.isBone)return;
          if(/Arm$/.test(node.name))node.scale.y=1.42;
          if(/ForeArm$/.test(node.name))node.scale.y=1.28;
        });
      }
      function wear(i){
        index=((i%roster.length)+roster.length)%roster.length;
        while(holder.children.length)holder.remove(holder.children[0]);
        const model=stage.humanoid('#718259','#665641','#ca9870','#503d32',null,roster[index]);
        actor={model,mode:'idle',facing:-.18,stride:0,offset:index+1};
        const display=model.skin?.display ?? model.root;
        lengthen(display);
        holder.add(display);
      }
      wear(0);
      return {
        display:holder,
        line:()=>lines[index%lines.length],
        randomize(){wear(Math.floor(Math.random()*roster.length))},
        update(time,delta){if(actor)stage.draw(actor,time,delta,true)}
      };
    },
    departCustomer(){releaseGuest();},
    awaitCustomer(approach,arrived) {
      releaseGuest();staff(true);service={approach,arrived};
      const goal=[252,198];
      let person=party.filter(p=>!p.away && !servedOnVisit.has(p)).sort((a,b)=>distance(a.position,goal)-distance(b.position,goal))[0];
      if(!person){if(outing==='away')startOuting();servedOnVisit.clear();person=party.find(p=>!p.away)}
      if(person){
        guest=person;
        servedOnVisit.add(person);
        if(panel.hidden)person.position=[320,201];
        const path=openRoute(person.position,goal);
        person.path=path.length?path:[goal];
        approachLength=Math.max(1,distance(person.position,goal));
        person.speed=28;
        window.matchaSfx?.steps();
      }
      run();
    },
    open() {
      if (!panel.hidden) return;
      releaseGuest();staff(false);switchAt=0;panel.hidden=false;
      if(Array.isArray(window.matchaSavedPark)){player.position=[...window.matchaSavedPark];player.path=[];window.matchaSavedPark=null}
      else{player.position=[...nodes[26]];player.path=[nodes[25],nodes[24]]}
      sitting=false;
      run();
      panel.querySelector('button').focus();
    }
  };
};
})();
