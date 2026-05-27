import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { HttpResponse, http } from 'msw';
import { getWrapper } from 'test/test-utils';

import { base64UrlEncode } from '@grafana/alerting';
import { setupMswServer } from 'app/features/alerting/unified/mockApi';
import { grantUserPermissions } from 'app/features/alerting/unified/mocks';
import {
  TIME_INTERVAL_NAME_FILE_PROVISIONED,
  TIME_INTERVAL_NAME_HAPPY_PATH,
} from 'app/features/alerting/unified/mocks/server/handlers/k8s/timeIntervals.k8s';
import { GRAFANA_RULES_SOURCE_NAME } from 'app/features/alerting/unified/utils/datasource';
import { AccessControlAction } from 'app/types/accessControl';

import { useGetMuteTiming, useMuteTimings } from './useMuteTimings';

const wrapper = ({ children }: { children: ReactNode }) => {
  const ProviderWrapper = getWrapper({ renderWithRouter: true });
  return <ProviderWrapper>{children}</ProviderWrapper>;
};

const server = setupMswServer();

describe('useMuteTimings', () => {
  beforeEach(() => {
    grantUserPermissions([AccessControlAction.AlertingNotificationsRead]);
  });

  describe('useMuteTimings', () => {
    it('should return mute timings with correct data structure', async () => {
      const { result } = renderHook(
        () =>
          useMuteTimings({
            alertmanager: GRAFANA_RULES_SOURCE_NAME,
            skip: false,
          }),
        {
          wrapper,
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);

      const timings = result.current.data!;
      expect(timings.length).toBeGreaterThan(0);

      // Verify structure of first timing
      const firstTiming = timings[0];
      expect(firstTiming).toHaveProperty('id');
      expect(firstTiming).toHaveProperty('name');
      expect(firstTiming).toHaveProperty('time_intervals');
      expect(typeof firstTiming.id).toBe('string');
      expect(typeof firstTiming.name).toBe('string');
      expect(Array.isArray(firstTiming.time_intervals)).toBe(true);
    });

    it('should correctly identify provisioned intervals', async () => {
      const { result } = renderHook(
        () =>
          useMuteTimings({
            alertmanager: GRAFANA_RULES_SOURCE_NAME,
            skip: false,
          }),
        {
          wrapper,
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const timings = result.current.data!;

      // Find the provisioned interval
      const provisionedTiming = timings.find((t) => t.name === TIME_INTERVAL_NAME_FILE_PROVISIONED);
      expect(provisionedTiming).toBeDefined();
      expect(provisionedTiming?.provisioned).toBe(true);

      // Find the non-provisioned interval
      const nonProvisionedTiming = timings.find((t) => t.name === TIME_INTERVAL_NAME_HAPPY_PATH);
      expect(nonProvisionedTiming).toBeDefined();
      expect(nonProvisionedTiming?.provisioned).toBe(false);
    });
  });

  describe('useGetMuteTiming', () => {
    it('should return single mute timing by name for editing', async () => {
      const { result } = renderHook(
        () =>
          useGetMuteTiming({
            alertmanager: GRAFANA_RULES_SOURCE_NAME,
            name: TIME_INTERVAL_NAME_HAPPY_PATH,
          }),
        {
          wrapper,
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.name).toBe(TIME_INTERVAL_NAME_HAPPY_PATH);
      expect(result.current.data?.id).toBe(base64UrlEncode(TIME_INTERVAL_NAME_HAPPY_PATH));
      expect(result.current.data).toHaveProperty('time_intervals');
      expect(result.current.isError).toBe(false);
    });

    it('should return single mute timing by metadata.name for editing', async () => {
      const { result } = renderHook(
        () =>
          useGetMuteTiming({
            alertmanager: GRAFANA_RULES_SOURCE_NAME,
            name: base64UrlEncode(TIME_INTERVAL_NAME_HAPPY_PATH),
          }),
        {
          wrapper,
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.name).toBe(TIME_INTERVAL_NAME_HAPPY_PATH);
      expect(result.current.data?.id).toBe(base64UrlEncode(TIME_INTERVAL_NAME_HAPPY_PATH));
      expect(result.current.isError).toBe(false);
    });

    it('should fall back to encoded metadata.name for legacy display names with reserved URL characters', async () => {
      const legacyName = 'legacy/name';
      const encodedLegacyName = base64UrlEncode(legacyName);

      server.use(
        http.get(`*/timeintervals/${legacyName}`, () => HttpResponse.json({}, { status: 404 })),
        http.get(`*/timeintervals/${encodedLegacyName}`, () =>
          HttpResponse.json({
            apiVersion: 'notifications.alerting.grafana.app/v0alpha1',
            kind: 'TimeInterval',
            metadata: { name: encodedLegacyName },
            spec: { name: legacyName, time_intervals: [] },
          })
        )
      );

      const { result } = renderHook(
        () =>
          useGetMuteTiming({
            alertmanager: GRAFANA_RULES_SOURCE_NAME,
            name: legacyName,
          }),
        {
          wrapper,
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.name).toBe(legacyName);
      expect(result.current.data?.id).toBe(encodedLegacyName);
      expect(result.current.isError).toBe(false);
    });

    it('should not retry encoded resource names as legacy display names', async () => {
      const encodedResourceName = base64UrlEncode(TIME_INTERVAL_NAME_HAPPY_PATH);
      const doublyEncodedName = base64UrlEncode(encodedResourceName);

      server.use(
        http.get(`*/timeintervals/${encodedResourceName}`, () => HttpResponse.json({}, { status: 404 })),
        http.get(`*/timeintervals/${doublyEncodedName}`, () =>
          HttpResponse.json({
            apiVersion: 'notifications.alerting.grafana.app/v0alpha1',
            kind: 'TimeInterval',
            metadata: { name: doublyEncodedName },
            spec: { name: encodedResourceName, time_intervals: [] },
          })
        )
      );

      const { result } = renderHook(
        () =>
          useGetMuteTiming({
            alertmanager: GRAFANA_RULES_SOURCE_NAME,
            name: encodedResourceName,
          }),
        {
          wrapper,
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isError).toBe(true);
    });
  });
});
