import { Kernel } from '@/core/classes/GPU/Kernels';
import type { RenderPass } from '@/core/classes/GPU/Passes/RenderPass';

export interface IRenderKernelOptions {
  renderPass: RenderPass;
  pipelineDescriptor: GPURenderPipelineDescriptor;
}

export abstract class RenderKernel extends Kernel<RenderPass, GPURenderPipeline> {
  public renderPass: RenderPass;

  constructor({ renderPass, pipelineDescriptor }: IRenderKernelOptions) {
    super(renderPass.context);
    this.pipeline = this.context.device.createRenderPipeline(pipelineDescriptor);
    this.renderPass = renderPass;
  }

  async run(): Promise<void> {
    if (!this.pipeline) throw new Error('Pipeline not initialized!');
    if (!this.bindGroup) throw new Error('BindGroup not initialized!');

    this.renderPass.passEncoder.setPipeline(this.pipeline);
    this.renderPass.passEncoder.setBindGroup(0, this.bindGroup);
  }
}
