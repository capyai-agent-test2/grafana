package legacy

import stdsql "database/sql"

type nullableBool struct {
	stdsql.NullBool
}

func (b *nullableBool) Scan(value any) error {
	switch v := value.(type) {
	case string:
		if v == "" {
			b.Bool = false
			b.Valid = false
			return nil
		}
	case []byte:
		if len(v) == 0 {
			b.Bool = false
			b.Valid = false
			return nil
		}
	}

	return b.NullBool.Scan(value)
}
