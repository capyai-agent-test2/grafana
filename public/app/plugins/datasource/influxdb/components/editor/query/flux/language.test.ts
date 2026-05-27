import { FLUX_LANGUAGE_ID, languageConfiguration, registerFluxLanguage } from './language';

describe('Flux Monaco language', () => {
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
});
