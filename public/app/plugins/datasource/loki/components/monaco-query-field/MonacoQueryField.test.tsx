import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { ReactMonacoEditor, type Monaco } from '@grafana/ui';

import { createLokiDatasource } from '../../mocks/datasource';

import MonacoQueryField from './MonacoQueryField';
import { type Props } from './MonacoQueryFieldProps';

jest.mock('@grafana/ui', () => {
  const actual = jest.requireActual('@grafana/ui');

  return {
    ...actual,
    ReactMonacoEditor: jest.fn(({ 'data-testid': dataTestId = selectors.components.ReactMonacoEditor.editorLazy }) => (
      <div data-testid={dataTestId} />
    )),
  };
});

function renderComponent({
  initialValue = '',
  onRunQuery = jest.fn(),
  onBlur = jest.fn(),
  onChange = jest.fn(),
}: Partial<Props> = {}) {
  const datasource = createLokiDatasource();

  render(
    <MonacoQueryField
      datasource={datasource}
      initialValue={initialValue}
      history={[]}
      onRunQuery={onRunQuery}
      onBlur={onBlur}
      onChange={onChange}
      placeholder="Enter a Loki query (run with Shift+Enter)"
    />
  );
}

describe('MonacoQueryField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Renders with no errors', async () => {
    renderComponent();

    const monacoEditor = await screen.findByTestId(selectors.components.QueryField.container);
    expect(monacoEditor).toBeInTheDocument();
  });

  test('scopes ctrl/cmd+f override to the focused query editor instance', async () => {
    renderComponent();

    const monacoEditorProps = (ReactMonacoEditor as jest.MockedFunction<typeof ReactMonacoEditor>).mock
      .calls[0][0] as ComponentProps<typeof ReactMonacoEditor>;

    const addKeybindingRule = jest.fn();
    const createContextKey = jest.fn().mockReturnValue({ set: jest.fn() });
    const onDidBlurEditorWidget = jest.fn();
    const onDidChangeModelContent = jest.fn();
    const onDidContentSizeChange = jest.fn();
    const onDidFocusEditorText = jest.fn();
    const addCommand = jest.fn();
    const getModel = jest.fn().mockReturnValue({
      deltaDecorations: jest.fn().mockReturnValue([]),
      id: 'model-id',
      getLinesContent: jest.fn().mockReturnValue([]),
      getValueLength: jest.fn().mockReturnValue(0),
      getValue: jest.fn().mockReturnValue(''),
    });
    const getValue = jest.fn().mockReturnValue('');

    const editor = {
      addCommand,
      createContextKey,
      getContentHeight: jest.fn().mockReturnValue(18),
      getModel,
      getValue,
      layout: jest.fn(),
      onDidBlurEditorWidget,
      onDidChangeModelContent,
      onDidContentSizeChange,
      onDidFocusEditorText,
      trigger: jest.fn(),
    };

    const monaco = {
      KeyCode: { Enter: 3, KeyF: 33 },
      KeyMod: { CtrlCmd: 2048, Shift: 1024 },
      MarkerSeverity: { Error: 8 },
      Range: jest.fn(),
      editor: {
        addKeybindingRule,
        setModelMarkers: jest.fn(),
      },
      languages: {
        registerCompletionItemProvider: jest.fn().mockReturnValue({ dispose: jest.fn() }),
      },
    } as unknown as Monaco;

    monacoEditorProps.onMount?.(editor as never, monaco);

    expect(createContextKey).toHaveBeenCalledWith(expect.stringMatching(/^isEditorFocused/), false);
    expect(addKeybindingRule).toHaveBeenCalledWith(
      expect.objectContaining({
        keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF,
        command: null,
        when: expect.stringMatching(/^isEditorFocused/),
      })
    );
  });
});
