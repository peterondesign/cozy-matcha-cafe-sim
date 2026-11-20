// A change of direction counts as a whisk stroke. Space and taps provide the same action.
const whiskPad=document.querySelector('#interaction');
let sweep=null;
function startWhisk(){
  state.whisking=true;
  state.whiskTime=0;
  state.whiskStrokes=0;
  state.lastStroke=null;
  state.strokeQuality=0;
  state.whiskOffset=0;
  sweep=null;
  whiskPad.dataset.tool='whisk';
  $('#interactionTitle').textContent='Whisk a fine foam';
  $('#interactionSub').textContent='Sweep across the bowl or tap Space. Follow the green rhythm guide.';
  $('#meter').style.display='block';
  $('#arcShell').classList.remove('show');
  $('#targetCaption').innerHTML='<span>steady</span><span>whisk in the green</span><span>steady</span>';
  whiskPad.classList.add('show');
  setStatus('Follow the slider, then whisk');
  updateUI();
  requestAnimationFrame(guideWhisk);
}
function guideWhisk(now){
  if(!state.whisking)return;
  state.whiskGuide=(Math.sin(now/340)+1)/2;
  $('#meterNeedle').style.left=(state.whiskGuide*100)+'%';
  requestAnimationFrame(guideWhisk);
}
function whiskStroke(){
  if(!state.whisking||state.phase!=='play'||document.querySelector('dialog[open]'))return;
  const now=performance.now();
  const gap=state.lastStroke===null?240:now-state.lastStroke;
  if(gap<70)return;
  state.lastStroke=now;
  state.whiskStrokes++;
  const onMark=state.whiskGuide>=.67&&state.whiskGuide<=.74;
  state.strokeQuality+=onMark?100:gap>=110&&gap<=620?70:48;
  state.whiskOffset=state.whiskStrokes%2?1:-1;
  $('#targetCaption').innerHTML='<span>'+state.whiskStrokes+' / 8</span><span>whisk in the green</span><span>steady</span>';
  if(state.whiskStrokes<8){if(matchMedia('(prefers-reduced-motion: reduce)').matches)updateCounter(state);return;}
  state.whisking=false;
  sweep=null;
  whiskPad.classList.remove('show');
  state.step++;
  updateQuality(state.strokeQuality/8,$('#counterBowl'));
  setStatus('Fine foam is ready','good');
  say('Lift the whisk gently to leave the foam intact.');
  updateUI();savePantry();
}
for(const pad of [whiskPad,document.querySelector('#counterBowl')]){
  pad.addEventListener('pointerdown',e=>{
    if(!state.whisking||sweep)return;
    e.preventDefault();pad.setPointerCapture(e.pointerId);
    sweep={id:e.pointerId,x:e.clientX,extreme:e.clientX,direction:0,moved:false};
  });
  pad.addEventListener('pointermove',e=>{
    if(!state.whisking||sweep?.id!==e.pointerId)return;
    const dx=e.clientX-sweep.extreme;
    if(sweep.direction===1&&dx>0 || sweep.direction===-1&&dx<0)sweep.extreme=e.clientX;
    else if(Math.abs(dx)>=12){
      sweep.direction=Math.sign(dx);sweep.extreme=e.clientX;sweep.moved=true;
      whiskStroke();
    }
  });
  pad.addEventListener('pointerup',e=>{
    if(sweep?.id!==e.pointerId)return;
    const tapped=!sweep.moved;
    sweep=null;
    if(tapped)whiskStroke();
  });
  pad.addEventListener('pointercancel',()=>{sweep=null});
}
