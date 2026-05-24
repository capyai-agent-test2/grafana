package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	simplejson "github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/services/dashboards"
	libraryelementsmodel "github.com/grafana/grafana/pkg/services/libraryelements/model"
)

func (pd *PublicDashboardServiceImpl) hydrateLibraryPanels(ctx context.Context, dash *dashboards.Dashboard) error {
	if dash == nil || dash.Data == nil || pd.libraryElements == nil {
		return nil
	}

	serviceCtx := identity.WithServiceIdentityContext(ctx, dash.OrgID)
	requester, err := identity.GetRequester(serviceCtx)
	if err != nil {
		return fmt.Errorf("get service requester: %w", err)
	}

	cache := make(map[string]*simplejson.Json)
	return pd.hydratePanels(serviceCtx, requester, dash.Data.Get("panels").MustArray(), cache)
}

func (pd *PublicDashboardServiceImpl) hydratePanels(ctx context.Context, requester identity.Requester, panels []any, cache map[string]*simplejson.Json) error {
	for _, panelObj := range panels {
		panel := simplejson.NewFromAny(panelObj)

		if panel.Get("type").MustString() == "row" && panel.Get("collapsed").MustBool() {
			if err := pd.hydratePanels(ctx, requester, panel.Get("panels").MustArray(), cache); err != nil {
				return err
			}
		}

		libraryPanel := panel.Get("libraryPanel")
		uid := libraryPanel.Get("uid").MustString()
		if uid == "" {
			continue
		}

		model, ok := cache[uid]
		if !ok {
			element, err := pd.libraryElements.GetElement(ctx, requester, libraryelementsmodel.GetLibraryElementCommand{UID: uid})
			if err != nil {
				pd.log.Warn("Failed to hydrate library panel for public dashboard", "uid", uid, "error", err)
				continue
			}

			modelJSON, err := simplejson.NewJson(element.Model)
			if err != nil {
				return fmt.Errorf("decode library panel model %s: %w", uid, err)
			}

			cache[uid] = modelJSON
			model = modelJSON
		}

		if err := mergeLibraryPanelModel(panel, model); err != nil {
			return fmt.Errorf("merge library panel model %s: %w", uid, err)
		}
	}

	return nil
}

func mergeLibraryPanelModel(panel *simplejson.Json, model *simplejson.Json) error {
	panelID := panel.Get("id").Interface()
	gridPos := panel.Get("gridPos").Interface()
	libraryPanel := panel.Get("libraryPanel").Interface()

	modelBytes, err := model.MarshalJSON()
	if err != nil {
		return err
	}

	var merged map[string]any
	if err := json.Unmarshal(modelBytes, &merged); err != nil {
		return err
	}

	for key, value := range panel.MustMap() {
		if shouldPreserveLibraryPanelRefProperty(key) {
			merged[key] = value
		}
	}

	if panelID != nil {
		merged["id"] = panelID
	}
	if gridPos != nil {
		merged["gridPos"] = gridPos
	}
	if libraryPanel != nil {
		merged["libraryPanel"] = libraryPanel
	}

	for key := range panel.MustMap() {
		if _, ok := merged[key]; !ok {
			panel.Del(key)
		}
	}
	for key, value := range merged {
		panel.Set(key, value)
	}

	return nil
}

func shouldPreserveLibraryPanelRefProperty(key string) bool {
	switch key {
	case "collapsed", "gridPos", "id", "libraryPanel", "maxPerRow", "panels", "repeat", "repeatDirection":
		return true
	default:
		return false
	}
}
