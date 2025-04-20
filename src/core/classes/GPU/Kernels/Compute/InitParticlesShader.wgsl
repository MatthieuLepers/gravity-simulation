struct Element {
  @align(16) color: vec4<f32>,
  mass: f32,
  rarity: f32,
  padding: vec2<f32>,
}

override PARTICLE_COUNT: u32;
override INIT_VELOCITY: u32 = 1u;
override VELOCITY_FACTOR: f32 = 0.05;

@group(0) @binding(0) var particleTexture: texture_storage_2d<rgba32float, write>;
@group(0) @binding(1) var<storage, read> elementsData: array<Element>;
@group(0) @binding(2) var gaussianNoiseTexture: texture_storage_2d<rgba32float, read>;
@group(0) @binding(3) var uniformNoiseTexture: texture_storage_2d<rgba32float, read>;

fn chooseElement(coord: vec2<i32>) -> Element {
  let noise = textureLoad(uniformNoiseTexture, coord);
  let rand = fract(noise.x + noise.y * 0.5 + noise.z * 0.25);  // Génère un meilleur aléa

  var sum = 0.0;
  for (var i = 0u; i < arrayLength(&elementsData); i = i + 1u) {
    sum = sum + elementsData[i].rarity;
    if (rand < sum) {
      return elementsData[i];
    }
  }
  return elementsData[arrayLength(&elementsData) - 1u]; // Dernier élément si rien n'est choisi
}

@compute @workgroup_size(256)
fn cs_init_particles(@builtin(global_invocation_id) id: vec3<u32>) {
  let index = id.x;
  if (index >= PARTICLE_COUNT) { return; }

  let dimNoiseX = textureDimensions(gaussianNoiseTexture).r;
  let pxNoise = i32(index % dimNoiseX);
  let pyNoise = i32(index / dimNoiseX);

  let element = chooseElement(vec2<i32>(pxNoise, pyNoise));
  let position = textureLoad(gaussianNoiseTexture, vec2<i32>(pxNoise, pyNoise)).rgb;

  var velocity = vec3<f32>(0.0);
  if (INIT_VELOCITY == 1u) {
    velocity = (position.xyz * 2.0 - vec3<f32>(1.0)) * VELOCITY_FACTOR;
  }

  let dimX = textureDimensions(particleTexture).r;
  let px = i32((index * 4u) % dimX);
  let py = i32((index * 4u) / dimX);

  textureStore(particleTexture, vec2<i32>(px, py), vec4<f32>(position, 0.0));
  textureStore(particleTexture, vec2<i32>(px + 1, py), vec4<f32>(velocity, 0.0));
  textureStore(particleTexture, vec2<i32>(px + 2, py), element.color);
  textureStore(particleTexture, vec2<i32>(px + 3, py), vec4<f32>(element.mass, pow(element.mass, 1.0 / 3.0), 1.0, 0.0));
}
