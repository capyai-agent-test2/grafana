package dashboard

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestThresholdMarshalOmitsNilValue(t *testing.T) {
	b, err := json.Marshal(Threshold{Color: "green"})
	require.NoError(t, err)
	require.JSONEq(t, `{"color":"green"}`, string(b))
}

func TestThresholdMarshalIncludesValue(t *testing.T) {
	value := 80.0

	b, err := json.Marshal(Threshold{Color: "red", Value: &value})
	require.NoError(t, err)
	require.JSONEq(t, `{"color":"red","value":80}`, string(b))
}
