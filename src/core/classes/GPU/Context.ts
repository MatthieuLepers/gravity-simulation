import type { DistributionType } from '@/core/classes/DistributionType';

export interface IGPUContextOptions {
  device: GPUDevice;
  particleCount: number;
  distributionType: DistributionType;
  workgroupSizeX?: number;
  workgroupSizeY?: number;
  workgroupSizeZ?: number;
  bitsPerPass?: number;
  numBits?: number;
  initParticlesDone?: boolean;
  initVelocity?: boolean;
  velocityFactor?: number;
  gravity?: number;
}

export class GPUContext {
  public device: GPUDevice;

  public particleCount: number;

  public distributionType: DistributionType;

  public workgroupSize: [number, number, number] = [1, 1, 1];

  public bitsPerPass: number = 8;

  public numBits: number = 32;

  public initParticlesDone: boolean = false;

  public initVelocity: boolean = true;

  public velocityFactor: number = 0.05;

  public gravity: number = 6.6743e-5;

  public debug: boolean = false;

  public textures: Record<string, GPUTexture> = {};

  public buffers: Record<string, GPUBuffer> = {};

  constructor({
    device,
    particleCount,
    distributionType,
    workgroupSizeX = 256,
    workgroupSizeY = 1,
    workgroupSizeZ = 1,
    bitsPerPass = 8,
    numBits = 32,
    initParticlesDone = false,
    initVelocity = true,
    velocityFactor = 0.05,
  }: IGPUContextOptions) {
    this.device = device;
    this.particleCount = particleCount;
    this.distributionType = distributionType;
    this.workgroupSize = [workgroupSizeX, workgroupSizeY, workgroupSizeZ];
    this.bitsPerPass = bitsPerPass;
    this.numBits = numBits;
    this.initParticlesDone = initParticlesDone;
    this.initVelocity = initVelocity;
    this.velocityFactor = velocityFactor;
  }

  get numBuckets() {
    return 2 ** this.bitsPerPass;
  }
}
