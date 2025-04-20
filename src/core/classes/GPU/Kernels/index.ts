import type { GPUContext } from '@/core/classes/GPU/Context';

export interface IRunKernelOptions<T> {
  pass: T;
}

export abstract class Kernel<T, K extends GPUPipelineBase> {
  public pipeline?: K;

  public bindings: Array<GPUBindGroupEntry> = [];

  public bindGroup?: GPUBindGroup;

  constructor(public context: GPUContext) {
  }

  setBinding(binding: number, resource: GPUBindingResource): this {
    const index = this.bindings.findIndex((b) => b.binding === binding);
    if (index !== -1) {
      this.bindings[index] = { binding, resource };
    } else {
      this.bindings.push({ binding, resource });
    }
    return this;
  }

  setBindGroup(bindings: Array<GPUBindGroupEntry> = []): void {
    if (!this.pipeline) throw new Error('Pipeline not initialized!');

    bindings.forEach(({ binding, resource }) => {
      this.setBinding(binding, resource);
    });
    this.bindGroup = this.context.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: this.bindings,
    });
  }

  abstract prepare(): Promise<void>;

  abstract run(options: IRunKernelOptions<T>): Promise<void>;
}
