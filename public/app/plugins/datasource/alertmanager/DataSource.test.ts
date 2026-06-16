import { of, throwError } from 'rxjs';

import { type DataSourceInstanceSettings } from '@grafana/data';
import { type FetchResponse } from '@grafana/runtime';

import { AlertManagerDatasource } from './DataSource';
import { AlertManagerImplementation, type AlertManagerDataSourceJsonData } from './types';

const mockFetch = jest.fn();
const mockDiscoverAlertmanagerFeaturesByUrl = jest.fn();

jest.mock('@grafana/runtime', () => ({
  __esModule: true,
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: () => ({
    fetch: mockFetch,
  }),
}));

jest.mock('../../../features/alerting/unified/api/buildInfo', () => ({
  __esModule: true,
  discoverAlertmanagerFeaturesByUrl: (...args: unknown[]) => mockDiscoverAlertmanagerFeaturesByUrl(...args),
}));

const createDatasource = (jsonData: AlertManagerDataSourceJsonData) =>
  new AlertManagerDatasource({
    id: 1,
    uid: 'alertmanager',
    type: 'alertmanager',
    name: 'alertmanager',
    access: 'proxy',
    url: 'http://alertmanager.example',
    jsonData,
  } as DataSourceInstanceSettings<AlertManagerDataSourceJsonData>);

describe('AlertManagerDatasource', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockDiscoverAlertmanagerFeaturesByUrl.mockReset();
    mockDiscoverAlertmanagerFeaturesByUrl.mockResolvedValue({ lazyConfigInit: false });
  });

  it('uses a custom alertmanager prefix for Mimir health checks', async () => {
    mockFetch
      .mockReturnValueOnce(throwError(() => new Error('prometheus endpoint not found')))
      .mockReturnValueOnce(
        of({
          status: 200,
        } as FetchResponse)
      );

    const datasource = createDatasource({
      implementation: AlertManagerImplementation.mimir,
      alertmanagerPrefix: '/mimir-alertmanager/',
    });

    const result = await datasource.testDatasource();

    expect(result).toEqual({ status: 'success', message: 'Health check passed.' });
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ url: 'http://alertmanager.example/api/v2/status' })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ url: 'http://alertmanager.example/mimir-alertmanager/api/v2/status' })
    );
  });

  it('uses the custom alertmanager prefix when checking a Prometheus selection against Mimir endpoints', async () => {
    mockFetch
      .mockReturnValueOnce(throwError(() => new Error('custom prefix not found')))
      .mockReturnValueOnce(
        of({
          status: 200,
        } as FetchResponse)
      );

    const datasource = createDatasource({
      implementation: AlertManagerImplementation.prometheus,
      alertmanagerPrefix: '/mimir-alertmanager/',
    });

    const result = await datasource.testDatasource();

    expect(result).toEqual({ status: 'success', message: 'Health check passed.' });
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ url: 'http://alertmanager.example/mimir-alertmanager/api/v2/status' })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ url: 'http://alertmanager.example/api/v2/status' })
    );
  });
});
