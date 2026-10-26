import MortonCodeShaderCode from '@/core/classes/GPU/Kernels/Compute/MortonCodeShader.wgsl?raw';
import { ComputeKernel } from '@/core/classes/GPU/Kernels/Compute';
import type { GPUContext } from '@/core/classes/GPU/Context';

// The existing texture/kernel names are retained for compatibility; keys are Morton codes.
export const MORTON_GRID_SIZE = 1024;
export const MORTON_MIN_BOUND = -100;
export const MORTON_MAX_BOUND = 100;

export const MORTON_INDEX_STRIDE = 2;

export const PIXELS_PER_MORTON_INDEX = Math.ceil(MORTON_INDEX_STRIDE / 4);

export class MortonCodeKernel extends ComputeKernel {
  constructor(context: GPUContext) {
    super(context);
    this.setDispatchSize(Math.ceil(context.particleCount / context.workgroupSize[0]));
  }

  async prepare(): Promise<void> {
    const TEXTURE_WIDTH = Math.min(8192, this.context.particleCount * PIXELS_PER_MORTON_INDEX);
    const TEXTURE_HEIGHT = Math.ceil((this.context.particleCount * PIXELS_PER_MORTON_INDEX) / TEXTURE_WIDTH);

    this.context.textures.mortonTexture = this.context.device.createTexture({
      size: {
        width: TEXTURE_WIDTH,
        height: TEXTURE_HEIGHT,
      },
      format: 'rg32uint',
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
    });
    this.context.textures.sortedMortonTexture = this.context.device.createTexture({
      size: {
        width: TEXTURE_WIDTH,
        height: TEXTURE_HEIGHT,
      },
      format: 'rg32uint',
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
    });

    this
      .initPipeline(MortonCodeShaderCode, 'cs_morton_code', {
        PARTICLE_COUNT: this.context.particleCount,
        GRID_SIZE: MORTON_GRID_SIZE,
        MIN_BOUND: MORTON_MIN_BOUND,
        MAX_BOUND: MORTON_MAX_BOUND,
      })
      .setBinding(0, this.context.textures.particleTexture.createView())
      .setBinding(1, this.context.textures.mortonTexture.createView())
      .setBindGroup()
    ;
  }
}
