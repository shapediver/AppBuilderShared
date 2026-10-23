import {
	emitSelectValue,
	resolveDisplayValueForCards,
} from "../../lib/select/selectComponentAsyncValue";
import SelectButtonFlexComponent from "./SelectButtonFlexComponent";
import SelectButtonGroupComponent from "./SelectButtonGroupComponent";
import SelectCarouselComponent from "./SelectCarouselComponent";
import SelectChipGroupComponent from "./SelectChipGroupComponent";
import SelectColorComponent from "./SelectColorComponent";
import type {SelectComponentPropsExt} from "./SelectComponent";
import SelectDropDownComponent from "./SelectDropDownComponent";
import SelectFullWidthCardsComponent from "./SelectFullWidthCards";
import SelectGridComponent from "./SelectGridComponent";
import SelectImageDropDownComponent from "./SelectImageDropDownComponent";

type SelectWidgetProps = Omit<SelectComponentPropsExt, "source" | "database">;

/**
 * Renders one select widget from an already resolved `items` + `itemData` list.
 * Database loading and the e-commerce scrolling API stay in {@link SelectComponent}.
 */
export default function SelectWidget(props: SelectWidgetProps) {
	const {type, limit, emitValue, value, onChange, items, itemData, ...rest} =
		props;

	// String+database parameters store JSON data. Widgets select by item key.
	const displayValue =
		emitValue === "itemData"
			? resolveDisplayValueForCards(value, items, itemData)
			: value;

	const handleChange = (next: string | null) => {
		onChange(emitSelectValue(next, emitValue, itemData));
	};

	const widgetProps = {
		...rest,
		items,
		itemData,
		value: displayValue,
		onChange: handleChange,
	};

	if (type === "buttonflex") {
		return (
			<SelectButtonFlexComponent {...widgetProps} multiselect={false} />
		);
	} else if (type === "buttongroup") {
		return (
			<SelectButtonGroupComponent {...widgetProps} multiselect={false} />
		);
	} else if (type === "chipgroup") {
		return (
			<SelectChipGroupComponent {...widgetProps} multiselect={false} />
		);
	} else if (type === "color") {
		return <SelectColorComponent {...widgetProps} />;
	} else if (type === "imagedropdown") {
		return <SelectImageDropDownComponent {...widgetProps} />;
	} else if (type === "fullwidthcards") {
		return (
			<SelectFullWidthCardsComponent
				{...widgetProps}
				limit={limit}
				multiselect={false}
			/>
		);
	} else if (type === "carousel") {
		return <SelectCarouselComponent {...widgetProps} multiselect={false} />;
	} else if (type === "grid") {
		return (
			<SelectGridComponent
				{...widgetProps}
				limit={limit}
				multiselect={false}
			/>
		);
	} else {
		return (
			<SelectDropDownComponent
				{...widgetProps}
				limit={limit}
				multiselect={false}
			/>
		);
	}
}
