struct Particle {
  @align(16) position: vec3<f32>, // 12 bytes + 4 bytes (padding) - Particle position
  @align(16) velocity: vec3<f32>, // 12 bytes + 4 bytes (padding) - Particle velocity
  @align(16) color: vec4<f32>,    // 16 bytes                     - Particle color
  mass: f32,                      //  4 bytes                     - Particle mass
  size: f32,                      //  4 bytes                     - Particle size
  padding: vec2<f32>,             //  8 bytes                     - Padding
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
}

struct CameraUniform {
  projectionMatrix : mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  cameraPosition: vec3<f32>,
  padding: f32,
}

override PARTICLE_COUNT: u32;

@group(0) @binding(0) var particleTexture: texture_storage_2d<rgba32float, read>;
@group(0) @binding(1) var<uniform> camera: CameraUniform;

fn getParticle(index: u32) -> Particle {
  let dimX = textureDimensions(particleTexture).r;

  let x = i32((index * 4u) % dimX);
  let y = i32(((index * 4u) / dimX));

  let data1 = textureLoad(particleTexture, vec2<i32>(x, y));
  let data2 = textureLoad(particleTexture, vec2<i32>(x + 1, y));
  let data3 = textureLoad(particleTexture, vec2<i32>(x + 2, y));
  let data4 = textureLoad(particleTexture, vec2<i32>(x + 3, y));

  return Particle(
    data1.xyz,
    data2.xyz,
    data3,
    data4.x,
    data4.y,
    data4.zw,
  );
}

@vertex
fn vs_main(@builtin(vertex_index) index: u32) -> VertexOutput {
  if (index >= PARTICLE_COUNT) {
    return VertexOutput(vec4<f32>(0.0), vec4<f32>(0.0)); // Pas de rendu
  }

  var out: VertexOutput;
  let particle = getParticle(index);

  out.position = camera.projectionMatrix * vec4<f32>(particle.position.xyz, 1.0);
  out.color = particle.color;

  return out;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  return input.color;
}
