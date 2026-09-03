import {
	AppBuilderActionType,
	type IAppBuilderActionDefinition,
	type IAppBuilderActionPropsCommon,
	type IAppBuilderLegacyActionDefinition,
} from "../config/appbuilder";

function stripLegacyCommonProps<T extends IAppBuilderActionPropsCommon>(
	props: T,
): Omit<T, keyof IAppBuilderActionPropsCommon> {
	const {id, icon, label, tooltip, ...rest} = props;
	return rest;
}

function stripLegacyDisplayProps<
	T extends Pick<IAppBuilderActionPropsCommon, "icon" | "label" | "tooltip">,
>(props: T): Omit<T, "icon" | "label" | "tooltip"> {
	const {icon, label, tooltip, ...rest} = props;
	return rest;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

const APP_BUILDER_ACTION_TYPES = new Set<unknown>(
	Object.values(AppBuilderActionType),
);

function isAppBuilderActionType(value: unknown): value is AppBuilderActionType {
	return APP_BUILDER_ACTION_TYPES.has(value);
}

/** Strips legacy common fields from action definition JSON before modern validation. */
export function preprocessActionDefinitionInput(value: unknown): unknown {
	if (!isRecord(value)) {
		return value;
	}
	if (!isAppBuilderActionType(value.type) || !isRecord(value.props)) {
		return value;
	}
	if (value.type === AppBuilderActionType.Camera) {
		const {icon, label, tooltip, ...rest} = value.props;
		return {
			type: value.type,
			props: rest,
		};
	}
	const {id, icon, label, tooltip, ...rest} = value.props;
	return {
		type: value.type,
		props: rest,
	};
}

/** Converts a legacy widget action (common props on `props`) to a modern action definition. */
export function legacyActionToDefinition(
	action: IAppBuilderLegacyActionDefinition,
): IAppBuilderActionDefinition {
	switch (action.type) {
		case AppBuilderActionType.CreateModelState:
			return {
				type: action.type,
				props: stripLegacyCommonProps(action.props),
			};
		case AppBuilderActionType.AddToCart:
			return {
				type: action.type,
				props: stripLegacyCommonProps(action.props),
			};
		case AppBuilderActionType.SetParameterValue:
			return {
				type: action.type,
				props: stripLegacyCommonProps(action.props),
			};
		case AppBuilderActionType.SetParameterValues:
			return {
				type: action.type,
				props: stripLegacyCommonProps(action.props),
			};
		case AppBuilderActionType.SetBrowserLocation:
			return {
				type: action.type,
				props: stripLegacyCommonProps(action.props),
			};
		case AppBuilderActionType.CloseConfigurator:
			return {
				type: action.type,
				props: stripLegacyCommonProps(action.props),
			};
		case AppBuilderActionType.Ar:
			return {
				type: action.type,
				props: stripLegacyCommonProps(action.props),
			};
		case AppBuilderActionType.Fullscreen:
			return {
				type: action.type,
				props: stripLegacyCommonProps(action.props),
			};
		case AppBuilderActionType.Undo:
			return {
				type: action.type,
				props: stripLegacyCommonProps(action.props),
			};
		case AppBuilderActionType.Redo:
			return {
				type: action.type,
				props: stripLegacyCommonProps(action.props),
			};
		case AppBuilderActionType.ResetParameterValues:
			return {
				type: action.type,
				props: stripLegacyCommonProps(action.props),
			};
		case AppBuilderActionType.ImportParameterValues:
			return {
				type: action.type,
				props: stripLegacyCommonProps(action.props),
			};
		case AppBuilderActionType.ExportParameterValues:
			return {
				type: action.type,
				props: stripLegacyCommonProps(action.props),
			};
		case AppBuilderActionType.ImportModelState:
			return {
				type: action.type,
				props: stripLegacyCommonProps(action.props),
			};
		case AppBuilderActionType.Camera:
			return {
				type: action.type,
				props: stripLegacyDisplayProps(action.props),
			};
		case AppBuilderActionType.Sound:
			return {
				type: action.type,
				props: stripLegacyCommonProps(action.props),
			};
		case AppBuilderActionType.SetContainerVisibility:
			return {
				type: action.type,
				props: stripLegacyCommonProps(action.props),
			};
		case AppBuilderActionType.MessageToParent:
			return {
				type: action.type,
				props: stripLegacyCommonProps(action.props),
			};
		default: {
			const _exhaustive: never = action;
			return _exhaustive;
		}
	}
}
