import { Kernel, type IRunKernelOptions } from '@/core/classes/GPU/Kernels';
import type { ComputePass } from '@/core/classes/GPU/Passes/ComputePass';

export abstract class ComputeKernel extends Kernel<ComputePass, GPUComputePipeline> {
  public dispatchSize: [number, number, number] = [1, 1, 1];

  setDispatchSize(x: number, y: number = 1, z: number = 1) {
    this.dispatchSize = [x, y, z];
  }

  initPipeline(
    shaderCode: string,
    kernel: string,
    constants?: Record<string, number>,
  ): this {
    if (this.pipeline) return this;

    this.pipeline = this.context.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: this.context.device.createShaderModule({ code: shaderCode }),
        entryPoint: kernel,
        constants,
      },
    });
    return this;
  }

  async run(options: IRunKernelOptions<ComputePass>): Promise<void> {
    if (!this.pipeline) throw new Error('Pipeline not initialized!');
    if (!this.bindGroup) throw new Error('BindGroup not initialized!');

    options.pass.passEncoder.setPipeline(this.pipeline);
    options.pass.passEncoder.setBindGroup(0, this.bindGroup);
    options.pass.passEncoder.dispatchWorkgroups(...this.dispatchSize);
  }
}
