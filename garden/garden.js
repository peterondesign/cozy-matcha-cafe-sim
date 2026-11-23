(() => {
  const practice=new URLSearchParams(location.search).has('dev');
  const slot=practice?'practiceGarden':'gardenBeds';
  const views=new Map(), attention=new Map();
  let selected=null;
  const panel=document.querySelector('#care-panel');
  const gardenNow=()=>MatchaWorld.clock.gardenNow();
  function latest() {
    const state=MatchaPantry.load();
    state[slot] ||= {};
    let legacy;
    try { legacy=JSON.parse(localStorage.getItem('matcha-garden-v2'))?.plants; }
    catch(error) { console.warn('Legacy garden could not be read.',error); }
    for(const crop of Garden.crops) state[slot][crop.id] ||= Garden.initial(crop,gardenNow(),legacy?.find(p=>p.id===crop.id));
    return state;
  }
  async function change(fn) {
    function commit() {
      const state=latest();
      const afterSave=fn(state);
      localStorage.setItem(MatchaPantry.KEY,JSON.stringify(state));
      window.dispatchEvent(new Event('matcha-stock'));
      refresh();
      if(afterSave)afterSave();
    }
    try {
      if(navigator.locks) await navigator.locks.request('matcha-garden',commit);
      else commit();
    } catch(error) {
      console.error('Garden changes could not be saved.',error);
      announce('Could not save your garden. Please try again.');
    }
  }
  function duration(ms) {
    const mins=Math.ceil(Math.max(ms,0)/Garden.minute);
    return mins===0?'now':mins<60?mins+'m':Math.floor(mins/60)+'h'+(mins%60?' '+mins%60+'m':'');
  }
  let noticeTimer;
  function announce(line) {
    const notice=document.querySelector('#notice');
    notice.textContent=line;
    clearTimeout(noticeTimer);
    noticeTimer=setTimeout(()=>{notice.textContent='';},5000);
  }
  function harvestAnimation(crop) {
    const source=views.get(crop.id).image.getBoundingClientRect();
    const target=document.getElementById('pantry-'+crop.id);
    if(!target)return;
    target.classList.remove('harvested');
    void target.offsetWidth;
    target.classList.add('harvested');
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const destination=target.getBoundingClientRect(), item=document.createElement('img');
    item.className='harvest-flight';
    item.src=MatchaPantry.icon(crop.id==='strawberries'?'berries':crop.id);
    item.alt='';
    item.style.left=(source.left+source.width/2-24)+'px';
    item.style.top=(source.top+source.height/2-24)+'px';
    document.body.append(item);
    const dx=destination.left+destination.width/2-(source.left+source.width/2);
    const dy=destination.top+destination.height/2-(source.top+source.height/2);
    const flight=item.animate([
      {transform:'translate(0,0) scale(.8)',opacity:0},
      {transform:`translate(${dx*.4}px,${dy*.4-35}px) scale(1.2)`,opacity:1,offset:.4},
      {transform:`translate(${dx}px,${dy}px) scale(.45)`,opacity:0}
    ],{duration:900,easing:'ease-in-out'});
    flight.onfinish=flight.oncancel=()=>item.remove();
  }
  function createCard(crop) {
    const article=document.createElement('article');
    article.innerHTML=`<button class="plot" type="button" aria-label="View ${crop.name}" aria-pressed="false">
      <span class="plot-name">${crop.name}</span><img class="plant-art" src="assets/bed-${crop.id}.png" alt="">
      <span class="plot-status"></span></button>
      <div class="growth"><span class="sr-only">Growth </span><input type="range" min="0" max="100" step="1" aria-label="${crop.name} growth progress"><span class="percent"></span></div>`;
    document.querySelector('#beds').append(article);
    const q=s=>article.querySelector(s);
    const ui={article, image:q('.plant-art'), plot:q('.plot'), status:q('.plot-status'), percent:q('.percent'),progress:q('input')};
    views.set(crop.id,ui);
    ui.plot.addEventListener('click',()=>{
      if(selected?.id===crop.id) {
        selected=null;
        panel.hidden=true;
        ui.plot.setAttribute('aria-pressed','false');
      } else select(crop);
    });
    ui.progress.addEventListener('input',()=>{
      const percent=Number(ui.progress.value);
      select(crop);
      ui.progress.style.setProperty('--progress',percent+'%');
      change(state=>Garden.seek(state[slot][crop.id],percent,gardenNow()));
    });
  }
  function select(crop) {
    selected=crop;
    panel.hidden=false;
    for(const [id,ui] of views) ui.plot.setAttribute('aria-pressed',String(id===crop.id));
    refresh();
  }
  document.querySelector('#care-action').addEventListener('click',()=>{
    if(!selected)return;
    const crop=selected;
    change(state=>{
      const time=gardenNow(),bed=state[slot][crop.id],view=Garden.inspect(bed,time);
      if(view.status==='ready') {
        if(!practice) {
          state.stock[crop.id==='strawberries'?'berries':crop.id]++;
          state.harvests=(state.harvests||0)+1;
        }
        state[slot][crop.id]=Garden.plant(crop,time);
        return ()=>{
          announce(practice?'Practice harvest complete.':crop.name+' added to the café pantry.');
          if(!practice)harvestAnimation(crop);
        };
      } else if(Garden.tend(bed,time)) {
        return ()=>announce(crop.name+' watered.');
      }
    });
  });
  function refresh() {
    const state=latest(),time=gardenNow();
    for(const crop of Garden.crops) {
      const id=crop.id==='strawberries'?'berries':crop.id;
      document.querySelector('#pantry-'+crop.id+' .quantity').textContent=state.stock[id];
    }
    for(const crop of Garden.crops) {
      const ui=views.get(crop.id),bed=state[slot][crop.id],v=Garden.inspect(bed,time);
      const ready=v.status==='ready',care=['missed','available','approaching'].includes(v.status);
      ui.article.dataset.state=v.status;
      ui.image.style.setProperty('--growth-scale',String(.78+.22*v.growthProgress/100));
      ui.status.textContent=ready?'Ready!':care?'Needs care':'';
      ui.percent.textContent=v.growthProgress+'%';
      if(document.activeElement!==ui.progress || !ui.progress.matches(':active')) {
        ui.progress.value=v.growthProgress;
        ui.progress.style.setProperty('--progress',v.growthProgress+'%');
      }
      ui.progress.setAttribute('aria-valuetext',v.growthProgress+'% grown, '+crop.stages[v.stage]);
      let line;
      if(ready) line='Ready to harvest!';
      else if(v.status==='missed') line=crop.verb+' overdue'+(v.lostProgress>0?' · '+v.lostProgress.toFixed(1)+'% progress lost':' · growth has stopped')+'.';
      else if(v.status==='available') line=crop.verb+' now · '+duration(bed.nextCareAt+5*Garden.minute-time)+' left in the care window.';
      else if(v.status==='approaching') line=crop.verb+' is due soon.';
      else if(bed.nextCareAt===null) line='Growing on its own · ready in '+duration(bed.growthDuration-v.growth)+'.';
      else line=crop.verb+' in '+duration(bed.nextCareAt-time)+'.';
      if(selected?.id===crop.id) {
        const action=document.querySelector('#care-action');
        document.querySelector('#care-icon').src=MatchaPantry.icon(crop.id==='strawberries'?'berries':crop.id);
        document.querySelector('#care-name').textContent=crop.name;
        document.querySelector('#care-stage').textContent=crop.stages[v.stage];
        document.querySelector('#care-message').textContent=line;
        panel.dataset.state=v.status;
        action.textContent=ready?'Harvest':crop.verb;
        action.setAttribute('aria-label',(ready?'Harvest ':crop.verb+' ')+crop.name);
        action.disabled=!(ready||care);
      }
      const previous=attention.get(crop.id);
      const loss=Math.floor(v.lostProgress);
      if(previous && ((care&&!previous.care) || loss>previous.loss)) announce(crop.name+': '+line);
      attention.set(crop.id,{care,loss});
    }
    document.body.classList.toggle('night',(state.minutes??480)<360||(state.minutes??480)>=1080);
  }
  for(const crop of Garden.crops) {
    createCard(crop);
    const item=document.createElement('div'),id=crop.id==='strawberries'?'berries':crop.id;
    item.id='pantry-'+crop.id;
    item.className='pantry-item';
    item.title=crop.name;
    item.innerHTML=`<img src="${MatchaPantry.icon(id)}" alt=""><span class="sr-only">${crop.name}: </span><span class="quantity"></span>`;
    document.querySelector('#pantry-items').append(item);
  }
  if(new URLSearchParams(location.search).get('from')==='counter') document.querySelector('matcha-exit').setAttribute('href','../counter/');
  change(()=>{});
  setInterval(refresh,1000);
  window.addEventListener('pageshow',refresh);
  window.addEventListener('storage',refresh);
  window.addEventListener('matcha-clock',refresh);
})();
