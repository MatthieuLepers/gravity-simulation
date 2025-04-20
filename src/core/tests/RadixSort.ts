import { HILBERT_INDEX_STRIDE } from '@/core/classes/GPU/Kernels/Compute/HilbertCurveKernel';
import { readStorageTexture } from '@/core/classes/utils';
import { extractData, getAsUint32Array } from '@/core/tests/utils';
import { PARTICLE_STRIDE } from '@/core/classes/GPU/Kernels/Compute/InitParticlesKernel';
import type { GPUContext } from '@/core/classes/GPU/Context';

export const RadixSortDebug = async (context: GPUContext) => {
  const inputTextureData = await readStorageTexture(context.device, context.textures.hilbertTexture, getAsUint32Array);
  const inputExtractedData = extractData(inputTextureData, HILBERT_INDEX_STRIDE, context.particleCount);

  console.log('[RadixSort] inputTexture', inputExtractedData);

  const outputTextureData = await readStorageTexture(context.device, context.textures.sortedHilbertTexture, getAsUint32Array);
  const outputExtractedData = extractData(outputTextureData, HILBERT_INDEX_STRIDE, context.particleCount);
  const isSorted = outputExtractedData.every(([hilbertKey], index, arr) => index === 0 || hilbertKey >= arr[index - 1][0]);

  console.log('[RadixSort] outputTexture', outputExtractedData);

  console.log('[RadixSort] isSorted', isSorted);
};

export const ReorderParticleDebug = async (context: GPUContext) => {
  const textureData = await readStorageTexture(context.device, context.textures.sortedParticleTexture);
  const extractedData = extractData(textureData, PARTICLE_STRIDE, context.particleCount);

  console.log('[ReorderParticle] sortedParticleTexture', extractedData);
};
