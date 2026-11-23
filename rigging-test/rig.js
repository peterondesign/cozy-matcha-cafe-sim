const T = globalThis.MatchaThree;
const readout = document.querySelector('#readout');
const bodies = ['barista', 'walker', 'hiker', 'grocer'];
const clips = ['bind', 'walk-femme', 'walk', 'walk-hiker', 'wave', 'sit-bench', 'sit-mat'];
let bodyName = 'barista';
let clipName = 'walk-femme';
const library = {};
const rigs = {};

const canvas = document.querySelector('#stage');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setClearColor(0x8eaf72, 1);
renderer.outputColorSpace = T.SRGBColorSpace;
const scene = new T.Scene();
scene.add(new T.HemisphereLight(0xfff6e4, 0x6d8a55, 1.4));
const sun = new T.DirectionalLight(0xfff7ea, 1.2);
sun.position.set(2, 4, 3);
scene.add(sun);
const camera = new T.PerspectiveCamera(32, 1, 0.1, 40);
camera.position.set(0, 1.15, 3.2);
camera.lookAt(0, 0.9, 0);
const stage = new T.Group();
scene.add(stage);

function namesOf(root) {
  const names = new Set();
  root.traverse(node => { if (node.name) names.add(node.name); });
  return names;
}
function clipTargets(clip) {
  const names = new Set();
  for (const channel of clip.tracks || []) {
    const dot = channel.name.lastIndexOf('.');
    if (dot > 0) names.add(channel.name.slice(0, dot));
  }
  return names;
}
function textureSize(root) {
  let size = '';
  root.traverse(node => {
    const map = node.material && node.material.map;
    const image = map && map.image;
    if (image && image.width && !size) size = image.width + '×' + image.height;
  });
  return size || 'none';
}
function show(text) { readout.textContent = text; }

function mount(name) {
  stage.clear();
  const rig = rigs[name];
  if (!rig) return;
  stage.add(rig.root);
  rig.root.position.set(0, 0, 0);
  play(clipName);
}
function play(name) {
  clipName = name;
  const rig = rigs[bodyName];
  if (!rig) return;
  for (const button of document.querySelectorAll('#clips button')) button.classList.toggle('active', button.dataset.clip === name);
  rig.mixer.stopAllAction();
  if (name === 'bind' || !library[name]) {
    rig.root.traverse(node => { if (node.isBone && node.userData.rest) node.quaternion.copy(node.userData.rest); });
    report(rig, null);
    return;
  }
  const clip = library[name];
  const act = rig.mixer.clipAction(clip);
  act.reset();
  act.setLoop(2201, Infinity);
  act.play();
  report(rig, clip);
}
function report(rig, clip) {
  const bones = namesOf(rig.root);
  const targets = clip ? clipTargets(clip) : new Set();
  let hit = 0;
  for (const name of targets) if (bones.has(name)) hit++;
  const sample = [...targets].slice(0, 3).join(', ') || 'bind pose';
  const hips = bones.has('mixamorigHips') || bones.has('mixamorig:Hips') ? 'mixamorigHips' : 'other';
  const match = !clip ? 'bind pose, no clip' : hit ? hit + '/' + targets.size + ' tracks land on this rig' : '0 tracks match — this clip will leave a T-pose';
  show([
    bodyName + '  ·  ' + (clip ? clipName : 'bind'),
    'Hips: ' + hips,
    'Texture: ' + textureSize(rig.root),
    'Clip bones: ' + sample,
    match
  ].join('\n'));
}

function buttonRow(host, items, key, current, onPick) {
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset[key] = item;
    button.textContent = item;
    button.classList.toggle('active', item === current);
    button.onclick = () => {
      for (const other of host.children) other.classList.toggle('active', other === button);
      onPick(item);
    };
    host.append(button);
  }
}
buttonRow(document.querySelector('#bodies'), bodies, 'body', bodyName, name => { bodyName = name; mount(name); });
buttonRow(document.querySelector('#clips'), clips, 'clip', clipName, play);

const loader = new T.GLTFLoader();
let pending = bodies.length + clips.length - 1;
function done() {
  pending--;
  if (pending > 0) return;
  mount(bodyName);
}
for (const name of bodies) {
  loader.load('../park/characters/test/' + name + '-uthana.glb', gltf => {
    const root = gltf.scene;
    root.traverse(node => { if (node.isBone) node.userData.rest = node.quaternion.clone(); });
    const box = new T.Box3().setFromObject(root);
    const size = box.getSize(new T.Vector3());
    const fit = 1.7 / (size.y || 1);
    root.scale.setScalar(fit);
    root.position.y = -box.min.y * fit;
    rigs[name] = { root, mixer: new T.AnimationMixer(root) };
    done();
  }, undefined, () => { show(name + ' rig failed to load'); done(); });
}
for (const name of clips) {
  if (name === 'bind') continue;
  loader.load('../park/characters/test/motion/' + name + '.glb', gltf => {
    library[name] = gltf.animations[0] || null;
    done();
  }, undefined, () => done());
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const rig = rigs[bodyName];
  if (rig && clipName !== 'bind') rig.mixer.update(dt);
  const w = canvas.clientWidth, h = canvas.clientHeight, dpr = Math.min(devicePixelRatio, 2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
