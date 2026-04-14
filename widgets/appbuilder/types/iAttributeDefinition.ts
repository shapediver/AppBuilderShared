import type {
	IAttribute,
	IStringAttribute,
} from "@shapediver/viewer.features.attribute-visualization";
import type {IDefaultAttributeExtended} from "../ui/attributes/DefaultAttribute";
import type {INumberAttributeExtended} from "../ui/attributes/NumberAttribute";

export type IAttributeDefinition =
	| IAttribute
	| INumberAttributeExtended
	| IStringAttribute
	| IDefaultAttributeExtended;
