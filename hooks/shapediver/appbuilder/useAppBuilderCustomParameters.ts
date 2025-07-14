import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useDefineGenericParameters} from "@AppBuilderShared/hooks/shapediver/parameters/useDefineGenericParameters";
import {useParameterStateless} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterStateless";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {IAppBuilder} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	IAcceptRejectModeSelector,
	IGenericParameterExecutor,
} from "@AppBuilderShared/types/store/shapediverStoreParameters";
import {ISessionApi, PARAMETER_TYPE} from "@shapediver/viewer.session";
import {useCallback, useContext, useEffect, useMemo, useRef} from "react";
import {useShallow} from "zustand/react/shallow";

/** Prefix used to register custom parameters */
export const CUSTOM_SESSION_ID_POSTFIX = "_appbuilder";

/** Name of input (parameter of the Grasshopper model) used to consume the custom parameter values */
const CUSTOM_DATA_INPUT_NAME = "AppBuilder";

interface Props {
	sessionApi: ISessionApi | undefined;
	appBuilderData: IAppBuilder | undefined;
	acceptRejectMode: IAcceptRejectModeSelector | boolean | undefined;
}

/**
 * This hook registers custom parameters and UI elements defined by a data output component
 * of the model named "AppBuilder". Updates of the custom parameter values are fed back to the model as JSON into
 * a text input named "AppBuilder".
 *
 * @param sessionApi
 * @param appBuilderData
 * @returns
 */
