// Eye-level plates for the three seats that have a painted view. People walk the paths in the picture.
window.openSeatView=function(seat,actors){
  const views={
    'Picnic mat':{
      day:'assets/pov/picnic-mat.jpeg',night:'assets/pov/picnic-mat-night.jpeg',
      paths:[
        [[.50,.34],[.50,.44],[.50,.54],[.50,.64]],
        [[.47,.50],[.30,.55],[.12,.59]],
        [[.53,.50],[.72,.55],[.90,.59]]
      ]
    },
    'Yoga mat':{
      day:'assets/pov/yoga-mat.jpeg',night:'assets/pov/yoga-mat-night.jpeg',
      paths:[
        [[.40,.50],[.38,.44],[.36,.36]],
        [[.42,.52],[.24,.56],[.08,.58]],
        [[.52,.52],[.72,.58],[.88,.63]]
      ]
    },
    'Plaza bench':{
      day:'assets/pov/plaza-seat.jpg',night:'assets/pov/plaza-seat-night.jpg',
      paths:[
        [[.52,.36],[.49,.48],[.46,.60],[.42,.74]],
        [[.44,.46],[.26,.50],[.12,.54]],
        [[.56,.42],[.72,.40],[.84,.38]]
      ]
    }
  };
  const view=views[seat.name]||views['Plaza bench'];
  const night=['night','dusk'].includes(document.body.dataset.daylight);
  const modal=document.createElement('dialog');
  modal.className='seat-pov';
  modal.setAttribute('aria-label','Seated village view');
  modal.innerHTML='<canvas></canvas><nav><button aria-label="Look left">←</button><button>Back to village</button><button aria-label="Look right">→</button></nav>';
  document.body.append(modal);
  modal.showModal();
  const canvas=modal.querySelector('canvas'),ctx=canvas.getContext('2d');
  const plate=new Image();
  let yaw=0, drag, failed=false, frame;
  plate.onload=draw;
  plate.onerror=()=>{failed=true;draw()};
  plate.src=night?view.night:view.day;
  function along(path,t){
    const n=path.length-1, f=Math.max(0,Math.min(.999,t))*n, i=Math.floor(f), u=f-i;
    const a=path[i], b=path[Math.min(n,i+1)];
    return [a[0]+(b[0]-a[0])*u, a[1]+(b[1]-a[1])*u];
  }
  function draw(){
    if(!modal.open)return;
    const w=modal.clientWidth,h=modal.clientHeight;
    const ratio=Math.min(devicePixelRatio||1,2);
    if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){
      canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
    }
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    if(failed||!plate.naturalWidth){ctx.fillStyle='#c9d7a4';ctx.fillRect(0,0,w,h);return}
    const scale=Math.max(w/plate.naturalWidth,h/plate.naturalHeight);
    const dw=plate.naturalWidth*scale, dh=plate.naturalHeight*scale;
    const ox=(w-dw)/2-Math.sin(yaw)*w*.06, oy=(h-dh)/2;
    ctx.drawImage(plate,ox,oy,dw,dh);
    const placed=[];
    for(const actor of actors){
      if(actor.away||!actor.sprite)continue;
      const dx=actor.position[0]-seat.anchor[0], dy=(actor.position[1]-seat.anchor[1])*1.35;
      const dist=Math.hypot(dx,dy);
      if(dist<28||dist>640)continue;
      const near=1-Math.min(1,dist/560);
      const branch=Math.abs(dx)<70?0:dx<0?1:2;
      const [nx,ny]=along(view.paths[branch],.12+near*.82);
      const size=h*(.045+near*.2);
      placed.push({actor,x:ox+nx*dw,y:oy+ny*dh,size,near});
    }
    for(const spot of placed.sort((a,b)=>a.near-b.near)){
      ctx.fillStyle='rgba(40,48,28,.28)';
      ctx.beginPath();ctx.ellipse(spot.x,spot.y+spot.size*.04,spot.size*.28,spot.size*.08,0,0,Math.PI*2);ctx.fill();
      ctx.drawImage(spot.actor.sprite.canvas,spot.x-spot.size*.42,spot.y-spot.size*.92,spot.size*.84,spot.size);
    }
  }
  const turn=d=>{yaw=Math.max(-.8,Math.min(.8,yaw+d));draw()};
  modal.querySelector('nav').onclick=e=>{
    const buttons=[...modal.querySelectorAll('button')],i=buttons.indexOf(e.target);
    if(i===1)modal.close();else if(i>=0)turn(i===0?-.28:.28);
  };
  modal.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();turn(e.key==='ArrowLeft'?-.16:.16)}};
  canvas.onpointerdown=e=>{drag=e.clientX;canvas.setPointerCapture(e.pointerId)};
  canvas.onpointermove=e=>{if(drag!=null){turn((e.clientX-drag)*.003);drag=e.clientX}};
  canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
  addEventListener('resize',draw);
  modal.onclose=()=>{cancelAnimationFrame(frame);removeEventListener('resize',draw);modal.remove()};
  function animate(){draw();frame=requestAnimationFrame(animate)}
  animate();
};
