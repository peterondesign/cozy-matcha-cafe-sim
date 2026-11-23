const COMPONENTS = {
  5120: {Type: Int8Array, bytes: 1, read: 'getInt8'},
  5121: {Type: Uint8Array, bytes: 1, read: 'getUint8'},
  5122: {Type: Int16Array, bytes: 2, read: 'getInt16'},
  5123: {Type: Uint16Array, bytes: 2, read: 'getUint16'},
  5125: {Type: Uint32Array, bytes: 4, read: 'getUint32'},
  5126: {Type: Float32Array, bytes: 4, read: 'getFloat32'}
};
const ELEMENTS = {SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16};

function normalizeName(name = '') {
  return name.replace(/^mixamorig:/, '');
}

async function readGlb(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load local park asset ${url} (${response.status}).`);
  const data = await response.arrayBuffer();
  const view = new DataView(data);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2) {
    throw new Error(`Unsupported GLB header in ${url}.`);
  }
  const totalLength = view.getUint32(8, true);
  if (totalLength > data.byteLength) throw new Error(`Truncated GLB asset ${url}.`);
  let offset = 12, json = null, binary = null;
  while (offset + 8 <= totalLength) {
    const length = view.getUint32(offset, true), type = view.getUint32(offset + 4, true);
    offset += 8;
    if (offset + length > totalLength) throw new Error(`Invalid GLB chunk in ${url}.`);
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(data.slice(offset, offset + length)).trim());
    if (type === 0x004e4942) binary = data.slice(offset, offset + length);
    offset += length;
  }
  if (!json || !binary) throw new Error(`GLB asset ${url} is missing JSON or binary data.`);
  return {json, binary};
}

function readAccessor(doc, binary, index) {
  const accessor = doc.accessors[index];
  if (!accessor || accessor.sparse) throw new Error(`Unsupported GLB accessor ${index}.`);
  const component = COMPONENTS[accessor.componentType], itemSize = ELEMENTS[accessor.type];
  if (!component || !itemSize) throw new Error(`Unsupported GLB accessor format at index ${index}.`);
  const Constructor = accessor.normalized ? Float32Array : component.Type;
  const output = new Constructor(accessor.count * itemSize);
  const bufferView = doc.bufferViews[accessor.bufferView];
  if (!bufferView) return {array: output, itemSize};
  const stride = bufferView.byteStride || component.bytes * itemSize;
  const start = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
  const source = new DataView(binary);
  for (let row = 0; row < accessor.count; row++) {
    for (let column = 0; column < itemSize; column++) {
      const byteOffset = start + row * stride + column * component.bytes;
      let value = source[component.read](byteOffset, true);
      if (accessor.normalized && component.Type !== Float32Array) {
        const signed = component.Type === Int8Array || component.Type === Int16Array;
        const max = component.Type === Int8Array ? 127
          : component.Type === Int16Array ? 32767
            : component.Type === Uint8Array ? 255 : 65535;
        value = signed ? Math.max(value / max, -1) : value / max;
      }
      output[row * itemSize + column] = value;
    }
  }
  return {array: output, itemSize};
}

async function readImage(doc, binary, imageDef) {
  if (imageDef.bufferView === undefined) throw new Error('Park character GLB image must be embedded.');
  const bufferView = doc.bufferViews[imageDef.bufferView];
  const start = bufferView.byteOffset || 0;
  const bytes = binary.slice(start, start + bufferView.byteLength);
  const objectUrl = URL.createObjectURL(new Blob([bytes], {type: imageDef.mimeType}));
  const image = new Image();
  image.src = objectUrl;
  try {
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function makeGeometry(THREE, doc, binary, primitive) {
  if (primitive.mode !== undefined && primitive.mode !== 4) {
    throw new Error(`Unsupported park character primitive mode ${primitive.mode}.`);
  }
  const geometry = new THREE.BufferGeometry();
  for (const [sourceName, targetName] of [
    ['POSITION', 'position'], ['NORMAL', 'normal'], ['TEXCOORD_0', 'uv'],
    ['JOINTS_0', 'skinIndex'], ['WEIGHTS_0', 'skinWeight']
  ]) {
    const accessorIndex = primitive.attributes[sourceName];
    if (accessorIndex === undefined) continue;
    const {array, itemSize} = readAccessor(doc, binary, accessorIndex);
    const attribute = targetName === 'skinIndex'
      ? new THREE.Uint16BufferAttribute(new Uint16Array(array), itemSize)
      : new THREE.Float32BufferAttribute(new Float32Array(array), itemSize);
    geometry.setAttribute(targetName, attribute);
  }
  if (primitive.indices !== undefined) {
    const indices = readAccessor(doc, binary, primitive.indices).array;
    geometry.setIndex(new THREE.Uint16BufferAttribute(new Uint16Array(indices), 1));
  }
  geometry.computeBoundingBox();
  return geometry;
}

function makeMaterial(THREE, doc, textures, materialIndex) {
  const definition = doc.materials?.[materialIndex] || {};
  const pbr = definition.pbrMetallicRoughness || {};
  const factor = pbr.baseColorFactor || [1, 1, 1, 1];
  const textureIndex = pbr.baseColorTexture?.index;
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(factor[0], factor[1], factor[2]),
    map: textureIndex === undefined ? null : textures[doc.textures[textureIndex].source],
    roughness: pbr.roughnessFactor ?? 1,
    metalness: pbr.metallicFactor ?? 0,
    opacity: factor[3],
    transparent: definition.alphaMode === 'BLEND' || factor[3] < 1,
    alphaTest: definition.alphaMode === 'MASK' ? definition.alphaCutoff ?? 0.5 : 0,
    side: definition.doubleSided ? THREE.DoubleSide : THREE.FrontSide
  });
  return material;
}

async function loadRigTemplate(THREE, url) {
  const {json: doc, binary} = await readGlb(url);
  const images = await Promise.all((doc.images || []).map(image => readImage(doc, binary, image)));
  const textures = images.map(image => {
    const texture = new THREE.CanvasTexture(image);
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
    texture.needsUpdate = true;
    return texture;
  });
  const materials = (doc.materials || []).map((_, index) => makeMaterial(THREE, doc, textures, index));
  const geometries = (doc.meshes || []).map(mesh => mesh.primitives.map(primitive =>
    makeGeometry(THREE, doc, binary, primitive)));
  const skins = (doc.skins || []).map(skin => {
    const inverseBindMatrices = skin.inverseBindMatrices === undefined
      ? null : readAccessor(doc, binary, skin.inverseBindMatrices).array;
    return {joints: skin.joints, inverseBindMatrices};
  });

  function createInstance() {
    const jointSet = new Set(skins.flatMap(skin => skin.joints));
    const nodes = doc.nodes.map((definition, index) => {
      const node = jointSet.has(index) ? new THREE.Bone() : new THREE.Group();
      node.name = normalizeName(definition.name || `park-node-${index}`);
      if (definition.matrix) {
        const matrix = new THREE.Matrix4().fromArray(definition.matrix);
        matrix.decompose(node.position, node.quaternion, node.scale);
      } else {
        if (definition.translation) node.position.fromArray(definition.translation);
        if (definition.rotation) node.quaternion.fromArray(definition.rotation);
        if (definition.scale) node.scale.fromArray(definition.scale);
      }
      return node;
    });
    for (let index = 0; index < doc.nodes.length; index++) {
      for (const child of doc.nodes[index].children || []) nodes[index].add(nodes[child]);
    }
    const sceneRoot = new THREE.Group();
    const sceneDefinition = doc.scenes[doc.scene || 0];
    for (const index of sceneDefinition.nodes) sceneRoot.add(nodes[index]);
    sceneRoot.updateMatrixWorld(true);

    const skinnedMeshes = [];
    for (let index = 0; index < doc.nodes.length; index++) {
      const definition = doc.nodes[index];
      if (definition.mesh === undefined) continue;
      const primitives = doc.meshes[definition.mesh].primitives;
      primitives.forEach((primitive, primitiveIndex) => {
        const geometry = geometries[definition.mesh][primitiveIndex];
        const material = materials[primitive.material] || new THREE.MeshStandardMaterial({color: 0xffffff});
        const mesh = definition.skin === undefined
          ? new THREE.Mesh(geometry, material)
          : new THREE.SkinnedMesh(geometry, material);
        mesh.frustumCulled = false;
        nodes[index].add(mesh);
        if (definition.skin !== undefined) skinnedMeshes.push({mesh, skinIndex: definition.skin});
      });
    }
    sceneRoot.updateMatrixWorld(true);
    const skeletons = skins.map(skin => {
      const inverses = skin.joints.map((_, index) => skin.inverseBindMatrices
        ? new THREE.Matrix4().fromArray(skin.inverseBindMatrices, index * 16)
        : new THREE.Matrix4());
      return new THREE.Skeleton(skin.joints.map(joint => nodes[joint]), inverses);
    });
    for (const {mesh, skinIndex} of skinnedMeshes) mesh.bind(skeletons[skinIndex]);
    sceneRoot.updateMatrixWorld(true);
    const bounds = new THREE.Box3();
    const vertexPosition = new THREE.Vector3();
    for (const {mesh} of skinnedMeshes) {
      mesh.skeleton.update();
      const positions = mesh.geometry.attributes.position;
      for (let index = 0; index < positions.count; index++) {
        mesh.getVertexPosition(index, vertexPosition);
        bounds.expandByPoint(vertexPosition);
      }
    }
    const size = new THREE.Vector3();
    bounds.getSize(size);
    if (!Number.isFinite(size.y) || size.y <= 0) throw new Error(`Character asset ${url} has no usable height.`);
    const nodesByName = new Map();
    for (const node of nodes) if (node.name) nodesByName.set(node.name, node);
    return {
      root: sceneRoot,
      nodesByName,
      skinMeshes: skinnedMeshes.map(({mesh}) => mesh),
      height: size.y,
      minY: bounds.min.y,
      centerX: (bounds.min.x + bounds.max.x) / 2
    };
  }
  return {createInstance};
}

export async function loadParkAssets(THREE) {
  const base = './characters/test/';
  const barista = await loadRigTemplate(THREE, `${base}barista-rig.glb`);
  return {models: {barista}};
}
