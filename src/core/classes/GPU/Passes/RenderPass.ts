import type { Camera } from '@/core/classes/Camera';
import type { GPUContext } from '@/core/classes/GPU/Context';
import type { RenderKernel } from '@/core/classes/GPU/Kernels/Render';
import { serial } from '@/core/utils';

export interface IRenderPassOptions {
  context: GPUContext;
  commandEncoder: GPUCommandEncoder;
  canvas: HTMLCanvasElement;
  camera: Camera;
}

export class RenderPass {
  public context: GPUContext;

  public commandEncoder: GPUCommandEncoder;

  public passEncoder: GPURenderPassEncoder;

  public canvas: HTMLCanvasElement;

  public ctx: GPUCanvasContext;

  public format: GPUTextureFormat;

  public camera: Camera;

  public kernels: Array<RenderKernel> = [];

  constructor({
    context,
    commandEncoder,
    canvas,
    camera,
  }: IRenderPassOptions) {
    this.context = context;
    this.commandEncoder = commandEncoder;
    this.canvas = canvas;
    this.camera = camera;
    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.ctx = canvas.getContext('webgpu')!;
    this.ctx.configure({ device: context.device, format: this.format });

    const depthTexture = this.context.device.createTexture({
      size: [canvas.width, canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.passEncoder = this.commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: this.ctx.getCurrentTexture().createView(),
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: [0, 0, 0, 1],
      }],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        depthClearValue: 1.0,
      },
    });
  }

  async addKernel(kernel: RenderKernel): Promise<void> {
    await kernel.prepare();
    this.kernels.push(kernel);
  }

  async submit(): Promise<void> {
    await serial(this.kernels.map((kernel) => () => kernel.run()));
    this.passEncoder.end();
    this.context.device.queue.submit([this.commandEncoder.finish()]);
    await this.context.device.queue.onSubmittedWorkDone();
  }

  static create(options: Omit<IRenderPassOptions, 'commandEncoder'>): RenderPass {
    return new RenderPass({
      ...options,
      commandEncoder: options.context.device.createCommandEncoder(),
    });
  }
}
