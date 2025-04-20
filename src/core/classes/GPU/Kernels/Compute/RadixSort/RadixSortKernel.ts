import { ComputePass } from '@/core/classes/GPU/Passes/ComputePass';
import { ComputeKernel } from '@/core/classes/GPU/Kernels/Compute';
import { BuildHistogramKernel } from '@/core/classes/GPU/Kernels/Compute/RadixSort/BuildHistogramKernel';
import { PrefixSumKernel } from '@/core/classes/GPU/Kernels/Compute/RadixSort/PrefixSumKernel';
import { ScatterKernel } from '@/core/classes/GPU/Kernels/Compute/RadixSort/ScatterKernel';

export class RadixSortKernel extends ComputeKernel {
  async prepare(): Promise<void> {
    this.context.buffers.shiftValue = this.context.device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  async run(): Promise<void> {
    const NUM_PASSES = this.context.numBits / this.context.bitsPerPass;

    for (let i = 0; i < NUM_PASSES; i += 1) {
      const shiftValue = i * this.context.bitsPerPass;

      // Init histogram buffer
      this.context.buffers.histogram = this.context.device.createBuffer({
        size: 4 * this.context.numBuckets,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
      });

      // Init prefixSum buffer
      this.context.buffers.prefixSum = this.context.device.createBuffer({
        size: 4 * this.context.numBuckets,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
      });

      const pass = ComputePass.create(this.context);

      this.context.device.queue.writeBuffer(this.context.buffers.shiftValue, 0, new Uint32Array([shiftValue]));

      await pass.addKernel(new BuildHistogramKernel(this.context));
      await pass.addKernel(new PrefixSumKernel(this.context));
      await pass.addKernel(new ScatterKernel(this.context));

      await pass.submit();

      [this.context.textures.hilbertTexture, this.context.textures.sortedHilbertTexture] = [this.context.textures.sortedHilbertTexture, this.context.textures.hilbertTexture];
    }
    [this.context.textures.hilbertTexture, this.context.textures.sortedHilbertTexture] = [this.context.textures.sortedHilbertTexture, this.context.textures.hilbertTexture];
  }
}
