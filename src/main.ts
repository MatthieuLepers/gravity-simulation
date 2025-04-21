import { GUI } from 'dat.gui';

import { Camera } from '@/core/classes/Camera';
import { DistributionType } from '@/core/classes/DistributionType';
import { RenderPass } from '@/core/classes/GPU/Passes/RenderPass';
// import { Texture2DKernel } from '@/core/classes/GPU/Kernels/Render/Texture2DKernel';
import { BillboardingKernel } from '@/core/classes/GPU/Kernels/Render/BillboardingKernel';
// import { OctreeNodeKernel } from '@/core/classes/GPU/Kernels/Render/OctreeNodeKernel';
import { GPUContext } from '@/core/classes/GPU/Context';
import { MakeInterstellarCloud } from '@/core/classes/GPU/InterstellarCloud';

import './style.css';

interface GUIParams {
  camera: 'wasd' | 'arcball';
  particleCount: number;
  distributionType: 'cube' | 'gaussian' | 'gaussian-disc' | 'sphere';
  initVelocity: boolean;
  velocityFactor: number;
  gravity: number;
}

export async function main() {
  const warning = document.getElementById('warning');

  if (!navigator.gpu) {
    console.error('WebGPU n\'est pas supporté par votre navigateur !');
    warning?.classList.remove('hide');
    return;
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.error('WebGPU Adapter non disponible !');
    warning?.classList.remove('hide');
    return;
  }

  const device = await adapter.requestDevice({
    requiredLimits: {
      maxTextureDimension2D: 8192,
    },
  });

  // Init GUI
  const gui = new GUI({ width: 340 });
  const params: GUIParams = {
    camera: 'arcball',
    particleCount: 10000,
    distributionType: 'gaussian',
    initVelocity: true,
    velocityFactor: 0.05,
    gravity: -5,
  };

  const canvas = document.createElement('canvas');
  document.getElementById('app')!.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const camera = new Camera(device, canvas);
  const context = new GPUContext({
    device,
    particleCount: params.particleCount,
    distributionType: params.distributionType as DistributionType,
    workgroupSizeX: 256,
    bitsPerPass: 8,
    numBits: 32,
    initParticlesDone: false,
  });

  gui
    .add(params, 'camera', ['arcball', 'wasd'])
    .name('Camera type')
    .onChange(() => {
      camera.setType(params.camera);
    })
  ;
  gui
    .add(params, 'particleCount', 100, 1e7, 100)
    .name('Particles count')
    .onChange((particleCount: number) => {
      context.particleCount = particleCount;
    })
  ;
  gui
    .add(params, 'distributionType', Object.values(DistributionType))
    .name('Distribution type')
    .onChange((distributionType: DistributionType) => {
      context.distributionType = distributionType;
    })
  ;
  gui
    .add(params, 'initVelocity')
    .name('Init velocity?')
    .onChange((initVelocity: boolean) => {
      context.initVelocity = initVelocity;
    })
  ;
  gui
    .add(params, 'velocityFactor', 0.01, 0.1, 0.01)
    .name('Velocity multiplier')
    .onChange((velocityFactor: number) => {
      context.velocityFactor = velocityFactor;
    })
  ;
  gui
    .add(params, 'gravity', -11, -1, -1)
    .name('Gravity strength')
    .onChange((gravity: number) => {
      context.gravity = 6.6743 * (10 ** gravity);
    })
  ;
  const restartBtn = gui
    .add({ restart() { context.initParticlesDone = false; } }, 'restart')
    .name('Restart simulation')
  ;
  const btnStyle = (restartBtn.domElement.previousSibling as HTMLElement)!.style;
  btnStyle.textAlign = 'center';
  btnStyle.fontWeight = 'bold';

  async function frame() {
    camera.frame();

    await MakeInterstellarCloud(context);

    const pass = RenderPass.create({ context, canvas, camera });
    // await pass.addKernel(new Texture2DKernel(pass));
    await pass.addKernel(new BillboardingKernel(pass));
    // await pass.addKernel(new OctreeNodeKernel(pass));
    await pass.submit();

    requestAnimationFrame(frame);
  }

  frame();
}

window.addEventListener('DOMContentLoaded',async  () => {
  await main();
});
