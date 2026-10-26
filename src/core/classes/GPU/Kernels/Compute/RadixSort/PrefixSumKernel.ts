import type { GPUContext } from '@/core/classes/GPU/Context';
import { ComputeKernel } from '@/core/classes/GPU/Kernels/Compute';
import RadixSortShaderCode from '@/core/classes/GPU/Kernels/Compute/RadixSort/RadixSortShader.wgsl?raw';

export class PrefixSumKernel extends ComputeKernel {
  constructor(context: GPUContext) {
    super(context);
    this.setDispatchSize(Math.ceil(context.numBuckets / context.workgroupSize[0]));
  }

  async prepare(): Promise<void> {
    this
      .initPipeline(RadixSortShaderCode, 'c_prefix_sum', {
        WORKGROUP_SIZE: this.context.workgroupSize[0],
      })
      .setBinding(3, { buffer: this.context.buffers.histogram })
      .setBinding(4, { buffer: this.context.buffers.prefixSum })
      .setBindGroup()
    ;
  }
}
