// Shared by the service counter and the village. Each ingredient action uses one portion.
const pantryItems = [
  ['matcha','Matcha powder',12,4],['berries','Strawberries',5,3],['oat','Oat milk',5,3],
  ['milk','Regular milk',10,2],['ice','Ice',6,1],['water','Water',12,1],
  ['syrup','Sugar syrup',4,2],['vanilla','Vanilla extract',3,4],['blueberries','Blueberries',4,3],['coconut','Coconut milk',4,3]
];
pantryItems.push(...[['tea-leaves', 'Tea leaves', 0, 3], ['pineapple', 'Pineapple', 0, 3], ['banana', 'Banana', 0, 3], ['honey', 'Honey', 0, 3], ['peach', 'Peach', 0, 3], ['watermelon', 'Watermelon', 0, 3], ['mango', 'Mango', 0, 3], ['fresh-coconut', 'Fresh coconut', 0, 3], ['juice', 'Juice', 0, 3]]);
const ingredientFor = {powder:'matcha',ice:'ice',milk:'milk',hotwater:'water'};
const storageKey='matcha-pantry-v1';
let saved={};
try {saved=JSON.parse(localStorage.getItem(storageKey))||{};} catch {}
const stock=Object.fromEntries(pantryItems.map(([id,,initial])=>[id,Number.isInteger(saved.stock?.[id])?Math.max(0,saved.stock[id]):initial]));
if(Number.isInteger(saved.coins)&&saved.coins>=0)state.coins=saved.coins;
if(Number.isFinite(saved.clock))window.matchaClock?.set(saved.clock);
if(saved.recipeKey&&typeof recipes!=='undefined'&&recipes[saved.recipeKey]){state.recipeKey=saved.recipeKey;state.step=Number.isSafeInteger(saved.step)?saved.step:0;state.customerIndex=Number.isSafeInteger(saved.customerIndex)?saved.customerIndex:0;window.matchaResume=true}
if(saved.phase==='park'||saved.phase==='play'||saved.phase==='waiting'||saved.phase==='win')window.matchaSavedPhase=saved.phase;
if(Array.isArray(saved.park)&&saved.park.length===2)window.matchaSavedPark=saved.park;
if(saved.phase)window.matchaSavedPhase=saved.phase;
if(Array.isArray(saved.park)&&saved.park.length===2)window.matchaSavedPark=saved.park;
const upgrades=[
  ['whisk','Premium bamboo whisk',45,'Equipment','Adds 6 quality points to any order.'],
  ['frother','Milk frothing machine',75,'Equipment','Adds 8 quality points to iced lattes.'],
  ['lights','String lights',28,'Decorations','A short string of honey bulbs over the cart.'],
  ['bunting','Sage bunting',18,'Decorations','Cream and sage pennants above the stall.'],
  ['chimes','Wind chime',16,'Decorations','A small wooden chime beside the lights.'],
  ['fern','Hanging fern',22,'Decorations','A fern in a ceramic pot over the counter.'],
  ['flowers','Flower pot',20,'Decorations','Pink blossoms at the left of the deck.'],
  ['jars','Tea jars',24,'Decorations','Three glass jars of green tea.'],
  ['tea-table','Garden tea table',65,'Decorations','A low table with two cups.'],
  ['mat','Welcome mat',14,'Decorations','A woven mat in front of the cart.'],
  ['seats','Deck cushions',40,'Decorations','Two moss cushions beside the table.'],
  ['sign','Matcha chalkboard',35,'Decorations','A painted board that reads Matcha.'],
  ['canopy','Grand canopy',120,'Decorations','A wide run of sage pennants across the deck.'],
  ['lantern-court','Lantern court',160,'Decorations','A long string of honey bulbs over the serving floor.'],
  ['orchard-planters','Orchard planters',180,'Decorations','A large pair of blossom pots beside the steps.'],
  ['lounge','Lounge cushions',220,'Decorations','A broad seat of moss cushions at the deck edge.'],
  ['grand-board','Grand matcha board',280,'Decorations','A tall chalkboard that reads Matcha, set past the deck.'],
  ['kiosk','Kiosk awning',80,'Stall','The cart grows an awning, pots, and a menu.'],
  ['small-cafe','Small café',150,'Stall','Shelves, a wheel, and a serving window.'],
  ['cafe','Café front',240,'Stall','The finished shop, with lights, flowers, and seating.']
];
const stallNeeds={'small-cafe':'kiosk',cafe:'small-cafe'};
const owned=new Set(upgrades.filter(([id])=>Array.isArray(saved.owned)&&saved.owned.includes(id)).map(([id])=>id));
function dressCart(){
  document.body.dataset.upgrades=[...owned].join(' ');
  document.body.dataset.stall=owned.has('cafe')?3:owned.has('small-cafe')?2:owned.has('kiosk')?1:0;
  document.dispatchEvent(new Event('stall'));
}
dressCart();
loadDeviceSave();
state.satisfaction=Number.isFinite(saved.satisfaction)?Math.max(0,Math.min(100,Math.round(saved.satisfaction))):80;
state.served=Number.isSafeInteger(saved.served)?Math.max(0,saved.served):0;
const greetings=new Map(Object.entries(saved.greetings||{}));
state.level=Math.max(1,Math.floor(saved.level||(saved.recipeKey==='iced'?2:1)));
state.featuredRecipe=recipes[saved.featuredRecipe]?.key;
function restoreTicket(data){
  state.quality=Number.isFinite(data.quality)?Math.max(0,Math.min(100,data.quality)):0;
  state.qualitySet=Boolean(data.qualitySet);
  const guest=data.guest;
  visitingCustomer=null;
  if(guest&&typeof guest.name==='string'&&typeof guest.img==='string'&&
    (/^assets\/customers\/[a-z-]+\.(png|webp)$/.test(guest.img)||/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(guest.img)))
    visitingCustomer={name:guest.name,mood:String(guest.mood||''),img:guest.img,idle:'idle-0'};
}
restoreTicket(saved);
function adjustSatisfaction(delta){
  state.satisfaction=Math.min(100,Math.max(0,Math.round(state.satisfaction+delta)));
  if(state.satisfaction===100){
    state.level++;
    state.satisfaction=0;
    const recipe=Object.values(recipes)[state.level-1];
    state.featuredRecipe=recipe?.key;
    state.unlockMessage='Level '+state.level+(recipe?' · '+recipe.name+' unlocked.': ' reached.');
    say(state.unlockMessage);
  }
}
const portion=step=>step.ingredient||ingredientFor[step.icon];
function missingPortion(recipe){
  const need={};
  for(const step of recipe.steps){
    const id=portion(step);
    if(id && (need[id]=(need[id]||0)+1)>stock[id])return id;
  }
}
function customerLeaves(id){
  const reason='Out of '+pantryItems.find(item=>item[0]===id)[1]+'. '+currentGuest().name+' left without a drink.';
  adjustSatisfaction(-3);state.phase='win';departCustomer();
  $('#servedPlate').hidden=true;$('#levelNote').textContent=state.satisfaction+'% satisfaction';$('#resultTitle').textContent='Order unavailable';$('#resultStars').textContent='';
  $('#resultBody').textContent=reason;$('#resultReward').textContent='Restock at the grocery shop';
  setTimeout(()=>{if(state.phase==='win')$('#resultVeil').classList.remove('hidden')},2300);say(reason);updateUI();savePantry();
}
window.greetResident=name=>{if(Date.now()-(greetings.get(name)||0)<180000||state.satisfaction>=100)return false;greetings.set(name,Date.now());adjustSatisfaction(1);savePantry();return true};
function equipmentBonus(){return (owned.has('whisk')?6:0)+(owned.has('frother')&&state.recipeKey!=='hot'?8:0)}
function stockForecast(){return Object.values(recipes).slice(0,state.level).map(r=>{const need=r.steps.map(s=>portion(s)).filter(Boolean);return r.short+' × '+Math.min(...need.map(id=>stock[id]/need.filter(x=>x===id).length).map(Math.floor))}).join(' · ')}
const volume={music:saved.volume?.music??.23,sound:saved.volume?.sound??.5};
function saveBlob(){
  let garden=null;
  try{garden=JSON.parse(localStorage.getItem('matcha-garden-v1'))}catch{}
  return {stock,guest:visitingCustomer,quality:state.quality,qualitySet:state.qualitySet,coins:state.coins,volume,owned:[...owned],served:state.served,level:state.level,featuredRecipe:state.featuredRecipe,satisfaction:state.satisfaction,greetings:Object.fromEntries(greetings),clock:window.matchaClock?.get(),recipeKey:state.recipeKey,step:state.step,customerIndex:state.customerIndex,phase:state.phase,park:window.matchaParkSpot||window.matchaSavedPark||null,garden,savedAt:Date.now()};
}
function applySave(data){
  if(!data)return;
  restoreTicket(data);
  for(const [id,qty] of Object.entries(data.stock||{}))if(id in stock&&Number.isInteger(qty))stock[id]=Math.max(0,qty);
  if(Number.isInteger(data.coins)&&data.coins>=0)state.coins=data.coins;
  if(data.volume){if(Number.isFinite(data.volume.music))volume.music=data.volume.music;if(Number.isFinite(data.volume.sound))volume.sound=data.volume.sound}
  owned.clear();for(const id of data.owned||[])if(upgrades.some(u=>u[0]===id))owned.add(id);
  dressCart();
  state.featuredRecipe=recipes[data.featuredRecipe]?.key;
  state.level=Math.max(1,Math.floor(data.level||(data.recipeKey==='iced'?2:1)));
  if(Number.isSafeInteger(data.served))state.served=Math.max(0,data.served);
  if(Number.isFinite(data.satisfaction))state.satisfaction=Math.max(0,Math.min(100,Math.round(data.satisfaction)));
  greetings.clear();for(const [name,when] of Object.entries(data.greetings||{}))greetings.set(name,when);
  if(Number.isFinite(data.clock))window.matchaClock?.set(data.clock);
  if(data.recipeKey&&recipes[data.recipeKey]){state.recipeKey=data.recipeKey;window.matchaResume=true;}
  if(Number.isSafeInteger(data.step))state.step=data.step;
  if(Number.isSafeInteger(data.customerIndex))state.customerIndex=data.customerIndex;
  if(data.phase)window.matchaSavedPhase=data.phase;
  if(Array.isArray(data.park)&&data.park.length===2)window.matchaSavedPark=data.park;
  if(data.garden)try{localStorage.setItem('matcha-garden-v1',JSON.stringify(data.garden))}catch{}
}
const deviceKey='matcha-device-v1';
const boardKey='matcha-leaderboard-v1';
const nameA=['Willow','Moss','Hana','Juniper','Sora','Aki','Nori','Yuzu','Kiri','Maple'];
const nameB=['Tea','Leaf','Bloom','Cedar','River','Lantern','Orchard','Kettle','Garden','Hearth'];
function deviceId(){
  let id='';
  try{id=localStorage.getItem(deviceKey)||''}catch{}
  if(!id){
    id=crypto.randomUUID?.()||('dev-'+Date.now().toString(36)+Math.random().toString(36).slice(2));
    try{localStorage.setItem(deviceKey,id)}catch{}
  }
  return id;
}
function baristaName(id){
  let hash=0;
  for(const char of id)hash=Math.imul(hash,31)+char.charCodeAt(0)|0;
  const n=Math.abs(hash);
  return nameA[n%nameA.length]+' '+nameB[(n>>>8)%nameB.length];
}
function leaderboard(){
  const me={id:deviceId(),name:baristaName(deviceId()),served:state.served,level:state.level,satisfaction:state.satisfaction};
  let rows=[];
  try{rows=JSON.parse(localStorage.getItem(boardKey))||[]}catch{}
  rows=rows.filter(row=>row&&row.id&&row.id!==me.id);
  rows.push(me);
  rows.sort((a,b)=>b.served-a.served||b.level-a.level||b.satisfaction-a.satisfaction);
  try{localStorage.setItem(boardKey,JSON.stringify(rows))}catch{}
  return rows;
}
function savePantry(){
  const data=saveBlob();
  try{localStorage.setItem(storageKey,JSON.stringify(data))}catch{}
  leaderboard();
  window.matchaCloud?.push();
  if(!window.indexedDB)return;
  const open=indexedDB.open('matcha-cafe',1);
  open.onupgradeneeded=()=>{if(!open.result.objectStoreNames.contains('save'))open.result.createObjectStore('save')};
  open.onsuccess=()=>{const db=open.result;db.transaction('save','readwrite').objectStore('save').put(data,'progress')};
}
function loadDeviceSave(){
  if(!window.indexedDB)return;
  const open=indexedDB.open('matcha-cafe',1);
  open.onupgradeneeded=()=>{if(!open.result.objectStoreNames.contains('save'))open.result.createObjectStore('save')};
  open.onsuccess=()=>{
    const get=open.result.transaction('save').objectStore('save').get('progress');
    get.onsuccess=()=>{
      const data=get.result;
      if(!data||!(data.savedAt>(saved.savedAt||0)))return;
      applySave(data);saved=data;updateUI();
      window.matchaCloud?.push();
      window.matchaCloud?.nudge();
    };
  };
}
const dialog=document.createElement('dialog');
dialog.className='pantry';
dialog.setAttribute('aria-labelledby','pantry-title');
const dock=document.createElement('nav');
dock.className='pantry-dock';
dock.setAttribute('aria-label','Café menu');
const art=(id)=>'<img alt="" src="assets/pantry/'+id+'.jpg">';
dock.innerHTML='<button data-page="pause" aria-label="Pause menu"><b>☰</b><span>Menu</span></button>';
document.body.append(dock,dialog);
let menuPage, category='Ingredients',returnPhase;
const stockTotal=()=>Object.values(stock).reduce((a,b)=>a+b,0);
const button=(label,action,disabled=false)=>'<button data-do="'+action+'" '+(disabled?'disabled':'')+'>'+label+'</button>';
function itemCard([id,name]){
  const qty=stock[id];
  return '<article>'+art(id)+'<strong>'+name+'</strong><small>'+qty+' in stock'+(qty<=3?' · Low stock':'')+'</small><meter min="0" max="20" value="'+qty+'"></meter>'+'</article>';
}
function openMenu(page){
  state.arcHolding=false;
  menuPage=page;
  const titles={inventory:'My inventory',recipes:'Recipe book',pause:'Tea break',settings:'Settings',audio:'Music & sound'};
  let content='';
  dialog.dataset.page=page;
  if(page==='pause'){
    titles.pause='Little Matcha Days';
    content='<img class="menu-bowl" src="assets/recipes/hot.webp" alt=""><div class="pause-links">'+[['close','Resume game'],['inventory','Inventory & upgrades'],['recipes','Recipe book'],['board','Leaderboard'],['map','World map'],['journal','Quest journal'],['settings','Settings'],['new','New game']].map(([id,label])=>button(label,id)).join('')+'</div><footer>'+baristaName(deviceId())+'　·　Day '+(1+Math.floor(window.matchaClock.get()/1440))+'　·　 Level '+state.level+'　·　'+state.coins+' coins</footer>';
  }else if(page==='map'){
    titles.map='World map';
    content='<figure class="menu-map"><img src="assets/park-painted.jpg" alt="Village park"><span style="left:22%;top:30%">Café</span><span style="left:16%;top:66%">Garden</span><span style="left:84%;top:57%">Grocery</span></figure>'+button('Back to menu','pause');
  }else if(page==='journal'){
    titles.journal='Quest journal';
    const next=Object.values(recipes)[state.level];
    content='<p>Serve customers to reach 100% satisfaction.</p><meter min="0" max="100" value="'+state.satisfaction+'"></meter><p>'+state.satisfaction+'% satisfaction · '+state.served+' drinks served</p>'+(next?'<p>Next recipe · '+next.name+'</p>':'<p>Recipe collection complete</p>')+button('Back to menu','pause');
  }else if(page==='new'){titles.new='Start a new game?';content='<p>This will erase your saved café, garden, inventory and level.</p>'+button('Keep playing','pause')+' '+button('Erase and start again','erase')}
  else if(page==='coins'){titles.coins='Coin purse';content='<p>'+state.coins+' coins · Earn coins by serving drinks.</p>'+button('Add 50 demo coins · Free','topup')}
  else if(page==='inventory'){
    content='<p>'+stockTotal()+' portions · '+state.coins+' coins</p><p>Ready to serve · '+stockForecast()+'</p>';
    content+='<div class="pantry-tabs">'+['Ingredients','Equipment','Decorations','Stall'].map(c=>button(c,'tab-'+c,c===category)).join('')+'</div>';
    content+='<div class="pantry-grid">'+(category==='Ingredients'?pantryItems.map(itemCard).join(''):
      (category==='Equipment'?['warm-chawan','whisk-matcha','choose-glass','sift-matcha'].map((gif,i)=>'<article><img src="assets/actions/gif/'+gif+'.gif" alt=""><strong>'+['Chawan bowl','Bamboo whisk','Tall glass','Fine sieve'][i]+'</strong><small>Owned</small></article>').join(''):'')+upgrades.filter(u=>u[3]===category).map(([id,name,cost,,detail])=>'<article><img src="'+({whisk:'assets/actions/gif/whisk-matcha.gif',lights:'assets/decor/lights.png',bunting:'assets/decor/bunting.png',chimes:'assets/decor/chimes.png',fern:'assets/decor/fern.png',flowers:'assets/decor/flowers.png',jars:'assets/decor/jars.png',sign:'assets/decor/board.png','tea-table':'assets/decor/table.png',mat:'assets/decor/mat.png',seats:'assets/decor/cushions.png',canopy:'assets/decor/bunting.png','lantern-court':'assets/decor/lights.png','orchard-planters':'assets/decor/flowers.png',lounge:'assets/decor/cushions.png','grand-board':'assets/decor/board.png',kiosk:'assets/stall/kiosk.png','small-cafe':'assets/stall/small.png',cafe:'assets/stall/cafe.png',frother:'assets/pantry/frother.svg'}[id]||'assets/pantry/'+id+'.png')+'" alt="" style="mix-blend-mode:normal"><strong>'+name+'</strong><small>'+detail+'</small>'+button(owned.has(id)?'Owned':stallNeeds[id]&&!owned.has(stallNeeds[id])?'Unlock previous':cost+' coins','unlock-'+id,owned.has(id)||state.coins<cost||(stallNeeds[id]&&!owned.has(stallNeeds[id])))+'</article>').join(''))+'</div>';
    content+=button('Restock at grocery store','restock');
  }else if(page==='recipes'){
    const collection=Object.values(recipes);
    const next=collection[state.level];
    content='<p>'+state.satisfaction+'% satisfaction · '+(next?'At 100%, learn '+next.name+'.':'Every recipe is in your book.')+'</p>';
    collection.forEach((recipe,index)=>{
      const ingredients=recipe.steps.map(portion).filter(Boolean).map(id=>pantryItems.find(item=>item[0]===id)?.[1]).filter(Boolean);
      const face='<img alt="" src="'+recipe.bubble+'"><span><strong>'+recipe.name+'</strong><small>'+ingredients.join(' · ')+'</small></span>';
      if(index<state.level)content+='<details class="recipe-entry" '+(recipe.key===state.recipeKey?'open':'')+'><summary>'+face+'</summary><ol>'+recipe.steps.map(step=>'<li>'+step.name+'</li>').join('')+'</ol></details>';
      else content+='<article class="recipe-entry locked"><span class="summary-like">'+face+'</span></article>';
    });
  }else if(page==='board'){
    titles.board='Leaderboard';
    const mine=deviceId();
    content='<table class="leaderboard"><thead><tr><th>Barista</th><th>Drinks served</th><th>Level</th><th>Satisfaction</th></tr></thead><tbody>'+leaderboard().map(row=>'<tr'+(row.id===mine?' class="me"':'')+'><td>'+row.name+'</td><td>'+row.served+'</td><td>'+row.level+'</td><td>'+row.satisfaction+'%</td></tr>').join('')+'</tbody></table>'+button('Back to menu','pause');
  }else if(page==='settings') content=button('Music & sound ›','audio')+' '+button('Coin purse','coins');
  else content=['music','sound'].map(k=>'<label>'+ (k==='music'?'Music':'Sound effects & ambience')+' <output>'+Math.round(volume[k]*100)+'%</output><input data-volume="'+k+'" type="range" min="0" max="100" value="'+Math.round(volume[k]*100)+'"></label>').join('')+button('Back to settings','settings');
  dialog.innerHTML='<header><h2 id="pantry-title">'+titles[page]+'</h2>'+button('Close','close')+'</header>'+content;
  if(!dialog.open)dialog.showModal();
}
dock.onclick=e=>{const b=e.target.closest('button');if(b)openMenu(b.dataset.page)};
dialog.onclick=async e=>{
  const action=e.target.closest('button')?.dataset.do;
  if(!action||action==='garden-more')return;
  if(action==='erase'){
    const fresh={stock:Object.fromEntries(pantryItems.map(([id,,qty])=>[id,qty])),coins:125,clock:570,served:0,level:1,satisfaction:80,recipeKey:'hot',step:0,customerIndex:0,phase:'title'};
    state.phase='title';window.matchaSavedPark=window.matchaParkSpot=null;
    localStorage.removeItem('matcha-garden-v1');applySave(fresh);savePantry();await window.matchaCloud?.flush();location.reload();return;
  }
  if(action==='topup'){state.coins+=50;savePantry();updateUI();openMenu('coins');return}
  if(action.startsWith('unlock-')){const item=upgrades.find(u=>u[0]===action.slice(7));if(item&&!owned.has(item[0])&&state.coins>=item[2]){state.coins-=item[2];owned.add(item[0]);dressCart();savePantry();updateUI()}openMenu('inventory');return}
  if(action==='close'){dialog.close();return;}
  if(action==='restock'){
    dialog.close();
    try{
      const village=await ensurePark();
      if(state.phase!=='park'){
        returnPhase=state.phase;
        state.phase='park';
        counterUI.forEach(el=>el.inert=true);
        village.open();
      }
      document.querySelector('[data-place="Grocery shop"]').dispatchEvent(new MouseEvent('click'));
    }catch{say('The park could not open. Please try again.');}
    return;
  }
  if(action.startsWith('tab-')){category=action.slice(4);openMenu('inventory');return;}
  openMenu(action);
};
function useIngredient(step){
  const id=portion(step);
  if(!id)return true;
  if(stock[id]<1){customerLeaves(id);return false}
  stock[id]--;return true;
}
const tracks=['assets/music/Music Cafe 2.mp3','assets/music/Music Cafe 3.mp3'];
let track=0,unlocked=false;
const music=new Audio(tracks[0]), ambience=new Audio('assets/sounds/park-ambience-v01.mp3'), whiskSound=new Audio('assets/sounds/matcha-whisk-foley-v01.mp3');
window.matchaSfx=(()=>{
  let ctx;
  const context=()=>ctx||=new AudioContext();
  function env(gain,peak,hold){
    const now=context().currentTime;
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(peak*(volume.sound||.5),now+.02);
    gain.gain.exponentialRampToValueAtTime(.0001,now+hold);
  }
  return {
    step(){
      if((volume.sound||0)<=0)return;
      const audio=context(), buffer=audio.createBuffer(1,Math.floor(audio.sampleRate*.07),audio.sampleRate), data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/700);
      const source=audio.createBufferSource();source.buffer=buffer;
      const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=380;
      const gain=audio.createGain();env(gain,.22,.09);
      source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.start();
    },
    steps(){this.step();setTimeout(()=>this.step(),180)},
    play(name){
      if((volume.sound||0)<=0)return;
      const audio=new Audio('assets/sounds/'+name+'.mp3');
      audio.volume=Math.min(1,volume.sound);
      audio.play().catch(()=>{});
    },
    whisk(){this.play('whisk')},
    sift(){this.play('sift')},
    pour(){this.play('pour')},
    clink(){this.play('clink')},
    order(){
      if((volume.sound||0)<=0)return;
      const audio=context();
      [392,523,659].forEach((freq,i)=>{
        const tone=audio.createOscillator(), gain=audio.createGain();
        tone.type='sine';tone.frequency.value=freq;
        const now=audio.currentTime+i*.07;
        gain.gain.setValueAtTime(.0001,now);
        gain.gain.exponentialRampToValueAtTime(.05*(volume.sound||.5),now+.03);
        gain.gain.exponentialRampToValueAtTime(.0001,now+.28);
        tone.connect(gain);gain.connect(audio.destination);tone.start(now);tone.stop(now+.3);
      });
    }
  };
})();
ambience.loop=whiskSound.loop=true;
music.onended=()=>{track=1-track;music.src=tracks[track];playAudio(music)};
function playAudio(audio){audio.play().catch(()=>{});}
function syncAudio(){
  music.volume=volume.music;ambience.volume=volume.sound*.55;whiskSound.volume=volume.sound;
  if(!unlocked)return;
  for(const [audio,wanted] of [[music,volume.music>0],[ambience,state.phase==='park'&&volume.sound>0],[whiskSound,state.whisking&&!dialog.open&&volume.sound>0]]){
    if(wanted&&!document.hidden){if(audio.paused)playAudio(audio)}else audio.pause();
  }
}
for(const event of ['pointerdown','keydown']) document.addEventListener(event,()=>{unlocked=true;syncAudio()},{once:true});
document.addEventListener('visibilitychange',syncAudio);
dialog.oninput=e=>{const k=e.target.dataset.volume;if(!k)return;volume[k]=Number(e.target.value)/100;e.target.previousElementSibling.value=e.target.value+'%';savePantry();syncAudio()};
window.matchaProgress={blob:saveBlob,apply(data){applySave(data);saved=data;updateUI();if(typeof showCustomer==='function')showCustomer();}};
dialog.onclose=syncAudio;

addEventListener('keydown',event=>{if(event.key==='Escape'&&!event.repeat&&!document.querySelector('dialog[open]')){event.preventDefault();openMenu('pause')}});
