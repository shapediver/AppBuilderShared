import {MantineColor} from "@mantine/core";
import React from "react";
import SelectButtonFlexComponent from "./SelectButtonFlexComponent";
import SelectButtonGroupComponent from "./SelectButtonGroupComponent";
import SelectChipGroupComponent from "./SelectChipGroupComponent";
import SelectColorComponent from "./SelectColorComponent";
import SelectDropDownComponent from "./SelectDropDownComponent";
import SelectImageDropDownComponent from "./SelectImageDropDownComponent";

export interface SelectComponentItemDataType {
	/** Display name to use instead of the item name. */
	displayname?: string;
	/** Tooltip. */
	tooltip?: string;
	/** Description. */
	description?: string;
	/** URL to image. Can be a data URL including a base 64 encoded image. */
	imageUrl?: string;
	/** Optional color, used for color selection components. */
	color?: MantineColor;
}

export interface SelectComponentProps {
	/** Controlled value (item name). */
	value: string | null | undefined;
	/** Handler for updating the value. */
	onChange: (value: string | null) => void;
	/** Item names that can be selected, must be unique. */
	items: string[];
	/** Record containing optional further item data per item name. */
	itemData?: Record<string, SelectComponentItemDataType>;
	/** Whether the component shall be disabled. */
	disabled?: boolean;
}

/** Types of selection components. */
export type SelectComponentType =
	| "buttonflex"
	| "buttongroup"
	| "chipgroup"
	| "dropdown"
	| "color"
	| "imagedropdown";

interface SelectComponentPropsExt extends SelectComponentProps {
	/** Type of select component to use. */
	type?: SelectComponentType;
}

/**
 * Functional select component.
 * At most one item can be selected at a time.
 */
export default function SelectComponent(props: SelectComponentPropsExt) {
	const {type, ...rest} = props;

	if (type === "buttonflex") {
		return <SelectButtonFlexComponent {...rest} />;
	} else if (type === "buttongroup") {
		return <SelectButtonGroupComponent {...rest} />;
	} else if (type === "chipgroup") {
		return <SelectChipGroupComponent {...rest} />;
	} else if (type === "color") {
		return <SelectColorComponent {...rest} />;
	} else if (type === "imagedropdown") {
		return <SelectImageDropDownComponent {...rest} />;
	} else {
		return <SelectDropDownComponent {...rest} />;
	}
}
