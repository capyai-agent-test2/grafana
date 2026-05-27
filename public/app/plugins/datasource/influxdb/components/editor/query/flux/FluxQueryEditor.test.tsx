import { render } from '@testing-library/react';

import { FluxQueryEditor } from './FluxQueryEditor';
import { FLUX_LANGUAGE_ID } from './language';

const codeEditor = jest.fn(() => null);

jest.mock('@grafana/runtime', () => ({
  getTemplateSrv: () => ({
    getVariables: () => [],
    replace: (value: string) => value,
  }),
}));

jest.mock('@grafana/ui', () => {
  const actual = jest.requireActual('@grafana/ui');

  return {
    ...actual,
    CodeEditor: (props: unknown) => {
      codeEditor(props);
      return null;
    },
  };
});

describe('FluxQueryEditor', () => {
  it('uses the Flux Monaco language', () => {
    render(
      <FluxQueryEditor
        datasource={{} as never}
        onChange={jest.fn()}
        query={{ refId: 'A', query: 'from(bucket: "example")' }}
      />
    );

    expect(codeEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        language: FLUX_LANGUAGE_ID,
        onBeforeEditorMount: expect.any(Function),
      })
    );
  });
});
