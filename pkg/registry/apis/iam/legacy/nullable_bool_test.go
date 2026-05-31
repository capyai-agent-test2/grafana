package legacy

import "testing"

func TestNullableBoolScan(t *testing.T) {
	tests := []struct {
		name      string
		value     any
		wantBool  bool
		wantValid bool
	}{
		{name: "nil", value: nil, wantBool: false, wantValid: false},
		{name: "empty string", value: "", wantBool: false, wantValid: false},
		{name: "empty bytes", value: []byte{}, wantBool: false, wantValid: false},
		{name: "false string", value: "0", wantBool: false, wantValid: true},
		{name: "true string", value: "1", wantBool: true, wantValid: true},
		{name: "false bytes", value: []byte("0"), wantBool: false, wantValid: true},
		{name: "true bytes", value: []byte("1"), wantBool: true, wantValid: true},
		{name: "false bool", value: false, wantBool: false, wantValid: true},
		{name: "true bool", value: true, wantBool: true, wantValid: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var got nullableBool
			if err := got.Scan(tt.value); err != nil {
				t.Fatalf("Scan() error = %v", err)
			}
			if got.Bool != tt.wantBool {
				t.Fatalf("Bool = %v, want %v", got.Bool, tt.wantBool)
			}
			if got.Valid != tt.wantValid {
				t.Fatalf("Valid = %v, want %v", got.Valid, tt.wantValid)
			}
		})
	}
}
