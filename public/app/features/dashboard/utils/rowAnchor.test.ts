import { doesRowAnchorMatchLocation, getRowAnchorId } from './rowAnchor';

describe('rowAnchor', () => {
  it('slugifies row titles into anchor ids', () => {
    expect(getRowAnchorId('Traces Instance Stats')).toBe('traces-instance-stats');
  });

  it('falls back when title is empty', () => {
    expect(getRowAnchorId('', 'row-7')).toBe('row-7');
  });

  it('matches the current hash', () => {
    window.location.hash = '#traces-instance-stats';

    expect(doesRowAnchorMatchLocation('Traces Instance Stats')).toBe(true);
  });
});
