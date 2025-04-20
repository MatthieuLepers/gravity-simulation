import HilbertCurveShaderCode from '@/core/classes/GPU/Kernels/Compute/HilbertCurveShader.wgsl?raw';
import { ComputeKernel } from '@/core/classes/GPU/Kernels/Compute';
import type { GPUContext } from '@/core/classes/GPU/Context';

export const HILBERT_INDEX_STRIDE = 2;

export const PIXELS_PER_HILBERT_INDEX = Math.ceil(HILBERT_INDEX_STRIDE / 4);

export class HilbertCurveKernel extends ComputeKernel {
  constructor(context: GPUContext) {
    super(context);
    this.setDispatchSize(Math.ceil(context.particleCount / context.workgroupSize[0]));
  }

  async prepare(): Promise<void> {
    const TEXTURE_WIDTH = Math.min(8192, this.context.particleCount * PIXELS_PER_HILBERT_INDEX);
    const TEXTURE_HEIGHT = Math.ceil((this.context.particleCount * PIXELS_PER_HILBERT_INDEX) / TEXTURE_WIDTH);

    this.context.textures.hilbertTexture = this.context.device.createTexture({
      size: {
        width: TEXTURE_WIDTH,
        height: TEXTURE_HEIGHT,
      },
      format: 'rg32uint',
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
    });
    this.context.textures.sortedHilbertTexture = this.context.device.createTexture({
      size: {
        width: TEXTURE_WIDTH,
        height: TEXTURE_HEIGHT,
      },
      format: 'rg32uint',
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
    });

    this
      .initPipeline(HilbertCurveShaderCode, 'cs_hilbert_curve', {
        PARTICLE_COUNT: this.context.particleCount,
      })
      .setBinding(0, this.context.textures.particleTexture.createView())
      .setBinding(1, this.context.textures.hilbertTexture.createView())
      .setBindGroup()
    ;
  }
}
