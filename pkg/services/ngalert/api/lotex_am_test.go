package api

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/components/simplejson"
)

func TestGetAlertmanagerPrefix(t *testing.T) {
	t.Run("defaults to alertmanager", func(t *testing.T) {
		require.Equal(t, defaultAlertmanagerPath, getAlertmanagerPrefix(nil))
		require.Equal(t, defaultAlertmanagerPath, getAlertmanagerPrefix(simplejson.New()))
	})

	t.Run("normalizes custom prefixes", func(t *testing.T) {
		require.Equal(t, "/mimir-alertmanager", getAlertmanagerPrefix(simplejson.NewFromAny(map[string]any{
			"alertmanagerPrefix": " /mimir-alertmanager/ ",
		})))
		require.Equal(t, "", getAlertmanagerPrefix(simplejson.NewFromAny(map[string]any{
			"alertmanagerPrefix": "/",
		})))
	})
}

func TestFormatAlertmanagerEndpointPath(t *testing.T) {
	t.Run("uses the custom prefix for Mimir endpoints", func(t *testing.T) {
		path := formatAlertmanagerEndpointPath("mimir", endpoints["mimir"]["status"], simplejson.NewFromAny(map[string]any{
			"alertmanagerPrefix": " /mimir-alertmanager/ ",
		}), nil)

		require.Equal(t, "/mimir-alertmanager/api/v2/status", path)
	})

	t.Run("keeps Prometheus endpoints unprefixed", func(t *testing.T) {
		path := formatAlertmanagerEndpointPath("prometheus", endpoints["prometheus"]["status"], simplejson.NewFromAny(map[string]any{
			"alertmanagerPrefix": "/ignored",
		}), nil)

		require.Equal(t, "/api/v2/status", path)
	})
}
