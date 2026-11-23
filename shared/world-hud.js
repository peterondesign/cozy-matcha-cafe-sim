const worldHudUrl = document.currentScript?.src;

class MatchaHud extends HTMLElement {
  connectedCallback() {
    const scriptUrl = worldHudUrl || this.getAttribute('script-url') || location.href;
    const root = new URL('../counter/ui/', scriptUrl);
    const fields = [['coin','coins','coinCount'],['smile','satisfaction','smileCount'],['day','day','dayCount'],['time','time','timeCount']];
    this.className='top-hud';
    const labels={coin:'Coins',smile:'Customer satisfaction',day:'Day',time:'Time'};
    this.innerHTML=fields.map(([type,icon,id])=>`<div class="pill ${type}" title="${labels[type]}"><img alt="${labels[type]}" src="${new URL(icon+'.png',root)}"><b id="${id}"></b></div>`).join('');
    if (location.pathname.includes('/counter')) {
      const park=document.createElement('a');
      park.className='park-go';
      park.style.right='calc(2.2% + 80px)';
      park.href=new URL('../park/', scriptUrl).href;
      park.textContent='Park';
      this.append(park);
      const garden=document.createElement('a');
      garden.className='park-go';
      garden.href=new URL('../garden/', scriptUrl).href;
      garden.textContent='Garden';
      this.append(garden);
    }
    this.refresh();
    this.update=()=>this.refresh();
    window.addEventListener('pageshow',this.update);
    window.addEventListener('storage',this.update);
    window.addEventListener('matcha-stock',this.update);
  }
  disconnectedCallback(){window.removeEventListener('pageshow',this.update);window.removeEventListener('storage',this.update);window.removeEventListener('matcha-stock',this.update)}
  refresh(){
    const s=JSON.parse(localStorage.getItem('matchaVisualState')||'{}'),m=s.minutes??480,h=Math.floor(m/60)%24;
    const values=[(s.coins??120).toLocaleString('en-US'),s.satisfaction??82,s.day??1,(h%12||12)+':'+String(m%60).padStart(2,'0')+' '+(h>=12?'PM':'AM')];
    this.querySelectorAll('b').forEach((b,i)=>b.textContent=values[i]);
  }
}
customElements.define('matcha-hud',MatchaHud);
