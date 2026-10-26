struct Particle {
  @align(16) position: vec3<f32>, // 12 bytes + 4 bytes (padding) - Particle position
  @align(16) velocity: vec3<f32>, // 12 bytes + 4 bytes (padding) - Particle velocity
  @align(16) color: vec4<f32>,    // 16 bytes                     - Particle color
  mass: f32,                      //  4 bytes                     - Particle mass
  size: f32,                      //  4 bytes                     - Particle size
  nodeIndex: i32,                 //  4 bytes                     - OctreeNode index
  padding: f32,                   //  4 bytes                     - padding
}

override PARTICLE_COUNT: u32;
override GRID_SIZE: u32;
override MIN_BOUND: f32;
override MAX_BOUND: f32;

@group(0) @binding(0) var particleTextureRead: texture_storage_2d<rgba32float, read>;
@group(0) @binding(1) var hilbertTextureWrite: texture_storage_2d<rg32uint, write>;

fn getParticle(index: u32) -> Particle {
  let dimX = textureDimensions(particleTextureRead).r;

  let x = i32((index * 4u) % dimX);
  let y = i32(((index * 4u) / dimX));

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

fn interleave_bits(xi: u32, yi: u32, zi: u32) -> u32 {
  var x = xi;
  var y = yi;
  var z = zi;

  x = (x | (x << 16u)) & 0x030000FFu;
  x = (x | (x <<  8u)) & 0x0300F00Fu;
  x = (x | (x <<  4u)) & 0x030C30C3u;
  x = (x | (x <<  2u)) & 0x09249249u;

  y = (y | (y << 16u)) & 0x030000FFu;
  y = (y | (y <<  8u)) & 0x0300F00Fu;
  y = (y | (y <<  4u)) & 0x030C30C3u;
  y = (y | (y <<  2u)) & 0x09249249u;

  z = (z | (z << 16u)) & 0x030000FFu;
  z = (z | (z <<  8u)) & 0x0300F00Fu;
  z = (z | (z <<  4u)) & 0x030C30C3u;
  z = (z | (z <<  2u)) & 0x09249249u;

  return x | (y << 1u) | (z << 2u);
}

fn morton3D(position: vec3<f32>) -> u32 {
  let normalized = (position - vec3<f32>(MIN_BOUND)) / (MAX_BOUND - MIN_BOUND);
  let maxCell = GRID_SIZE - 1u;
  let maxCellF = f32(maxCell);

  // Clamp positions outside the configured cube and quantize to integer grid cells.
  // GRID_SIZE is 1024, so each axis contributes 10 bits to the 30-bit Morton key.
  let xi = u32(clamp(floor(normalized.x * f32(GRID_SIZE)), 0.0, maxCellF));
  let yi = u32(clamp(floor(normalized.y * f32(GRID_SIZE)), 0.0, maxCellF));
  let zi = u32(clamp(floor(normalized.z * f32(GRID_SIZE)), 0.0, maxCellF));

  return interleave_bits(xi, yi, zi);
}

fn setHilbertIndex(particleIndex: u32, hilbert: vec4<u32>) {
  let dimX = textureDimensions(hilbertTextureWrite).x;
  let x = i32(particleIndex % dimX);
  let y = i32((particleIndex / dimX));

  textureStore(hilbertTextureWrite, vec2<i32>(x, y), hilbert);
}

@compute @workgroup_size(256)
fn cs_hilbert_curve(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = id.x;
  if (i >= PARTICLE_COUNT) { return; }

  let particle = getParticle(i);

  let mortonKey = morton3D(particle.position);

  // rg32uint stores the 32-bit key and original particle index without float conversion.
  setHilbertIndex(i, vec4<u32>(mortonKey, i, 0u, 0u));
}
