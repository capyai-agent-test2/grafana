package apis

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestDashboardThresholdManifestSchemaDoesNotRequireValue(t *testing.T) {
	for _, rawSchema := range [][]byte{
		rawSchemaDashboardv2,
		rawSchemaDashboardv2alpha1,
		rawSchemaDashboardv2beta1,
	} {
		var schema map[string]struct {
			Required []string `json:"required"`
		}

		require.NoError(t, json.Unmarshal(rawSchema, &schema))
		require.ElementsMatch(t, []string{"color"}, schema["Threshold"].Required)
	}
}
