struct Particle {
  @align(16) position: vec3<f32>, // 12 bytes + 4 bytes (padding) - Particle position
  @align(16) velocity: vec3<f32>, // 12 bytes + 4 bytes (padding) - Particle velocity
  @align(16) color: vec4<f32>,    // 16 bytes                     - Particle color
  mass: f32,                      //  4 bytes                     - Particle mass
  size: f32,                      //  4 bytes                     - Particle size
  alive: u32,                     //  4 bytes                     - Mark to remove
  padding: f32,                   //  4 bytes                     - Padding
}

override WORKGROUP_SIZE: u32;
override PARTICLE_COUNT: u32;
override SIZE_FACTOR: f32 = 1;

@group(0) @binding(0) var particleTextureRead: texture_storage_2d<rgba32float, read>;
@group(0) @binding(1) var particleTextureWrite: texture_storage_2d<rgba32float, write>;

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
    data4.y * SIZE_FACTOR,
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

@compute @workgroup_size(WORKGROUP_SIZE)
fn cs_main(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  let i = global_id.x;
  if (i >= PARTICLE_COUNT) { return; }

  var particle_i = getParticle(i);
  if (particle_i.alive == 0u) { return; }

  for (var j: u32 = workgroup_id.x; j < workgroup_id.x + WORKGROUP_SIZE; j++) {
    if (i == j) { continue; }

    var particle_j = getParticle(j);
    if (particle_j.alive == 0u) { continue; }

    if (distance(particle_i.position, particle_j.position) < particle_i.size + particle_j.size) {
      let newMass = particle_i.mass + particle_j.mass;
      let newSize = pow(newMass, 1.0 / 3.0);
      let newPosition = (particle_i.position * particle_i.mass + particle_j.position * particle_j.mass) / newMass;
      let newVelocity = (particle_i.velocity * particle_i.mass + particle_j.velocity * particle_j.mass) / newMass;

      particle_i.mass = newMass;
      particle_i.size = newSize;
      particle_i.position = newPosition;
      particle_i.velocity = newVelocity;
      setParticle(i, particle_i);

      particle_j.alive = 0u;
      particle_j.mass = 0.0;
      particle_j.size = 0.0;
      particle_j.color = vec4<f32>(particle_j.color.rgb, 0.0);
      particle_j.velocity = vec3<f32>(0.0);
      setParticle(j, particle_j);
    }
  }
}
