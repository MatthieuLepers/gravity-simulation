import BillboardingShaderCode from '@/core/classes/GPU/Kernels/Render/BillboardingShader.wgsl?raw';
import { RenderKernel } from '@/core/classes/GPU/Kernels/Render';
import type { RenderPass } from '@/core/classes/GPU/Passes/RenderPass';

export class BillboardingKernel extends RenderKernel {
  constructor(renderPass: RenderPass) {
    const shaderModule = renderPass.context.device.createShaderModule({
      code: BillboardingShaderCode,
    });
    super({
      renderPass,
      pipelineDescriptor: {
        layout: 'auto',
        vertex: {
          module: shaderModule,
          entryPoint: 'vs_billboard',
          buffers: [
            {
              arrayStride: 2 * 4,
              attributes: [
                {
                  shaderLocation: 0,
                  offset: 0,
                  format: 'float32x2',
                },
              ],
            },
          ],
        },
        fragment: {
          module: shaderModule,
          entryPoint: 'fs_billboard',
          targets: [{ format: 'bgra8unorm' }],
        },
        primitive: {
          topology: 'triangle-list',
          cullMode: 'none',
        },
        depthStencil: {
          format: 'depth24plus',
          depthWriteEnabled: true,
          depthCompare: 'less',
        },
      },
    });
  }

  async prepare(): Promise<void> {
    const quadVertices = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]);

    this.context.buffers.quadBuffer = this.context.device.createBuffer({
      size: quadVertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.context.device.queue.writeBuffer(this.context.buffers.quadBuffer, 0, quadVertices);

    this
      .setBinding(0, this.context.textures.particleTexture.createView())
      .setBinding(1, { buffer: this.renderPass.camera.getUniformBuffer() })
      .setBindGroup()
    ;
  }

  async run(): Promise<void> {
    super.run();
    this.renderPass.passEncoder.setVertexBuffer(0, this.context.buffers.quadBuffer);
    this.renderPass.passEncoder.draw(6, this.context.particleCount);
  }
}
