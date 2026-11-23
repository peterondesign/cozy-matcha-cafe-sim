const westApproach = [
  [-240, 1360], [120, 1175], [310, 1105], [470, 1030], [600, 982], [720, 930], [735, 880]
];

export const VISITOR_PATHS = [
  [...westApproach, [785, 820], [795, 755], [782, 680], [785, 635],
    [810, 600], [850, 570], [930, 545], [1050, 510], [1160, 475],
    [1220, 450], [1260, 410], [1290, 345], [1330, 325], [1400, 325],
    [1440,345], [1470,410], [1510,440], [1600,480], [1700,530],
    [1760,550], [1820,555], [1840,535]],
  [...westApproach, [800, 900], [900, 975], [1050, 1045], [1220, 1060],
    [1450, 1020], [1630, 980], [1740, 985], [1840, 1015], [1950, 1080], [2260, 1350]]
].map(points => {
  const segments = [];
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i - 1], [endX, endY] = points[i];
    const segmentLength = Math.hypot(endX - x, endY - y);
    segments.push({x, y, dx: endX - x, dy: endY - y, start: length, length: segmentLength});
    length += segmentLength;
  }
  return {segments, length};
});

export function sampleVisitorPath(path, distance) {
  if (!Number.isFinite(distance) || distance < 0) throw new RangeError('Path distance must be non-negative.');
  const phase = distance % (path.length * 2);
  const backwards = phase >= path.length;
  const position = backwards ? path.length * 2 - phase : phase;
  const segment = path.segments.find(item => position <= item.start + item.length) || path.segments.at(-1);
  const progress = (position - segment.start) / segment.length;
  const sign = backwards ? -1 : 1;
  return {
    x: segment.x + segment.dx * progress,
    y: segment.y + segment.dy * progress,
    vx: sign * segment.dx / segment.length,
    vy: sign * segment.dy / segment.length,
    opacity: Math.min(1, position / 90, (path.length - position) / 90)
  };
}

export function visitorTarget(minutes) {
  const hour = ((minutes % 1440) + 1440) % 1440 / 60;
  return hour < 6 || hour >= 23 ? 0 : hour < 21 ? 2 : 1;
}

export function findViewEntry(path, view, offset = 0) {
  const inside = point => point.x >= view.cx && point.x <= view.cx + view.cw &&
    point.y + offset >= view.cy && point.y + offset <= view.cy + view.ch;
  const outside = point => point.x < view.cx - 150 || point.x > view.cx + view.cw + 150 ||
    point.y + offset < view.cy - 150 || point.y + offset > view.cy + view.ch + 150;
  const step = 30, period = path.length * 2;
  const count = Math.ceil(period / step), lookahead = 600 / step;
  const points = Array.from({length: count + lookahead}, (_, index) =>
    sampleVisitorPath(path, index * step));
  let best = null, bestAhead = Infinity, nextInside = Infinity;
  for (let i = points.length - 1; i >= 0; i--) {
    if (i < count && outside(points[i])) {
      const ahead = (nextInside - i) * step;
      if (ahead <= 600 && ahead <= bestAhead) {
        best = i * step;
        bestAhead = ahead;
      }
    }
    if (inside(points[i])) nextInside = i;
  }
  return best;
}
