export type GetAsFunction = (arrayBuffer: ArrayBuffer) => Array<number>;

export const getAsFloat32Array: GetAsFunction = (arrayBuffer: ArrayBuffer) => Array.from(new Float32Array(arrayBuffer));

export const getAsUint32Array: GetAsFunction = (arrayBuffer: ArrayBuffer) => Array.from(new Uint32Array(arrayBuffer));

export const extractData = (
  textureData: Array<number>,
  stride: number,
  particleCount: number,
) => [...Array(textureData.length / stride).keys()]
  .map((i) => textureData.slice(i * stride, (i + 1) * stride))
  .slice(0, particleCount)
;
