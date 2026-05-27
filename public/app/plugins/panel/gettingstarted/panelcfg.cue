package grafanaplugin

composableKinds: PanelCfg: {
	maturity: "experimental"

	lineage: {
		schemas: [{
			version: [0, 0]
			schema: {
				Options: {} @cuetsy(kind="interface")
			}
		}]
		lenses: []
	}
}
