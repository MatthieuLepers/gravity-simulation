import OctreeShaderCode from '@/core/classes/GPU/Kernels/Compute/OctreeShader.wgsl?raw';
import { ComputeKernel } from '@/core/classes/GPU/Kernels/Compute';
import { copyTexture } from '@/core/classes/utils';

export class InsertParticlesKernel extends ComputeKernel {
  async prepare(): Promise<void> {
    // Init octreeParticle texture
    this.context.textures.octreeParticleTexture = await copyTexture(this.context.device, this.context.textures.sortedParticleTexture);

    this
      .initPipeline(OctreeShaderCode, 'cs_insert_particles', {
        WORKGROUP_SIZE: this.context.workgroupSize[0],
        PARTICLE_COUNT: this.context.particleCount,
        MAX_PARTICLE_PER_LEAF: Math.sqrt(this.context.particleCount) * 2,
      })
      .setBinding(0, this.context.textures.sortedParticleTexture.createView())
      .setBinding(1, this.context.textures.octreeParticleTexture.createView())
      .setBinding(2, { buffer: this.context.buffers.octreeNodes })
      .setBinding(3, { buffer: this.context.buffers.freeNodeIndices })
      .setBinding(4, { buffer: this.context.buffers.freeNodeCounter })
      .setBindGroup()
    ;
  }
}
