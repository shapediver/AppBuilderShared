import {
	IFilterableDatabaseSettings,
	ISelectComponentItemDataType,
	SelectComponentType,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import React from "react";
import {DatabaseSelectFrame} from "../select/DatabaseSelectFrame";
import SelectButtonFlexComponent from "../select/SelectButtonFlexComponent";
import SelectButtonGroupComponent from "../select/SelectButtonGroupComponent";
import SelectCarouselComponent from "../select/SelectCarouselComponent";
import SelectChipGroupComponent from "../select/SelectChipGroupComponent";
import type {
	SelectComponentProps,
	SelectComponentSettings,
} from "../select/SelectComponent";
import SelectDropDownComponent from "../select/SelectDropDownComponent";
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
	/**
	 * Optional catalog. Same file and patch rules as a single-select database.
	 * Checklist widgets render the filtered catalog directly.
	 */
	database?: IFilterableDatabaseSettings;
	/**
	 * Keeps the database filter selection while this control is unmounted
	 * or idle. Pass `namespace:parameterId`.
	 */
	persistenceKey?: string;
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
	const {type, database, persistenceKey, itemData, items, ...rest} = props;

	if (database) {
		return (
			<DatabaseSelectFrame
				database={database}
				itemData={itemData}
				limit={rest.limit}
				persistenceKey={persistenceKey}
			>
				{({catalog}) => (
					<MultiSelectComponent
						{...rest}
						type={type}
						items={catalog?.items ?? []}
						itemData={catalog?.itemData}
					/>
				)}
			</DatabaseSelectFrame>
		);
	}

	const widgetProps = {...rest, items, itemData};

	if (type === "multiselect-checkboxes") {
		return <MultiSelectCheckboxesComponent {...widgetProps} />;
	}

	if (type === "buttonflex") {
		return (
			<SelectButtonFlexComponent {...widgetProps} multiselect={true} />
		);
	}

	if (type === "buttongroup") {
		return (
			<SelectButtonGroupComponent {...widgetProps} multiselect={true} />
		);
	}

	if (type === "chipgroup") {
		return <SelectChipGroupComponent {...widgetProps} multiselect={true} />;
	}

	if (type === "fullwidthcards") {
		return (
			<SelectFullWidthCardsComponent
				{...widgetProps}
				multiselect={true}
			/>
		);
	}

	if (type === "grid") {
		return <SelectGridComponent {...widgetProps} multiselect={true} />;
	}

	if (type === "carousel") {
		return <SelectCarouselComponent {...widgetProps} multiselect={true} />;
	}

	return <SelectDropDownComponent {...widgetProps} multiselect={true} />;
}
