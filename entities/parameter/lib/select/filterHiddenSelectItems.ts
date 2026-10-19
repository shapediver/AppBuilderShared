import type {ISelectComponentItemDataType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

/**
 * Drops items whose itemData.hidden is true.
 *
 * Select widgets read displayname, tooltip, description, imageUrl, and color.
 * They do not read hidden. Callers that own the item list must filter first
 * (string-list parameters do this in ParameterSelectComponent).
 */
export function filterHiddenSelectItems(
	items: readonly string[] | undefined,
	itemData: Record<string, ISelectComponentItemDataType> | undefined,
): string[] {
	if (!items?.length) return [];
	return items.filter((item) => !itemData?.[item]?.hidden);
}
