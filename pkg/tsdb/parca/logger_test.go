package parca

import (
	"context"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	sdklog "github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/stretchr/testify/require"
)

func TestProvideServiceInitializesLoggerAtRuntime(t *testing.T) {
	original := backend.NewLoggerWith
	t.Cleanup(func() {
		backend.NewLoggerWith = original
	})

	expected := &stubLogger{}
	backend.NewLoggerWith = func(args ...any) sdklog.Logger {
		return expected
	}

	service := ProvideService(httpclient.NewProvider())
	require.Same(t, expected, service.logger)
	require.Same(t, expected, newLogger())
}

type stubLogger struct{}

func (l *stubLogger) Debug(string, ...interface{})              {}
func (l *stubLogger) Info(string, ...interface{})               {}
func (l *stubLogger) Warn(string, ...interface{})               {}
func (l *stubLogger) Error(string, ...interface{})              {}
func (l *stubLogger) With(...interface{}) sdklog.Logger         { return l }
func (l *stubLogger) Level() sdklog.Level                       { return sdklog.NoLevel }
func (l *stubLogger) FromContext(context.Context) sdklog.Logger { return l }
