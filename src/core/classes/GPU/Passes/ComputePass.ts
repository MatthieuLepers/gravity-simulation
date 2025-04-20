import { serial } from '@/core/utils';
import type { ComputeKernel } from '@/core/classes/GPU/Kernels/Compute';
import type { GPUContext } from '@/core/classes/GPU/Context';

export class ComputePass {
  public kernels: Array<ComputeKernel> = [];

  public passEncoder: GPUComputePassEncoder;

  constructor(
    public context: GPUContext,
    public commandEncoder: GPUCommandEncoder,
  ) {
    this.passEncoder = this.commandEncoder.beginComputePass();
  }

  async addKernel(kernel: ComputeKernel): Promise<void> {
    await kernel.prepare();
    this.kernels.push(kernel);
  }

  async submit(): Promise<void> {
    await serial(this.kernels.map((kernel) => () => kernel.run({ pass: this })));
    this.passEncoder.end();
    this.context.device.queue.submit([this.commandEncoder.finish()]);
    await this.context.device.queue.onSubmittedWorkDone();
  }

  static create(context: GPUContext): ComputePass {
    const commandEncoder = context.device.createCommandEncoder();
    return new ComputePass(context, commandEncoder);
  }
}
