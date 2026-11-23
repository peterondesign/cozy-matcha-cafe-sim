import {resolveSprite, spriteFrame} from '../shared/sprite-actions.js';

const benchViews = prefix => [
  {label: 'West', asset: `${prefix}_bench_west`},
  {label: 'North', asset: `${prefix}_bench_north`},
  {label: 'East', asset: `${prefix}_bench_east`}
];
const waveViews = ['down', 'up', 'right', 'left'].map(direction => ({
  label: direction[0].toUpperCase() + direction.slice(1), asset: `wave_${direction}`
}));
const actionGroups = [
  {
    label: 'Walk',
    actions: [
      { label: 'Walk right', asset: 'walk_right' },
      { label: 'Walk left', asset: 'walk_left' },
      { label: 'Walk down', asset: 'walk_down' },
      { label: 'Walk up', asset: 'walk_up' },
      { label: 'Walk northeast', asset: 'walk_ne' },
      { label: 'Walk northwest', asset: 'walk_nw' },
      { label: 'Walk southeast', asset: 'walk_se' },
      { label: 'Walk southwest', asset: 'walk_sw' }
    ]
  },
  {
    label: 'Park',
    actions: [
      {label: 'Sit down on bench', rotations: benchViews('sit_down')},
      {label: 'Seated on bench', rotations: benchViews('seated')},
      {label: 'Stand up from bench', rotations: benchViews('stand_up')},
      {label: 'Sit down on mat', asset: 'sit_down_mat'},
      {label: 'Seated on mat', asset: 'seated_mat'},
      {label: 'Stretch on mat', asset: 'stretch_mat'},
      {label: 'Stand up from mat', asset: 'stand_up_mat'},
      {label: 'Wave', rotations: waveViews}
    ]
  }
];

const customers = [
  { id: 'bones', name: 'Bones', image: 'walk_right-pose-guide.png' },
  { id: 'barista', name: 'Matcha Barista', image: '../park/characters/test/barista.png' },
  { id: '01', name: 'Sota' },
  { id: '02', name: 'Hana' },
  { id: '03', name: 'Mio' },
  { id: '04', name: 'Ken' },
  { id: '05', name: 'Ren' },
  { id: '06', name: 'Aya' },
  { id: '07', name: 'Jun' },
  { id: '08', name: 'Yuki' },
  { id: '09', name: 'Haru' },
  { id: '10', name: 'Noa' }
];

const actionList = document.querySelector('#action-list');
const stage = document.querySelector('#stage');
const preview = document.querySelector('#preview');
const sheetPreview = document.querySelector('#sheet-preview');
const actionName = document.querySelector('#action-name');
const assetName = document.querySelector('#asset-name');
const status = document.querySelector('#status');
const selectedCustomer = document.querySelector('#selected-customer');
let activeSheet = null;
let selectedCustomerId = 'bones';
let selectedActionKey = 'walk_right';
let actionAssets = null;

function findAsset(stem, characterId) {
  const asset = resolveSprite(actionAssets, stem, characterId);
  return asset ? {...asset, path: `./${asset.file}`} : null;
}

function showSheetFrame() {
  if (!activeSheet) return;
  const column = activeSheet.frame % activeSheet.columns;
  const row = Math.floor(activeSheet.frame / activeSheet.columns);
  const x = activeSheet.columns === 1 ? 0 : column / (activeSheet.columns - 1) * 100;
  const y = activeSheet.rows === 1 ? 0 : row / (activeSheet.rows - 1) * 100;
  sheetPreview.style.backgroundPosition = `${x}% ${y}%`;
}

