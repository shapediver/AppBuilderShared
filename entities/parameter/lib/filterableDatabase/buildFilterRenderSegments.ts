import type {FilterTreeGroup} from "@AppBuilderLib/entities/parameter/model/filterableDatabase/useFilterableDatabase";
import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

export type FilterRenderSegment =
	| {kind: "inline"; group: FilterTreeGroup}
	| {kind: "accordion"; groups: FilterTreeGroup[]};

/**
 * Preserves filter order while batching consecutive accordion groups.
 * Inline filters flush any open accordion batch before rendering.
 */
export function buildFilterRenderSegments(
	filterGroups: FilterTreeGroup[],
	filters: IFilterableDatabaseSettings["filters"],
): FilterRenderSegment[] {
	const segments: FilterRenderSegment[] = [];
	let accordionBatch: FilterTreeGroup[] = [];

	const flushAccordionBatch = () => {
		if (accordionBatch.length === 0) {
			return;
		}
		segments.push({kind: "accordion", groups: accordionBatch});
		accordionBatch = [];
	};

	for (const group of filterGroups) {
		if (filters[group.filterIndex]?.inline === true) {
			flushAccordionBatch();
			segments.push({kind: "inline", group});
		} else {
			accordionBatch.push(group);
		}
	}

	flushAccordionBatch();
	return segments;
}
