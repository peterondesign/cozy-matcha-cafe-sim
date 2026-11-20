window.createVillageClock=function createVillageClock(state) {
  const preview=new URLSearchParams(location.search).get('hour');
  let minutes=preview!==null && Number.isFinite(Number(preview)) ? Math.max(0,Math.min(23.99,Number(preview)))*60 : 570;
  window.matchaClock={get:()=>minutes,set(value){if(Number.isFinite(value)&&value>=0)minutes=value;}};
  let lastMinute=-1,previousCoins=-1,previousServed=-1,lastRating=-1;
  const hud=document.querySelector('.village-hud');
  const timeLabel=hud.querySelector('time');
  const coins=hud.querySelector('.village-coins b');
  const rating=hud.querySelector('.village-rating');
  const phases=[
    [0,.66,.83,1.05],[5,.70,.87,.95],[6,.91,1.12,.49],[8,1,1.12,.18],
    [16,1,1.12,.18],[18,.94,1.26,.47],[19,.81,1.12,.85],[20.5,.66,.83,1.05],[24,.66,.83,1.05]
  ];
  return dt=>{
    minutes+=dt*3;
    const minute=Math.floor(minutes);
    if (lastMinute===minute && previousCoins===state.coins && previousServed===state.served && lastRating===state.satisfaction) return;
    lastRating=state.satisfaction; lastMinute=minute; previousCoins=state.coins; previousServed=state.served;
    const hour=minute%1440/60;
    const end=phases.findIndex(row=>row[0]>hour);
    const a=phases[end-1],b=phases[end],t=(hour-a[0])/(b[0]-a[0]);
    const mix=i=>a[i]+(b[i]-a[i])*t;
    const phase=hour<5||hour>=20.5?'night':hour<8?'sunrise':hour<16?'day':hour<18.7?'sunset':'dusk';
    document.body.dataset.daylight=phase;
    const style=document.body.style;
    style.setProperty('--evening-mix',Math.min(1,Math.max(0,(mix(3)-.22)/.77)));
    style.setProperty('--day-bright',mix(1));
    style.setProperty('--day-sat',mix(2));
    style.setProperty('--lamp-power',Math.min(1,mix(3)));
    style.setProperty('--sky-wash',phase==='night'?'#354780':phase==='dusk'?'#995e8f':phase==='sunrise'||phase==='sunset'?'#ffae68':'#ffe6aa');
    const day=String(1+Math.floor(minute/1440)).padStart(2,'0');
    const clock=`${Math.floor(hour)%12||12}:${String(minute%60).padStart(2,'0')} ${hour<12?'AM':'PM'}`;
    const icon=phase==='night'?'☾':phase==='day'?'☀':'◒';
    const label=`${icon}  DAY ${day}  ·  ${clock}`;
    timeLabel.textContent=label;
    document.querySelector('.dayTime').textContent=label;
    coins.textContent=state.coins;
    const satisfaction=Math.round(Number.isFinite(state.satisfaction)?state.satisfaction:80);
    const text='Customer satisfaction · '+(satisfaction===null?'—':satisfaction+'%');
    const level='Level '+state.level;
    hud.querySelector('.village-level').textContent=level;
    const counterLevel=document.querySelector('.brandWords small');
    if(counterLevel) counterLevel.textContent='MatchaMika · '+level;
    rating.textContent=text;
    document.querySelector('.counter-satisfaction').textContent=text;
    hud.querySelector('meter').max=100;hud.querySelector('meter').value=state.satisfaction;
  };
};
