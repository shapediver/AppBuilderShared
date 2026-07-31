import type {IStringParameterSelectSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

/**
 * Async String parameter selectors serialize `itemData.data` as JSON when it
 * is available. This preserves the source-backed selector contract while also
 * supporting filterable databases. SelectComponentAsync falls back to the
 * item key when an item has no data.
 */
export function resolveStringSelectEmitValue(
	selectSettings: IStringParameterSelectSettings,
): "itemKey" | "itemData" {
	return selectSettings.source || selectSettings.database
		? "itemData"
		: "itemKey";
}
