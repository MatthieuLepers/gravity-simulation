export enum DistributionType {
  Cube = 'cube',
  Gaussian = 'gaussian',
  GaussianDisc = 'gaussian-disc',
  Sphere = 'sphere',
}

export function randomGaussian(mean = 0, stdDev = 1) {
  const u = 1 - Math.random();
  const v = 1 - Math.random();
  const standardNormal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

  return mean + stdDev * standardNormal;
}

export function randomUniform(min = 0, max = 1) {
  return (min + Math.random() * max) - (0.5 * max);
}

export function randomUniformSphere() {
  // Générer un angle azimutal et un angle polaire
  const theta = Math.random() * 2 * Math.PI; // Azimutal entre 0 et 2π
  const phi = Math.acos(2 * Math.random() - 1); // Polaire entre 0 et π

  // Conversion des coordonnées sphériques en cartésiennes
  const scale = Math.cbrt(Math.random());
  const x = Math.sin(phi) * Math.cos(theta) * scale;
  const y = Math.sin(phi) * Math.sin(theta) * scale;
  const z = Math.cos(phi) * scale;

  return { x, y, z };
}

export function createUniformNoiseTexture(
  device: GPUDevice,
  width: number,
  height: number,
  min: number = 0,
  max: number = 1,
): GPUTexture {
  const size = width * height;
  const data = new Float32Array(size * 4);

  for (let i = 0; i < size; i += 1) {
    data[i * 4 + 0] = randomUniform(min, max);
    data[i * 4 + 1] = randomUniform(min, max);
    data[i * 4 + 2] = randomUniform(min, max);
    data[i * 4 + 3] = 1.0;
  }

  const texture = device.createTexture({
    size: { width, height },
    format: 'rgba32float',
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
  });

  device.queue.writeTexture(
    { texture },
    data.buffer,
    { bytesPerRow: width * 16, rowsPerImage: height },
    { width, height, depthOrArrayLayers: 1 },
  );

  return texture;
}

export function createGaussianDiscNoiseTexture(
  device: GPUDevice,
  width: number,
  height: number,
  min: number = 0,
  max: number = 1,
) {
  const size = width * height;
  const data = new Float32Array(size * 4);

  for (let i = 0; i < size; i += 1) {
    data[i * 4 + 0] = randomGaussian(min, max);
    data[i * 4 + 1] = randomUniform(min, max * 0.5);
    data[i * 4 + 2] = randomGaussian(min, max);
    data[i * 4 + 3] = 1.0;
  }

  const texture = device.createTexture({
    size: { width, height },
    format: 'rgba32float',
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
  });

  device.queue.writeTexture(
    { texture },
    data.buffer,
    { bytesPerRow: width * 16, rowsPerImage: height },
    { width, height, depthOrArrayLayers: 1 },
  );

  return texture;
}

export function createGaussianNoiseTexture(
  device: GPUDevice,
  width: number,
  height: number,
  min: number = 0,
  max: number = 1,
): GPUTexture {
  const size = width * height;
  const data = new Float32Array(size * 4);

  for (let i = 0; i < size; i += 1) {
    data[i * 4 + 0] = randomGaussian(min, max);
    data[i * 4 + 1] = randomGaussian(min, max);
    data[i * 4 + 2] = randomGaussian(min, max);
    data[i * 4 + 3] = 1.0;
  }

  const texture = device.createTexture({
    size: { width, height },
    format: 'rgba32float',
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
  });

  device.queue.writeTexture(
    { texture },
    data.buffer,
    { bytesPerRow: width * 16, rowsPerImage: height },
    { width, height, depthOrArrayLayers: 1 },
  );

  return texture;
}

export function createSphericalNoiseTexture(
  device: GPUDevice,
  width: number,
  height: number,
  min: number = 0,
  max: number = 1,
): GPUTexture {
  const size = width * height;
  const data = new Float32Array(size * 4);

  for (let i = 0; i < size; i += 1) {
    const { x, y, z } = randomUniformSphere();
    data[i * 4 + 0] = min + x * max;
    data[i * 4 + 1] = min + y * max;
    data[i * 4 + 2] = min + z * max;
    data[i * 4 + 3] = 1.0;
  }

  const texture = device.createTexture({
    size: { width, height },
    format: 'rgba32float',
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
  });

  device.queue.writeTexture(
    { texture },
    data.buffer,
    { bytesPerRow: width * 16, rowsPerImage: height },
    { width, height, depthOrArrayLayers: 1 },
  );

  return texture;
}

export const CreateNoiseTexture = {
  uniform: createUniformNoiseTexture,
  cube: createUniformNoiseTexture,
  gaussian: createGaussianNoiseTexture,
  'gaussian-disc': createGaussianDiscNoiseTexture,
  sphere: createSphericalNoiseTexture,
};
