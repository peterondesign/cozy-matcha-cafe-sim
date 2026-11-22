(() => {
  const art = '../assets/garden/';
  const practice = new URLSearchParams(location.search).has('dev');
  const slot = practice ? 'practiceGarden' : 'gardenBeds';
  const views = new Map();
  const feedback = new Map();
  const games = new Map();
  const minute = Garden.minute;
  function latest() {
    const state=MatchaPantry.load();
    state[slot] ||= {};
    let legacy;
    try { legacy=JSON.parse(localStorage.getItem('matcha-garden-v2'))?.plants; } catch {}
    for(const crop of Garden.crops) {
      state[slot][crop.id] ||= Garden.initial(crop,Date.now(),legacy?.find(p=>p.id===crop.id));
    }
    return state;
  }
  async function change(fn) {
    function commit() {
      const state=latest();
      fn(state);
      localStorage.setItem(MatchaPantry.KEY,JSON.stringify(state));
      refresh();
    }
    if(navigator.locks) await navigator.locks.request('matcha-garden',commit);
    else commit();
  }
  function duration(ms) {
    const mins=Math.ceil(Math.max(ms,0)/minute);
    return mins===0?'now':mins<60?mins+'m':Math.floor(mins/60)+'h'+(mins%60?' '+mins%60+'m':'');
  }
  function announce(crop,line) {
    feedback.set(crop.id,{line,until:Date.now()+4000});
    document.querySelector('#notice').textContent=line;
    views.get(crop.id).article.animate([{filter:'brightness(1.09)'},{filter:'none'}],{duration:450});
  }
  function createCard(crop) {
    const article=document.createElement('article');
    const honey=crop.id==='honey';
    const img=(name)=>art+name+'.webp';
    const stages=crop.stages.map((stage,i)=>{
      const src=honey?'../park/goods/honey.png':img(crop.id+'-'+i);
      return '<li title="'+stage+'"><img src="'+src+'" alt="'+stage+'"></li>';
    }).join('');
    article.innerHTML=`<div class="identity" title="${crop.family}"><img src="${honey?'../park/goods/honey.png':img(crop.id)}" alt=""><h2>${crop.name}</h2></div>
      <div class="bed"><div class="talk"><img class="face" alt=""><p></p></div>
      <ol aria-label="Growth stages">${stages}</ol>
      <div class="meter" role="progressbar" aria-label="Growth" aria-valuemin="0" aria-valuemax="100"><i></i><b></b></div>
      <div class="controls"><span class="clock"><img alt=""><span></span></span><button class="act"><img alt=""><span></span></button></div>
      <div class="branches" hidden aria-label="Prune the highlighted tips"></div></div>`;
    document.querySelector(honey?'#apiary':'#beds').append(article);
    const q=s=>article.querySelector(s);
    const ui={article, face:q('.face'), line:q('.talk p'), stages:[...article.querySelectorAll('li')], meter:q('.meter'), fill:q('.meter i'), percent:q('.meter b'), clock:q('.clock span'), clockIcon:q('.clock img'), button:q('.act'), label:q('.act span'), icon:q('.act img'), branches:q('.branches')};
    views.set(crop.id,ui);
    ui.button.onclick=()=>{
      if(ui.button.dataset.action==='harvest') return change(state=>{
        const bed=state[slot][crop.id];
        if(Garden.inspect(bed,Date.now()).status!=='ready') return;
        if(!practice) {
          state.stock[crop.id==='strawberries'?'berries':crop.id]++;
          state.harvests=(state.harvests||0)+1;
        }
        state[slot][crop.id]=Garden.plant(crop,Date.now());
        announce(crop,practice?'Practice harvest complete.':crop.name+' added to the café pantry.');
      });
      if(games.has(crop.id)) return;
      if(crop.verb==='Water') {
        games.set(crop.id,'water');
        ui.button.classList.add('watering');
        refresh();
        setTimeout(()=>finish(crop),850);
      } else {
        games.set(crop.id,'prune');
        ui.branches.hidden=false;
        ui.branches.replaceChildren();
        for(let i=0;i<3;i++){
          const tip=document.createElement('button');
          tip.innerHTML='<img src="'+img('sprout')+'" alt="">';
          tip.setAttribute('aria-label','Snip tip '+(i+1));
          tip.onclick=()=>{tip.disabled=true;if(!ui.branches.querySelector('button:not(:disabled)'))finish(crop)};
          ui.branches.append(tip);
        }
        refresh();
        ui.branches.firstChild.focus();
      }
    };
  }
  function finish(crop) {
    const ui=views.get(crop.id);
    games.delete(crop.id);
    ui.branches.hidden=true;
    ui.button.classList.remove('watering');
    change(state=>{
      if(Garden.tend(state[slot][crop.id],Date.now())) announce(crop,crop.verb==='Water'?'Freshly watered!':'Three tips trimmed!');
    });
  }
  function refresh() {
    const state=latest(), time=Date.now();
    let readyCount=0, careCount=0;
    for(const crop of Garden.crops) {
      const ui=views.get(crop.id), bed=state[slot][crop.id], v=Garden.inspect(bed,time);
      const ready=v.status==='ready', missed=v.status==='missed';
      const care=['missed','available','approaching'].includes(v.status);
      const harvest=ready || (!care && (bed.nextCareAt===null || time+bed.growthDuration-v.growth<=bed.nextCareAt));
      const action=harvest?'Harvest':crop.verb;
      const icon=harvest?'basket':crop.verb==='Water'?'drop':'sprout';
      if(ready)readyCount++;
      if(care)careCount++;
      ui.article.dataset.state=v.status;
      const msg=feedback.get(crop.id);
      let line='The garden is looking good.';
      if(ready)line='Ready to harvest!';
      else if(missed)line='Oh no, I forgot to '+crop.verb.toLowerCase()+'!';
      else if(v.status==='available')line=crop.verb==='Water'?'Time for a drink!':'Time to prune the tips!';
      else if(v.status==='approaching')line='Care is due soon.';
      else if(v.growthProgress>=78)line='Almost ready to harvest!';
      if(games.get(crop.id)==='prune')line='Tap the three leaf tips.';
      ui.line.textContent=msg?.until>time?msg.line:line;
      ui.face.src=art+(care?'concerned':'happy')+'.webp';
      ui.face.alt=missed?'Sad gardener':care?'Concerned gardener':ready?'Excited gardener':'Happy gardener';
      ui.stages.forEach((el,i)=>el.toggleAttribute('aria-current',i===v.stage));
      ui.meter.setAttribute('aria-valuenow',v.growthProgress);
      ui.fill.style.width=v.growthProgress+'%';
      ui.percent.textContent=v.growthProgress+'%';
      ui.clockIcon.src=art+(harvest?'sprout':icon)+'.webp';
      ui.clock.textContent=ready?'Harvest now':missed?'Overdue '+duration(time-v.missedCareAt):v.status==='available'?action+' now':action+' in '+duration(harvest?bed.growthDuration-v.growth:bed.nextCareAt-time);
      ui.label.textContent=games.get(crop.id)==='water'?'Watering…':action;
      ui.icon.src=art+icon+'.webp';
      ui.button.dataset.action=harvest?'harvest':'care';
      ui.button.setAttribute('aria-label',action+' '+crop.name);
      ui.button.disabled=games.has(crop.id)||!(ready||care);
    }
    document.querySelector('#summary').textContent='Day '+(state.day||1)+' · '+state.coins+' coins · '+(4-readyCount-careCount)+' healthy · '+careCount+' need care · '+readyCount+' ready';
    document.body.classList.toggle('night',(state.minutes??480)<360||(state.minutes??480)>=1080);
  }
  Garden.crops.forEach(createCard);
  if(practice) {
    const dev=document.querySelector('#dev');
    dev.hidden=false;
    for(const mode of ['Healthy','Approaching','Available','Missed','Ready']) {
      const btn=document.createElement('button');
      btn.textContent=mode;
      btn.onclick=()=>change(state=>Garden.crops.forEach(c=>{
        const bed=Garden.plant(c,Date.now(),mode==='Ready'?1:.5);
        if(c.interval)bed.nextCareAt+=({Healthy:20,Approaching:3,Available:-1,Missed:-17,Ready:20}[mode]-c.interval)*minute;
        state[slot][c.id]=bed;
      }));
      dev.append(btn);
    }
  }
  const leave=document.querySelector('#leave');
  if(new URLSearchParams(location.search).get('from')==='counter')leave.href='../../counter/';
  change(()=>{});
  setInterval(refresh,1000);
  window.addEventListener('pageshow',refresh);
  window.addEventListener('storage',refresh);
})();
