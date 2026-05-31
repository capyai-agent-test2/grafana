import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { isNumber, sortBy, toLower, uniqBy } from 'lodash';

import {
  type MetricFindValue,
  type QueryVariableModel,
  stringToJsRegex,
  type VariableOption,
  VariableRefresh,
  VariableSort,
} from '@grafana/data';

import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE, NONE_VARIABLE_TEXT, NONE_VARIABLE_VALUE } from '../constants';
import { getInstanceState } from '../state/getInstanceState';
import { initialVariablesState, type VariablePayload, type VariablesState } from '../state/types';
import { initialVariableModelState } from '../types';

interface VariableOptionsUpdate {
  templatedRegex: string;
  results: MetricFindValue[];
}

export const initialQueryVariableModelState: QueryVariableModel = {
  ...initialVariableModelState,
  type: 'query',
  datasource: null,
  query: '',
  regex: '',
  sort: VariableSort.disabled,
  refresh: VariableRefresh.onDashboardLoad,
  multi: false,
  includeAll: false,
  allValue: null,
  options: [],
  current: {},
  definition: '',
};

export const sortVariableValues = (options: any[], sortOrder: VariableSort) => {
  if (sortOrder === VariableSort.disabled) {
    return options;
  }

  const sortType = Math.ceil(sortOrder / 2);
  const reverseSort = sortOrder % 2 === 0;

  if (sortType === 1) {
    options = sortBy(options, 'text');
  } else if (sortType === 2) {
    options = sortBy(options, (opt) => {
      if (!opt.text) {
        return -1;
      }

      const matches = opt.text.match(/.*?(\d+).*/);
      if (!matches || matches.length < 2) {
        return -1;
      } else {
        return parseInt(matches[1], 10);
      }
    });
  } else if (sortType === 3) {
    options = sortBy(options, (opt) => {
      return toLower(opt.text);
    });
  } else if (sortType === 4) {
    options.sort((a, b) => {
      if (!a.text) {
        return -1;
      }

      if (!b.text) {
        return 1;
      }

      return a.text.localeCompare(b.text, undefined, { numeric: true });
    });
  }

  if (reverseSort) {
    options = options.reverse();
  }

  return options;
};

const getAllMatches = (str: string, regex: RegExp): RegExpExecArray[] => {
  const results: RegExpExecArray[] = [];
  let matches = null;

  regex.lastIndex = 0;

  do {
    matches = regex.exec(str);
    if (matches) {
      results.push(matches);
    }
  } while (regex.global && matches && matches[0] !== '' && matches[0] !== undefined);

  return results;
};

export const metricNamesToVariableValues = (variableRegEx: string, sort: VariableSort, metricNames: any[]) => {
  let regex;
  let options: VariableOption[] = [];

  if (variableRegEx) {
    regex = stringToJsRegex(variableRegEx);
  }

  for (let i = 0; i < metricNames.length; i++) {
    const item = metricNames[i];
    let text = item.text === undefined || item.text === null ? item.value : item.text;
    let value = item.value === undefined || item.value === null ? item.text : item.value;

    if (isNumber(value)) {
      value = value.toString();
    }

    if (isNumber(text)) {
      text = text.toString();
    }

    if (regex) {
      const matches = getAllMatches(value, regex);
      if (!matches.length) {
        continue;
      }

      const valueGroup = matches.find((m) => m.groups && m.groups.value);
      const textGroup = matches.find((m) => m.groups && m.groups.text);
      const firstMatch = matches.find((m) => m.length > 1);
      const manyMatches = matches.length > 1 && firstMatch;

      if (valueGroup || textGroup) {
        value = valueGroup?.groups?.value ?? textGroup?.groups?.text;
        text = textGroup?.groups?.text ?? valueGroup?.groups?.value;
      } else if (manyMatches) {
        for (let j = 0; j < matches.length; j++) {
          const match = matches[j];
          options.push({ text: match[1], value: match[1], selected: false });
        }
        continue;
      } else if (firstMatch) {
        text = firstMatch[1];
        value = firstMatch[1];
      }
    }

    options.push({ text: text, value: value, selected: false });
  }

  options = uniqBy(options, 'value');
  return sortVariableValues(options, sort);
};

const getStaticOptionRegex = (option: VariableOption): string | undefined => {
  const regex = option.properties?.regex ?? option.properties?.filterRegex;
  if (typeof regex === 'string' && regex.length > 0) {
    return regex;
  }

  if (typeof option.value !== 'string') {
    return undefined;
  }

  return /^\/.*\/[dgimsuvy]*$/.test(option.value) ? option.value : undefined;
};

export const expandRegexStaticOptions = (staticOptions: VariableOption[] = [], options: VariableOption[]) => {
  return staticOptions.map((option) => {
    const regex = getStaticOptionRegex(option);
    if (!regex) {
      return option;
    }

    const matcher = stringToJsRegex(regex);
    const matches = options.filter((queryOption) => {
      matcher.lastIndex = 0;
      return matcher.test(String(queryOption.value));
    });

    return {
      ...option,
      value: matches.map((match) => match.value).flat(),
      properties: {
        ...option.properties,
        textValues: matches.map((match) => match.text).flat(),
      },
    };
  });
};

const mergeStaticOptions = (
  options: VariableOption[],
  staticOptions: VariableOption[] | undefined,
  staticOptionsOrder: QueryVariableModel['staticOptionsOrder'],
  sort: VariableSort
) => {
  if (!staticOptions?.length) {
    return options;
  }

  const expandedStaticOptions = expandRegexStaticOptions(staticOptions, options);

  if (staticOptionsOrder === 'after') {
    return [...options, ...expandedStaticOptions];
  }

  if (staticOptionsOrder === 'sorted') {
    return sortVariableValues([...options, ...expandedStaticOptions], sort);
  }

  return [...expandedStaticOptions, ...options];
};

export const queryVariableSlice = createSlice({
  name: 'templating/query',
  initialState: initialVariablesState,
  reducers: {
    updateVariableOptions: (state: VariablesState, action: PayloadAction<VariablePayload<VariableOptionsUpdate>>) => {
      const { results, templatedRegex } = action.payload.data;
      const instanceState = getInstanceState(state, action.payload.id);
      if (instanceState.type !== 'query') {
        return;
      }

      const { includeAll, sort, staticOptions, staticOptionsOrder } = instanceState;
      const queryOptions = metricNamesToVariableValues(templatedRegex, sort, results);
      const options = mergeStaticOptions(queryOptions, staticOptions, staticOptionsOrder, sort);

      if (includeAll) {
        options.unshift({ text: ALL_VARIABLE_TEXT, value: ALL_VARIABLE_VALUE, selected: false });
      }

      if (!options.length) {
        options.push({ text: NONE_VARIABLE_TEXT, value: NONE_VARIABLE_VALUE, isNone: true, selected: false });
      }

      instanceState.options = options;
    },
  },
});

export const queryVariableReducer = queryVariableSlice.reducer;

export const { updateVariableOptions } = queryVariableSlice.actions;
