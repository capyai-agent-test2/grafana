import { AppEvents, type InterpolateFunction, textUtil } from '@grafana/data';
import { type BackendSrvRequest, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { appEvents } from 'app/core/app_events';
import { createAbsoluteUrl, type RelativeUrl } from 'app/features/alerting/unified/utils/url';
import { getDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';

import { HttpRequestMethod } from '../../panelcfg.gen';

import { type APIEditorConfig } from './APIEditor';

type IsLoadingCallback = (loading: boolean) => void;

export const callApi = (
  api: APIEditorConfig,
  updateLoadingStateCallback?: IsLoadingCallback,
  replaceVariables?: InterpolateFunction
) => {
  if (!api.endpoint) {
    appEvents.emit(AppEvents.alertError, ['API endpoint is not defined.']);
    return;
  }

  const request = getRequest(api, replaceVariables);

  getBackendSrv()
    .fetch(request)
    .subscribe({
      error: (error) => {
        appEvents.emit(AppEvents.alertError, ['An error has occurred. Check console output for more details.']);
        console.error('API call error: ', error);
        updateLoadingStateCallback && updateLoadingStateCallback(false);
      },
      complete: () => {
        const message = api.successMessage || 'API call was successful';
        appEvents.emit(AppEvents.alertSuccess, [message]);
        updateLoadingStateCallback && updateLoadingStateCallback(false);
      },
    });
};

export const interpolateVariables = (text: string, replaceVariables?: InterpolateFunction) => {
  if (replaceVariables) {
    return replaceVariables(text);
  }

  const panel = getDashboardSrv().getCurrent()?.panelInEdit;
  return getTemplateSrv().replace(text, panel?.scopedVars);
};

export const getRequest = (api: APIEditorConfig, replaceVariables?: InterpolateFunction) => {
  const endpoint = getEndpoint(interpolateVariables(api.endpoint, replaceVariables));
  const url = new URL(endpoint);

  const requestHeaders: Record<string, string> = {};

  let request: BackendSrvRequest = {
    url: url.toString(),
    method: api.method,
    data: getData(api, replaceVariables),
    headers: requestHeaders,
  };

  if (api.headerParams) {
    api.headerParams.forEach(([name, value]) => {
      requestHeaders[interpolateVariables(name, replaceVariables)] = interpolateVariables(value, replaceVariables);
    });
  }

  if (api.queryParams) {
    api.queryParams?.forEach(([name, value]) => {
      url.searchParams.append(interpolateVariables(name, replaceVariables), interpolateVariables(value, replaceVariables));
    });

    request.url = url.toString();
  }

  if (api.method === HttpRequestMethod.POST) {
    requestHeaders['Content-Type'] = api.contentType!;
  }

  requestHeaders['X-Grafana-Action'] = '1';
  request.headers = requestHeaders;

  return request;
};

const getData = (api: APIEditorConfig, replaceVariables?: InterpolateFunction) => {
  let data: string | undefined = api.data ? interpolateVariables(api.data, replaceVariables) : '{}';
  if (api.method === HttpRequestMethod.GET) {
    data = undefined;
  }

  return data;
};

const getEndpoint = (endpoint: string) => {
  const isRelativeUrl = endpoint.startsWith('/');
  if (isRelativeUrl) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const sanitizedRelativeURL = textUtil.sanitizeUrl(endpoint) as RelativeUrl;
    endpoint = createAbsoluteUrl(sanitizedRelativeURL, []);
  }

  return endpoint;
};
