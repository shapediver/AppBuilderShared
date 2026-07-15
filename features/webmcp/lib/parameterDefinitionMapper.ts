import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {decomposeSdColor} from "@AppBuilderLib/shared/lib/colors";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	SUPPORTED_PARAMETER_TYPES,
	type ListParameterDefinitionItem,
} from "../config/listParameterDefinitions";
import {parseStringListIndex} from "./stringListValue";

export type {ListParameterDefinitionItem};

export function mapParameterDefinition(
	param: IShapeDiverParameter<any>,
): ListParameterDefinitionItem {
	const def = param.definition;
	const currentValue = param.state.uiValue;
	const name = def.displayname || def.name;

	const item: ListParameterDefinitionItem = {
		id: def.id,
		name,
		type: def.type,
		settable: SUPPORTED_PARAMETER_TYPES.includes(def.type),
	};

	if (def.hidden !== undefined) {
		item.hidden = def.hidden;
	}

	if (def.displayname && def.displayname !== name) {
		item.displayname = def.displayname;
	}

	if (def.group?.name) {
		item.group = def.group.name;
	}

	if (def.tooltip) {
		item.tooltip = def.tooltip;
	}

	if (def.type === ResParameterType.STRINGLIST) {
		item.choices = def.choices;
		item.currentValue = parseStringListIndex(currentValue);
		item.defaultValue = parseStringListIndex(def.defval);
	} else if (def.type === ResParameterType.COLOR) {
		item.currentValue = decomposeSdColor(currentValue as string);
		item.defaultValue = decomposeSdColor(def.defval as string);
	} else if (
		def.type === ResParameterType.EVEN ||
		def.type === ResParameterType.ODD ||
		def.type === ResParameterType.INT ||
		def.type === ResParameterType.FLOAT ||
		def.type === ResParameterType.STRING
	) {
		if (def.type !== ResParameterType.STRING) {
			item.min = def.min ?? null;
		}
		item.max = def.max ?? null;
		if (def.type === ResParameterType.FLOAT) {
			item.decimalplaces = def.decimalplaces ?? null;
		}
		item.currentValue = currentValue as string | number | boolean;
		item.defaultValue = def.defval as string | number | boolean;
	} else if (def.type === ResParameterType.BOOL) {
		item.currentValue = currentValue as boolean;
		item.defaultValue = def.defval;
	}

	return item;
}
