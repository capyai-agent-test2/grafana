package v2alpha1

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestDashboardAnnotationFilterUnmarshalLargePanelIDs(t *testing.T) {
	var dashboard Dashboard

	err := json.Unmarshal([]byte(`{"spec":{"annotations":[{"spec":{"filter":{"ids":[4294967296,9007199254740991]}}}]}}`), &dashboard)
	require.NoError(t, err)
	require.Len(t, dashboard.Spec.Annotations, 1)
	require.NotNil(t, dashboard.Spec.Annotations[0].Spec.Filter)
	require.Equal(t, []float64{4294967296, 9007199254740991}, dashboard.Spec.Annotations[0].Spec.Filter.Ids)
}
