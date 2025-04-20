import OctreeNodeShaderCode from '@/core/classes/GPU/Kernels/Render/OctreeNodeShader.wgsl?raw';
import { RenderKernel } from '@/core/classes/GPU/Kernels/Render';
import type { RenderPass } from '@/core/classes/GPU/Passes/RenderPass';
import { getMaxNodes } from '@/core/classes/GPU/Kernels/Compute/Octree/InitOctreeKernel';

export class OctreeNodeKernel extends RenderKernel {
  constructor(renderPass: RenderPass) {
    const renderModule = renderPass.context.device.createShaderModule({
      code: OctreeNodeShaderCode,
    });
    super({
      renderPass,
      pipelineDescriptor: {
        layout: 'auto',
        vertex: {
          module: renderModule,
          entryPoint: 'vs_main',
        },
        fragment: {
          module: renderModule,
          entryPoint: 'fs_main',
          targets: [{ format: renderPass.format }],
        },
        primitive: {
          topology: 'line-list',
        },
      },
    });
  }

  async prepare(): Promise<void> {
    this
      .setBinding(0, { buffer: this.renderPass.context.buffers.octreeNodes })
      .setBinding(1, { buffer: this.renderPass.camera.getUniformBuffer() })
      .setBindGroup()
    ;
  }

  async run(): Promise<void> {
    super.run();
    this.renderPass.passEncoder.draw(24, getMaxNodes(this.renderPass.context.particleCount));
  }
}
