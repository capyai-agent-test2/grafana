import { PanelModel } from '../../../state/PanelModel';

import { initialState, panelEditorReducer, updateEditorInitState } from './reducers';

describe('panelEditor reducers', () => {
  describe('updateEditorInitState', () => {
    it('opens the visualization picker when editing a new panel', () => {
      const sourcePanel = new PanelModel({ isNew: true });
      const panel = new PanelModel({});
      const initialPanelEditorState = initialState();

      const state = panelEditorReducer(
        { ...initialPanelEditorState, ui: { ...initialPanelEditorState.ui, isPanelOptionsVisible: false } },
        updateEditorInitState({ panel, sourcePanel })
      );

      expect(state.isVizPickerOpen).toBe(true);
      expect(state.ui.isPanelOptionsVisible).toBe(true);
    });

    it('keeps the visualization picker closed when editing an existing panel', () => {
      const sourcePanel = new PanelModel({});
      const panel = new PanelModel({});

      const state = panelEditorReducer(
        { ...initialState(), isVizPickerOpen: true },
        updateEditorInitState({ panel, sourcePanel })
      );

      expect(state.isVizPickerOpen).toBe(false);
    });
  });
});
