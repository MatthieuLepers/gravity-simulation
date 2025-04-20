import InitParticlesShaderCode from '@/core/classes/GPU/Kernels/Compute/InitParticlesShader.wgsl?raw';
import { CreateNoiseTexture } from '@/core/classes/DistributionType';
import { elements, flatten } from '@/core/classes/ParticleData';
import { ComputeKernel } from '@/core/classes/GPU/Kernels/Compute';
import type { GPUContext } from '@/core/classes/GPU/Context';

export const PARTICLE_STRIDE = 16;

export const PIXELS_PER_PARTICLE = Math.ceil(PARTICLE_STRIDE / 4);

export function getParticlesTextureDimensions(particleCount: number) {
  const width = Math.min(8192, particleCount * PIXELS_PER_PARTICLE);
  const height = Math.ceil((particleCount * PIXELS_PER_PARTICLE) / width);

  return { width, height };
}

export class InitParticlesKernel extends ComputeKernel {
  constructor(context: GPUContext) {
    super(context);
    this.setDispatchSize(Math.ceil(context.particleCount / context.workgroupSize[0]));
  }

  async prepare(): Promise<void> {
    const { width: TEXTURE_WIDTH, height: TEXTURE_HEIGHT } = getParticlesTextureDimensions(this.context.particleCount);
    // Init particles texture
    this.context.textures.particleTexture = this.context.device.createTexture({
      size: { width: TEXTURE_WIDTH, height: TEXTURE_HEIGHT },
      format: 'rgba32float',
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // Init sorted particles texture
    this.context.textures.sortedParticleTexture = this.context.device.createTexture({
      size: { width: TEXTURE_WIDTH, height: TEXTURE_HEIGHT },
      format: 'rgba32float',
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // Init elementData buffer
    const elementsData = new Float32Array(elements
      .reduce((acc, element) => [...acc, ...flatten(element)], [] as number[]));
    this.context.buffers.elementsData = this.context.device.createBuffer({
      size: elementsData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.context.device.queue.writeBuffer(this.context.buffers.elementsData, 0, elementsData);

    // Init noise textures
    const { width, height } = {
      width: TEXTURE_WIDTH / PIXELS_PER_PARTICLE,
      height: TEXTURE_HEIGHT,
    };
    this.context.textures.gaussianNoiseTexture = CreateNoiseTexture[this.context.distributionType](this.context.device, width, height);
    this.context.textures.uniformNoiseTexture = CreateNoiseTexture.uniform(this.context.device, width, height);

    this.initPipeline(InitParticlesShaderCode, 'cs_init_particles', {
      PARTICLE_COUNT: this.context.particleCount,
      INIT_VELOCITY: +this.context.initVelocity,
      VELOCITY_FACTOR: this.context.velocityFactor,
    })
      .setBinding(0, this.context.textures.particleTexture.createView())
      .setBinding(1, { buffer: this.context.buffers.elementsData })
      .setBinding(2, this.context.textures.gaussianNoiseTexture.createView())
      .setBinding(3, this.context.textures.uniformNoiseTexture.createView())
      .setBindGroup()
    ;
  }
}
