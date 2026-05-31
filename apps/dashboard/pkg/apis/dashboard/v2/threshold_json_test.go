package v2

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestDashboardThresholdMarshalOmitsNilValue(t *testing.T) {
	b, err := json.Marshal(DashboardThreshold{Color: "green"})
	require.NoError(t, err)
	require.JSONEq(t, `{"color":"green"}`, string(b))
}

func TestDashboardThresholdMarshalIncludesValue(t *testing.T) {
	value := 80.0

	b, err := json.Marshal(DashboardThreshold{Color: "red", Value: &value})
	require.NoError(t, err)
	require.JSONEq(t, `{"color":"red","value":80}`, string(b))
}
