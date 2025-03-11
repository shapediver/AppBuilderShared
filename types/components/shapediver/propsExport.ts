import {PropsParameterOrExport} from "@AppBuilderShared/types/components/shapediver/propsCommon";
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
}
