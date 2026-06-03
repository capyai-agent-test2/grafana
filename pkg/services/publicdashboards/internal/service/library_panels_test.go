package service

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	simplejson "github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/dashboards"
	"github.com/grafana/grafana/pkg/services/libraryelements/model"
	publicdashboardmodels "github.com/grafana/grafana/pkg/services/publicdashboards/internal/models"
	"github.com/grafana/grafana/pkg/services/publicdashboards/internal/service/intervalv2"
)

func TestHydrateLibraryPanelsMergesLibraryPanelModel(t *testing.T) {
	dash := dashboardWithLibraryPanel(t)
	service := newTestPublicDashboardService(t)

	err := service.hydrateLibraryPanels(context.Background(), dash)
	require.NoError(t, err)

	panel := dash.Data.Get("panels").GetIndex(0)
	require.Equal(t, "stat", panel.Get("type").MustString())
	require.Equal(t, int64(1), panel.Get("id").MustInt64())
	require.Equal(t, "lib-panel-uid", panel.Get("libraryPanel").Get("uid").MustString())
	require.Equal(t, float64(8), panel.Get("gridPos").Get("h").MustFloat64())
	require.Len(t, panel.Get("targets").MustArray(), 1)
	require.Equal(t, "A", panel.Get("targets").GetIndex(0).Get("refId").MustString())
}

func TestBuildMetricRequestSupportsHydratedLibraryPanels(t *testing.T) {
	dash := dashboardWithLibraryPanel(t)
	service := newTestPublicDashboardService(t)

	err := service.hydrateLibraryPanels(context.Background(), dash)
	require.NoError(t, err)

	req, err := service.buildMetricRequest(dash, &publicdashboardmodels.PublicDashboard{}, 1, publicdashboardmodels.PublicDashboardQueryDTO{})
	require.NoError(t, err)
	require.Len(t, req.Queries, 1)
	require.Equal(t, "A", req.Queries[0].Get("refId").MustString())
	require.Equal(t, "1,2,3", req.Queries[0].Get("stringInput").MustString())
	require.Equal(t, "testdata", req.Queries[0].Get("datasource").Get("uid").MustString())

	sanitizeData(dash.Data)
	panel := dash.Data.Get("panels").GetIndex(0)
	require.Equal(t, "stat", panel.Get("type").MustString())
	require.Len(t, panel.Get("targets").MustArray(), 1)
	_, exists := panel.Get("targets").GetIndex(0).CheckGet("expr")
	require.False(t, exists)
}

func dashboardWithLibraryPanel(t *testing.T) *dashboards.Dashboard {
	t.Helper()

	data := simplejson.MustJson([]byte(`{
		"time": {
			"from": "now-1h",
			"to": "now"
		},
		"panels": [
			{
				"id": 1,
				"type": "library-panel-ref",
				"title": "Loading library panel",
				"gridPos": {
					"h": 8,
					"w": 12,
					"x": 0,
					"y": 0
				},
				"libraryPanel": {
					"uid": "lib-panel-uid",
					"name": "Library Panel"
				}
			}
		]
	}`))

	return &dashboards.Dashboard{
		OrgID: 1,
		Data:  data,
	}
}

func newTestPublicDashboardService(t *testing.T) *PublicDashboardServiceImpl {
	t.Helper()

	modelBytes, err := json.Marshal(map[string]any{
		"type":  "stat",
		"title": "Library Panel",
		"targets": []map[string]any{
			{
				"refId":       "A",
				"scenarioId":  "csv_metric_values",
				"stringInput": "1,2,3",
				"datasource": map[string]any{
					"type": "testdata",
					"uid":  "testdata",
				},
			},
		},
	})
	require.NoError(t, err)

	return &PublicDashboardServiceImpl{
		log:                log.New("test"),
		intervalCalculator: intervalv2.NewCalculator(),
		libraryElements: fakeLibraryElementsService{
			element: model.LibraryElementDTO{
				UID:   "lib-panel-uid",
				Model: modelBytes,
			},
		},
	}
}

type fakeLibraryElementsService struct {
	element model.LibraryElementDTO
}

func (f fakeLibraryElementsService) CreateElement(context.Context, identity.Requester, model.CreateLibraryElementCommand) (model.LibraryElementDTO, error) {
	panic("not implemented")
}

func (f fakeLibraryElementsService) PatchLibraryElement(context.Context, identity.Requester, model.PatchLibraryElementCommand, string) (model.LibraryElementDTO, error) {
	panic("not implemented")
}

func (f fakeLibraryElementsService) DeleteLibraryElement(context.Context, identity.Requester, string) (int64, error) {
	panic("not implemented")
}

func (f fakeLibraryElementsService) GetElement(context.Context, identity.Requester, model.GetLibraryElementCommand) (model.LibraryElementDTO, error) {
	return f.element, nil
}

func (f fakeLibraryElementsService) DeleteLibraryElementsInFolder(context.Context, identity.Requester, string) error {
	panic("not implemented")
}

func (f fakeLibraryElementsService) GetAllElements(context.Context, identity.Requester, model.SearchLibraryElementsQuery) (model.LibraryElementSearchResult, error) {
	panic("not implemented")
}
