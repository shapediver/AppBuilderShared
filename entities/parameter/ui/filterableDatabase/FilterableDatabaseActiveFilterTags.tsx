import type {ActiveFilterTag} from "@AppBuilderLib/entities/parameter/model/filterableDatabase/useFilterableDatabase";
import {Pill, type PillGroupProps, type PillProps} from "@mantine/core";

export interface FilterableDatabaseActiveFilterTagsStyleProps {
	pillGroupProps?: PillGroupProps;
	pillProps?: PillProps;
}

export interface FilterableDatabaseActiveFilterTagsProps extends FilterableDatabaseActiveFilterTagsStyleProps {
	tags: ActiveFilterTag[];
	onRemove: (filterIndex: number, value: string) => void;
}

export function FilterableDatabaseActiveFilterTags(
	props: FilterableDatabaseActiveFilterTagsProps,
) {
	const {tags, onRemove, pillGroupProps, pillProps} = props;

	if (tags.length === 0) {
		return null;
	}

	return (
		<Pill.Group gap="xs" {...pillGroupProps}>
			{tags.map((tag) => (
				<Pill
					key={`${tag.filterIndex}-${tag.value}`}
					withRemoveButton
					onRemove={() => onRemove(tag.filterIndex, tag.value)}
					{...pillProps}
				>
					{`${tag.groupLabel}: ${tag.label}`}
				</Pill>
			))}
		</Pill.Group>
	);
}
