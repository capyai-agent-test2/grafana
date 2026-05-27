import { doesRowAnchorMatchLocation, getRowAnchorId } from './rowAnchor';

describe('rowAnchor', () => {
  it('slugifies row titles into anchor ids', () => {
    expect(getRowAnchorId('Traces Instance Stats', 'row-7')).toBe('traces-instance-stats-row-7');
  });

  it('falls back when title is empty', () => {
    expect(getRowAnchorId('', 'row-7')).toBe('row-7');
  });

  it('keeps anchors unique when titles repeat', () => {
    expect(getRowAnchorId('Repeated Row', 'row-1')).toBe('repeated-row-row-1');
    expect(getRowAnchorId('Repeated Row', 'row-2')).toBe('repeated-row-row-2');
  });

  it('matches the current hash', () => {
    window.location.hash = '#traces-instance-stats-row-7';

    expect(doesRowAnchorMatchLocation('Traces Instance Stats', 'row-7')).toBe(true);
  });
});
