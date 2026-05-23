import { lastValueFrom, of, throwError } from 'rxjs';

import { dateTime, LoadingState, type DataQueryRequest } from '@grafana/data';
import { type TemplateSrv } from '@grafana/runtime';

import { TempoDatasource } from './datasource';
import { type TempoQuery } from './types';

const doTempoSearchStreamingMock = jest.fn();

jest.mock('./streaming', () => ({
  ...jest.requireActual('./streaming'),
  doTempoSearchStreaming: (...args: unknown[]) => doTempoSearchStreamingMock(...args),
}));

describe('TempoDatasource.handleStreamingQuery', () => {
  const templateSrv: TemplateSrv = { replace: (s: string) => s } as unknown as TemplateSrv;
  const defaultSettings = {
    id: 1,
    uid: 'tempo-uid',
    type: 'tempo',
    access: 'proxy',
    url: '/api/datasources/proxy/uid/tempo',
    jsonData: {},
  };
  const range = {
    from: dateTime(new Date(2022, 8, 13, 16, 0, 0, 0)),
    to: dateTime(new Date(2022, 8, 13, 16, 15, 0, 0)),
    raw: { from: 'now-15m', to: 'now' },
  };

  beforeEach(() => {
    doTempoSearchStreamingMock.mockReset();
  });

  it('falls back to HTTP query when streaming search errors', async () => {
    const ds = new TempoDatasource(defaultSettings, templateSrv);
    const target = { refId: 'A', queryType: 'traceql', query: '{}' } as TempoQuery;
    const fallbackResponse = { data: [], state: LoadingState.Done };
    const fallbackSpy = jest.spyOn(ds, 'handleTraceQlQuery').mockReturnValue(of(fallbackResponse));

    doTempoSearchStreamingMock.mockReturnValue(throwError(() => new Error('expired')));

    const response = await lastValueFrom(
      ds.handleStreamingQuery(
        { targets: [target], range } as DataQueryRequest<TempoQuery>,
        [target],
        '{}',
        { traceql: [target] }
      )
    );

    expect(response).toEqual(fallbackResponse);
    expect(doTempoSearchStreamingMock).toHaveBeenCalledTimes(1);
    expect(fallbackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ targets: [target], range }),
      expect.objectContaining({ traceql: [target] })
    );
  });
});
