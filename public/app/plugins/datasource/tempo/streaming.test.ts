import { lastValueFrom, of } from 'rxjs';

import { LiveChannelConnectionState, LiveChannelEventType, LiveChannelScope, dateTime } from '@grafana/data';
import { getGrafanaLiveSrv } from '@grafana/runtime';

import { SearchTableType } from './dataquery.gen';
import { DEFAULT_SPSS } from './datasource';
import { doTempoSearchStreaming } from './streaming';
import { createTempoDatasource } from './test/mocks';
import { type TempoQuery } from './types';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getGrafanaLiveSrv: jest.fn(),
}));

describe('doTempoSearchStreaming', () => {
  const getGrafanaLiveSrvMock = jest.mocked(getGrafanaLiveSrv);
  const getStream = jest.fn();
  const datasource = createTempoDatasource();
  const query: TempoQuery = {
    refId: 'A',
    query: '{}',
    queryType: 'traceql',
    tableType: SearchTableType.Traces,
  };
  const options = {
    range: {
      from: dateTime('2026-05-01T00:00:00Z'),
      to: dateTime('2026-05-01T01:00:00Z'),
      raw: { from: 'now-1h', to: 'now' },
    },
  } as const;

  beforeEach(() => {
    getStream.mockReset();
    getGrafanaLiveSrvMock.mockReturnValue({ getStream } as unknown as ReturnType<typeof getGrafanaLiveSrv>);
  });

  it('surfaces live channel status errors', async () => {
    getStream.mockReturnValue(
      of({
        type: LiveChannelEventType.Status,
        id: 'ds/test/search/expired',
        timestamp: Date.now(),
        state: LiveChannelConnectionState.Shutdown,
        error: 'expired',
      })
    );

    await expect(
      lastValueFrom(doTempoSearchStreaming(query, datasource, options, datasource.instanceSettings))
    ).rejects.toThrow('expired');

    expect(getStream).toHaveBeenCalledWith({
      scope: LiveChannelScope.DataSource,
      stream: datasource.uid,
      path: expect.stringMatching(/^search\//),
      data: {
        ...query,
        SpansPerSpanSet: DEFAULT_SPSS,
        timeRange: {
          from: options.range.from.toISOString(),
          to: options.range.to.toISOString(),
        },
      },
    });
  });
});