export function useAppBuilderCustomParameters(props: Props) {
	const {sessionApi, appBuilderData, acceptRejectMode} = props;
	const namespace = sessionApi?.id ?? "";
	const namespaceAppBuilder = namespace + CUSTOM_SESSION_ID_POSTFIX;

	// get the notification context
	const notifications = useContext(NotificationContext);

	// default values and current values of the custom parameters
	const defaultCustomParameterValues = useRef<{[key: string]: any}>({});
	const customParameterValues = useRef<{[key: string]: any}>({});

	// define a callback which returns the current state of custom parameter values
	const getCustomParameterValues = useCallback(() => {
		// We want to set the value of the "AppBuilder" to a JSON string
		// of the current custom parameter values. Values for all currently
		// defined custom parameters shall be included in the JSON string.
		// Therefore we need to merge the default values with the current values.
		const customValues = {...defaultCustomParameterValues.current};
		Object.keys(customValues).forEach((id) => {
			if (id in customParameterValues.current)
				customValues[id] = customParameterValues.current[id];
		});
		// remove leftover values from custom parameters that have been removed
		Object.keys(customParameterValues.current).forEach((id) => {
			if (!(id in customValues)) delete customParameterValues.current[id];
		});

		return customValues;
	}, []);

	// "AppBuilder" parameter (used for sending values of custom parameters to the model)
	const appBuilderParam = useParameterStateless<string>(
		namespace,
		CUSTOM_DATA_INPUT_NAME,
		PARAMETER_TYPE.STRING,
	);
	const appBuilderFileParam = useParameterStateless<Blob>(
		namespace,
		CUSTOM_DATA_INPUT_NAME,
		PARAMETER_TYPE.FILE,
	);

	// prepare for adding pre-execution hook, which will set the value of the parameter named "AppBuilder"
	// to a JSON string of the current custom parameter values
	const {setPreExecutionHook, removePreExecutionHook} =
		useShapeDiverStoreParameters(
			useShallow((state) => ({
				setPreExecutionHook: state.setPreExecutionHook,
				removePreExecutionHook: state.removePreExecutionHook,
			})),
		);

	// set the default values of the custom parameters whenever the
	// custom parameter definitions change
	useEffect(() => {
		if (appBuilderData?.parameters) {
			appBuilderData.parameters.forEach((p) => {
				// If a "value" is given as part of the custom parameter definition,
				// we use it to define the default value of the custom parameter.
				defaultCustomParameterValues.current[p.id] =
					p.value ?? p.defval;
				// If a "value" is given as part of the custom parameter definition,
				// AND if a value has already been set for the custom parameter,
				// we remove this current value of the custom parameter
				// (thereby overriding the current value with the given one).
				if (
					p.value !== undefined &&
					p.id in customParameterValues.current
				)
					delete customParameterValues.current[p.id];
			});
		}

		return () => {
			defaultCustomParameterValues.current = {};
		};
	}, [appBuilderData]);

	// executor function for changes of custom parameter values
	const executor = useCallback<IGenericParameterExecutor>(
		async (values: {[key: string]: any}, _, skipHistory) => {
			Object.keys(values).forEach(
				(key) => (customParameterValues.current[key] = values[key]),
			);

			// Note: Strictly speaking there would be no need to set the value of
			// the "AppBuilder" parameter, as it is set by the pre-execution hook anyway.

			// Note: we call actions.execute with forceImmediate `true` to
			// immediately execute the parameter change of the "AppBuilder" parameter
			// and await the execution to finish (this will call the pre-execution hook).
			// We also skip the history state update, as the pre-execution hook
			// includes the state update of custom parameters.
			// In case both the static and custom parameters are configured for
			// accept/reject mode, the changes of the custom parameters will be
			// accepted first (see IParameterChanges.priority).

			const json = JSON.stringify(getCustomParameterValues());
			if (
				appBuilderParam &&
				json.length <= appBuilderParam.definition.max!
			) {
				appBuilderParam.actions.setUiValue(json);
				await appBuilderParam.actions.execute(true, skipHistory, true);
			} else if (
				appBuilderFileParam &&
				appBuilderFileParam.definition.format?.includes(
					"application/json",
				)
			) {
				appBuilderFileParam.actions.setUiValue(
					new Blob([json], {type: "application/json"}),
				);
				await appBuilderFileParam.actions.execute(
					true,
					skipHistory,
					true,
				);
			} else if (appBuilderParam) {
				notifications.error({
					title: "Custom parameter value too long",
					message: `The custom parameter value length ${json.length} exceeds the maximum length of ${appBuilderParam.definition.max!} characters. Please use a file parameter instead.`,
				});
			} else {
				console.warn(
					`Could not find a suitable parameter named "${CUSTOM_DATA_INPUT_NAME}" whose type is 'String' or 'File'!`,
				);
			}
		},
		[appBuilderParam, appBuilderFileParam],
	);

	// register the pre-execution hook
	useEffect(() => {
		if (appBuilderParam || appBuilderFileParam) {
			setPreExecutionHook(namespace, async (_values) => {
				const values = {..._values};
				const customValues = getCustomParameterValues();
				const json = JSON.stringify(customValues);
				if (
					appBuilderParam &&
					json.length <= appBuilderParam.definition.max!
				) {
					values[appBuilderParam.definition.id] = json;
				} else if (
					appBuilderFileParam &&
					appBuilderFileParam.definition.format?.includes(
						"application/json",
					)
				) {
					values[appBuilderFileParam.definition.id] = new Blob(
						[json],
						{type: "application/json"},
					);
				} else if (appBuilderParam) {
					notifications.error({
						title: "Custom parameter value too long",
						message: `The custom parameter value length ${json.length} exceeds the maximum length of ${appBuilderParam.definition.max!} characters. Please use a file parameter instead.`,
					});
				} else {
					console.warn(
						`Could not find a suitable parameter named "${CUSTOM_DATA_INPUT_NAME}" whose type is 'String' or 'File'!`,
					);
				}

				return {
					amendedValues: values,
					historyState: {[namespaceAppBuilder]: customValues},
				};
			});
		}

		return () => removePreExecutionHook(namespace);
	}, [appBuilderParam, appBuilderFileParam]);

	// create stateful definition of custom parameters
	const parameterDefinitions = useMemo(
		() =>
			(appBuilderData?.parameters ?? []).map((p) => {
				const {value, ...rest} = p;

				return {definition: rest, value};
			}),
		[appBuilderData?.parameters],
	);

	// define custom parameters and an execution callback for them
	const {loaded} = useDefineGenericParameters(
		namespaceAppBuilder,
		acceptRejectMode ?? false,
		parameterDefinitions,
		executor,
		namespace,
	);

	return {loaded};
}
