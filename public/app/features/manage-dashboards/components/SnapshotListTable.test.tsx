import { config } from '@grafana/runtime';

import { getSnapshots } from './SnapshotListTable';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: () => ({
    get: jest.fn().mockResolvedValue([
      {
        name: 'Snap 1',
        key: 'JRXqfKihKZek70FM6Xaq502NxH7OyyEs',
        external: true,
        externalUrl: 'https://www.externalSnapshotUrl.com',
        created: '2025-08-04T17:47:48Z',
      },
      {
        id: 3,
        name: 'Snap 2',
        key: 'RziRfhlBDTjwyYGoHAjnWyrMNQ1zUg3j',
        external: false,
        externalUrl: '',
        created: '2025-08-25T08:21:34Z',
      },
    ]),
  }),
}));

describe('getSnapshots', () => {
  config.appUrl = 'http://snapshots.grafana.com/';

  test('returns correct snapshot urls', async () => {
    const results = await getSnapshots();

    expect(results).toMatchInlineSnapshot(`
      [
        {
          "created": "2025-08-04T17:47:48Z",
          "external": true,
          "externalUrl": "https://www.externalSnapshotUrl.com",
          "key": "JRXqfKihKZek70FM6Xaq502NxH7OyyEs",
          "name": "Snap 1",
          "url": "http://snapshots.grafana.com/dashboard/snapshot/JRXqfKihKZek70FM6Xaq502NxH7OyyEs",
        },
        {
          "created": "2025-08-25T08:21:34Z",
          "external": false,
          "externalUrl": "",
          "id": 3,
          "key": "RziRfhlBDTjwyYGoHAjnWyrMNQ1zUg3j",
          "name": "Snap 2",
          "url": "http://snapshots.grafana.com/dashboard/snapshot/RziRfhlBDTjwyYGoHAjnWyrMNQ1zUg3j",
        },
      ]
    `);
  });
});
