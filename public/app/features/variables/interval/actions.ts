import { rangeUtil } from '@grafana/data';
import { type ThunkResult } from 'app/types/store';

import { getTimeSrv } from '../../dashboard/services/TimeSrv';
import { getTemplateSrv, type TemplateSrv } from '../../templating/template_srv';
import { validateVariableSelectionState } from '../state/actions';
import { toKeyedAction } from '../state/keyedVariablesReducer';
import { getVariable } from '../state/selectors';
import { type KeyedVariableIdentifier } from '../state/types';
import { toVariablePayload } from '../utils';

import { createIntervalOptions } from './reducer';

export const updateIntervalVariableOptions =
  (identifier: KeyedVariableIdentifier): ThunkResult<void> =>
  async (dispatch, getState) => {
    const { rootStateKey } = identifier;
    const variable = getVariable(identifier, getState());
    if (variable.type !== 'interval') {
      return;
    }

    const query = getTemplateSrv().replace(variable.query);
    await dispatch(toKeyedAction(rootStateKey, createIntervalOptions(toVariablePayload(identifier, query))));
    await dispatch(updateAutoValue(identifier));
    await dispatch(validateVariableSelectionState(identifier));
  };

export interface UpdateAutoValueDependencies {
  calculateInterval: typeof rangeUtil.calculateInterval;
  getTimeSrv: typeof getTimeSrv;
  templateSrv: TemplateSrv;
}

export const updateAutoValue =
  (
    identifier: KeyedVariableIdentifier,
    dependencies: UpdateAutoValueDependencies = {
      calculateInterval: rangeUtil.calculateInterval,
      getTimeSrv: getTimeSrv,
      templateSrv: getTemplateSrv(),
    }
  ): ThunkResult<void> =>
  (dispatch, getState) => {
    const variableInState = getVariable(identifier, getState());
    if (variableInState.type !== 'interval') {
      return;
    }

    if (variableInState.auto) {
      const res = dependencies.calculateInterval(
        dependencies.getTimeSrv().timeRange(),
        variableInState.auto_count,
        variableInState.auto_min
      );
      dependencies.templateSrv.setGrafanaVariable('$__auto_interval_' + variableInState.name, res.interval);
      // for backward compatibility, to be removed eventually
      dependencies.templateSrv.setGrafanaVariable('$__auto_interval', res.interval);
    }
  };