function showAction(actionKey, label, asset) {
  const { path, sheet, flipX } = asset;
  stage.dataset.empty = 'false';
  actionName.textContent = label;
  assetName.textContent = `${path.replace('./', '')}${flipX ? ' · mirrored' : ''}${sheet ? ` · ${sheet.frames} frames · ${sheet.fps} fps · ${sheet.playback}` : ''}`;
  selectedActionKey = actionKey;
  activeSheet = null;
  preview.style.transform = flipX ? 'scaleX(-1)' : '';
  sheetPreview.style.transform = flipX ? 'scaleX(-1)' : '';
  if (sheet) {
    preview.hidden = true;
    sheetPreview.hidden = false;
    sheetPreview.style.backgroundImage = `url("${path}")`;
    sheetPreview.style.backgroundSize = `${sheet.columns * 100}% ${sheet.rows * 100}%`;
    activeSheet = { ...sheet, path, frame: 0, startedAt: performance.now() };
    const anchor = sheetPreview.querySelector('.anchor');
    anchor.style.left = `${sheet.anchor[0] * 100}%`;
    anchor.style.top = `${sheet.anchor[1] * 100}%`;
    anchor.title = `Contact anchor: ${(sheet.anchor[0] * 100).toFixed(1)}%, ${(sheet.anchor[1] * 100).toFixed(1)}%`;
    showSheetFrame();
    const image = new Image();
    image.onload = () => {
      if (activeSheet?.path !== path) return;
      if (image.width % sheet.columns || image.height % sheet.rows) {
        activeSheet = null;
        sheetPreview.hidden = true;
        stage.dataset.empty = 'true';
        status.textContent = `Invalid sprite dimensions for ${path.replace('./', '')}.`;
        return;
      }
      sheetPreview.style.aspectRatio = `${image.width / sheet.columns} / ${image.height / sheet.rows}`;
    };
    image.onerror = () => {
      if (activeSheet?.path !== path) return;
      activeSheet = null;
      sheetPreview.hidden = true;
      stage.dataset.empty = 'true';
      status.textContent = `Could not load ${path.replace('./', '')}.`;
    };
    image.src = path;
  } else {
    sheetPreview.hidden = true;
    preview.hidden = false;
    preview.alt = label;
    preview.onerror = () => {
      if (preview.getAttribute('src') !== path) return;
      stage.dataset.empty = 'true';
      status.textContent = `Could not load ${path.replace('./', '')}.`;
    };
    preview.src = path;
  }
  for (const button of actionList.querySelectorAll('[data-action-key]')) {
    button.setAttribute('aria-pressed', String(button.dataset.actionKey === actionKey));
  }
}

function showUnavailableAction(label, message) {
  activeSheet = null;
  preview.hidden = true;
  sheetPreview.hidden = true;
  preview.style.transform = '';
  sheetPreview.style.transform = '';
  stage.dataset.empty = 'true';
  actionName.textContent = label;
  assetName.textContent = '';
  document.querySelector('#empty-state').textContent = message;
  for (const button of actionList.querySelectorAll('[data-action-key]')) {
    button.setAttribute('aria-pressed', String(button.dataset.actionKey === selectedActionKey));
  }
}

function createActionButton(label, actionKey, asset) {
  const button = document.createElement('button');
  button.className = 'action';
  button.type = 'button';
  button.textContent = label;
  button.dataset.actionKey = actionKey;
  button.disabled = !asset;
  button.setAttribute('aria-pressed', 'false');

  const availability = document.createElement('span');
  availability.className = 'availability';
  availability.textContent = asset ? '' : 'Soon';
  button.append(availability);
  if (asset) button.addEventListener('click', () => showAction(actionKey, label, asset));
  return button;
}

function resolveAction(action) {
    if (action.rotations) {
      const rotations = action.rotations.map(rotation => ({
        ...rotation,
        path: findAsset(rotation.asset, selectedCustomerId)
      }));
      return { ...action, rotations, path: rotations.find(rotation => rotation.path)?.path || null };
    }
    return { ...action, path: findAsset(action.asset, selectedCustomerId) };
}

