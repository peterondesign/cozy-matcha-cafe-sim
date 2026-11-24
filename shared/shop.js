(() => {
  const KEY = 'matchaShopState';
  const SIZES = [
    {id: 'small', name: 'Small Café', price: 0},
    {id: 'medium', name: 'Medium Café', price: 120},
    {id: 'large', name: 'Large Café', price: 280}
  ];
  const DECOR = [
    {id: 's', name: 'S · Seating & Comfort', price: 40},
    {id: 'l', name: 'L · Lighting & Signage', price: 80},
    {id: 'g', name: 'G · Greenery, Shade & Accents', price: 120}
  ];
  const oldSizes = {cart:'small', stall:'medium', pavilion:'large', kiosk:'large'};
  const oldDecor = {seating:'s', lantern:'l', lights:'l', planter:'g'};
  function read() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch (error) { console.warn('Café selection could not be read.', error); saved = {}; }
    const size = oldSizes[saved.selected] || saved.selected;
    const selected = SIZES.some(item => item.id === size) ? size : 'small';
    const unlocked = new Set(['small']);
    for (const id of Array.isArray(saved.unlocked) ? saved.unlocked : []) {
      const mapped = oldSizes[id] || id;
      if (SIZES.some(item => item.id === mapped)) unlocked.add(mapped);
    }
    unlocked.add(selected);
    const normalizeDecor = list => [...new Set((Array.isArray(list) ? list : [])
      .map(id => oldDecor[id] || id).filter(id => DECOR.some(item => item.id === id)))];
    const decor = normalizeDecor(saved.decor);
    const active = normalizeDecor(Array.isArray(saved.activeDecor) ? saved.activeDecor : decor)
      .filter(id => decor.includes(id));
    return {...saved, selected, unlocked:[...unlocked], decor, activeDecor:active};
  }
  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('matcha-shop'));
  }
  function variant(active) {
    return DECOR.map(item => item.id).filter(id => active.includes(id)).join('') || 'none';
  }
  function asset(size, active) {
    if (!SIZES.some(item => item.id === size)) throw new Error(`Unknown café size: ${size}`);
    return `../menu/layers/shop/cafes/${size}-${variant(active)}.png`;
  }
  window.MatchaShop = {KEY, SIZES, DECOR, read, save, variant, asset};
})();
