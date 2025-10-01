import {PropsParameterOrExport} from "@AppBuilderShared/types/components/shapediver/propsCommon";
import {IAppBuilderActionPropsSetParameterValue} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IShapeDiverExportDefinition} from "@AppBuilderShared/types/shapediver/export";

/** Props of an export reference. */
export interface PropsExport extends PropsParameterOrExport {
	/**
	 * Id of the export.
	 */
	readonly exportId: string;

	/**
	 * Properties of the export to be overridden.
	 */
	readonly overrides?: Pick<
		Partial<IShapeDiverExportDefinition>,
		"displayname" | "group" | "order" | "tooltip" | "hidden"
	>;

	/**
	 * Parameter values to be used when requesting this export.
	 */
	readonly parameterValues?: IAppBuilderActionPropsSetParameterValue[];
}
