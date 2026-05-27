// Copyright 2021 Prometheus Team
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package v0mimir1

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/go-kit/log"
	"github.com/go-kit/log/level"
	"github.com/prometheus/alertmanager/notify"
	"github.com/prometheus/alertmanager/template"
	"github.com/prometheus/alertmanager/types"
	commoncfg "github.com/prometheus/common/config"
	"github.com/prometheus/common/model"

	"github.com/grafana/alerting/receivers"

	httpcfg "github.com/grafana/alerting/http/v0mimir"
)

const (
	// https://discord.com/developers/docs/resources/channel#embed-object-embed-limits - 256 characters or runes.
	maxTitleLenRunes = 256
	// https://discord.com/developers/docs/resources/channel#embed-object-embed-limits - 4096 characters or runes.
	maxDescriptionLenRunes = 4096
)

const (
	colorRed   = 0x992D22
	colorGreen = 0x2ECC71
	colorGrey  = 0x95A5A6
)

var discordMentionTokenPattern = regexp.MustCompile(`(<@!?[0-9]+>|<@&[0-9]+>|@everyone|@here)`)

// Notifier implements a Notifier for Discord notifications.
type Notifier struct {
	conf       *Config
	tmpl       *template.Template
	logger     log.Logger
	client     *http.Client
	retrier    *notify.Retrier
	webhookURL *receivers.SecretURL
}

// New returns a new Discord notifier.
func New(c *Config, t *template.Template, l log.Logger, httpOpts ...commoncfg.HTTPClientOption) (*Notifier, error) {
	client, err := httpcfg.NewClientFromConfig(c.HTTPConfig, "discord", httpOpts...)
	if err != nil {
		return nil, err
	}
	n := &Notifier{
		conf:       c,
		tmpl:       t,
		logger:     l,
		client:     client,
		retrier:    &notify.Retrier{},
		webhookURL: c.WebhookURL,
	}
	return n, nil
}

type webhook struct {
	Content string         `json:"content"`
	Embeds  []webhookEmbed `json:"embeds"`
}

type webhookEmbed struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Color       int    `json:"color"`
}

func (n *Notifier) SendResolved() bool { return n.conf.SendResolved() }

// Notify implements the Notifier interface.
func (n *Notifier) Notify(ctx context.Context, as ...*types.Alert) (bool, error) {
	key, err := notify.ExtractGroupKey(ctx)
	if err != nil {
		return false, err
	}

	level.Debug(n.logger).Log("incident", key)

	alerts := types.Alerts(as...)
	data := notify.GetTemplateData(ctx, n.tmpl, as, n.logger)
	tmpl := notify.TmplText(n.tmpl, data, &err)
	if err != nil {
		return false, err
	}

	title, truncated := notify.TruncateInRunes(tmpl(n.conf.Title), maxTitleLenRunes)
	if err != nil {
		return false, err
	}
	if truncated {
		level.Warn(n.logger).Log("msg", "Truncated title", "key", key, "max_runes", maxTitleLenRunes)
	}
	message := tmpl(n.conf.Message)
	description, truncated := notify.TruncateInRunes(message, maxDescriptionLenRunes)
	if err != nil {
		return false, err
	}
	if truncated {
		level.Warn(n.logger).Log("msg", "Truncated message", "key", key, "max_runes", maxDescriptionLenRunes)
	}

	color := colorGrey
	if alerts.Status() == model.AlertFiring {
		color = colorRed
	}
	if alerts.Status() == model.AlertResolved {
		color = colorGreen
	}

	var url string
	if n.conf.WebhookURL != nil {
		url = n.conf.WebhookURL.String()
	} else {
		content, err := os.ReadFile(n.conf.WebhookURLFile)
		if err != nil {
			return false, fmt.Errorf("read webhook_url_file: %w", err)
		}
		url = strings.TrimSpace(string(content))
	}

	w := webhook{
		Content: extractDiscordMentionContent(message),
		Embeds: []webhookEmbed{{
			Title:       title,
			Description: description,
			Color:       color,
		}},
	}

	var payload bytes.Buffer
	if err = json.NewEncoder(&payload).Encode(w); err != nil {
		return false, err
	}

	resp, err := notify.PostJSON(ctx, n.client, url, &payload)
	if err != nil {
		return true, notify.RedactURL(err)
	}
	defer resp.Body.Close()

	shouldRetry, err := n.retrier.Check(resp.StatusCode, resp.Body)
	if err != nil {
		return shouldRetry, err
	}
	return false, nil
}

func extractDiscordMentionContent(message string) string {
	matchIndexes := discordMentionTokenPattern.FindAllStringIndex(message, -1)
	if len(matchIndexes) == 0 {
		return ""
	}

	mentions := make([]string, 0, len(matchIndexes))
	seen := make(map[string]struct{}, len(matchIndexes))
	for _, matchIndex := range matchIndexes {
		if mentionIsEscaped(message, matchIndex[0]) {
			continue
		}
		match := message[matchIndex[0]:matchIndex[1]]
		if !mentionHasTokenBoundaries(message, match, matchIndex[0], matchIndex[1]) {
			continue
		}
		if _, ok := seen[match]; ok {
			continue
		}
		seen[match] = struct{}{}
		mentions = append(mentions, match)
	}

	return strings.Join(mentions, " ")
}

func mentionIsEscaped(message string, matchStart int) bool {
	backslashCount := 0
	for i := matchStart - 1; i >= 0 && message[i] == '\\'; i-- {
		backslashCount++
	}

	return backslashCount%2 == 1
}

func mentionHasTokenBoundaries(message, match string, matchStart, matchEnd int) bool {
	if match != "@everyone" && match != "@here" {
		return true
	}

	if matchStart > 0 {
		prev, _ := utf8.DecodeLastRuneInString(message[:matchStart])
		if unicode.IsLetter(prev) || unicode.IsDigit(prev) || prev == '_' {
			return false
		}
	}

	if matchEnd < len(message) {
		next, _ := utf8.DecodeRuneInString(message[matchEnd:])
		if unicode.IsLetter(next) || unicode.IsDigit(next) || next == '_' {
			return false
		}
	}

	return true
}
