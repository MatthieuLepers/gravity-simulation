import { color2vector } from '@/core/utils';

export interface ElementData {
  name: string;
  symbol: string;
  mass: number;
  color: number;
  probabilityWeight: number;
}

export function flatten(element: ElementData) {
  return [
    ...color2vector(element.color), 1,
    element.mass,
    element.probabilityWeight,
    0.0, 0.0,
  ];
}

export const elements: Array<ElementData> = [
  {
    name: 'Hydrogène',
    symbol: 'H',
    mass: 1.008,
    color: 0xFFFFFF,
    probabilityWeight: 0.91,
  },
  {
    name: 'Hélium',
    symbol: 'He',
    mass: 4.0026,
    color: 0xF0F0F0,
    probabilityWeight: 0.08,
  },
  {
    name: 'Oxygène',
    symbol: 'O',
    mass: 15.999,
    color: 0xFF0F0F,
    probabilityWeight: 0.005,
  },
  {
    name: 'Carbone',
    symbol: 'C',
    mass: 12.011,
    color: 0x808080,
    probabilityWeight: 0.002,
  },
  {
    name: 'Azote',
    symbol: 'N',
    mass: 14.007,
    color: 0x1F77B4,
    probabilityWeight: 0.001,
  },
  {
    name: 'Néon',
    symbol: 'Ne',
    mass: 20.18,
    color: 0xFF5F00,
    probabilityWeight: 0.0005,
  },
  {
    name: 'Magnésium',
    symbol: 'Mg',
    mass: 24.305,
    color: 0x00FF00,
    probabilityWeight: 0.0004,
  },
  {
    name: 'Silicium',
    symbol: 'Si',
    mass: 28.085,
    color: 0xA0A0A0,
    probabilityWeight: 0.0003,
  },
  {
    name: 'Soufre',
    symbol: 'S',
    mass: 32.06,
    color: 0xFFFF00,
    probabilityWeight: 0.0002,
  },
  {
    name: 'Fer',
    symbol: 'Fe',
    mass: 55.845,
    color: 0xB22222,
    probabilityWeight: 0.0001,
  },
];
