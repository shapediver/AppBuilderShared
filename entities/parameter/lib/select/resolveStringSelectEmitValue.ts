import type {IStringParameterSelectSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

/**
 * String parameters with a filterable database serialize `itemData.data` as JSON
 * (see SS-9717 design). E-commerce `source` without `database` uses item keys.
 */
export function resolveStringSelectEmitValue(
	selectSettings: IStringParameterSelectSettings,
): "itemKey" | "itemData" {
	if (selectSettings.source && !selectSettings.database) {
		return "itemKey";
	}

	return "itemData";
}
