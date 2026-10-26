import { MORTON_INDEX_STRIDE } from '@/core/classes/GPU/Kernels/Compute/MortonCodeKernel';
import { readStorageTexture } from '@/core/classes/utils';
import { extractData, getAsUint32Array } from '@/core/tests/utils';
import type { GPUContext } from '@/core/classes/GPU/Context';

export const MortonCodeDebug = async (context: GPUContext) => {
  const textureData = await readStorageTexture(context.device, context.textures.mortonTexture, getAsUint32Array);
  const extractedData = extractData(textureData, MORTON_INDEX_STRIDE, context.particleCount);

  console.log('[MortonCode] mortonTexture', extractedData);
};
