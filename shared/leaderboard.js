(() => {
  const ID_KEY = 'matchaPlayerId';
  const config = () => window.MATCHA_SUPABASE || {};
  const enabled = () => Boolean(config().url && config().anonKey);

  // Optional, gitignored config. Missing file means local-only mode.
  const configScript = document.createElement('script');
  configScript.src = new URL('supabase-config.js', document.currentScript.src).href;
  configScript.onerror = () => {};
  document.head.appendChild(configScript);

  function playerId() {
    let id = localStorage.getItem(ID_KEY);
    if (id && /^[a-z]+-[a-z]+-[0-9]{2}$/.test(id)) return id;
    const first = ['mint','mochi','moss','peach','cloud','honey','bamboo','matcha','sakura','vanilla','cocoa','berry','olive','daisy','juniper','taro'];
    const second = ['sprout','whisk','tea','cup','frog','leaf','kettle','bunny','blossom','panda','meadow','muffin','lantern','garden','picnic','button'];
    const randomIndex = max => crypto.getRandomValues
      ? crypto.getRandomValues(new Uint32Array(1))[0] % max
      : Math.floor(Math.random() * max);
    id = `${first[randomIndex(first.length)]}-${second[randomIndex(second.length)]}-${String(randomIndex(100)).padStart(2,'0')}`;
    localStorage.setItem(ID_KEY, id);
    return id;
  }

  function headers(extra = {}) {
    return {
      apikey: config().anonKey,
      Authorization: `Bearer ${config().anonKey}`,
      'Content-Type': 'application/json',
      ...extra
    };
  }

  async function request(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async function push(stats) {
    if (!enabled()) return false;
    const row = {
      player_id: playerId(),
      display_name: String(stats.display_name || 'Player').slice(0, 24),
      avatar: Number(stats.avatar) || 1,
      day: Number(stats.day) || 1,
      served: Number(stats.served) || 0,
      coins: Number(stats.coins) || 0,
      gems: Number(stats.gems) || 0,
      state: stats.state && typeof stats.state === 'object' ? stats.state : {},
      updated_at: new Date().toISOString()
    };
    const response = await request(`${config().url}/rest/v1/matcha_saves?on_conflict=player_id`, {
      method: 'POST',
      headers: headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify(row)
    });
    if (!response.ok) {
      let detail = '';
      try { detail = await response.text(); } catch (error) {}
      console.warn('Cloud save rejected.', { status: response.status, detail });
      return false;
    }
    return response.ok;
  }

  async function pull(code) {
    if (!enabled()) throw new Error('Cloud sync is offline.');
    const response = await request(`${config().url}/rest/v1/matcha_saves?player_id=eq.${encodeURIComponent(code)}&select=*`, {
      headers: headers()
    });
    if (!response.ok) throw new Error(`Sync request failed: ${response.status}`);
    const rows = await response.json();
    return rows[0] || null;
  }

  function setPlayerId(id) {
    localStorage.setItem(ID_KEY, id);
  }

  async function top() {
    if (!enabled()) return null;
    const response = await request(`${config().url}/rest/v1/matcha_leaderboard?select=*&order=served.desc&limit=20`, {
      headers: headers()
    });
    if (!response.ok) throw new Error(`Leaderboard request failed: ${response.status}`);
    return response.json();
  }

  window.MatchaLeaderboard = { enabled, playerId, setPlayerId, push, pull, top };
})();
