import type { Mat4, Vec4 } from 'wgpu-matrix';

import type Input from '@/core/classes/Camera/Input';

export interface Camera {
  // update updates the camera using the user-input and returns the view matrix.
  update(delta_time: number, input: Input): Mat4;

  // The camera matrix.
  // This is the inverse of the view matrix.
  matrix: Mat4;
  // Alias to column vector 0 of the camera matrix.
  right: Vec4;
  // Alias to column vector 1 of the camera matrix.
  up: Vec4;
  // Alias to column vector 2 of the camera matrix.
  back: Vec4;
  // Alias to column vector 3 of the camera matrix.
  position: Vec4;
}
