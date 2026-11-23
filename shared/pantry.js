// Shared stock for the counter, the grocer, and the pause menu.
const MatchaPantry = (() => {
  const KEY = 'matchaVisualState';
  const ITEMS = [
    ['matcha', 'Matcha powder', 12, 4],
    ['berries', 'Strawberries', 5, 3],
    ['oat', 'Oat milk', 5, 3],
    ['milk', 'Regular milk', 10, 2],
    ['ice', 'Ice', 6, 1],
    ['water', 'Water', 12, 1],
    ['syrup', 'Sugar syrup', 4, 2],
    ['vanilla', 'Vanilla extract', 3, 4],
    ['blueberries', 'Blueberries', 4, 3],
    ['coconut', 'Coconut milk', 4, 3],
    ['tea-leaves', 'Tea leaves', 4, 3],
    ['pineapple', 'Pineapple', 4, 3],
    ['banana', 'Banana', 4, 3],
    ['honey', 'Honey', 4, 3],
    ['peach', 'Peach', 4, 3],
    ['watermelon', 'Watermelon', 3, 3],
    ['mango', 'Mango', 4, 3],
    ['fresh-coconut', 'Fresh coconut', 3, 3],
    ['juice', 'Juice', 4, 3]
  ];
  const LOW = 3;
  const FULL_STOCK = 20;
  const byId = Object.fromEntries(ITEMS.map(item => [item[0], item]));

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
    catch { return {}; }
  }
  function write(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('matcha-stock'));
  }
  function ensure(state) {
    state.stock = state.stock || {};
    for (const [id, , initial] of ITEMS) {
      const qty = state.stock[id];
      state.stock[id] = Number.isInteger(qty) ? Math.max(0, qty) : initial;
    }
    if (!Number.isFinite(state.coins)) state.coins = 120;
    return state;
  }
  function load() { return ensure(read()); }
  function qty(id) { return load().stock[id] || 0; }
  function item(id) { return byId[id]; }
  function consume(id) {
    const state = load();
    if (!byId[id] || state.stock[id] < 1) return state.stock[id] || 0;
    state.stock[id] -= 1;
    write(state);
    return state.stock[id];
  }
  function buy(lines, cost) {
    const state = load();
    if (cost > state.coins) return false;
    state.coins -= cost;
    for (const [id, count] of lines) state.stock[id] = (state.stock[id] || 0) + count;
    write(state);
    return true;
  }
  function icon(id) {
    return location.pathname.includes('/park/') ? `goods/${id}.png` : `../park/goods/${id}.png`;
  }
  return { ITEMS, LOW, FULL_STOCK, KEY, load, qty, item, consume, buy, icon };
})();
