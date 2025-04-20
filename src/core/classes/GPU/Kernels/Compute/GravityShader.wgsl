struct Particle {
  @align(16) position: vec3<f32>, // 12 bytes + 4 bytes (padding) - Particle position
  @align(16) velocity: vec3<f32>, // 12 bytes + 4 bytes (padding) - Particle velocity
  @align(16) color: vec4<f32>,    // 16 bytes                     - Particle color
  mass: f32,                      //  4 bytes                     - Particle mass
  size: f32,                      //  4 bytes                     - Particle size
  alive: u32,                     //  4 bytes                     - Marked for removal
  padding: f32,                   //  4 bytes                     - Padding
}

override WORKGROUP_SIZE: u32;
override PARTICLE_COUNT: u32;
override G: f32;

@group(0) @binding(0) var particleTextureRead: texture_storage_2d<rgba32float, read>;
@group(0) @binding(1) var particleTextureWrite: texture_storage_2d<rgba32float, write>;

const EPSILON: f32 = 1e-5;
const LIGHT_SPEED: f32 = 299792458.0;

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
    u32(data4.z),
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
  textureStore(particleTextureWrite, vec2<i32>(x + 3, y), vec4<f32>(particle.mass, particle.size, f32(particle.alive), particle.padding));
}

fn computeGravitationelForce(p1: Particle, p2: Particle) -> vec3<f32> {
  let direction = p2.position - p1.position;
  let distance = max(length(direction), 1.0);

  let forceMagnitude = (G * p1.mass * p2.mass) / (distance * distance);

  if (distance <= EPSILON) {
    return vec3<f32>(0.0, 0.0, 0.0);
  }

  return normalize(direction) * forceMagnitude;
}

@compute @workgroup_size(WORKGROUP_SIZE)
fn cs_main(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  let i = global_id.x;
  if (i >= PARTICLE_COUNT) { return; }

  var particle_i = getParticle(i);
  if (particle_i.alive == 0u) { return; }

  var totalForce = vec3<f32>(0.0, 0.0, 0.0);

  for (var j: u32 = workgroup_id.x; j < workgroup_id.x + WORKGROUP_SIZE; j++) {
    if (i == j || j >= PARTICLE_COUNT) { continue; }

    let particle_j = getParticle(j);
    if (particle_j.alive == 0u) { continue; }

    let force = computeGravitationelForce(particle_i, particle_j);
    totalForce += force;
  }

  let acceleration = totalForce / particle_i.mass;

  particle_i.velocity = clamp(particle_i.velocity + acceleration, vec3<f32>(-LIGHT_SPEED), vec3<f32>(LIGHT_SPEED));
  particle_i.position += particle_i.velocity;

  setParticle(i, particle_i);
}
