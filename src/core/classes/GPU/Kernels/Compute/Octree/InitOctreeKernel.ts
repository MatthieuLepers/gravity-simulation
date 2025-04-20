import OctreeShaderCode from '@/core/classes/GPU/Kernels/Compute/OctreeShader.wgsl?raw';
import { ComputeKernel } from '@/core/classes/GPU/Kernels/Compute';

export const OCTREE_NODE_STRIDE = 24;

const nextPowerOf8 = (n: number): number => (n <= 1 ? 1 : 8 ** (Math.ceil(Math.log(n) / Math.log(8))));

export const getMaxNodes = (particleCount: number) => {
  const maxParticlePerLeaf = Math.sqrt(particleCount) * 2;
  const reduce = (acc: number, val: number): number => (Math.ceil(val / 8) === 1
    ? acc + 1
    : reduce(acc + val, Math.ceil(val / 8)));

  const powerOf8 = nextPowerOf8(particleCount / maxParticlePerLeaf);
  return reduce(powerOf8, powerOf8);
};

export class InitOctreeKernel extends ComputeKernel {
  async prepare(): Promise<void> {
    const MAX_NODES = getMaxNodes(this.context.particleCount);

    // Init octreeNodes buffer
    this.context.buffers.octreeNodes = this.context.device.createBuffer({
      size: MAX_NODES * OCTREE_NODE_STRIDE * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });

    // Init freeNodeIndices buffer
    this.context.buffers.freeNodeIndices = this.context.device.createBuffer({
      size: MAX_NODES * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });

    // Init freeNodeCounter buffer
    this.context.buffers.freeNodeCounter = this.context.device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });

    this
      .initPipeline(OctreeShaderCode, 'cs_init_octree', {
        // PARTICLE_COUNT: this.context.particleCount,
      })
      .setBinding(2, { buffer: this.context.buffers.octreeNodes })
      .setBinding(3, { buffer: this.context.buffers.freeNodeIndices })
      .setBinding(4, { buffer: this.context.buffers.freeNodeCounter })
      .setBindGroup()
    ;
  }
}
