import GravityShaderCode from '@/core/classes/GPU/Kernels/Compute/GravityShader.wgsl?raw';
import { ComputeKernel } from '@/core/classes/GPU/Kernels/Compute';
import type { GPUContext } from '@/core/classes/GPU/Context';

export class GravityKernel extends ComputeKernel {
  constructor(context: GPUContext) {
    super(context);
    this.setDispatchSize(Math.ceil(context.particleCount / context.workgroupSize[0]));
  }

  async prepare(): Promise<void> {
    this
      .initPipeline(GravityShaderCode, 'cs_main', {
        WORKGROUP_SIZE: this.context.workgroupSize[0],
        PARTICLE_COUNT: this.context.particleCount,
        G: this.context.gravity,
      })
      .setBinding(0, this.context.textures.particleTexture.createView())
      .setBinding(1, this.context.textures.sortedParticleTexture.createView())
      .setBindGroup()
    ;
  }
}
