import { getExportableSettings, REDACTED_CONTACT_POINT_SECRET } from './GrafanaContactPointModifyExport';

describe('getExportableSettings', () => {
  it('preserves configured secure fields as redacted placeholders', () => {
    expect(
      getExportableSettings(
        {
          url: 'https://hooks.slack.test',
          sigv4: {
            region: 'eu-west-1',
          },
        },
        {
          token: true,
          'sigv4.access_key': true,
          'sigv4.secret_key': true,
        }
      )
    ).toEqual({
      url: 'https://hooks.slack.test',
      token: REDACTED_CONTACT_POINT_SECRET,
      sigv4: {
        region: 'eu-west-1',
        access_key: REDACTED_CONTACT_POINT_SECRET,
        secret_key: REDACTED_CONTACT_POINT_SECRET,
      },
    });
  });
});
