import type { languages } from 'monaco-editor';

import type { Monaco } from '@grafana/ui';

export const FLUX_LANGUAGE_ID = 'flux';

export const languageConfiguration: languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
  },
};

export const language: languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.flux',
  escapes: /\\(?:[abfnrtv\\"'])/,
  tokenizer: {
    root: [
      [/\/\/.*$/, 'comment'],
      [/"/, 'string', '@string_double'],
      [/'/, 'string', '@string_single'],
    ],
    string_double: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop'],
    ],
    string_single: [
      [/[^\\']+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/'/, 'string', '@pop'],
    ],
  },
};

export function registerFluxLanguage(monaco: Monaco) {
  if (monaco.languages.getLanguages().some((registeredLanguage) => registeredLanguage.id === FLUX_LANGUAGE_ID)) {
    return;
  }

  monaco.languages.register({ id: FLUX_LANGUAGE_ID });
  monaco.languages.setMonarchTokensProvider(FLUX_LANGUAGE_ID, language);
  monaco.languages.setLanguageConfiguration(FLUX_LANGUAGE_ID, languageConfiguration);
}
