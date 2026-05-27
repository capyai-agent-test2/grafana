import { createTheme } from '../themes/createTheme';
import { type DataFrame, type Field, FieldType } from '../types/dataFrame';
import { FieldColorModeId } from '../types/fieldColor';

import { fieldColorModeRegistry, type FieldValueColorCalculator } from './fieldColor';
import { cacheFieldDisplayNames } from './fieldState';
import { getFieldSeriesColor } from './scale';

function getTestField(mode: string, fixedColor?: string, name = 'name'): Field {
  return {
    name: name,
    type: FieldType.number,
    values: [],
    config: {
      color: {
        mode: mode,
        fixedColor: fixedColor,
      },
    },
    state: {},
  };
}

interface GetCalcOptions {
  mode: string;
  seriesIndex?: number;
  name?: string;
  fixedColor?: string;
  classicPalette?: string[];
}

function getCalculator(options: GetCalcOptions): FieldValueColorCalculator {
  const field = getTestField(options.mode, options.fixedColor, options.name);
  field.config.custom = options.classicPalette ? { classicPalette: options.classicPalette } : undefined;
  const mode = fieldColorModeRegistry.get(options.mode);
  field.state!.seriesIndex = options.seriesIndex;
  return mode.getCalculator(field, createTheme());
}

describe('fieldColorModeRegistry', () => {
  it('Schemes should interpolate', () => {
    const calcFn = getCalculator({ mode: 'continuous-GrYlRd' });
    expect(calcFn(70, 0.5, undefined)).toEqual('rgb(226, 192, 61)');
  });

  it('Palette classic with series index 0', () => {
    const calcFn = getCalculator({ mode: FieldColorModeId.PaletteClassic, seriesIndex: 0, name: 'series1' });
    expect(calcFn(70, 0, undefined)).toEqual('#73BF69');
  });

  it('Palette classic with series index 1', () => {
    const calcFn = getCalculator({ mode: FieldColorModeId.PaletteClassic, seriesIndex: 1, name: 'series2' });
    expect(calcFn(70, 0, undefined)).toEqual('#F2CC0C');
  });

  it('Palette uses name', () => {
    const calcFn1 = getCalculator({ mode: FieldColorModeId.PaletteClassicByName, seriesIndex: 0, name: 'same name' });
    const calcFn2 = getCalculator({ mode: FieldColorModeId.PaletteClassicByName, seriesIndex: 1, name: 'same name' });
    expect(calcFn1(12, 34, undefined)).toEqual(calcFn2(56, 78, undefined));
  });

  it('Palette uses displayName with Value fields', () => {
    let frames: DataFrame[] = [
      {
        length: 0,
        fields: [
          {
            name: 'Time',
            type: FieldType.time,
            values: [],
            config: {},
          },
          {
            name: 'Value',
            labels: { foo: 'bar' },
            type: FieldType.number,
            values: [],
            config: {
              color: {
                mode: FieldColorModeId.PaletteClassicByName,
              },
            },
            state: {},
          },
        ],
      },
      {
        length: 0,
        fields: [
          {
            name: 'Time',
            type: FieldType.time,
            values: [],
            config: {},
          },
          {
            name: 'Value',
            labels: { foo: 'baz' },
            type: FieldType.number,
            values: [],
            config: {
              color: {
                mode: FieldColorModeId.PaletteClassicByName,
              },
            },
            state: {},
          },
        ],
      },
    ];

    cacheFieldDisplayNames(frames);

    const mode = fieldColorModeRegistry.get(FieldColorModeId.PaletteClassicByName);

    const calcFn1 = mode.getCalculator(frames[0].fields[1], createTheme());
    const calcFn2 = mode.getCalculator(frames[1].fields[1], createTheme());

    expect(calcFn1(0, 0)).toEqual('#5195CE');
    expect(calcFn2(0, 0)).toEqual('#37872D');
  });

  it('Palette classic can use a custom palette from field config', () => {
    const calcFn = getCalculator({
      mode: FieldColorModeId.PaletteClassic,
      seriesIndex: 1,
      classicPalette: ['#111111', 'dark-red'],
    });

    expect(calcFn(70, 0, undefined)).toEqual('#C4162A');
  });

  it('Palette by name can use a custom palette from field config', () => {
    const calcFn1 = getCalculator({
      mode: FieldColorModeId.PaletteClassicByName,
      seriesIndex: 0,
      name: 'same name',
      classicPalette: ['#111111', 'dark-red'],
    });
    const calcFn2 = getCalculator({
      mode: FieldColorModeId.PaletteClassicByName,
      seriesIndex: 1,
      name: 'same name',
      classicPalette: ['#111111', 'dark-red'],
    });

    expect(calcFn1(12, 34, undefined)).toEqual(calcFn2(56, 78, undefined));
    expect(['#111111', '#C4162A']).toContain(calcFn1(12, 34, undefined));
  });

  it('Palette by name ignores invalid custom palette entries', () => {
    const calcFn = getCalculator({
      mode: FieldColorModeId.PaletteClassicByName,
      seriesIndex: 0,
      name: 'same name',
      classicPalette: ['not-a-color', 'dark-red'],
    });

    expect(calcFn(12, 34, undefined)).toEqual('#C4162A');
  });

  it('When color.seriesBy is set to last use that instead of v', () => {
    const field = getTestField('continuous-GrYlRd');

    field.config.color!.seriesBy = 'last';
    // min = -10, max = 10, last = 5
    // last percent 75%
    field.values = [0, -10, 5, 10, 2, 5];

    const color = getFieldSeriesColor(field, createTheme());
    const calcFn = getCalculator({ mode: 'continuous-GrYlRd' });

    expect(color.color).toEqual(calcFn(4, 0.75));
  });

  it('Shades should return selected color for index 0', () => {
    const color = '#123456';
    const calcFn = getCalculator({ mode: FieldColorModeId.Shades, seriesIndex: 0, fixedColor: color });
    expect(calcFn(70, 0, undefined)).toEqual(color);
  });

  it('Shades should return different than selected color for index 1', () => {
    const color = '#123456';
    const calcFn = getCalculator({ mode: FieldColorModeId.Shades, seriesIndex: 1, fixedColor: color });
    expect(calcFn(70, 0, undefined)).not.toEqual(color);
  });
});
