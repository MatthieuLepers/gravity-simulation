import type { GPUContext } from '@/core/classes/GPU/Context';
import { ComputeKernel } from '@/core/classes/GPU/Kernels/Compute';
import RadixSortShaderCode from '@/core/classes/GPU/Kernels/Compute/RadixSort/RadixSortShader.wgsl?raw';

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
