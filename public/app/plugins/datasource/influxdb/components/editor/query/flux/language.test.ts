import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { FLUX_LANGUAGE_ID, languageConfiguration, registerFluxLanguage } from './language';

describe('Flux Monaco language', () => {
  afterEach(() => {
    for (const model of monaco.editor.getModels()) {
      model.dispose();
    }
  });

  it('uses double-slash line comments', () => {
    expect(languageConfiguration.comments?.lineComment).toBe('//');
  });

  it('registers the Flux language once', () => {
    const register = jest.fn();
    const setMonarchTokensProvider = jest.fn();
    const setLanguageConfiguration = jest.fn();
    const monaco = {
      languages: {
        getLanguages: jest.fn().mockReturnValue([]),
        register,
        setMonarchTokensProvider,
        setLanguageConfiguration,
      },
    };

    registerFluxLanguage(monaco as never);

    expect(register).toHaveBeenCalledWith({ id: FLUX_LANGUAGE_ID });
    expect(setMonarchTokensProvider).toHaveBeenCalledTimes(1);
    expect(setLanguageConfiguration).toHaveBeenCalledWith(FLUX_LANGUAGE_ID, languageConfiguration);

    monaco.languages.getLanguages.mockReturnValue([{ id: FLUX_LANGUAGE_ID }]);
    registerFluxLanguage(monaco as never);

    expect(register).toHaveBeenCalledTimes(1);
    expect(setMonarchTokensProvider).toHaveBeenCalledTimes(1);
    expect(setLanguageConfiguration).toHaveBeenCalledTimes(1);
  });

  it('does not tokenize double slashes inside quoted strings as comments', () => {
    registerFluxLanguage(monaco as never);

    const model = monaco.editor.createModel('url = "http://example"', FLUX_LANGUAGE_ID);
    const tokens = monaco.editor.tokenize(model.getValue(), FLUX_LANGUAGE_ID)[0];

    expect(tokens.some((token) => token.type.includes('comment'))).toBe(false);
    expect(tokens.some((token) => token.type.includes('string'))).toBe(true);
  });
});
