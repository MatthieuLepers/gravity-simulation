import RadixSortShaderCode from '@/core/classes/GPU/Kernels/Compute/RadixSortShader.wgsl?raw';
import { ComputeKernel } from '@/core/classes/GPU/Kernels/Compute';
import type { GPUContext } from '@/core/classes/GPU/Context';

export class ScatterKernel extends ComputeKernel {
  constructor(context: GPUContext) {
    super(context);
    this.setDispatchSize(Math.ceil(context.particleCount / context.workgroupSize[0]));
  }

  async prepare(): Promise<void> {
    this
      .initPipeline(RadixSortShaderCode, 'c_scatter', {
        PARTICLE_COUNT: this.context.particleCount,
        WORKGROUP_SIZE: this.context.workgroupSize[0],
        BITS_PER_PASS: this.context.bitsPerPass,
      })
      .setBinding(0, this.context.textures.hilbertTexture.createView())
      .setBinding(1, this.context.textures.sortedHilbertTexture.createView())
      .setBinding(2, { buffer: this.context.buffers.shiftValue })
      .setBinding(4, { buffer: this.context.buffers.prefixSum })
      .setBindGroup()
    ;
  }
}
