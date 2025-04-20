import type { GPUContext } from '@/core/classes/GPU/Context';
import { ComputePass } from '@/core/classes/GPU/Passes/ComputePass';
import { InitParticlesKernel } from '@/core/classes/GPU/Kernels/Compute/InitParticlesKernel';
import { GravityKernel } from '@/core/classes/GPU/Kernels/Compute/GravityKernel';
// import { CollisionKernel } from '@/core/classes/GPU/Kernels/Compute/CollisionKernel';

export const MakeInterstellarCloud = async (context: GPUContext) => {
  // Pass 1 - Init & Gravity
  const pass1 = ComputePass.create(context);

  if (!context.initParticlesDone) {
    await pass1.addKernel(new InitParticlesKernel(context));
    context.initParticlesDone = true;
  }
  await pass1.addKernel(new GravityKernel(context));
  // await pass1.addKernel(new CollisionKernel(context));
  await pass1.submit();

  [context.textures.particleTexture, context.textures.sortedParticleTexture] = [context.textures.sortedParticleTexture, context.textures.particleTexture];
};
