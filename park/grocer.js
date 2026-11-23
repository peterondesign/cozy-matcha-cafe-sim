(async () => {
  const get=id=>document.getElementById(id);
  const canvas=get('aisle'), panel=get('panel'), content=get('content'), status=get('status');
  let world;
  try {world=await buildMarket(canvas);}
  catch(error){
    console.error('Village Grocer renderer:',error);
    status.textContent='3D rendering is unavailable. ';
    const link=document.createElement('a');link.href='shelf-access.html';link.textContent='Open the accessible shelves';link.style.pointerEvents='auto';status.append(link);
    return;
  }
  const {camera,cart,renderer}=world, bag=[], keys=new Set(), held=new Map();
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const player={x:0,z:6.65,yaw:0,pitch:-.015,speed:0};
  try {
    const saved=JSON.parse(localStorage.getItem('matcha-grocer-pause-position')||'null');
    localStorage.removeItem('matcha-grocer-pause-position');
    if(saved && [saved.x,saved.z,saved.yaw,saved.pitch].every(Number.isFinite)
      && saved.x>=-1.71 && saved.x<=1.71 && saved.z>=-5.32 && saved.z<=7.22
      && saved.pitch>=-.78 && saved.pitch<=.53) {
      Object.assign(player,{x:saved.x,z:saved.z,yaw:saved.yaw,pitch:saved.pitch});
      if(Array.isArray(saved.bag)) for(const index of saved.bag) {
        const unit=world.units[index];
        if(Number.isInteger(index) && unit && !unit.picked) {bag.push(unit);world.setPicked(unit,true);}
      }
      world.basket(bag);
    }
  } catch(error) { console.warn('Grocer position could not be restored.',error); }
  addEventListener('matcha-pause',()=>localStorage.setItem('matcha-grocer-pause-position',JSON.stringify({x:player.x,z:player.z,yaw:player.yaw,pitch:player.pitch,bag:bag.map(unit=>world.units.indexOf(unit))})));
  let panelType='',aim=null,drag=null,hover=null,route=false;
  let last=performance.now(),lastRay=0,noticeEnd=0,stride=0,turnLean=0, width=0,height=0;
  const item=id=>MatchaPantry.item(id);
  const total=()=>bag.reduce((sum,u)=>sum+item(u.id)[3],0);
  const atTill=()=>player.z < -4.86 && player.x> -1.58 && player.x<2;
  const tally=()=>{get('tally').textContent=bag.length+' '+(bag.length===1?'item':'items')+(bag.length?' · '+total()+' coins':'');};
  function say(text,ms=2200){status.textContent=text;noticeEnd=performance.now()+ms;}
  function node(tag,text,cls){
    const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;
  }
  function button(text,fn,cls='primary'){
    const b=node('button',text,cls);b.type='button';b.onclick=fn;return b;
  }
  function icon(id){const img=new Image();img.alt='';img.src=MatchaPantry.icon(id);return img;}
  function close(){if(panel.open)panel.close();}
  panel.onclose=()=>{panelType='';canvas.focus({preventScroll:true});};
  function show(type){
    panelType=type;keys.clear();held.clear();drag=hover=null;player.speed=0;
    if(!panel.open)panel.showModal();
    paintPanel();
  }
  function walkToTill(){close();route=true;say('Pushing to the checkout. Steer to take over.',2000);}
  function pay(){
    if(!bag.length||!atTill()||panelType!=='basket')return;
    const counts=new Map();for(const u of bag)counts.set(u.id,1+(counts.get(u.id)||0));
    const amount=total(),n=bag.length;
    if(!MatchaPantry.buy([...counts],amount)){paintPanel();say('Not enough coins.');return;}
    // Restock display units for the next visit after the purchase commits.
    bag.forEach(u=>world.setPicked(u,false));bag.length=0;world.basket(bag);tally();
    document.querySelector('matcha-hud').refresh();window.MatchaAudio?.playEffect('finish');
    panelType='paid';get('title').textContent='Paid ✓';content.replaceChildren();
    content.append(node('p',n+' '+(n===1?'portion':'portions')+' added to your café pantry.'),node('p',amount+' coins paid · '+MatchaPantry.load().coins+' remaining'),button('Continue shopping',close),navLink('Back to counter','../counter/'));
  }
  function navLink(label,path){const a=node('a',label,'link');a.href=path;return a;}
  function paymentTray(){
    const bar=node('div',null,'payment'),coin=button('',null,'coin'),tray=node('span','Till','tray');let start;
    coin.setAttribute('aria-label','Slide payment coin to the till');
    coin.onpointerdown=e=>{start=[e.clientX,e.clientY];coin.setPointerCapture(e.pointerId);};
    coin.onpointermove=e=>{if(start)coin.style.transform='translate('+(e.clientX-start[0])+'px,'+(e.clientY-start[1])+'px)';};
    coin.onpointercancel=()=>{start=null;coin.style.transform='';};
    coin.onpointerup=e=>{if(!start)return;start=null;coin.style.transform='';const r=tray.getBoundingClientRect();
      if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)pay();
    };
    coin.onclick=e=>{if(e.detail===0)pay();};bar.append(coin,tray);return bar;
  }
  function paintPanel(){
    if(!panel.open||panelType==='paid')return;
    const state=MatchaPantry.load();content.replaceChildren();
    if(panelType==='inventory'){
      get('title').textContent='Café inventory';
      for(const [id,name] of MatchaPantry.ITEMS){const row=node('div',null,'row');row.append(icon(id),node('span',name),node('b',String(state.stock[id])));content.append(row);}
      content.append(button('Current order shopping list',()=>show('list'))); return;
    }
    if(panelType==='list'){
      const [recipe,ingredients]=grocerOrder(state.orderIndex);
      get('title').textContent='Shopping list';content.append(node('p',recipe));
      for(const id of ingredients.sort((a,b)=>state.stock[a]-state.stock[b])){
        const row=node('div',null,'row'),n=bag.filter(u=>u.id===id).length;
        row.append(icon(id),node('span',item(id)[1]),node('small',state.stock[id]+' in pantry'+(n?' · '+n+' in cart':'')));content.append(row);
      }
      content.append(button('Back to the aisle',close));return;
    }
    get('title').textContent=atTill()?'Checkout':'Your basket';
    content.append(button('Shopping list',()=>show('list'),'link'),button('Café inventory',()=>show('inventory'),'link'));
    if(!bag.length){content.append(node('p','Your basket is empty.'),button('Browse shelves',close));return;}
    for(const id of new Set(bag.map(u=>u.id))){
      const n=bag.filter(u=>u.id===id).length,row=node('div',null,'row'),name=node('span',item(id)[1]);
      name.append(node('small',n+' × '+item(id)[3]+' coins'));
      const remove=button('−',()=>{const j=bag.map(u=>u.id).lastIndexOf(id);world.setPicked(bag.splice(j,1)[0],false);world.basket(bag);tally();paintPanel();},'remove');
      remove.setAttribute('aria-label','Put back one '+item(id)[1]);row.append(icon(id),name,node('b',String(n*item(id)[3])),remove);content.append(row);
    }
    const bill=node('p','Basket total','bill');bill.append(node('b',total()+' coins'));content.append(bill);
    if(!atTill()){content.append(button('Push cart to checkout',walkToTill));return;}
    const ok=total()<=state.coins;
    content.append(ok?paymentTray():node('p','Put an item back to fit your balance.'));
    const confirm=button('Pay '+total()+' coins',pay);confirm.disabled=!ok;content.append(confirm);
  }
  function pick(u){
    if(!u||u.picked||panel.open||route)return;
    if(total()+item(u.id)[3]>MatchaPantry.load().coins){say('Your basket would exceed your balance.');return;}
    bag.push(u);world.lift(u,bag,motion.matches);tally();aim=null;world.aim(null);
    say(item(u.id)[1]+' added to basket.');window.MatchaAudio?.playEffect('finish');
  }
  function interact(){if(atTill())show('basket');else pick(aim);}
  get('bagButton').onclick=()=>show('basket');
  get('close').onclick=close;get('take').onclick=interact;
  function screen(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*2-1,y:1-(e.clientY-r.top)/r.height*2};}
  canvas.onpointerdown=e=>{
    if(!e.isPrimary)return;
    route=false;canvas.focus();canvas.setPointerCapture(e.pointerId);
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:player.yaw,pitch:player.pitch,moved:false};
  };
  canvas.onpointermove=e=>{
    if(!drag){hover=e.pointerType==='mouse'?screen(e):null;return;}
    if(drag.id!==e.pointerId)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(Math.hypot(dx,dy)>4)drag.moved=true;
    if(drag.moved){
      player.yaw=drag.yaw-dx*.006;player.pitch=Math.max(-.78,Math.min(.53,drag.pitch-dy*.004));hover=null;
    }
  };
  canvas.onpointerup=e=>{
    if(drag?.id!==e.pointerId)return;
    if(!drag.moved){const p=screen(e);const u=world.pick(p.x,p.y);if(u)pick(u);else if(atTill())show('basket');}
    drag=null;
  };
  canvas.onpointercancel=()=>drag=null;canvas.onpointerleave=()=>hover=null;
  const movement=['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
  addEventListener('keydown',e=>{
    if(panel.open||e.altKey||e.metaKey||e.ctrlKey)return;
    if(movement.includes(e.code)){e.preventDefault();keys.add(e.code);route=false;hover=null;}
    if(e.code==='KeyE'&&!e.repeat)interact();
    if(e.code==='KeyB'&&!e.repeat)show('basket');
  });
  addEventListener('keyup',e=>keys.delete(e.code));
  addEventListener('blur',()=>{held.clear();keys.clear();drag=null;player.speed=0;});
  const moves={up:'KeyW',down:'KeyS',left:'ArrowLeft',right:'ArrowRight'};
  for(const b of document.querySelectorAll('[data-key]')){
    b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held.set(e.pointerId,moves[b.dataset.key]);route=false;hover=null;};
    b.onlostpointercapture=e=>held.delete(e.pointerId);
  }
  function update(now){
    const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;
    if(width!==canvas.clientWidth||height!==canvas.clientHeight){width=canvas.clientWidth;height=canvas.clientHeight;
      renderer.setSize(width,height,false);camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();}
    const pressed=k=>keys.has(k)||Array.from(held.values()).includes(k);
    let turn=0,side=0,forward=0;
    if(!panel.open){
      if(route){
        player.yaw+=Math.atan2(Math.sin(-player.yaw),Math.cos(player.yaw))*Math.min(1,dt*4);
        player.pitch+=(0-player.pitch)*dt*4;player.x*=Math.exp(-dt*2);
        player.z-=dt*2.5;
        if(atTill()){route=false;show('basket');}
      }else{
        turn=Number(pressed('ArrowLeft'))-Number(pressed('ArrowRight'));
        forward=Number(pressed('KeyW')||pressed('ArrowUp'))-Number(pressed('KeyS')||pressed('ArrowDown'));
        side=Number(pressed('KeyD'))-Number(pressed('KeyA'));
        player.yaw+=turn*dt*1.75;
        const norm=Math.max(1,Math.hypot(side,forward));
        player.speed+=((forward>0?2.35:1.5)*forward/norm-player.speed)*(1-Math.exp(-dt*10));
        const sin=Math.sin(player.yaw),cos=Math.cos(player.yaw);
        player.x+=dt*(-sin*player.speed+cos*side*1.65/norm);
        player.z+=dt*(-cos*player.speed-sin*side*1.65/norm);
      }
      // Allow clearance for the cart even when turning sideways beside a shelf or till.
      player.x=Math.max(-1.71,Math.min(1.71,player.x));player.z=Math.max(-5.32,Math.min(7.22,player.z));
    }
    stride+=dt*(route?2.5:Math.abs(player.speed)+Math.abs(side))*4;
    const bob=motion.matches||panel.open?0:Math.sin(stride)*Math.min(.012,Math.abs(player.speed)*.005);
    camera.position.set(player.x,1.51+bob,player.z);camera.rotation.set(player.pitch,player.yaw,0,'YXZ');
    const sz=Math.min(.93,.87*camera.aspect);
    turnLean+=((motion.matches?0:turn*.055)-turnLean)*Math.min(1,dt*8);
    cart.scale.setScalar(sz);
    cart.position.set(0,-.60*sz,-.91*sz);
    cart.rotation.set(-player.pitch*.75,turnLean,0,'YXZ');
    camera.updateMatrixWorld(true);
    if(now-lastRay>75){
      lastRay=now;aim=panel.open||route?null:world.pick(hover?.x??0,hover?.y??0);
      world.aim(aim);const take=get('take'),label=atTill()?'Check out':aim?'Pick '+item(aim.id)[1]+' · '+item(aim.id)[3]+' coins':'';
      take.hidden=!label||panel.open||route;if(take.textContent!==label)take.textContent=label;
      if(now>noticeEnd&&status.textContent)status.textContent='';
    }
    world.animate(dt,bag);renderer.render(world.scene,camera);requestAnimationFrame(update);
  }
  function clockNightMix(minutes){
    const value=Number(minutes),minuteOfDay=((Number.isFinite(value)?value:480)%1440+1440)%1440;
    const hour=minuteOfDay/60;
    const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
    const dawn=smooth(5,7,hour),dusk=smooth(17,19,hour);
    return 1-Math.min(dawn,1-dusk);
  }
  const syncClock=()=>{const s=MatchaPantry.load(), m=s.minutes??480; document.querySelector('matcha-hud').refresh(); world.lighting(clockNightMix(m));};
  addEventListener('matcha-clock',syncClock);
  addEventListener('matcha-stock',()=>{document.querySelector('matcha-hud').refresh();paintPanel();});
  addEventListener('storage',paintPanel);syncClock();
  tally();say('Push to walk · Drag to look · Tap a product',6000);requestAnimationFrame(update);
})();
