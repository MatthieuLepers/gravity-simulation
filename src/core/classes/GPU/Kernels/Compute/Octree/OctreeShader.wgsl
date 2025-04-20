override WORKGROUP_SIZE: u32;
override MAX_PARTICLE_PER_LEAF: u32;
override PARTICLE_COUNT: u32;

struct OctreeNode {
  @align(16) minCorner: vec4<f32>,    // 16 bytes               - Coordonnées min du cube
  @align(16) maxCorner: vec4<f32>,    // 16 bytes               - Coordonnées max du cube
  children: array<i32, 8>,            // 32 bytes (8 * 4 bytes) - Indices des enfants (-1 si non existant)
  parent: i32,                        //  4 bytes               - Index du parent (-1 si racine)
  particleStart: atomic<u32>,         //  4 bytes               - Index des particules dans un buffer temporaire
  particleCount: atomic<u32>,         //  4 bytes               - Nombre de particules dans ce nœud
  totalMass: f32,                     //  4 bytes               - Masse du noeud
  @align(16) centerOfMass: vec3<f32>, // 12 bytes (no padding)  - Centre de masse du noeud
  subdivisionLock: atomic<i32>,       //  4 bytes               - Indique si le noeud est en train d'être subdivisé
}

struct Particle {
  @align(16) position: vec3<f32>, // 12 bytes + 4 bytes (padding) - Particle position
  @align(16) velocity: vec3<f32>, // 12 bytes + 4 bytes (padding) - Particle velocity
  @align(16) color: vec4<f32>,    // 16 bytes                     - Particle color
  mass: f32,                      //  4 bytes                     - Particle mass
  size: f32,                      //  4 bytes                     - Particle size
  nodeIndex: i32,                 //  4 bytes                     - OctreeNode index
  padding: f32,                   //  4 bytes                     - Padding
}

@group(0) @binding(0) var particleTextureRead: texture_storage_2d<rgba32float, read>;
@group(0) @binding(1) var particleTextureWrite: texture_storage_2d<rgba32float, write>;
@group(0) @binding(2) var<storage, read_write> octreeNodes: array<OctreeNode>;
@group(0) @binding(3) var<storage, read_write> freeNodeIndices: array<atomic<i32>>;
@group(0) @binding(4) var<storage, read_write> freeNodeCounter: atomic<i32>;
// @group(0) @binding(5) var<storage, read_write> debugCounters: array<atomic<i32>>;

fn getParticle(index: u32) -> Particle {
  let dimX = textureDimensions(particleTextureRead).r;
  let x = i32((index * 4u) % dimX);
  let y = i32((index * 4u) / dimX);

  let data1 = textureLoad(particleTextureRead, vec2<i32>(x, y));
  let data2 = textureLoad(particleTextureRead, vec2<i32>(x + 1, y));
  let data3 = textureLoad(particleTextureRead, vec2<i32>(x + 2, y));
  let data4 = textureLoad(particleTextureRead, vec2<i32>(x + 3, y));

  return Particle(
    data1.xyz,
    data2.xyz,
    data3,
    data4.x,
    data4.y,
    i32(data4.z),
    data4.w,
  );
}

fn setParticle(index: u32, particle: Particle) {
  let dimX = textureDimensions(particleTextureWrite).r;
  let x = i32((index * 4u) % dimX);
  let y = i32((index * 4u) / dimX);

  textureStore(particleTextureWrite, vec2<i32>(x, y), vec4<f32>(particle.position, 0.0));
  textureStore(particleTextureWrite, vec2<i32>(x + 1, y), vec4<f32>(particle.velocity, 0.0));
  textureStore(particleTextureWrite, vec2<i32>(x + 2, y), particle.color);
  textureStore(particleTextureWrite, vec2<i32>(x + 3, y), vec4<f32>(particle.mass, particle.size, f32(particle.nodeIndex), particle.padding));
}

fn findChildIndex(nodeIndex: i32, position: vec3<f32>) -> u32 {
  let center = (octreeNodes[nodeIndex].minCorner.xyz + octreeNodes[nodeIndex].maxCorner.xyz) * 0.5;
  return select(0u, 1u, position.x > center.x) +
         select(0u, 2u, position.y > center.y) +
         select(0u, 4u, position.z > center.z);
}

