import {
	ISelectComponentItemDataType,
	SelectComponentType,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import React from "react";
import {
	SelectComponentProps,
	SelectComponentSettings,
} from "@AppBuilderLib/entities/parameter/ui/select/SelectComponent";
import SelectDropDownComponent from "@AppBuilderLib/entities/parameter/ui/select/SelectDropDownComponent";
import SelectButtonFlexComponent from "../select/SelectButtonFlexComponent";
import SelectButtonGroupComponent from "../select/SelectButtonGroupComponent";
import SelectCarouselComponent from "../select/SelectCarouselComponent";
import SelectChipGroupComponent from "../select/SelectChipGroupComponent";
import SelectFullWidthCardsComponent from "../select/SelectFullWidthCards";
import SelectGridComponent from "../select/SelectGridComponent";
import MultiSelectCheckboxesComponent from "./MultiSelectCheckboxesComponent";

export interface MultiSelectComponentProps {
	/** Controlled value (array of selected item names). */
	value: string[];
	/** Handler for updating the value. */
	onChange: (value: string[]) => void;
	/** Record containing optional further item data per item name. */
	itemData?: Record<string, ISelectComponentItemDataType>;
	/** Item names that can be selected, must be unique. */
	items: string[];
	/** Whether the component shall be disabled. */
	disabled?: boolean;
	/** Component-specific settings (e.g. width for SelectImageDropDownComponent). */
	settings?: SelectComponentSettings;
	/** Optional function to wrap the input component in a custom container. */
	inputContainer?: (children: React.ReactNode) => React.ReactNode;
	/** Optional function to handle focus events. */
	onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
	/** Optional function to handle blur events. */
	onBlur?: () => void;
	/**
	 * Optional CSS controlling the absolute height of the widget.
	 * In case this is not specified, the default behavior of the widget
	 * is to adapt its height according to the items.
	 * This should always be specified in case of infinite scrolling.
	 */
	height?: string;
	/** Type of select component to use. */
	type?: SelectComponentType;
	/** Enable search (only used by dropdown type). */
	searchable?: boolean;
	/** Max number of options rendered at the same time (only used by dropdown type with searchable). */
	limit?: number;
}

export type UniversalMultiSelectComponentProps =
	| (SelectComponentProps & {multiselect: false})
	| (MultiSelectComponentProps & {multiselect: true});

/**
 * Functional multiselect component.
 * Multiple items can be selected at a time.
 */
export default function MultiSelectComponent(props: MultiSelectComponentProps) {
	const {type, ...rest} = props;

	if (type === "multiselect-checkboxes") {
		return <MultiSelectCheckboxesComponent {...rest} />;
	}

	if (type === "buttonflex") {
		return <SelectButtonFlexComponent {...rest} multiselect={true} />;
	}

	if (type === "buttongroup") {
		return <SelectButtonGroupComponent {...rest} multiselect={true} />;
	}

	if (type === "chipgroup") {
		return <SelectChipGroupComponent {...rest} multiselect={true} />;
	}

	if (type === "fullwidthcards") {
		return <SelectFullWidthCardsComponent {...rest} multiselect={true} />;
	}

	if (type === "grid") {
		return <SelectGridComponent {...rest} multiselect={true} />;
	}

	if (type === "carousel") {
		return <SelectCarouselComponent {...rest} multiselect={true} />;
	}

	return <SelectDropDownComponent {...rest} multiselect={true} />;
}
