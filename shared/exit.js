class MatchaExit extends HTMLElement {
  connectedCallback() {
    const link=document.createElement('a');
    link.className='matcha-exit';
    link.href=this.getAttribute('href') || '../park/';
    link.setAttribute('aria-label',this.getAttribute('label') || 'Exit');
    link.innerHTML='<span aria-hidden="true">❮</span><span></span>';
    link.lastElementChild.textContent=this.getAttribute('label') || 'Exit';
    this.replaceChildren(link);
  }
  static get observedAttributes(){return ['href','label'];}
  attributeChangedCallback(){if(this.isConnected)this.connectedCallback();}
}
customElements.define('matcha-exit',MatchaExit);
