import {
  mat4,
  vec3,
  type Mat4,
  type Vec3,
} from 'wgpu-matrix';

// The common functionality between camera implementations
export class CameraBase {
  // The camera matrix
  private $matrix = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);

  // The calculated view matrix
  private readonly $view = mat4.create();

  // Aliases to column vectors of the matrix
  private $right = new Float32Array(this.$matrix.buffer, 4 * 0, 4);

  private $up = new Float32Array(this.$matrix.buffer, 4 * 4, 4);

  private $back = new Float32Array(this.$matrix.buffer, 4 * 8, 4);

  private $position = new Float32Array(this.$matrix.buffer, 4 * 12, 4);

  // Returns the camera matrix
  get matrix() {
    return this.$matrix;
  }

  // Assigns `mat` to the camera matrix
  set matrix(mat: Mat4) {
    mat4.copy(mat, this.$matrix);
  }

  // Returns the camera view matrix
  get view() {
    return this.$view;
  }

  // Assigns `mat` to the camera view
  set view(mat: Mat4) {
    mat4.copy(mat, this.$view);
  }

  // Returns column vector 0 of the camera matrix
  get right() {
    return this.$right;
  }

  // Assigns `vec` to the first 3 elements of column vector 0 of the camera matrix
  set right(vec: Vec3) {
    vec3.copy(vec, this.$right);
  }

  // Returns column vector 1 of the camera matrix
  get up() {
    return this.$up;
  }

  // Assigns `vec` to the first 3 elements of column vector 1 of the camera matrix
  set up(vec: Vec3) {
    vec3.copy(vec, this.$up);
  }

  // Returns column vector 2 of the camera matrix
  get back() {
    return this.$back;
  }

  // Assigns `vec` to the first 3 elements of column vector 2 of the camera matrix
  set back(vec: Vec3) {
    vec3.copy(vec, this.$back);
  }

  // Returns column vector 3 of the camera matrix
  get position() {
    return this.$position;
  }

  // Assigns `vec` to the first 3 elements of column vector 3 of the camera matrix
  set position(vec: Vec3) {
    vec3.copy(vec, this.$position);
  }
}
