// Match-three on the kitchen garden. The cursor can rest on any tile. A swap spends a move only when three match.
(() => {
  const cols=7, rows=5, count=cols*rows, maxChain=3;
  const types=['matcha','berries','milk','blueberries','oat','coconut','syrup','vanilla'];
  const tint={matcha:'#7d9a45',berries:'#d4534a',milk:'#f7f1df',blueberries:'#4d6fd0',oat:'#e2c07a',coconut:'#f3e6cf',syrup:'#e0a04a',vanilla:'#c9893a'};
  const pitch=[261.6,293.7,329.6,392];
  let patch;
  try{patch=JSON.parse(localStorage.getItem('matcha-garden-v1'))}catch{}
  if(!patch||!Array.isArray(patch.pool)||patch.pool.length!==5||!patch.pool.every(id=>types.includes(id))||!Array.isArray(patch.tiles)||patch.tiles.length!==count||!patch.tiles.every(id=>types.includes(id))||!Number.isSafeInteger(patch.moves)||patch.moves<0)patch=null;
  if(patch&&!Number.isFinite(patch.cap))patch.cap=Math.max(18,patch.moves);
  let held=-1, cursor=0, busy=false, idleTimer=0, warned=false;
  let message='Arrows move anywhere. Enter or tap swaps the chosen ingredients.';
  const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cell=i=>dialog.querySelector('[data-tile="'+i+'"]');
  const nameOf=id=>pantryItems.find(item=>item[0]===id)?.[1]||id;
  function matches(a){
    const hit=new Set();
    for(let i=0;i<count;i++)for(const step of [1,cols]){
      if(step===1&&i%cols>cols-3)continue;
      if(a[i]&&a[i]===a[i+step]&&a[i]===a[i+step*2])for(const j of [i,i+step,i+step*2])hit.add(j);
    }
    return hit;
  }
  function neighbors(i,j){return Math.abs(i%cols-j%cols)+Math.abs(Math.floor(i/cols)-Math.floor(j/cols))===1}
  function tryPair(a,i,j){[a[i],a[j]]=[a[j],a[i]];const ok=matches(a).size;[a[i],a[j]]=[a[j],a[i]];return ok}
  function findMove(adjacentOnly){
    for(let i=0;i<count;i++)for(let j=i+1;j<count;j++){
      if(adjacentOnly&&!neighbors(i,j))continue;
      if(tryPair(patch.tiles,i,j))return [i,j];
    }
    return null;
  }
  function legal(a){for(let i=0;i<count;i++)for(let j=i+1;j<count;j++)if(tryPair(a,i,j))return true;return false}
  function layout(pool){let tiles;do{tiles=[];for(let i=0;i<count;i++)tiles.push(pick(pool.filter(id=>!(i%cols>=2&&tiles[i-1]===id&&tiles[i-2]===id)&&!(i>=2*cols&&tiles[i-cols]===id&&tiles[i-2*cols]===id))))}while(!legal(tiles));return tiles}
  function create(){const pool=[];while(pool.length<5){const id=pick(types);if(!pool.includes(id))pool.push(id)}patch={pool,tiles:layout(pool),moves:18,cap:18,planted:new Date().toDateString()}}
  function save(){try{localStorage.setItem('matcha-garden-v1',JSON.stringify(patch))}catch{}savePantry()}
  function tone(freq,dur=.12){
    if(!volume.sound)return;
    try{
      const ctx=tone.ctx||(tone.ctx=new AudioContext());
      const o=ctx.createOscillator(), g=ctx.createGain();
      o.frequency.value=freq; o.type='sine';
      g.gain.value=.05*volume.sound;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime+dur);
      o.stop(ctx.currentTime+dur);
    }catch{}
  }
  function shell(){
    menuPage='garden';dialog.classList.add('harvest');
    const buttons=Array.from({length:count},(_,i)=>'<button type="button" data-tile="'+i+'"></button>').join('');
    dialog.innerHTML='<header><h2 id="pantry-title">Kitchen garden</h2>'+button('Leave','close')+'</header><div class="harvest-layout"><div class="harvest-play"><div class="harvest-moves"><div class="harvest-meter" id="harvestMeter" role="meter" aria-valuemin="0" aria-label="Moves remaining"><i id="harvestFill"></i></div><b id="harvestMoveCount"></b></div><div class="harvest-grid">'+buttons+'<i class="harvest-cursor" hidden></i></div><p id="harvestNote" aria-live="polite"></p><div class="harvest-buy"><i class="harvest-pointer" hidden>Buy moves</i>'+button('Buy 5 moves · 10 coins','garden-more',state.coins<10)+'</div></div><aside class="harvest-stock" aria-label="Inventory"><h3>Inventory</h3><div id="harvestStock"></div><p class="harvest-total" id="harvestPortions"></p></aside></div>';
    if(!dialog.open)dialog.showModal();
  }
  function sync(){
    const low=patch.moves<=5&&patch.moves>0;
    for(let i=0;i<count;i++){
      const el=cell(i), id=patch.tiles[i];
      el.getAnimations().forEach(anim=>anim.cancel());
      if(el.dataset.id!==id){el.dataset.id=id;el.innerHTML=art(id);el.setAttribute('aria-label',nameOf(id)+' row '+(1+Math.floor(i/cols))+' column '+(1+i%cols))}
      el.classList.toggle('picked',i===held);
      el.setAttribute('aria-pressed',i===held?'true':'false');
      el.classList.remove('hint');
    }
    const meter=dialog.querySelector('#harvestMeter');
    meter.max=patch.cap; meter.setAttribute('aria-valuemax',patch.cap); meter.setAttribute('aria-valuenow',patch.moves);
    dialog.querySelector('#harvestFill').style.width=Math.max(0,Math.min(100,patch.moves/patch.cap*100))+'%';
    dialog.querySelector('#harvestMoveCount').textContent=patch.moves;
    dialog.querySelector('.harvest-moves').classList.toggle('low',low);
    paintStock();
    dialog.querySelector('#harvestPortions').textContent=stockTotal()+' portions';
    dialog.querySelector('#harvestNote').textContent=message;
    const buy=dialog.querySelector('[data-do="garden-more"]');
    const out=patch.moves===0;
    buy.disabled=state.coins<10;
    buy.classList.toggle('needs-moves',out);
    const pointer=dialog.querySelector('.harvest-pointer');
    if(pointer)pointer.classList.toggle('show',out);
    if(low&&!warned){warned=true;tone(880,.18)}
    if(!low)warned=false;
    placeCursor();
  }
  function placeCursor(){
    const ring=dialog.querySelector('.harvest-cursor'), el=cell(cursor);
    if(!ring||!el)return;
    const grid=el.parentElement.getBoundingClientRect(), r=el.getBoundingClientRect();
    const next={left:(r.left-grid.left)+'px',top:(r.top-grid.top)+'px',width:r.width+'px',height:r.height+'px'};
    const prev={left:ring.style.left,top:ring.style.top};
    Object.assign(ring.style,next); ring.hidden=false;
    if(!reduced()&&prev.left)ring.animate([{left:prev.left,top:prev.top},{left:next.left,top:next.top}],{duration:180,easing:'cubic-bezier(0.34, 1.56, 0.64, 1)'});
  }
  function poke(){clearTimeout(idleTimer);idleTimer=setTimeout(hint,3500)}
  function hint(){
    if(busy||menuPage!=='garden'||!dialog.open)return;
    const move=findMove(true)||findMove(false);
    if(!move){shuffle();return}
    move.forEach(i=>cell(i).classList.add('hint'));
  }
  function paintStock(){
    const host=dialog.querySelector('#harvestStock');
    if(!host)return;
    if(!host.children.length)host.innerHTML=pantryItems.map(([id,name])=>'<p data-stock="'+id+'">'+art(id)+'<span>'+name+'</span><b>'+stock[id]+'</b></p>').join('');
    else for(const [id] of pantryItems){
      const badge=host.querySelector('[data-stock="'+id+'"] b');
      if(badge&&badge.textContent!==String(stock[id]))badge.textContent=stock[id];
    }
  }
  async function flyGain(el,id,n){
    const badge=dialog.querySelector('[data-stock="'+id+'"] b');
    const land=()=>{
      stock[id]+=n;
      if(!badge)return;
      badge.textContent=stock[id];
      const row=badge.parentElement;
      row.classList.add('gained');
      badge.animate([{transform:'scale(1.55)'},{transform:'scale(1)'}],{duration:240,easing:'cubic-bezier(0.34, 1.56, 0.64, 1)'});
      setTimeout(()=>row.classList.remove('gained'),420);
    };
    if(reduced()||!badge||!el){land();return}
    badge.scrollIntoView({block:'nearest'});
    const chip=document.createElement('b');
    chip.className='harvest-fly';
    chip.textContent='+'+n+' '+nameOf(id);
    chip.style.background=tint[id]||'#94a851';
    chip.style.color=id==='milk'||id==='coconut'?'#5c4a32':'#fff';
    const a=el.getBoundingClientRect();
    chip.style.left=(a.left+a.width/2)+'px';
    chip.style.top=(a.top+a.height/2)+'px';
    document.body.append(chip);
    const b=badge.getBoundingClientRect();
    await play(chip.animate([
      {left:(a.left+a.width/2)+'px',top:(a.top+a.height/2)+'px',transform:'translate(-50%,-50%) scale(1)',opacity:1},
      {left:(b.left+b.width/2)+'px',top:(b.top+b.height/2)+'px',transform:'translate(-50%,-50%) scale(.72)',opacity:1}
    ],{duration:520,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'}));
    chip.remove();
    land();
  }
  function burst(el,color){
    if(reduced())return;
    const r=el.getBoundingClientRect(), x=r.left+r.width/2, y=r.top+r.height/2;
    for(let i=0,n=6+Math.floor(Math.random()*5);i<n;i++){
      const spark=document.createElement('i');
      spark.className='harvest-spark'; spark.style.left=x+'px'; spark.style.top=y+'px'; spark.style.background=color;
      document.body.append(spark);
      const ang=Math.random()*Math.PI*2, dist=16+Math.random()*26;
      spark.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:'translate('+Math.cos(ang)*dist+'px,'+Math.sin(ang)*dist+'px) scale(.2)',opacity:0}],{duration:320,easing:'ease-out'}).onfinish=()=>spark.remove();
    }
  }
  function play(anim){return anim.finished.catch(()=>{})}
  async function glide(i,j,commit){
    if(reduced())return;
    const a=cell(i), b=cell(j), ar=a.getBoundingClientRect(), br=b.getBoundingClientRect();
    const dx=br.left-ar.left, dy=br.top-ar.top;
    if(commit){
      const ease='cubic-bezier(0.34, 1.56, 0.64, 1)';
      await Promise.all([
        play(a.animate([{transform:'none'},{transform:'translate('+dx+'px,'+dy+'px)'}],{duration:180,easing:ease,fill:'forwards'})),
        play(b.animate([{transform:'none'},{transform:'translate('+(-dx)+'px,'+(-dy)+'px)'}],{duration:180,easing:ease,fill:'forwards'}))
      ]);
      return;
    }
    tone(140,.16);
    await Promise.all([
      play(a.animate([{transform:'none'},{transform:'translate('+(dx*.4)+'px,'+(dy*.4)+'px)',offset:.45},{transform:'none'}],{duration:220,easing:'ease-out'})),
      play(b.animate([{transform:'none'},{transform:'translate('+(-dx*.4)+'px,'+(-dy*.4)+'px)',offset:.45},{transform:'none'}],{duration:220,easing:'ease-out'}))
    ]);
  }
  async function pop(hit){
    const groups=new Map();
    for(const k of hit){const id=patch.tiles[k];if(!groups.has(id))groups.set(id,cell(k))}
    if(!reduced())await Promise.all([...hit].map(k=>play(cell(k).animate([{filter:'brightness(1)',transform:'scale(1)'},{filter:'brightness(1.4)',transform:'scale(1.06)',offset:.5},{filter:'brightness(1)',transform:'scale(1)'}],{duration:60}))));
    const flights=[...groups].map(([id,el])=>flyGain(el,id,[...hit].filter(k=>patch.tiles[k]===id).length));
    if(!reduced())[...hit].forEach(k=>burst(cell(k),tint[patch.tiles[k]]||'#94a851'));
    await Promise.all([
      ...flights,
      ...(reduced()?[]:[...hit].map(k=>play(cell(k).animate([{transform:'scale(1)',opacity:1},{transform:'scale(0)',opacity:0}],{duration:180,easing:'ease-in'}))))
    ]);
  }
  function fall(a){
    const moves=[];
    for(let col=0;col<cols;col++){
      const kept=[];
      for(let row=rows-1;row>=0;row--){const i=row*cols+col;if(a[i])kept.push({id:a[i],from:i})}
      for(let n=0;n<rows;n++){
        const to=(rows-1-n)*cols+col;
        if(n<kept.length){a[to]=kept[n].id;if(kept[n].from!==to)moves.push({from:kept[n].from,to})}
        else{a[to]=pick(patch.pool);moves.push({from:-1,to,fresh:true})}
      }
    }
    return moves;
  }
  async function drop(moves){
    sync();
    if(reduced())return;
    await Promise.all(moves.map(move=>{
      const el=cell(move.to), dest=el.getBoundingClientRect();
      const dy=move.fresh?-(dest.height+8)*2:(cell(move.from).getBoundingClientRect().top-dest.top);
      const rowsFallen=Math.max(1,Math.round(Math.abs(dy)/(dest.height+6)));
      return play(el.animate([
        {transform:'translateY('+dy+'px)'},
        {transform:'translateY(0)',offset:.78},
        {transform:'translateY(0) scaleY(.85)',offset:.9},
        {transform:'none'}
      ],{duration:120*rowsFallen,easing:'ease-in'}));
    }));
  }
  async function shuffle(){
    message='No moves left — shuffling.';
    sync();
    if(!reduced()){
      const buttons=[...dialog.querySelectorAll('[data-tile]')];
      await Promise.all(buttons.map(el=>play(el.animate([{transform:'none'},{transform:'scale(.3) rotate(12deg)',offset:.5},{transform:'none'}],{duration:400}))));
    }
    patch.tiles=layout(patch.pool);
    message='A fresh arrangement. Swap any two ingredients that line up three.';
    sync(); poke();
  }
  async function swap(i,j){
    if(busy||i===j)return;
    if(!patch.moves){message='Out of moves. Buy five more to keep harvesting.';sync();return}
    busy=true; held=-1;
    dialog.querySelector('.harvest-grid').classList.add('locked');
    clearTimeout(idleTimer);
    const a=patch.tiles;
    await glide(i,j,true);
    [a[i],a[j]]=[a[j],a[i]]; sync();
    if(!matches(a).size){
      [a[i],a[j]]=[a[j],a[i]]; sync();
      await glide(i,j,false);
      message='That swap makes no match. You keep your move.';
      busy=false; dialog.querySelector('.harvest-grid').classList.remove('locked'); sync(); poke(); return;
    }
    patch.moves--;
    const gains=new Map();
    let hit=matches(a), step=0;
    while(hit.size){
      await pop(hit);
      for(const k of hit){const id=a[k];gains.set(id,(gains.get(id)||0)+1);a[k]=null}
      const dropped=fall(a);
      tone(pitch[Math.min(step,maxChain)],.14); step++;
      await drop(dropped);
      hit=matches(a);
    }
    message='Harvested '+[...gains].map(([id,n])=>n+' '+nameOf(id)).join(', ')+'.';
    if(!legal(a))await shuffle();
    else save();
    busy=false;
    const grid=dialog.querySelector('.harvest-grid');
    if(grid)grid.classList.remove('locked');
    sync(); updateUI(); poke();
  }
  function choose(i){
    if(busy)return;
    poke();
    cursor=i; 
    if(held<0){held=i;message='Chosen. Move anywhere, then swap.';sync();return}
    if(held===i){held=-1;message='Arrows move anywhere. Enter or tap swaps the chosen ingredients.';sync();return}
    const from=held; held=-1; swap(from,i);
  }
  function show(){shell();sync();poke()}
  window.openGarden=()=>{if(!patch||(!patch.moves&&patch.planted!==new Date().toDateString())){create();save()}held=-1;cursor=0;show()};
  dialog.addEventListener('close',()=>{dialog.classList.remove('harvest');clearTimeout(idleTimer)});
  dialog.addEventListener('click',e=>{
    if(menuPage!=='garden')return;
    if(e.target.closest('[data-do="garden-more"]')){
      if(state.coins>=10&&!busy){state.coins-=10;patch.moves+=5;patch.cap+=5;message='Five more moves.';save();updateUI();sync()}
      return;
    }
    const tile=e.target.closest('[data-tile]');
    if(tile)choose(Number(tile.dataset.tile));
  });
  dialog.addEventListener('keydown',e=>{
    if(menuPage!=='garden'||!dialog.open)return;
    const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-cols,ArrowDown:cols}[e.key];
    if(step){
      e.preventDefault();
      if(busy)return;
      const col=cursor%cols, row=Math.floor(cursor/cols);
      if(e.key==='ArrowLeft'&&!col||e.key==='ArrowRight'&&col===cols-1||e.key==='ArrowUp'&&!row||e.key==='ArrowDown'&&row===rows-1)return;
      cursor+=step; poke(); sync(); return;
    }
    if((e.key==='Enter'||e.key===' ')&&!e.target.closest('[data-do]')){e.preventDefault();choose(cursor)}
  });
})();
