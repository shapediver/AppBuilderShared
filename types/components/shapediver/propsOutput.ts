import {PropsParameterOrExport} from "@AppBuilderShared/types/components/shapediver/propsCommon";
import {IShapeDiverOutputDefinition} from "@AppBuilderShared/types/shapediver/output";

/** Props of an output reference. */
export interface PropsOutput extends PropsParameterOrExport {
	/**
	 * Id of the output.
	 */
	readonly outputId: IShapeDiverOutputDefinition["id"];

	/**
	 * Properties of the output to be overridden.
	 */
	readonly overrides?: Pick<
		Partial<IShapeDiverOutputDefinition>,
		"displayname" | "group" | "order" | "tooltip" | "hidden"
	>;
}
