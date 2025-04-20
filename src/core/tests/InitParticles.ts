import { PARTICLE_STRIDE } from '@/core/classes/GPU/Kernels/Compute/InitParticlesKernel';
import { readStorageTexture } from '@/core/classes/utils';
import { extractData, getAsFloat32Array } from '@/core/tests/utils';
import type { GPUContext } from '@/core/classes/GPU/Context';

export const InitParticlesDebug = async (context: GPUContext) => {
  const textureData = await readStorageTexture(context.device, context.textures.particleTexture, getAsFloat32Array);
  const extractedData = extractData(textureData, PARTICLE_STRIDE, context.particleCount);

  console.log('[InitParticles] particleTexture', extractedData);
};
