// Particles share the viewport coordinate system with the two HUD counters.
function drawGuide(source, target, label, color, coins = false) {
  const origin = source.getBoundingClientRect();
  const destination = target.getBoundingClientRect();
  const x = origin.left + origin.width / 2;
  const y = origin.top + origin.height / 2;
  const dx = destination.left + destination.width / 2 - x;
  const dy = destination.top + destination.height / 2 - y;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loss = label.startsWith('−');
  const chip = document.createElement('span');
  chip.className = 'rewardChip';
  chip.textContent = label;
  chip.style.setProperty('--accent', color);
  chip.style.left = (reduced ? x+dx : x) + 'px';
  chip.style.top = (reduced ? y+dy+28 : y+(coins?12:-20)) + 'px';
  document.body.append(chip);
  chip.animate([{opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.7},
    {opacity:0,transform:reduced?'none':'translate(-50%,-32px)'}],{duration:980}).onfinish=()=>chip.remove();
  if (reduced) return;
  const count = coins ? 7 : 4;
  for (let i=0;i<count;i++) {
    const particle = document.createElement('span');
    particle.className = coins ? 'rewardCoin' : 'rewardLeaf';
    particle.style.backgroundColor = color;
    particle.style.left = x+'px';
    particle.style.top = y+'px';
    document.body.append(particle);
    const spread = (i-(count-1)/2)*13;
    const poses = [
      {transform:'scale(.2)',opacity:0},
      {transform:'translate('+spread+'px,-22px) scale(1.15)',opacity:1,offset:.22},
      {transform:'translate('+(dx*.4+spread)+'px,'+(dy*.68-20)+'px) rotate(110deg)',opacity:1,offset:.64},
      {transform:'translate('+dx+'px,'+dy+'px) scale(.42) rotate(210deg)',opacity:.6}
    ];
    particle.animate(poses,{duration:610,delay:i*48,fill:'backwards',easing:'ease-in-out'}).onfinish=()=>{
      particle.remove();
      if(i===count-1) target.animate(loss ?
        [{translate:'0'},{translate:'-4px'},{translate:'3px'},{translate:'0'}] :
        [{scale:'1'},{scale:'1.11',offset:.32},{scale:'1'}],{duration:290});
    };
  }
}
