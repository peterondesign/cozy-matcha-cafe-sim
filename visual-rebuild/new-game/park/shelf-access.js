(() => {
  const $ = id => document.getElementById(id);
  const stations = [
    {name:'Entrance', x:50,y:53,zoom:1},
    {name:'Tea & infusions',x:10,y:54,zoom:1.7,goods:[['matcha',9,35],['tea-leaves',9,51],['syrup',9,68],['vanilla',10,87]]},
    {name:'Orchard fruit',x:22,y:49,zoom:1.65,goods:[['berries',22,35],['blueberries',22,49],['peach',22,65]]},
    {name:'Dairy & oat',x:33,y:50,zoom:1.75,goods:[['oat',33,36],['milk',33,50],['coconut',33,63],['juice',33,77]]},
    {name:'Cold cabinet',x:74,y:49,zoom:1.7,goods:[['ice',74,38],['water',74,57]]},
    {name:'Garden fruit',x:84,y:52,zoom:1.65,goods:[['pineapple',83,35],['banana',83,49],['mango',83,63],['watermelon',83,78]]},
    {name:'Baking pantry',x:95,y:42,zoom:1.65,goods:[['honey',94,35],['fresh-coconut',94,55]]},
    {name:'Checkout',x:61,y:44,zoom:2.2}
  ];
  const till = stations.length - 1;
  const bag = new Map();
  const list = $('content'), targets = $('targets'), film = $('gesture');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let station = 0, review = false, purchase = null, night = false;
  let filmToken = 0;
  const item = id => MatchaPantry.item(id);
  const units = () => [...bag.values()].reduce((a,b)=>a+b,0);
  const cost = () => [...bag].reduce((sum,[id,n])=>sum+item(id)[3]*n,0);
  function el(tag, text, cls) {
    const node = document.createElement(tag);
    if(text) node.textContent=text;
    if(cls) node.className=cls;
    return node;
  }
  function button(label, callback, cls) {
    const b=el('button',label,cls); b.type='button'; b.onclick=callback;return b;
  }
  function icon(id) { const img=new Image();img.src=MatchaPantry.icon(id);img.alt='';return img; }
  function stopClip() {filmToken++;film.hidden=true;film.pause();}
  function clip(id) {
    stopClip();
    if(night || motion.matches) return;
    const token=filmToken;
    film.src='grocer-actions/'+id+'.mp4';
    film.onplaying=()=>{if(token===filmToken)film.hidden=false;};
    film.onended=film.onerror=()=>{if(token===filmToken)stopClip();};
    film.play().catch(()=>{if(token===filmToken)stopClip();});
  }
  function frame() {
    const {x,y,zoom}=stations[station],w=$('scene').clientWidth,h=$('scene').clientHeight;
    const s=Math.max(w/2048,h/1152)*zoom;
    const tx=Math.max(w-2048*s,Math.min(0,w/2-x/100*2048*s));
    const ty=Math.max(h-1152*s,Math.min(0,h/2-y/100*1152*s));
    $('painting').style.transform='translate('+tx+'px,'+ty+'px) scale('+s+')';
  }
  function visit(index) {
    stopClip();station=Math.max(0,Math.min(till,index));review=false;purchase=null;
    $('notice').textContent='';render();
  }
  function marker(x,y,name,fn,way=false) {
    const b=button(way?'›':'',fn,way?'waypoint':'spot');
    b.style.left=x+'%';b.style.top=y+'%';b.title=name;b.setAttribute('aria-label',name);
    targets.append(b);return b;
  }
  function row(id,label,sub,end,fn) {
    const b=button('',fn,'row');if(id)b.append(icon(id));
    const text=el('span',label);if(sub)text.append(el('small',sub));
    b.append(text,el('b',end));return b;
  }
  function add(id) {
    const product=item(id);
    if(cost()+product[3]>MatchaPantry.load().coins){$('notice').textContent='Your basket would exceed your coin balance.';return;}
    bag.set(id,(bag.get(id)||0)+1);
    $('notice').textContent=product[1]+' added · '+bag.get(id)+' in basket.';
    const active=document.activeElement;
    render();
    if(active?.matches('.row,.spot')) document.querySelector('.'+active.className+'[data-id="'+id+'"]')?.focus({preventScroll:true});
    if(['matcha','berries','banana'].includes(id)) clip(id);
    else if(!motion.matches) {
      const img=icon(id), from=$('scene').getBoundingClientRect(), to=$('basket').getBoundingClientRect();
      Object.assign(img.style,{position:'fixed',width:'44px',height:'44px',objectFit:'contain',pointerEvents:'none',zIndex:'5',left:from.x+from.width/2-22+'px',top:from.y+from.height/2-22+'px'});
      document.body.append(img);
      const finish=img.animate([{transform:'translate(0,0)'},{transform:'translate('+(to.x+25-from.x-from.width/2)+'px,'+(to.y+25-from.y-from.height/2)+'px) scale(.5)',opacity:.25}],{duration:420,easing:'ease-in'});
      finish.onfinish=()=>img.remove();
    }
  }
  function shoppingList(state) {
    const [recipe,ids]=grocerOrder(state.orderIndex);
    const d=el('details'), slip=el('ul',null,'slip');
    d.append(el('summary','Shopping list · '+recipe),slip);
    for(const id of ids.sort((a,b)=>state.stock[a]-state.stock[b])){
      const qty=bag.get(id)||0;
      slip.append(el('li',(qty?'✓ ':'')+item(id)[1]+' · '+state.stock[id]+' in pantry'+(qty?' · '+qty+' in basket':'')));
    }
    return d;
  }
  function entrance(state) {
    const grid=el('div',null,'shelves');
    stations.slice(1,till).forEach((s,i)=>{
      const go=()=>visit(i+1);grid.append(row(s.goods[0][0],s.name,'','›',go));
      marker(s.x,24,s.name,go,true);
    });
    marker(61,48,'Walk to checkout',()=>visit(till),true);
    list.append(grid,shoppingList(state));
  }
  function shelf(state,s) {
    for(const [id,x,y] of s.goods) {
      const [,name,,price]=item(id), qty=bag.get(id)||0;
      const pick=()=>add(id), b=row(id,name,state.stock[id]+' in pantry'+(qty?' · '+qty+' in basket':''),price+' ◉',pick);
      b.setAttribute('aria-label','Pick '+name+' for '+price+' coins');
      b.dataset.id=id;list.append(b);
      // Fresh coconuts are loose stock at this shelf; the painting has no matching package.
      if(id!=='fresh-coconut')marker(x,y,'Pick '+name,pick).dataset.id=id;
    }
    list.append(shoppingList(state));
  }
  function pay() {
    if(station!==till || !bag.size || purchase) return;
    const n=units(),amount=cost();
    if(!MatchaPantry.buy([...bag],amount)){render();$('notice').textContent='Remove an item to fit your balance.';return;}
    purchase={n,amount};bag.clear();$('notice').textContent='Pantry restocked.';
    document.querySelector('matcha-hud').refresh();window.MatchaAudio?.playEffect('finish');
    render();clip('pay');
  }
  function payment() {
    const pad=el('div',null,'payment'),coin=button('',null,'coin'),tray=el('span','Till','tray');
    coin.setAttribute('aria-label','Payment coin');coin.title='Slide coin to the till';
    let start=null;
    coin.onpointerdown=e=>{start=[e.clientX,e.clientY];coin.setPointerCapture(e.pointerId);};
    coin.onpointermove=e=>{if(start)coin.style.transform='translate('+(e.clientX-start[0])+'px,'+(e.clientY-start[1])+'px)';};
    coin.onpointercancel=()=>{start=null;coin.style.transform='';};
    coin.onpointerup=e=>{
      if(!start)return;
      const r=tray.getBoundingClientRect();start=null;coin.style.transform='';
      if(e.clientX>=r.left && e.clientX<=r.right && e.clientY>=r.top && e.clientY<=r.bottom)pay();
    };
    coin.onclick=e=>{if(e.detail===0)pay();};
    pad.append(coin,tray);list.append(el('p','Slide the coin to the till, or tap Pay.','muted'),pad);
  }
  function receipt(state) {
    if(purchase){
      list.append(el('p','✓  Paid · '+purchase.amount+' coins'),el('p',purchase.n+' portion'+(purchase.n===1?'':'s')+' added to your café pantry.'),button('Continue shopping',()=>visit(0),'primary'));
      return;
    }
    if(!bag.size){list.append(el('p','Your basket is empty.'),button('Browse the shelves',()=>visit(0),'primary'));return;}
    for(const [id,n] of bag){
      const line=el('div',null,'line'),description=el('span',item(id)[1]);
      description.append(el('small',n+' × '+item(id)[3]+' coins'));
      const remove=button('−',()=>{if(n===1)bag.delete(id);else bag.set(id,n-1);render();});
      remove.setAttribute('aria-label','Remove one '+item(id)[1]);
      line.append(icon(id),description,el('b',String(n*item(id)[3])),remove);list.append(line);
    }
    const total=el('div','Basket total','total');total.append(el('b',cost()+' coins'));list.append(total);
    if(station!==till){list.append(button('Walk to checkout',()=>visit(till),'primary'));return;}
    if(cost()<=state.coins)payment();
    const confirm=button('Pay '+cost()+' coins',pay,'primary');confirm.disabled=cost()>state.coins;
    if(confirm.disabled)list.append(el('p','Remove an item to fit your balance.'));
    list.append(confirm);
  }
  function render() {
    const state=MatchaPantry.load(), s=stations[station];
    targets.replaceChildren();list.replaceChildren();frame();
    $('location').textContent=s.name;$('prev').disabled=station===0;$('next').disabled=station===till;
    $('home').hidden=!station&&!review;
    $('eyebrow').textContent=purchase?'Receipt':review?'Shopping basket':station===till?'Village Grocer':station?'Shop aisle':'Village Grocer';
    $('title').textContent=purchase?'Thank you':review?'Your basket':station===0?'Browse the shelves':s.name;
    $('sum').textContent=units()+' · '+cost()+' coins';
    $('basket').hidden=review || station===till;
    if(review || station===till)receipt(state);else if(!station)entrance(state);else shelf(state,s);
  }
  $('basket').onclick=()=>{stopClip();review=true;$('notice').textContent='';render();};
  $('home').onclick=()=>visit(0);
  $('prev').onclick=()=>visit(station-1);$('next').onclick=()=>visit(station+1);
  $('light').onclick=()=>{stopClip();night=!night;$('artNight').style.opacity=night?'1':'0';$('light').textContent=night?'Day':'Night';};
  addEventListener('keydown',e=>{
    if(e.metaKey||e.altKey||e.ctrlKey||e.repeat)return;
    if(['KeyW','KeyD','ArrowRight','ArrowUp'].includes(e.code)){e.preventDefault();visit(station+1);}
    if(['KeyS','KeyA','ArrowLeft','ArrowDown'].includes(e.code)){e.preventDefault();visit(station-1);}
    if(e.code==='KeyB'&&station!==till){review=!review;render();}
    if(e.code==='Escape')visit(0);
  });
  new ResizeObserver(frame).observe($('scene'));
  addEventListener('storage',render);render();
})();
