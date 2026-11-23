export function resolveSprite(manifest, action, character, seen = new Set()) {
  const entry = manifest?.[action]?.[character];
  if (!entry) {
    if (action !== 'walk_left') return null;
    const right = resolveSprite(manifest, 'walk_right', character, seen);
    return right ? {...right, flipX: !right.flipX} : null;
  }
  const key = `${action}:${character}`;
  if (seen.has(key)) throw new Error(`Sprite mirror cycle: ${key}`);
  if (entry.mirrorOf) {
    if (typeof entry.mirrorOf !== 'string' || entry.file) throw new Error(`Invalid sprite mirror: ${key}`);
    const source = resolveSprite(manifest, entry.mirrorOf, character, new Set([...seen, key]));
    if (!source) throw new Error(`Missing sprite mirror source: ${key}`);
    return {...source, flipX: !source.flipX};
  }
  if (typeof entry.file !== 'string' || !entry.file) throw new Error(`Missing sprite file: ${key}`);
  if (entry.columns === undefined && entry.rows === undefined) {
    return {file: entry.file, sheet: null, flipX: false};
  }
  const columns = entry.columns, rows = entry.rows;
  const frames = entry.frames ?? columns * rows, fps = entry.fps ?? 12;
  const playback = entry.playback ?? (action.startsWith('walk_') ? 'loop' : action.startsWith('seated_') ? 'hold' : 'once');
  const anchor = entry.anchor ?? [0.5, 746 / 768];
  const heightFraction = entry.heightFraction ?? 700 / 768;
  const idleFrame = entry.idleFrame ?? 0;
  if (!Number.isInteger(columns) || columns < 1 || !Number.isInteger(rows) || rows < 1 ||
      !Number.isInteger(frames) || frames < 1 || frames > columns * rows ||
      !Number.isFinite(fps) || fps <= 0 || !['loop', 'once', 'hold'].includes(playback) ||
      !Array.isArray(anchor) || anchor.length !== 2 ||
      !anchor.every(value => Number.isFinite(value) && value >= 0 && value <= 1) ||
      !Number.isFinite(heightFraction) || heightFraction <= 0 || heightFraction > 1 ||
      !Number.isInteger(idleFrame) || idleFrame < 0 || idleFrame >= columns * rows) {
    throw new Error(`Invalid sprite sheet: ${key}`);
  }
  if ((action.startsWith('sit_down_') || action.startsWith('stand_up_') || action.startsWith('wave_')) && playback !== 'once') {
    throw new Error(`Action must play once: ${key}`);
  }
  return {file: entry.file, sheet: {columns, rows, frames, fps, playback, anchor, heightFraction, idleFrame}, flipX: false};
}

export function spriteFrame(sheet, elapsed) {
  if (!Number.isFinite(elapsed) || elapsed < 0) throw new RangeError('Sprite elapsed time must be non-negative.');
  if (sheet.playback === 'hold') return 0;
  const frame = Math.floor(elapsed * sheet.fps / 1000);
  return sheet.playback === 'loop' ? frame % sheet.frames : Math.min(frame, sheet.frames - 1);
}

export function facingDirection(dx, dy) {
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
}

export function playerActionKey(state, bench, facing) {
  const view = {'bench-w': 'west', 'bench-n': 'north', 'bench-e': 'east'}[bench];
  const benchAction = {
    'sit-start-bench': 'sit_down', 'sit-bench': 'seated', 'up-bench': 'stand_up'
  }[state];
  if (benchAction) {
    if (!view) throw new Error(`Unknown bench anchor: ${bench}`);
    return `${benchAction}_bench_${view}`;
  }
  return {
    'sit-start-mat': 'sit_down_mat', 'sit-mat': 'seated_mat',
    'stretch-mat': 'stretch_mat', 'up-mat': 'stand_up_mat',
    wave: `wave_${facing}`
  }[state] ?? null;
}
