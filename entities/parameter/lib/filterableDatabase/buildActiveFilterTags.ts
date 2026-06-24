import type {FilterTreeGroup} from "../../model/filterableDatabase/useFilterableDatabase";
import type {FilterSelection} from "./types";

export interface ActiveFilterTag {
	filterIndex: number;
	value: string;
	label: string;
	groupLabel: string;
}

export function buildActiveFilterTags(
	selection: FilterSelection,
	filterGroups: FilterTreeGroup[],
): ActiveFilterTag[] {
	const tags: ActiveFilterTag[] = [];

	for (const [indexStr, values] of Object.entries(selection)) {
		const filterIndex = Number(indexStr);
		const group = filterGroups.find(
			(entry) => entry.filterIndex === filterIndex,
		);

		if (!group || !values?.length) {
			continue;
		}

		for (const value of values) {
			tags.push({
				filterIndex,
				value,
				label: value,
				groupLabel: group.label,
			});
		}
	}

	return tags;
}
