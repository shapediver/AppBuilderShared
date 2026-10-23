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
	const {type, ...rest} = props;

	if (type === "buttonflex") {
		return <SelectButtonFlexComponent {...rest} multiselect={false} />;
	} else if (type === "buttongroup") {
		return <SelectButtonGroupComponent {...rest} multiselect={false} />;
	} else if (type === "chipgroup") {
		return <SelectChipGroupComponent {...rest} multiselect={false} />;
	} else if (type === "color") {
		return <SelectColorComponent {...rest} />;
	} else if (type === "imagedropdown") {
		return <SelectImageDropDownComponent {...rest} />;
	} else if (type === "fullwidthcards") {
		return <SelectFullWidthCardsComponent {...rest} multiselect={false} />;
	} else if (type === "carousel") {
		return <SelectCarouselComponent {...rest} multiselect={false} />;
	} else if (type === "grid") {
		return <SelectGridComponent {...rest} multiselect={false} />;
	} else {
		return <SelectDropDownComponent {...rest} multiselect={false} />;
	}
}
