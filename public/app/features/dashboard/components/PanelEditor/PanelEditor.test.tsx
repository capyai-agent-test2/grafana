import { PanelEditorUnconnected } from './PanelEditor';

jest.mock('./state/selectors', () => ({
  getPanelEditorTabs: jest.fn(() => [{ id: 'queries', text: 'Queries' }]),
}));

describe('PanelEditorUnconnected pane resizing', () => {
  const panel = {
    key: 'panel-1',
    events: { subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })) },
  };

  const dashboard = {
    meta: {},
  };

  const theme = {};

  it('persists a zero-height top pane after collapsing the queries drawer', () => {
    const updatePanelEditorUIState = jest.fn();
    const component = new PanelEditorUnconnected({
      panel,
      dashboard,
      plugin: {},
      tab: 'queries',
      initPanelEditor: jest.fn(),
      discardPanelChanges: jest.fn(),
      updatePanelEditorUIState,
      updateTimeZoneForSession: jest.fn(),
      toggleTableView: jest.fn(),
      notifyApp: jest.fn(),
      sourcePanel: panel,
      sectionNav: {} as never,
      pageNav: {} as never,
      initDone: true,
      uiState: { topPaneSize: 0.5, rightPaneSize: 0.5, isPanelOptionsVisible: false, mode: 'edit' },
      tableViewEnabled: false,
      variables: [],
      theme,
    } as never);

    const splitPane = component.renderPanelAndEditor(
      { topPaneSize: 0.5, rightPaneSize: 0.5, isPanelOptionsVisible: false, mode: 'edit' } as never,
      {} as never
    );

    splitPane.props.onDragFinished(0);

    expect(updatePanelEditorUIState).toHaveBeenCalledWith({ topPaneSize: 0 });
  });
});