fn createNodeAt(nodeIndex: i32, minCorner: vec3<f32>, maxCorner: vec3<f32>) {
  octreeNodes[nodeIndex].minCorner = vec4<f32>(minCorner, 0.0);
  octreeNodes[nodeIndex].maxCorner = vec4<f32>(maxCorner, 0.0);
  octreeNodes[nodeIndex].children = array<i32, 8>(-1, -1, -1, -1, -1, -1, -1, -1);
  atomicStore(&octreeNodes[nodeIndex].particleStart, 0xFFFFFFFFu);
  atomicStore(&octreeNodes[nodeIndex].particleCount, 0u);
  octreeNodes[nodeIndex].centerOfMass = vec3<f32>(0.0);
  atomicStore(&octreeNodes[nodeIndex].subdivisionLock, 0);
}

fn allocateNode() -> i32 {
  let idx = atomicSub(&freeNodeCounter, 1) - 1;

  if (idx >= 0 && idx < i32(arrayLength(&freeNodeIndices))) {
    return atomicExchange(&freeNodeIndices[idx], -1);
  }

  atomicAdd(&freeNodeCounter, 1);
  return -1;
}

fn subdivideNode(nodeIndex: i32) {
  let alreadySubdivided = atomicExchange(&octreeNodes[nodeIndex].subdivisionLock, 1);
  if (alreadySubdivided == 1) {
    return; // Un autre thread l’a déjà subdivisé
  }

  let center = (octreeNodes[nodeIndex].minCorner.xyz + octreeNodes[nodeIndex].maxCorner.xyz) * 0.5;

  for (var i = 0; i < 8; i++) {
    let newIndex = allocateNode();

    if (newIndex == -1) { continue; } // Stop si plus de place

    if (atomicLoad(&octreeNodes[newIndex].particleCount) > 0u) {
      continue; // On évite d'écraser un nœud utilisé
    }

    let min = vec3<f32>(
      select(center.x, octreeNodes[nodeIndex].minCorner.x, (i & 1) == 0),
      select(center.y, octreeNodes[nodeIndex].minCorner.y, (i & 2) == 0),
      select(center.z, octreeNodes[nodeIndex].minCorner.z, (i & 4) == 0)
    );

    let max = vec3<f32>(
      select(octreeNodes[nodeIndex].maxCorner.x, center.x, (i & 1) == 0),
      select(octreeNodes[nodeIndex].maxCorner.y, center.y, (i & 2) == 0),
      select(octreeNodes[nodeIndex].maxCorner.z, center.z, (i & 4) == 0)
    );

    createNodeAt(newIndex, min, max);
    octreeNodes[nodeIndex].children[i] = newIndex;
  }
}

@compute @workgroup_size(1)
fn cs_init_octree() {
  let size = 3.0;

  let minCorner = vec3<f32>(-size, -size, -size);
  let maxCorner = vec3<f32>(size, size, size);
  createNodeAt(0, minCorner, maxCorner);

  // Initialisation des indices de nœuds libres
  for (var i = 1; u32(i) < arrayLength(&octreeNodes); i++) {
    atomicStore(&freeNodeIndices[i - 1], i); // On stocke les indices disponibles
  }

  atomicStore(&freeNodeCounter, i32(arrayLength(&octreeNodes)) - 1);
}

@compute @workgroup_size(WORKGROUP_SIZE)
fn cs_insert_particles(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;
  if (index >= PARTICLE_COUNT) { return; }

  var nodeIndex: i32 = 0;
  var particle = getParticle(index);
  var maxIterations = (PARTICLE_COUNT / MAX_PARTICLE_PER_LEAF) - 1u;

  loop {
    if (maxIterations == 0u) { break; }
    maxIterations -= 1u;

    let childIdx = findChildIndex(nodeIndex, particle.position);
    var child = octreeNodes[nodeIndex].children[childIdx];

    if (child == -1) {
      subdivideNode(nodeIndex);

      child = octreeNodes[nodeIndex].children[childIdx];

      if (child == -1) { break; }
    }

    nodeIndex = child;
  }

  particle.nodeIndex = nodeIndex;
  setParticle(index, particle);
  atomicMin(&octreeNodes[nodeIndex].particleStart, index);
}