function renderActions() {
  if (!actionAssets) return;
  actionList.replaceChildren();
  const resolved = new Map();
  for (const group of actionGroups) {
    const section = document.createElement('section');
    section.className = 'group';
    const heading = document.createElement('h2');
    heading.className = 'group-title';
    heading.textContent = group.label;
    section.append(heading);

    for (const action of group.actions) {
      const state = resolveAction(action);
      const actionKey = action.asset || state.rotations.find(rotation => rotation.path)?.asset || action.rotations[0].asset;
      if (action.rotations) {
        for (const rotation of state.rotations) resolved.set(rotation.asset, rotation.path);
      } else {
        resolved.set(action.asset, state.path);
      }
      section.append(createActionButton(action.label, actionKey, state.path));
      if (action.rotations) {
        const rotationOptions = document.createElement('div');
        rotationOptions.className = 'rotation-options';
        rotationOptions.setAttribute('role', 'group');
        rotationOptions.setAttribute('aria-label', `${action.label} views`);
        for (const rotation of state.rotations) {
          const button = document.createElement('button');
          button.className = 'rotation';
          button.type = 'button';
          button.textContent = rotation.label;
          button.disabled = !rotation.path;
          button.dataset.actionKey = rotation.asset;
          button.setAttribute('aria-pressed', 'false');
          if (rotation.path) {
            button.addEventListener('click', () => showAction(rotation.asset, `${action.label} · ${rotation.label}`, rotation.path));
          }
          rotationOptions.append(button);
        }
        section.append(rotationOptions);
      }
    }
    actionList.append(section);
  }
  const availableCount = [...resolved.values()].filter(Boolean).length;
  status.textContent = `${availableCount} action${availableCount === 1 ? '' : 's'} ready for ${customers.find(customer => customer.id === selectedCustomerId).name}.`;
  const selectedAction = resolved.get(selectedActionKey);
  if (selectedAction) {
    const config = actionGroups.flatMap(group => group.actions).flatMap(action => (
      action.rotations || [action]
    )).find(action => action.asset === selectedActionKey);
    showAction(selectedActionKey, config.label, selectedAction);
  } else {
    const config = actionGroups.flatMap(group => group.actions).find(action => action.asset === selectedActionKey);
    showUnavailableAction(
      config?.label || 'Walk right',
      `No ${config?.label || 'walk right'} art for ${customers.find(customer => customer.id === selectedCustomerId).name} yet.`
    );
  }
}

function renderCustomers() {
  const container = document.querySelector('#customers');
  for (const customer of customers) {
    const button = document.createElement('button');
    button.className = 'customer';
    button.type = 'button';
    button.setAttribute('aria-pressed', String(customer.id === selectedCustomerId));
    button.setAttribute('aria-label', `${customer.name}, customer ${customer.id}`);

    const image = document.createElement('img');
    image.src = customer.image || `../counter/customers/${customer.id}/frame_01.png`;
    image.alt = '';
    image.addEventListener('error', () => {
      status.textContent = `Could not load customer ${customer.id}.`;
    }, { once: true });

    const name = document.createElement('span');
    name.className = 'customer-name';
    name.textContent = customer.name;
    const id = document.createElement('span');
    id.className = 'customer-id';
    id.textContent = customer.id;

    button.append(image, name, id);
    button.addEventListener('click', () => {
      selectedCustomerId = customer.id;
      for (const other of container.querySelectorAll('.customer')) {
        other.setAttribute('aria-pressed', String(other === button));
      }
      selectedCustomer.textContent = `Selected: ${customer.name}`;
      try {
        renderActions();
      } catch (error) {
        status.textContent = `Invalid action asset: ${error.message}`;
        console.error('Invalid action asset:', error);
        showUnavailableAction('Action unavailable', 'Fix the action manifest and reload.');
      }
    });
    container.append(button);
  }
  selectedCustomer.textContent = `Selected: ${customers.find(customer => customer.id === selectedCustomerId).name}`;
}

renderCustomers();
fetch('./action-assets.json?v=2')
  .then(response => {
    if (!response.ok) throw new Error(`Action asset manifest request failed: ${response.status}`);
    return response.json();
  })
  .then(assets => {
    actionAssets = assets;
    renderActions();
  })
  .catch(error => {
    status.textContent = `Could not check action images: ${error.message}`;
    throw error;
  });

function animateSheet(now) {
  if (activeSheet) {
    activeSheet.frame = spriteFrame(activeSheet, Math.max(0, now - activeSheet.startedAt));
    showSheetFrame();
  }
  requestAnimationFrame(animateSheet);
}
requestAnimationFrame(animateSheet);
