import {
	IShapeDiverParameterActions,
	IShapeDiverParameterDefinition,
} from "./parameter";
import {PropsParameterOrExport} from "@AppBuilderLib/shared/config";
import {UseFormReturnType} from "@mantine/form";

export interface PropsParameterWrapper {
	readonly wrapperComponent?:
		| string
		| React.ComponentType<any>
		| keyof React.JSX.IntrinsicElements;

	readonly wrapperProps?: {[key: string]: any};
}

export const defaultPropsParameterWrapper: PropsParameterWrapper = {
	wrapperComponent: "section",
	wrapperProps: {},
};

/**
 * Props for Mantine form integration with parameter components.
 */
export interface PropsParameterFormIntegration {
	/**
	 * Optional form instance from useParameterForm().
	 * When provided, the component will use the form for validation and state management.
	 */
	readonly form?: UseFormReturnType<Record<string, string>>;
}

/**
 * Props of a parameter reference.
 */
export interface PropsParameter extends PropsParameterOrExport {
	/**
	 * Id of the parameter.
	 */
	readonly parameterId: string;

	/**
	 * Disable the parameter component if it's in dirty state.
	 */
	readonly disableIfDirty?: boolean;

	/**
	 * If true, the component can assume that changes are not executed immediately.
	 */
	readonly acceptRejectMode?: boolean;

	/**
	 * Properties of the parameter to be overridden.
	 */
	readonly overrides?: Pick<
		Partial<IShapeDiverParameterDefinition>,
		"displayname" | "group" | "order" | "tooltip" | "hidden" | "settings"
	>;

	/**
	 * Parameter actions for replacement
	 */
	readonly customActions?: Partial<IShapeDiverParameterActions<any>>;
}

/**
 * Extended props for parameter components with Mantine form integration support.
 */
export type PropsParameterWithForm = PropsParameter &
	Partial<PropsParameterFormIntegration>;

export type PropsParameterComponent = (
	| PropsParameter
	| PropsParameterWithForm
) &
	(
		| {
				/**
				 * Keep value synchronized with store
				 */
				readonly reactive: false;

				/**
				 * Value of the parameter (only if reactive is false)
				 */
				value?: any;
		  }
		| {
				/**
				 * Keep value synchronized with store
				 */
				readonly reactive?: true;

				value?: never;
		  }
	);
