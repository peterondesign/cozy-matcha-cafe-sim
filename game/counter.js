// The contents are derived from the actual completed steps. Reopening the cart redraws the same drink.
const utensils=Object.fromEntries(['chawan','chasen','kettle','sieve'].map(name=>{
  const image=new Image();
  image.src='assets/tools/'+name+'.webp';
  image.onload=()=>{if(window.__game)updateCounter(state)};
  return [name,image];
}));
const milkBottle=document.createElement('canvas');
const milkSource=new Image();
milkSource.onload=()=>{
  const w=milkSource.naturalWidth,h=milkSource.naturalHeight;
  milkBottle.width=w;milkBottle.height=h;
  const ctx=milkBottle.getContext('2d');
  ctx.drawImage(milkSource,0,0);
  const pixels=ctx.getImageData(0,0,w,h), data=pixels.data;
  for(let i=0;i<data.length;i+=4){
    const [r,g,b]=[data[i],data[i+1],data[i+2]];
    if(r>214&&g>196&&b>160&&r-b<80)data[i+3]=0;
  }
  ctx.putImageData(pixels,0,0);
  if(window.__game)updateCounter(state);
};
milkSource.src='assets/pantry/milk.jpg';
const oatCarton=new Image();
oatCarton.onload=()=>{if(window.__game)updateCounter(state)};
oatCarton.src='assets/tools/oat-pour.webp';
let brewStarted=-10000,brewStep=null,brewFrame=0;
window.brewMotion=step=>{brewStarted=performance.now();brewStep=step};
function ellipse(ctx,x,y,rx,ry,fill){
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
}
function wash(ctx,x,y,endX,endY,colors){
  const g=ctx.createLinearGradient(x,y,endX,endY);
  colors.forEach((color,i)=>g.addColorStop(i/(colors.length-1),color));return g;
}
function utensil(ctx,name,x,y,w,h){
  const img=utensils[name];if(img.complete&&img.naturalWidth)ctx.drawImage(img,x,y,w,h);
}
function stream(ctx,x,y,tx,ty,color,width){
  ctx.save();
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo((x+tx)*.5-10,(y+ty)*.5,tx,ty);ctx.stroke();
  ctx.restore();
}
function paintPour(ctx,kind,age,surface){
  const tilt=Math.min(1,age/.32);
  const mouthY=Math.max(86,Math.min(surface-8,210));
  if(kind==='oat'&&oatCarton.complete&&oatCarton.naturalWidth){
    const w=248,h=w*oatCarton.naturalHeight/oatCarton.naturalWidth;
    const tx=236,ty=Math.max(150,surface-6);
    ctx.drawImage(oatCarton,tx-.996*w,ty-.999*h,w,h);
    return;
  }
  ctx.save();
  ctx.translate(150,mouthY);
  ctx.rotate(kind==='milk'?1.15+tilt*.45:.35+tilt*.4);
  if(kind==='milk'&&milkBottle.width)ctx.drawImage(milkBottle,-54,0,108,156);
  else if(kind==='honey'){
    ctx.rotate(-.9);
    ctx.fillStyle='#e7b44a';ctx.strokeStyle='#a56b22';ctx.lineWidth=3;
    ctx.beginPath();ctx.roundRect(-22,-78,40,78,10);ctx.fill();ctx.stroke();
    ctx.fillStyle='#f6e7b0';ctx.fillRect(-14,-90,24,16);
  }else{
    ctx.fillStyle='#f6f3ea';ctx.strokeStyle='#b7c4a4';ctx.lineWidth=3;
    ctx.beginPath();ctx.roundRect(-108,-16,108,64,6);ctx.fill();ctx.stroke();
    ctx.fillStyle='#5f7d49';ctx.font='700 16px Georgia,serif';ctx.fillText('coco',-92,22);
    ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(22,8);ctx.lineTo(-4,14);ctx.closePath();ctx.fill();ctx.stroke();
  }
  ctx.restore();
  const color=kind==='honey'?'#e2b15a':kind==='coconut'?'#f7f3ea':'#fff6e2';
  stream(ctx,150,mouthY,210,surface,color,(kind==='honey'?6:10)+3*Math.sin(age*8));
}
function paintBowl(ctx,steps,state,now,age,reduced){
  const has=icon=>steps.some(s=>s.icon===icon);
  const water=has('hotwater');
  const whisked=has('whisk');
  const pouring=brewStep?.icon==='hotwater'&&age<1.1&&!reduced;
  const sifting=brewStep?.icon==='powder'&&age<1.1&&!reduced;
  ellipse(ctx,212,344,143,12,'#5037203b');
  utensil(ctx,'chawan',51,91,318,254);
  ctx.save();
  ctx.beginPath();ctx.ellipse(209,137,146,40,0,0,2*Math.PI);ctx.clip();
  if(has('powder')){
    if(water){
      const fill=pouring?Math.min(1,.2+age):1;
      ellipse(ctx,210,151,114+29*fill,19+14*fill,wash(ctx,87,119,311,174,['#556d2d','#8eab43','#779138']));
      const foam=state.whisking?(state.whiskStrokes||0)/8:whisked?1:0;
      for(let i=0;i<Math.round(foam*180);i++){
        const a=i*2.39996,r=Math.sqrt((i+.5)/181);
        const theta=a+(reduced?0:Math.sin(now*.002-i*.01)*.028);
        ellipse(ctx,210+Math.cos(theta)*132*r,150+Math.sin(theta)*30*r,1.1+i%4,.6+(i%4)*.37,i%4?'#c9d78d99':'#f0ecc1ad');
      }
    }else{
      const spread=sifting?Math.min(1,age+.25):1;
      ellipse(ctx,212,168,96*spread,22*spread,'#869a40');
      for(let i=0;i<220;i++){
        const a=i*2.4,r=Math.sqrt(i/220);
        ellipse(ctx,212+Math.cos(a)*98*r*spread,166+Math.sin(a)*22*r*spread,2.6,1.5,i%2?'#627e35':'#adba63');
      }
    }
  }
  ctx.restore();
  if(sifting){
    const shake=8*Math.sin(age*32);
    utensil(ctx,'sieve',70+shake,2,280,128);
    for(let i=0;i<90;i++){
      const t=(age*1.8+i*.37)%1;
      ellipse(ctx,210+Math.sin(i*5.3)*48+shake*(1-t),108+t*t*70,2.1,1.5,'#829743');
    }
  }
  if(pouring){
    const tilt=Math.min(1,age/.28);
    ctx.save();ctx.translate(214,132);ctx.rotate(.62+tilt*.12);utensil(ctx,'kettle',-112,-44,124,124);ctx.restore();
    stream(ctx,214,132,204,158,'rgba(236,246,216,.92)',6+4*Math.sin(age/1.1*Math.PI));
  }
  if(state.whisking){
    const elapsed=Math.max(0,now-(state.lastStroke??now));
    const swing=reduced?0:(state.whiskOffset||0)*Math.exp(-elapsed/125);
    ctx.save();ctx.translate(210+30*swing,16);ctx.rotate(swing*.22);
    utensil(ctx,'chasen',-34,0,68,158);ctx.restore();
    const done=Math.min(1,(state.whiskStrokes||0)/8);
    ctx.save();ctx.translate(312,108);ctx.lineCap='round';ctx.lineWidth=8;
    ctx.strokeStyle='#e6d7b8';ctx.beginPath();ctx.arc(0,0,24,-Math.PI/2,Math.PI*1.5);ctx.stroke();
    ctx.strokeStyle='#7d9448';ctx.beginPath();ctx.arc(0,0,24,-Math.PI/2,-Math.PI/2+Math.max(.02,done)*Math.PI*2);ctx.stroke();
    ctx.fillStyle='#3c4a2b';ctx.font='700 14px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(String(state.whiskStrokes||0),0,1);ctx.restore();
  }
  if(water&&!reduced){
    for(let i=0;i<4;i++){
      const t=(now*.0005+i*.25)%1;
      ctx.strokeStyle='rgba(255,251,229,'+(.44*(1-t))+')';ctx.lineWidth=2.7;
      const x=150+i*36+Math.sin(now*.001+i)*5;
      ctx.beginPath();ctx.moveTo(x,132-t*76);ctx.bezierCurveTo(x+12,120-t*78,x-9,112-t*80,x+3,98-t*82);ctx.stroke();
    }
  }
}
function paintGlass(ctx,steps,state,age,reduced){
  ellipse(ctx,212,344,100,11,'#49332238');
  const body=new Path2D();
  body.moveTo(104,85);body.lineTo(122,321);body.bezierCurveTo(123,348,294,348,298,321);body.lineTo(316,85);body.closePath();
  ctx.fillStyle=wash(ctx,104,0,316,0,['#d6e8d5aa','#faffec99','#b4c5af77','#fff9debb']);ctx.fill(body);
  ctx.save();ctx.clip(body);
  let surface=323;
  function layer(height,colors){
    const next=surface-height;
    ctx.fillStyle=wash(ctx,0,next,0,surface+1,colors);ctx.fillRect(90,next,240,height+2);
    ellipse(ctx,210,next,108,10,colors[0]);surface=next;
  }
  for(const step of steps){
    const t=step===brewStep&&!reduced?Math.min(1,age/.8):1;
    if(step.ingredient==='berries')layer(32*t,['#e18a88','#b95360']);
    if(step.ingredient==='blueberries')layer(32*t,['#967695','#584468']);
    if(step.icon==='milk')layer(129*t,step.ingredient==='oat'?['#f4e2bd','#e8d1a4']:['#fff4dc','#e7ddc2']);
    if(step.gauge==='precision')layer(48,['#94ad56','#77973c','#b5c181']);
  }
  if(state.precisionPhase==='arc'&&state.arcProgress>0){
    layer(48*Math.min(1,state.arcProgress/.76),['#a0b766','#789442','#aabb72']);
    if(state.arcHolding&&!reduced){ctx.fillStyle='#879f4b';ctx.fillRect(203,76,6,state.arcProgress*12+surface-76)}
  }
  if(steps.some(step=>step.icon==='ice')){
    for(let i=0;i<4;i++){
      const time=Math.max(0,age-i*.07);
      const fall=brewStep?.icon==='ice'&&!reduced?Math.max(0,183-870*time*time):0;
      const bob=reduced?0:Math.sin(age*15+i)*7*Math.exp(-age*3);
      ctx.save();ctx.translate(149+i*39,Math.min(292,surface+11)+(i%2)*12-fall+bob);
      ctx.rotate(i*.48);ctx.fillStyle='#e4f7eabb';ctx.strokeStyle='#fff8dfdd';ctx.lineWidth=2;
      ctx.beginPath();ctx.roundRect(-19,-15,36,32,7);ctx.fill();ctx.stroke();ctx.restore();
    }
  }
  ctx.fillStyle='#fffc';ctx.fillRect(130,107,3,193);ctx.fillStyle='#fff6';ctx.fillRect(139,109,6,165);
  ctx.restore();
  ctx.strokeStyle='#dcdfc7';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(210,85,106,14,0,0,Math.PI*2);ctx.stroke();
  if(!reduced&&age<1.15){
    if(brewStep?.icon==='milk')paintPour(ctx,brewStep.ingredient==='oat'?'oat':brewStep.ingredient==='coconut'?'coconut':'milk',age,surface);
    else if(brewStep?.ingredient==='honey')paintPour(ctx,'honey',age,surface);
  }
  const layering=!reduced&&brewStep?.gauge==='precision'&&state.recipeKey!=='hot'&&(state.precisionPhase||age<1.3);
  if(layering){
    const flow=state.precisionPhase==='arc'?Math.min(1,(state.arcProgress||0)/.76):state.precisionPhase==='line'?.4:Math.min(1,age);
    stream(ctx,4,42,214,Math.min(surface+10,310),'#5f7d2e',14);
  }
}
function updateCounter(state){
  cancelAnimationFrame(brewFrame);
  const steps=recipes[state.recipeKey].steps.slice(0,state.step);
  const active=state.phase==='play'||state.phase==='win'&&document.body.dataset.service==='serving';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function vessel(id,visible){
    const slot=document.getElementById(id);slot.hidden=!visible;
    if(!visible)return null;
    let canvas=slot.querySelector('canvas');
    if(!canvas){
      canvas=document.createElement('canvas');canvas.width=420;canvas.height=380;
      canvas.style.cssText='display:block;width:100%;height:auto';slot.replaceChildren(canvas);
    }
    return canvas.getContext('2d');
  }
  const glass=vessel('counterGlass',active&&steps.some(s=>s.icon==='glass'));
  const bowl=vessel('counterBowl',active&&(state.recipeKey==='hot'||state.phase==='play'&&steps.some(s=>s.icon==='powder')));
  if(!bowl&&!glass)return;
  function paint(now){
    if(document.hidden||document.querySelector('dialog[open]')){brewFrame=requestAnimationFrame(paint);return}
    const age=(now-brewStarted)/1000;
    if(bowl){bowl.clearRect(0,0,420,380);paintBowl(bowl,steps,state,now,age,reduced)}
    if(glass){glass.clearRect(0,0,420,380);paintGlass(glass,steps,state,age,reduced)}
    if(!reduced&&(age<1.6||state.whisking||state.precisionPhase||brewStep&&age<1.4))brewFrame=requestAnimationFrame(paint);
  }
  paint(performance.now());
}
