import type uPlot from 'uplot';

import { ScaleOrientation } from '@grafana/schema';

import { scaleGradient } from './gradientFills';

const addColorStop = jest.fn((offset: number) => {
  if (offset < 0 || offset > 1) {
    throw new Error(`Invalid color stop offset: ${offset}`);
  }
});

jest.mock('../../../utils/measureText', () => ({
  getCanvasContext: () => ({
    createLinearGradient: () => ({
      addColorStop,
    }),
  }),
}));

describe('scaleGradient', () => {
  beforeEach(() => {
    addColorStop.mockClear();
  });

  it('handles unsorted threshold stops without invalid color stop offsets', () => {
    const plot = {
      scales: {
        x: { ori: ScaleOrientation.Horizontal },
        y: { min: -5, max: 5 },
      },
      valToPos: (value: number) => value,
    } as unknown as uPlot;

    expect(() =>
      scaleGradient(
        plot,
        'y',
        [
          [-Infinity, 'red'],
          [1, 'green'],
          [-3, 'blue'],
        ],
        true
      )
    ).not.toThrow();
    expect(addColorStop).toHaveBeenCalledWith(expect.any(Number), expect.any(String));
  });
});
