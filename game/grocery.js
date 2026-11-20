(() => {
  const shop=document.createElement('dialog');
  shop.className='grocery';shop.setAttribute('aria-labelledby','grocery-name');
  shop.innerHTML=`<canvas class="market-view" tabindex="0" aria-label="Grocery aisle. Walk with W and S, turn with the arrows, and press E to pick the item in view."></canvas>
  <div class="market-sign"><h2 id="grocery-name">Village Grocer</h2><span class="market-location">Entrance</span><details class="market-list"><summary>Shopping list</summary><ul></ul></details></div>
  <div class="market-wallet"><span aria-hidden="true">●</span> <b></b> coins</div>
  <span class="market-crosshair" aria-hidden="true"></span>
  <div class="market-prompt"><output aria-live="polite"></output><button data-pick hidden></button></div>
  <div class="market-controls" aria-label="Walk and turn">
    <button data-move="ArrowLeft" aria-label="Turn left">↶</button><button data-move="KeyW" aria-label="Walk forward">↑</button>
    <button data-move="ArrowRight" aria-label="Turn right">↷</button><button data-move="KeyS" aria-label="Walk back">↓</button>
  </div>
  <div class="market-actions"><button data-basket aria-expanded="false">Basket</button><button data-leave>Leave shop</button></div>
  <section class="market-receipt" aria-label="Shopping basket" hidden><header><h3>Your basket</h3><button data-fold aria-label="Close basket">×</button></header><div class="market-lines"></div><footer><strong></strong><button data-pay></button></footer></section>`;
  document.body.append(shop);
  const get=q=>shop.querySelector(q),canvas=get('canvas'), message=get('output'), receipt=get('.market-receipt');
  let listIds=[],paid=new Set();
  const keys=new Set(), items=new Map(pantryItems.map(item=>[item[0],item]));
  let world,renderer,loading,bag=[],x,z,yaw,pitch,frame,last,clock,aim,hover,drag,route=false,noticeUntil=0,sheetImage;
  function groceryArt(){
    if(sheetImage)return Promise.resolve(sheetImage);
    const image=new Image();
    image.src=window.matchaPark.grocerySheet;
    return image.decode().then(()=>sheetImage=image);
  }
  const atTill=()=>z<=-9.35;
  const cost=()=>bag.reduce((sum,unit)=>sum+items.get(unit.id)[3],0);
  function notice(text){message.textContent=text;noticeUntil=performance.now()+2200}
  function refresh(){
    get('.market-wallet b').textContent=state.coins;
    const list=get('.market-list ul');list.replaceChildren();
    for(const id of listIds){
      const li=document.createElement('li');
      const tick=paid.has(id)||bag.some(unit=>unit.id===id);
      li.classList.toggle('collected',tick);
      li.textContent=(tick?'☑  ':'☐  ')+items.get(id)[1]+' · '+stock[id]+' left';
      list.append(li);
    }
    get('[data-basket]').textContent='Basket · '+bag.length;
    const lines=get('.market-lines');
    lines.replaceChildren();
    if(!bag.length)lines.textContent='Your basket is empty.';
    for(const id of new Set(bag.map(unit=>unit.id))){
      const item=items.get(id),qty=bag.filter(unit=>unit.id===id).length,row=document.createElement('div');
      row.innerHTML='<img alt="" src="assets/pantry/'+id+'.jpg"><span>'+item[1]+' × '+qty+'</span><b>'+qty*item[3]+'</b><button data-remove="'+id+'" aria-label="Remove one '+item[1]+'">−</button>';
      lines.append(row);
    }
    receipt.querySelector('strong').textContent='Total · '+cost()+' coins';
    const pay=get('[data-pay]');pay.disabled=!bag.length;
    pay.textContent=atTill()?'Pay for groceries':'Walk to checkout';
    world?.showBasket(bag);
  }
  function setReceipt(open){
    receipt.hidden=!open;get('[data-basket]').setAttribute('aria-expanded',String(open));
    keys.clear();drag=null;hover=null;
    if(open){refresh();get('[data-fold]').focus()}else canvas.focus();
  }
  function talkClerk(){
    const keeper=world?.keeper;if(!keeper)return;
    window.matchaSfx?.order();
    notice(keeper.line());
  }
  function add(unit){
    if(!unit||unit.picked||!receipt.hidden||route)return;
    const item=items.get(unit.id);
    if(cost()+item[3]>state.coins){notice('More coins needed');return}
    world.lift(unit);bag.push(unit);hover=null;aim=null;canvas.focus();refresh();window.matchaSfx?.clink();notice(item[1]+' added to basket');
    get('[data-basket]').animate([{transform:'scale(1.08)'},{transform:'scale(1)'}],{duration:230});
  }
  function checkout(){
    if(!bag.length)return;
    if(!atTill()){setReceipt(false);route=true;notice('Walking to the till');return}
    if(cost()>state.coins){notice('Not enough coins');return}
    const count=bag.length,total=cost();
    for(const unit of bag){stock[unit.id]++;paid.add(unit.id)}
    state.coins-=total;bag=[];savePantry();updateUI();refresh();setReceipt(false);
    notice(count+' portion'+(count===1?'':'s')+' stocked · '+total+' coins paid');
  }
  function pointer(e){
    const b=canvas.getBoundingClientRect();
    return {x:(e.clientX-b.left)/b.width*2-1,y:1-(e.clientY-b.top)/b.height*2};
  }
  canvas.onpointerdown=e=>{
    if(!world)return;
    drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,yaw,pitch,moved:false};route=false;
    canvas.setPointerCapture(e.pointerId);canvas.focus();
  };
  canvas.onpointermove=e=>{
    if(!drag){hover=e.pointerType==='mouse'?pointer(e):null;return}
    const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
    if(Math.abs(dx)+Math.abs(dy)>5)drag.moved=true;
    if(drag.moved){yaw=drag.yaw-dx*.005;pitch=Math.max(-.52,Math.min(.43,drag.pitch-dy*.004));hover=null}
  };
  canvas.onpointerup=e=>{
    if(!drag)return;
    if(!drag.moved){if(Math.hypot(x-1.37,z+.9)<1.15)talkClerk();else{const pos=pointer(e);add(world.pick(pos.x,pos.y))}}
    drag=null;
  };
  canvas.onpointercancel=()=>{drag=null};canvas.onpointerleave=e=>{if(!e.relatedTarget?.closest?.('.market-prompt'))hover=null};
  shop.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-basket'))setReceipt(receipt.hidden);
    if(b.hasAttribute('data-fold'))setReceipt(false);
    if(b.hasAttribute('data-leave'))shop.close();
    if(b.hasAttribute('data-pay'))checkout();
    if(b.hasAttribute('data-pick')){if(Math.hypot(x-1.37,z+.9)<1.15)talkClerk();else add(aim)}
    if(b.dataset.remove){const index=bag.map(unit=>unit.id).lastIndexOf(b.dataset.remove);if(index>=0)world.restore(bag.splice(index,1)[0]);refresh()}
  });
  for(const b of shop.querySelectorAll('[data-move]')){
    b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.move);route=false;hover=null};
    b.onlostpointercapture=()=>keys.delete(b.dataset.move);
    b.onkeydown=e=>{if(['Enter','Space'].includes(e.code))keys.add(b.dataset.move)};
    b.onkeyup=()=>keys.delete(b.dataset.move);
  }
  const movement=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyS','KeyA','KeyD'];
  shop.onkeydown=e=>{
    if(e.target.closest('input,textarea,select,#saveCard,.market-receipt button'))return;
    if(movement.includes(e.code)){e.preventDefault();keys.add(e.code);hover=null;route=false}
    if(e.code==='KeyE'&&!e.repeat){e.preventDefault();if(Math.hypot(x-1.37,z+.9)<1.15)talkClerk();else add(aim)}
    if(e.code==='KeyB'&&!e.repeat){e.preventDefault();setReceipt(true)}
  };
  shop.onkeyup=e=>keys.delete(e.code);
  window.addEventListener('blur',()=>{keys.clear();drag=null});
  shop.oncancel=e=>{if(!receipt.hidden){e.preventDefault();setReceipt(false)}};
  shop.onclose=()=>{cancelAnimationFrame(frame);keys.clear();drag=null;bag=[];route=false;world?.reset()};
  function tick(now){
    if(!shop.open)return;
    frame=requestAnimationFrame(tick);const dt=Math.min(.055,(now-last)/1000);last=now;
    const {camera,cart}=world;
    const down=k=>Number(keys.has(k));
    let walk=0,side=0;
    yaw+=(down('ArrowLeft')-down('ArrowRight'))*dt*1.65;
    walk=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
    side=down('KeyD')-down('KeyA');
    if(route && (walk||side))route=false;
    if(route){
      yaw+=Math.atan2(Math.sin(-yaw),Math.cos(yaw))*Math.min(1,dt*5);pitch+=(-.04-pitch)*dt*4;
      x*=Math.max(0,1-dt*3);z-=dt*1.7;
      if(atTill()){route=false;setReceipt(true)}
    }else{
      const speed=dt*(walk<0?.8:1.45)/(Math.hypot(walk,side)||1);
      x+=(-walk*Math.sin(yaw)+side*Math.cos(yaw))*speed;
      z+=(-walk*Math.cos(yaw)-side*Math.sin(yaw))*speed;
    }
    const clerkDistance=Math.hypot(x-1.37,z+.9);
    if(clerkDistance<.53){x=1.37+(x-1.37)*.53/(clerkDistance||1);z=-.9+(z+.9)*.53/(clerkDistance||1)}
    x=Math.min(1.54,Math.max(-1.54,x));z=Math.max(-10.05,Math.min(7.93,z));
    const moving=Boolean(route||side||walk);
    if(moving)clock+=dt*8.3;
    const bob=moving&&!matchMedia('(prefers-reduced-motion:reduce)').matches?Math.sin(clock):0;
    camera.position.set(x,1.48+bob*.014,z);camera.rotation.set(pitch,yaw,0,'YXZ');
    cart.rotation.x=-pitch*.72;cart.position.set(0,-.42+bob*.004,-.48);cart.scale.setScalar(Math.min(.72,camera.aspect*.62));
    camera.updateMatrixWorld();
    const clerkNear=Math.hypot(x-1.37,z+.9)<1.15;
    aim=receipt.hidden&&!route&&!clerkNear?world.pick(hover?.x??0,hover?.y??0):null;
    const pick=get('[data-pick]');
    pick.hidden=!aim && !clerkNear;
    if(clerkNear)pick.textContent='Talk with the grocer';
    else if(aim){const item=items.get(aim.id);pick.textContent='Pick '+item[1]+' · '+item[3]+' coin'+(item[3]===1?'':'s')}
    canvas.style.cursor=drag?.moved?'grabbing':aim?'pointer':'grab';
    get('.market-location').textContent=atTill()?'Checkout':z>6?'Entrance':'Aisle '+Math.max(1,Math.min(6,Math.round((6.4-z)/2.56)+1));
    if(now>noticeUntil)message.textContent=route?'Walking to checkout':clerkNear?'':'' ;
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(renderer.domElement.width!==Math.floor(w*renderer.getPixelRatio())||renderer.domElement.height!==Math.floor(h*renderer.getPixelRatio())){
      renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
    }
    world.animate(now/1000,dt,bag);renderer.render(world.scene,camera);
  }
  window.openGrocery=async()=>{
    if(shop.open)return;
    listIds=[...new Set(currentRecipe().steps.map(portion).filter(id=>items.has(id)))].sort((a,b)=>stock[a]-stock[b]);
    paid=new Set();get('.market-list').open=innerWidth>580;
    shop.showModal();receipt.hidden=true;bag=[];x=0;z=6.88;yaw=.10;pitch=-.035;clock=0;hover=null;aim=null;route=false;
    get('[data-basket]').setAttribute('aria-expanded','false');noticeUntil=0;refresh();message.textContent='Opening the shop…';canvas.focus();
    try {
      if(!loading)loading=window.matchaPark.loadEngine().then(async THREE=>{
        renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});
        renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
        const sheet=await groceryArt();
        world=window.buildGroceryInterior(THREE,renderer,pantryItems,(await ensurePark()).shopkeeper(),sheet);
      }).catch(error=>{loading=null;throw error});
      await loading;
      if(shop.open){world.keeper?.randomize?.();cancelAnimationFrame(frame);last=performance.now();tick(last)}
    }catch(error){console.error(error);message.textContent='The shop could not open. Leave and try again.'}
  };
})();
