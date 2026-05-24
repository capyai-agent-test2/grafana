package api

import (
	"bytes"
	"fmt"
	"net/http"

	"go.yaml.in/yaml/v3"

	"github.com/grafana/grafana/pkg/api/response"
)

func yamlResponse(status int, body any) *response.NormalResponse {
	var b bytes.Buffer
	enc := yaml.NewEncoder(&b)
	enc.SetIndent(2)
	if err := enc.Encode(body); err != nil {
		return response.Error(http.StatusInternalServerError, "body yaml marshal", err)
	}
	if err := enc.Close(); err != nil {
		return response.Error(http.StatusInternalServerError, "body yaml marshal", err)
	}

	return response.Respond(status, b.Bytes()).
		SetHeader("Content-Type", "text/yaml")
}

func yamlDownloadResponse(status int, body any, filename string) *response.NormalResponse {
	return yamlResponse(status, body).
		SetHeader("Content-Type", "application/yaml").
		SetHeader("Content-Disposition", fmt.Sprintf(`attachment;filename="%s"`, filename))
}
