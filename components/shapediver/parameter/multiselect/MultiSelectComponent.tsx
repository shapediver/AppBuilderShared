import {SelectComponentType} from "@AppBuilderShared/types/shapediver/appbuilder";
import React from "react";
import MultiSelectCheckboxesComponent from "./MultiSelectCheckboxesComponent.tsx";
import MultiSelectDropDownComponent from "./MultiSelectDropDownComponent";

export interface MultiSelectComponentProps {
	/** Controlled value (array of selected item names). */
	value: string[];
	/** Handler for updating the value. */
	onChange: (value: string[]) => void;
	/** Item names that can be selected, must be unique. */
	items: string[];
	/** Whether the component shall be disabled. */
	disabled?: boolean;
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
}

/**
 * Functional multiselect component.
 * Multiple items can be selected at a time.
 */
export default function MultiSelectComponent(props: MultiSelectComponentProps) {
	const {type, ...rest} = props;

	if (type === "multiselect-checkboxes") {
		return <MultiSelectCheckboxesComponent {...rest} />;
	}

	return <MultiSelectDropDownComponent {...rest} />;
}
