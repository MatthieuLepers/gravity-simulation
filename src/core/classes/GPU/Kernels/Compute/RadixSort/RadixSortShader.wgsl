struct Particle {
  @align(16) position: vec3<f32>, // 12 bytes + 4 bytes (padding) - Position de la particule
  @align(16) velocity: vec3<f32>, // 12 bytes + 4 bytes (padding) - Vitesse de la particule
  @align(16) color: vec4<f32>,    // 16 bytes                     - Couleur de la particule
  mass: f32,                      //  4 bytes                     - Masse de la particule
  size: f32,                      //  4 bytes                     - Taille de la particule
  nodeIndex: i32,                 //  4 bytes                     - OctreeNode index
  padding: f32,                   //  4 bytes                     - padding
}

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

fn getHilbertIndex(index: u32) -> vec4<u32> {
  let dimX = textureDimensions(hilbertTextureRead).r;
  let x = i32(index % dimX);
  let y = i32(index / dimX);
  return textureLoad(hilbertTextureRead, vec2<i32>(x, y));
}

fn setHilbertIndex(index: u32, hilbert: vec4<u32>) {
  let dimX = textureDimensions(hilbertTextureWrite).r;
  let x = i32(index % dimX);
  let y = i32(index / dimX);
  textureStore(hilbertTextureWrite, vec2<i32>(x, y), hilbert);
}

fn countParticlesBefore(index: u32, bucket: u32) -> u32 {
  var count: u32 = 0;

  for (var i: u32 = 0; i < index; i++) {
    let hilbertData = getHilbertIndex(i);
    let b = (hilbertData.x >> shiftValue) & BIT_MASK;

    if (b == bucket) {
      count += 1;
    }
  }

  return count;
}

override PARTICLE_COUNT: u32;
override WORKGROUP_SIZE: u32;
override BITS_PER_PASS: u32;
override NUM_BUCKETS: u32 = u32(pow(2f, f32(BITS_PER_PASS)));
override BIT_MASK: u32 = NUM_BUCKETS - 1u;
override BIT_BUCKETS: u32 = 1u << BITS_PER_PASS;

@group(0) @binding(0) var hilbertTextureRead: texture_storage_2d<rg32uint, read>;
@group(0) @binding(1) var hilbertTextureWrite: texture_storage_2d<rg32uint, write>;
@group(0) @binding(2) var<uniform> shiftValue: u32;
@group(0) @binding(3) var<storage, read_write> histogram: array<atomic<u32>>;
@group(0) @binding(4) var<storage, read_write> prefixSum: array<u32>;
@group(0) @binding(5) var particleTextureRead: texture_storage_2d<rgba32float, read>;  
@group(0) @binding(6) var particleTextureWrite: texture_storage_2d<rgba32float, write>;

@compute @workgroup_size(WORKGROUP_SIZE)
fn c_build_histogram(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;
  if (index >= PARTICLE_COUNT) { return; }

  let hilbertData = getHilbertIndex(index);
  let bin = (hilbertData.x >> shiftValue) & BIT_MASK;
  atomicAdd(&histogram[bin], 1u);
}

@compute @workgroup_size(WORKGROUP_SIZE)
fn c_prefix_sum(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;
  if (index == 0u) {
    prefixSum[0] = 0u;
  }
  workgroupBarrier();

  var sum: u32 = 0u;
  for (var i: u32 = 0u; i < index; i++) {
    sum += atomicLoad(&histogram[i]);
  }
  prefixSum[index] = sum;
}

@compute @workgroup_size(WORKGROUP_SIZE)
fn c_scatter(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;
  if (index >= PARTICLE_COUNT) { return; }

  let hilbertData = getHilbertIndex(index);
  let hilbertKey = hilbertData.x;
  let originalIndex = hilbertData.y;

  let bucket = (hilbertKey >> shiftValue) & BIT_MASK;
  let baseWriteIndex = prefixSum[bucket];
  let localOffset = countParticlesBefore(index, bucket);
  let stableWriteIndex = baseWriteIndex + localOffset;

  setHilbertIndex(stableWriteIndex, hilbertData);
}

@compute @workgroup_size(WORKGROUP_SIZE)
fn c_reorder_particles(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;
  if (index >= PARTICLE_COUNT) { return; }

  let originalIndex = getHilbertIndex(index).y;
  let particle = getParticle(originalIndex);
  setParticle(index, particle);
}
