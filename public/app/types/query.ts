import { type DataQuery, type DataSourceRef } from '@grafana/data';

import { type MaxDataPoints } from '../features/query/utils/relativeMaxDataPoints';

export interface QueryGroupOptions {
  queries: DataQuery[];
  dataSource: QueryGroupDataSource;
  maxDataPoints?: MaxDataPoints | null;
  minInterval?: string | null;
  cacheTimeout?: string | null;
  queryCachingTTL?: number | null;
  timeRange?: {
    from?: string | null;
    shift?: string | null;
    hide?: boolean;
  };
}

export interface QueryGroupDataSource extends DataSourceRef {
  name?: string | null;
  default?: boolean;
}
