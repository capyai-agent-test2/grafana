package fsql

import (
	"fmt"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data/sqlutil"
)

var macros = sqlutil.Macros{
	"dateBin":        macroDateBin(""),
	"dateBinAlias":   macroDateBin("_binned"),
	"interval":       macroInterval,
	"timeGroup":      macroTimeGroup,
	"timeGroupAlias": macroTimeGroupAlias,

	// The behaviors of timeFrom and timeTo as defined in the SDK are different
	// from all other Grafana SQL plugins. Instead we'll take the implementations,
	// rename them and define timeFrom and timeTo ourselves.
	"timeTo":   macroTo,
	"timeFrom": macroFrom,
}

func macroTimeGroup(query *sqlutil.Query, args []string) (string, error) {
	if len(args) != 1 && len(args) != 2 {
		return "", fmt.Errorf("%w: expected 1 or 2 arguments, received %d", sqlutil.ErrorBadArgumentCount, len(args))
	}

	interval, err := timeGroupInterval(query, args)
	if err != nil {
		return "", err
	}

	return dateBin(args[0], interval, ""), nil
}

func macroTimeGroupAlias(query *sqlutil.Query, args []string) (string, error) {
	if len(args) != 1 && len(args) != 2 {
		return "", fmt.Errorf("%w: expected 1 or 2 arguments, received %d", sqlutil.ErrorBadArgumentCount, len(args))
	}

	interval, err := timeGroupInterval(query, args)
	if err != nil {
		return "", err
	}

	return dateBin(args[0], interval, fmt.Sprintf(" as %s_binned", args[0])), nil
}

func timeGroupInterval(query *sqlutil.Query, args []string) (string, error) {
	if len(args) == 1 {
		return macroInterval(query, nil)
	}

	if args[1] == "$__interval" {
		return macroInterval(query, nil)
	}

	return args[1], nil
}

func macroInterval(query *sqlutil.Query, _ []string) (string, error) {
	return fmt.Sprintf("interval '%d second'", int64(query.Interval.Seconds())), nil
}

// https://docs.influxdata.com/influxdb/cloud-serverless/query-data/sql/cast-types/?t=CAST%28%29#cast-to-a-timestamp-type
func macroFrom(query *sqlutil.Query, _ []string) (string, error) {
	return fmt.Sprintf("cast('%s' as timestamp)", query.TimeRange.From.Format(time.RFC3339)), nil
}

// https://docs.influxdata.com/influxdb/cloud-serverless/query-data/sql/cast-types/?t=CAST%28%29#cast-to-a-timestamp-type
func macroTo(query *sqlutil.Query, _ []string) (string, error) {
	return fmt.Sprintf("cast('%s' as timestamp)", query.TimeRange.To.Format(time.RFC3339)), nil
}

func macroDateBin(suffix string) sqlutil.MacroFunc {
	return func(query *sqlutil.Query, args []string) (string, error) {
		if len(args) != 1 {
			return "", fmt.Errorf("%w: expected 1 argument, received %d", sqlutil.ErrorBadArgumentCount, len(args))
		}
		return dateBin(args[0], fmt.Sprintf("interval '%d second'", int64(query.Interval.Seconds())), func() string {
			if suffix == "" {
				return ""
			}
			return fmt.Sprintf(" as %s%s", args[0], suffix)
		}()), nil
	}
}

func dateBin(column string, interval string, alias string) string {
	return fmt.Sprintf("date_bin(%s, %s, timestamp '1970-01-01T00:00:00Z')%s", interval, column, alias)
}
