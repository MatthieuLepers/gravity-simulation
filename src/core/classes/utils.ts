import { getAsFloat32Array, type GetAsFunction } from '@/core/tests/utils';

export const copyBuffer = async (device: GPUDevice, buffer: GPUBuffer): Promise<GPUBuffer> => {
  const dst = device.createBuffer({
    size: buffer.size,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const commandEncoder = device.createCommandEncoder();
  commandEncoder.copyBufferToBuffer(buffer, 0, dst, 0, buffer.size);

  device.queue.submit([commandEncoder.finish()]);
  await device.queue.onSubmittedWorkDone();
  await dst.mapAsync(GPUMapMode.READ);

  return dst;
};

export const copyTexture = async (device: GPUDevice, texture: GPUTexture): Promise<GPUTexture> => {
  const dst = device.createTexture({
    size: {
      width: texture.width,
      height: texture.height,
    },
    format: texture.format,
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
  });

  const commandEncoder = device.createCommandEncoder();
  commandEncoder.copyTextureToTexture(
    { texture },
    { texture: dst },
    {
      width: texture.width,
      height: texture.height,
      depthOrArrayLayers: 1,
    },
  );

  device.queue.submit([commandEncoder.finish()]);
  await device.queue.onSubmittedWorkDone();

  return dst;
};

export const readStorageBuffer = async (
  device: GPUDevice,
  buffer: GPUBuffer,
  getAs: GetAsFunction = getAsFloat32Array,
) => {
  const readBuffer = device.createBuffer({
    size: buffer.size,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const commandEncoder = device.createCommandEncoder();
  commandEncoder.copyBufferToBuffer(buffer, 0, readBuffer, 0, readBuffer.size);

  device.queue.submit([commandEncoder.finish()]);
  await device.queue.onSubmittedWorkDone();
  await readBuffer.mapAsync(GPUMapMode.READ);

  const arrayBuffer = readBuffer.getMappedRange();
  const typedArray = getAs(arrayBuffer);

  readBuffer.unmap();

  return typedArray;
};

export const readStorageTexture = async (
  device: GPUDevice,
  texture: GPUTexture,
  getAs: GetAsFunction = getAsFloat32Array,
) => {
  const regex = /^([rgbaRGBA]{1,4})(\d+)(\w+)?$/;
  const matches = texture.format.match(regex)!;
  const components = matches[1].length;
  const byteLength = parseInt(matches[2], 10) / 8;

  const bytesPerPixel = components * byteLength;
  const unalignedBytesPerRow = texture.width * bytesPerPixel;
  const alignedBytesPerRow = Math.ceil(unalignedBytesPerRow / 256) * 256; // Aligner sur 256
  const bufferSize = alignedBytesPerRow * texture.height;

  const readBuffer = device.createBuffer({
    size: bufferSize,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const commandEncoder = device.createCommandEncoder();
  commandEncoder.copyTextureToBuffer(
    { texture },
    { buffer: readBuffer, bytesPerRow: alignedBytesPerRow, rowsPerImage: texture.height },
    { width: texture.width, height: texture.height, depthOrArrayLayers: 1 },
  );

  device.queue.submit([commandEncoder.finish()]);
  await device.queue.onSubmittedWorkDone();
  await readBuffer.mapAsync(GPUMapMode.READ);

  const arrayBuffer = readBuffer.getMappedRange();
  const typedArray = getAs(arrayBuffer);

  readBuffer.unmap();

  return typedArray;
};
