struct OctreeNode {
  @align(16) minCorner: vec4<f32>,    // 16 bytes              - Coin inférieur du noeud
  @align(16) maxCorner: vec4<f32>,    // 16 bytes              - Coin supérieur du noeud
  children: array<i32, 8>,            // 32 bytes              - Indices des 8 enfants (-1 si vide)
  parent: u32,                        //  4 bytes              - Index du parent (-1 si racine)
  particleStart: u32,                 //  4 bytes              - Index de début des particules dans ce noeud
  particleCount: u32,                 //  4 bytes              - Nombre de particules contenues
  totalMass: f32,                     //  4 bytes              - Masse du noeud
  @align(16) centerOfMass: vec4<f32>, // 12 bytes (no padding) - Centre de masse du noeud
  subdivisionLock: i32,               //  4 bytes              - Indique si le noeud est en train d'être subdivisé
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
}

struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>,
}

@group(0) @binding(0) var<storage, read> octreeNodes: array<OctreeNode>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;

var<private> cubeEdges: array<u32, 24> = array<u32, 24>(
  0, 1,  1, 3,  3, 2,  2, 0,  // Face avant
  4, 5,  5, 7,  7, 6,  6, 4,  // Face arrière
  0, 4,  1, 5,  2, 6,  3, 7   // Connexions avant-arrière
);

var<private> cubeVertices: array<vec3<f32>, 8> = array<vec3<f32>, 8>(
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(1.0, 0.0, 0.0),
  vec3<f32>(0.0, 1.0, 0.0),
  vec3<f32>(1.0, 1.0, 0.0),
  vec3<f32>(0.0, 0.0, 1.0),
  vec3<f32>(1.0, 0.0, 1.0),
  vec3<f32>(0.0, 1.0, 1.0),
  vec3<f32>(1.0, 1.0, 1.0)
);

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32,
           @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
  var out: VertexOutput;

  let node = octreeNodes[instanceIndex];

  let edgeIndex = vertexIndex % 24u;
  let vertexID = cubeEdges[edgeIndex];

  let vertexOffset = cubeVertices[vertexID];
  let worldPos = node.minCorner.xyz + (node.maxCorner.xyz - node.minCorner.xyz) * vertexOffset;

  out.position = uniforms.modelViewProjectionMatrix * vec4<f32>(worldPos, 1.0);
  out.color = vec4<f32>(0.0, 1.0, 0.0, 1.0);

  return out;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  return input.color;
}
