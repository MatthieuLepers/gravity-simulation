import type { GPUContext } from '@/core/classes/GPU/Context';
import { MORTON_INDEX_STRIDE } from '@/core/classes/GPU/Kernels/Compute/MortonCodeKernel';
import { readStorageTexture } from '@/core/classes/utils';
import { extractData, getAsUint32Array } from '@/core/tests/utils';

export const MortonCodeDebug = async (context: GPUContext) => {
  const textureData = await readStorageTexture(context.device, context.textures.mortonTexture, getAsUint32Array);
  const extractedData = extractData(textureData, MORTON_INDEX_STRIDE, context.particleCount);
  const particuleIndexGroupedByMortonCode = extractedData.reduce((acc, val) => ({
    ...acc,
    [val[0]]: [
      ...(acc[val[0]] ?? []),
      val[1],
    ],
  }), {} as Record<string, Array<number>>);

  console.log('[MortonCode] mortonTexture', extractedData, particuleIndexGroupedByMortonCode);
};
