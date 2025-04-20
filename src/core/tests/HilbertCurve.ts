import { HILBERT_INDEX_STRIDE } from '@/core/classes/GPU/Kernels/Compute/HilbertCurveKernel';
import { readStorageTexture } from '@/core/classes/utils';
import { extractData, getAsUint32Array } from '@/core/tests/utils';
import type { GPUContext } from '@/core/classes/GPU/Context';

export const HilbertCurveDebug = async (context: GPUContext) => {
  const textureData = await readStorageTexture(context.device, context.textures.hilbertTexture, getAsUint32Array);
  const extractedData = extractData(textureData, HILBERT_INDEX_STRIDE, context.particleCount);

  console.log('[HilbertCurve] hilbertTexture', extractedData);
};
