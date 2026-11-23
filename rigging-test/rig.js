const sprite = document.querySelector('#walk-right');
const stage = document.querySelector('#stage');
let offset = 0;
const step = 24;
const keys = new Set();

function applyPosition() {
  const halfWidth = sprite.getBoundingClientRect().width / 2;
  const limit = stage.clientWidth / 2 - halfWidth;
  offset = Math.max(-limit, Math.min(limit, offset));
  sprite.style.left = `calc(50% + ${offset}px)`;
}

document.querySelector('#left').addEventListener('click', () => {
  offset -= step;
  applyPosition();
});
document.querySelector('#right').addEventListener('click', () => {
  offset += step;
  applyPosition();
});
document.querySelector('#reset').addEventListener('click', () => {
  offset = 0;
  applyPosition();
});

const directions = { ArrowLeft: -1, ArrowRight: 1 };
addEventListener('keydown', event => {
  if (directions[event.key]) {
    event.preventDefault();
    keys.add(event.key);
  }
});
addEventListener('keyup', event => keys.delete(event.key));

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const direction = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
  if (direction) {
    offset += direction * 180 * dt;
    applyPosition();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
