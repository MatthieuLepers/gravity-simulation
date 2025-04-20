import RadixSortShaderCode from '@/core/classes/GPU/Kernels/Compute/RadixSortShader.wgsl?raw';
import { ComputeKernel } from '@/core/classes/GPU/Kernels/Compute';
import type { GPUContext } from '@/core/classes/GPU/Context';

export class ReorderParticlesKernel extends ComputeKernel {
  constructor(context: GPUContext) {
    super(context);
    this.setDispatchSize(Math.ceil(context.particleCount / context.workgroupSize[0]));
  }

  async prepare(): Promise<void> {
    this
      .initPipeline(RadixSortShaderCode, 'c_reorder_particles', {
        WORKGROUP_SIZE: this.context.workgroupSize[0],
        PARTICLE_COUNT: this.context.particleCount,
      })
      .setBinding(0, this.context.textures.sortedHilbertTexture.createView())
      .setBinding(5, this.context.textures.particleTexture.createView())
      .setBinding(6, this.context.textures.sortedParticleTexture.createView())
      .setBindGroup()
    ;
  }
}
