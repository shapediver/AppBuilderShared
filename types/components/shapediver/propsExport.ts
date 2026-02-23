import {PropsParameterOrExport} from "@AppBuilderShared/types/components/shapediver/propsCommon";
import {IAppBuilderActionPropsSetParameterValue} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IShapeDiverExportDefinition} from "@AppBuilderShared/types/shapediver/export";
import {UseFormReturnType} from "@mantine/form";

/** Export parameters **/
export type IParameterValues = {[key: string]: string};
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

/**
 * Props for Mantine form integration with export components.
 */
export interface PropsExportFormIntegration {
	/**
	 * Optional form instance from useExport().
	 * When provided, the component will use the form for form submission.
	 */
	readonly form?: UseFormReturnType<any>;

	/**
	 * Optional callback to be called after successful form validation and export.
	 */
	readonly onSuccess?: (values?: IParameterValues) => void;

	/**
	 * Optional callback to be called when export fails.
	 */
	readonly onError?: (values?: IParameterValues) => void;

	/**
	 * When provided, the export label header is hidden and this text is used
	 * as the button label instead of the default "Download File" / "Send Email".
	 */
	readonly buttonLabel?: string;
}

/**
 * Extended props for export components with Mantine form integration support.
 */
export type PropsExportWithForm = PropsExport &
	Partial<PropsExportFormIntegration>;
