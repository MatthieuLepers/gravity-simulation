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

fn hilbert3D(position: vec3<f32>, minBounds: vec3<f32>, maxBounds: vec3<f32>, gridSize: f32) -> u32 {
  let normalized = (position - minBounds) / (maxBounds - minBounds);
  let xi = min(normalized.x * f32(gridSize), gridSize - 1.0);
  let yi = min(normalized.y * f32(gridSize), gridSize - 1.0);
  let zi = min(normalized.z * f32(gridSize), gridSize - 1.0);

  return interleave_bits(bitcast<u32>(xi), bitcast<u32>(yi), bitcast<u32>(zi));
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

  let gridSize = 100.0;
  let minCorner = vec3<f32>(-100.0);
  let maxCorner = vec3<f32>(100.0);
  let hilbertKey = hilbert3D(particle.position, minCorner, maxCorner, gridSize);

  setHilbertIndex(i, vec4<u32>(hilbertKey, i, 0u, 0u));
}
