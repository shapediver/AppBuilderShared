import {
	isExecuteActionsAction,
	isSetParameterValueAction,
	isSetParameterValuesAction,
	type IAppBuilderActionDefinition,
	type IAppBuilderActionPropsSetParameterValue,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {parameterValueSchema} from "../config/listParameterDefinitions";
import {readInputPath} from "./readInputPath";

const NOT_A_PARAMETER_VALUE =
	"agentTool path did not resolve to a single string, number, boolean, or color";

type BindResult =
	| {ok: true; actions: IAppBuilderActionDefinition[]}
	| {ok: false; message: string};

type ParameterItem = IAppBuilderActionPropsSetParameterValue;

function bindItem(item: ParameterItem, input: unknown): string | undefined {
	const hasValue = item.value !== undefined;
	const hasSource = item.source !== undefined;
	if (hasValue && hasSource) {
		return 'Either "value" or "source" must be set.';
	}
	if (item.source?.type !== "agentTool") {
		return undefined;
	}
	const path = (item.source.props as {path: string}).path;
	const queried = readInputPath(input, path);
	if (!queried.ok) {
		return queried.message;
	}
	const parsed = parameterValueSchema.safeParse(queried.value);
	if (!parsed.success) {
		return NOT_A_PARAMETER_VALUE;
	}
	(item as {value?: unknown}).value = parsed.data;
	delete item.source;
	return undefined;
}

function bindAction(
	action: IAppBuilderActionDefinition,
	input: unknown,
): string | undefined {
	if (isExecuteActionsAction(action)) {
		for (const nested of action.props.actions) {
			const message = bindAction(nested, input);
			if (message) return message;
		}
		return undefined;
	}
	const items = isSetParameterValuesAction(action)
		? action.props.parameterValues
		: isSetParameterValueAction(action)
			? [action.props]
			: [];
	for (const item of items) {
		const message = bindItem(item, input);
		if (message) return message;
	}
	return undefined;
}

/** Clone the sequence and replace agentTool sources with literal parameter values. */
export function bindAgentToolSources(
	actions: IAppBuilderActionDefinition[],
	input: unknown,
): BindResult {
	const cloned = JSON.parse(
		JSON.stringify(actions),
	) as IAppBuilderActionDefinition[];
	for (const action of cloned) {
		const message = bindAction(action, input);
		if (message) return {ok: false, message};
	}
	return {ok: true, actions: cloned};
}
