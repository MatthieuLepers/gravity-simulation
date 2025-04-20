import { mat4, vec3 } from 'wgpu-matrix';

import { createInputHandler, type InputHandler } from '@/core/classes/Camera/Input';
import type { Camera as ICamera } from '@/core/classes/Camera/i';
import { WASDCamera } from '@/core/classes/Camera/WASDCamera';
import { ArcballCamera } from '@/core/classes/Camera/ArcballCamera';

export class Camera {
  private inputHandler: InputHandler;

  private initialCameraPosition: Float32Array = vec3.create(0, 0, 50);

  private instances: Record<string, ICamera> = {
    wasd: new WASDCamera({
      position: this.initialCameraPosition,
    }),
    arcball: new ArcballCamera({
      position: this.initialCameraPosition,
    }),
  };

  private uniformBuffer: GPUBuffer;

  private aspect: number;

  private projectionMatrix: Float32Array;

  private modelViewProjectionMatrix: Float32Array = mat4.create();

  private lastFrameMS: number = Date.now();

  private type: string = 'arcball';

  constructor(
    public device: GPUDevice,
    public canvas: HTMLCanvasElement,
  ) {
    this.inputHandler = createInputHandler(window, canvas);
    this.uniformBuffer = device.createBuffer({
      size: 4 * 36,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.aspect = canvas.width / canvas.height;
    this.projectionMatrix = mat4.perspective((2 * Math.PI) / 5, this.aspect, 0.01, 10000.0);
  }

  setRenderDistance(min: number = 1, max: number = 100) {
    this.projectionMatrix = mat4.perspective((2 * Math.PI) / 5, this.aspect, min, max);
  }

  private get cameraInstance() {
    return this.instances[this.type];
  }

  private getCameraUniformData(deltaTime: number) {
    const viewMatrix = this.cameraInstance.update(deltaTime, this.inputHandler());
    mat4.multiply(this.projectionMatrix, viewMatrix, this.modelViewProjectionMatrix);

    return new Float32Array([
      ...this.modelViewProjectionMatrix,
      ...viewMatrix,
      ...this.cameraInstance.position,
    ]);
  }

  setType(type: 'wasd' | 'arcball') {
    this.instances[type].matrix = this.instances[this.type].matrix;
    this.type = type;
  }

  getUniformBuffer() {
    return this.uniformBuffer;
  }

  frame() {
    const now = Date.now();
    const deltaTime = (now - this.lastFrameMS) / 1000;
    this.lastFrameMS = now;

    const cameraUniforms = this.getCameraUniformData(deltaTime);
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      cameraUniforms.buffer,
      cameraUniforms.byteOffset,
      cameraUniforms.byteLength,
    );
  }
}
