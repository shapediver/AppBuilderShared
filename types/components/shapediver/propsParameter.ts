import {PropsParameterOrExport} from "@AppBuilderShared/types/components/shapediver/propsCommon";
import {IShapeDiverParameterDefinition} from "@AppBuilderShared/types/shapediver/parameter";

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
}
