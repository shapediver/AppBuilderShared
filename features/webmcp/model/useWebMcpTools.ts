import {getParameterStates} from "@AppBuilderLib/entities/parameter/lib/parameterStates";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {AppBuilderDataContext} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderContext";
import {getParameterRefs} from "@AppBuilderLib/features/appbuilder/lib/appbuilder";
import {useCreateModelState} from "@AppBuilderLib/features/model-state/model/useCreateModelState";
import {useImportModelState} from "@AppBuilderLib/features/model-state/model/useImportModelState";
import {useContext, useEffect, useRef, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {createModelStateInputSchema} from "../config/createModelState";
import {importModelStateInputSchema} from "../config/importModelState";
import {listParameterDefinitionsInputSchema} from "../config/listParameterDefinitions";
import {
	resolveAndUpdate,
	setParameterValuesInputSchema,
} from "../config/setParameterValues";
import {
	CREATE_MODEL_STATE_TOOL_DESCRIPTION,
	CREATE_MODEL_STATE_TOOL_NAME,
	IMPORT_MODEL_STATE_TOOL_DESCRIPTION,
	IMPORT_MODEL_STATE_TOOL_NAME,
	LIST_PARAMETER_DEFINITIONS_TOOL_DESCRIPTION,
	LIST_PARAMETER_DEFINITIONS_TOOL_NAME,
	SET_PARAMETER_VALUES_TOOL_DESCRIPTION,
	SET_PARAMETER_VALUES_TOOL_NAME,
} from "../config/tools";
import {computeAppliedParameterIds} from "../lib/computeAppliedParameterIds";
import {filterVisibleParameters} from "../lib/filterVisibleParameters";
import {formatToolInputError} from "../lib/formatToolInputError";
import {mapParameterDefinition} from "../lib/parameterDefinitionMapper";
import {
	getModelContext,
	getWebMcpEnvironment,
	isWebMcpAvailable,
} from "../lib/webmcpAvailability";
import {zodToJsonSchema} from "../lib/zodToJsonSchema";
import type {
	UseWebMcpToolsProps,
	UseWebMcpToolsResult,
} from "./useWebMcpTools.types";

export function useWebMcpTools(
	props: UseWebMcpToolsProps,
): UseWebMcpToolsResult {
	const {namespace, enabled = isWebMcpAvailable()} = props;
	const [registered, setRegistered] = useState(false);
	const environment = getWebMcpEnvironment();
	const ready = registered && environment.ready;

	const {sessions} = useShapeDiverStoreSession(
		useShallow((state) => ({
			sessions: state.sessions,
		})),
	);

	const {getParameters, batchParameterValueUpdate} =
		useShapeDiverStoreParameters(
			useShallow((state) => ({
				getParameters: state.getParameters,
				batchParameterValueUpdate: state.batchParameterValueUpdate,
			})),
		);

	const {createModelState} = useCreateModelState({
		namespace: namespace ?? "",
	});
	const {importModelState} = useImportModelState({
		namespace: namespace ?? "",
	});
	const {data: appBuilderData} = useContext(AppBuilderDataContext);

	const namespaceRef = useRef<string>(namespace ?? "");
	namespaceRef.current = namespace ?? "";

	const getParametersRef = useRef(getParameters);
	getParametersRef.current = getParameters;

	const batchParameterValueUpdateRef = useRef(batchParameterValueUpdate);
	batchParameterValueUpdateRef.current = batchParameterValueUpdate;

	const createModelStateRef = useRef(createModelState);
	createModelStateRef.current = createModelState;

	const importModelStateRef = useRef(importModelState);
	importModelStateRef.current = importModelState;

	const appBuilderDataRef = useRef(appBuilderData);
	appBuilderDataRef.current = appBuilderData;

	const sessionReady = !!namespace && !!sessions[namespace];
	const paramsPopulated =
		!!namespace && Object.keys(getParameters(namespace)).length > 0;

	useEffect(() => {
		if (enabled === false || !isWebMcpAvailable()) {
			setRegistered(false);
			return;
		}

		if (!sessionReady || !paramsPopulated) {
			setRegistered(false);
			return;
		}

		const controller = new AbortController();
		let cancelled = false;

		const getLiveParameters = (targetNamespace: string) => {
			const paramStores = getParametersRef.current(targetNamespace);

			return Object.values(paramStores).map((store) => store.getState());
		};

		const findParameterRef = (
			paramId: string,
			paramName: string,
			displayname?: string,
		) => {
			const refs = appBuilderDataRef.current
				? getParameterRefs(appBuilderDataRef.current)
				: [];

			return refs.find(
				(ref) =>
					ref.name === paramId ||
					ref.name === paramName ||
					ref.name === displayname,
			);
		};

		const registerTools = async () => {
			const modelContext = getModelContext();

			try {
				await modelContext.registerTool(
					{
						name: LIST_PARAMETER_DEFINITIONS_TOOL_NAME,
						description:
							LIST_PARAMETER_DEFINITIONS_TOOL_DESCRIPTION,
						inputSchema: zodToJsonSchema(
							listParameterDefinitionsInputSchema,
						),
						annotations: {
							readOnlyHint: true,
							untrustedContentHint: true,
						},
						execute: async (input) => {
							try {
								const parsed =
									listParameterDefinitionsInputSchema.parse(
										input,
									);
								const filter = parsed.filter ?? "all";
								const targetNamespace =
									parsed.sessionId ?? namespaceRef.current;
								let parameters =
									getLiveParameters(targetNamespace);

								if (filter === "visible") {
									const refs = appBuilderDataRef.current
										? getParameterRefs(
												appBuilderDataRef.current,
											)
										: [];
									parameters = filterVisibleParameters(
										parameters,
										refs,
									);
								}

								return {
									parameters: parameters.map((param) => {
										const def = param.definition;
										const ref = findParameterRef(
											def.id,
											def.name,
											def.displayname,
										);

										return mapParameterDefinition(
											param,
											ref,
										);
									}),
								};
							} catch (e) {
								return {
									parameters: [],
									...formatToolInputError(e),
								};
							}
						},
					},
					{signal: controller.signal},
				);

				await modelContext.registerTool(
					{
						name: SET_PARAMETER_VALUES_TOOL_NAME,
						description: SET_PARAMETER_VALUES_TOOL_DESCRIPTION,
						inputSchema: zodToJsonSchema(
							setParameterValuesInputSchema,
						),
						annotations: {
							readOnlyHint: false,
							untrustedContentHint: true,
						},
						execute: async (input) => {
							try {
								const parsed =
									setParameterValuesInputSchema.parse(input);
								const targetNamespace = namespaceRef.current;

								return await resolveAndUpdate(
									targetNamespace,
									getLiveParameters,
									parsed.updates,
									batchParameterValueUpdateRef.current,
								);
							} catch (e) {
								return {
									applied: [],
									...formatToolInputError(e),
								};
							}
						},
					},
					{signal: controller.signal},
				);

				await modelContext.registerTool(
					{
						name: CREATE_MODEL_STATE_TOOL_NAME,
						description: CREATE_MODEL_STATE_TOOL_DESCRIPTION,
						inputSchema: zodToJsonSchema(
							createModelStateInputSchema,
						),
						annotations: {
							readOnlyHint: false,
							untrustedContentHint: true,
						},
						execute: async (input) => {
							try {
								const parsed =
									createModelStateInputSchema.parse(input);
								const result =
									await createModelStateRef.current(parsed);

								if (!result.modelStateId) {
									return {
										success: false as const,
										error: "Failed to create model state.",
									};
								}

								return {
									success: true as const,
									modelStateId: result.modelStateId,
									modelStateImageUrl:
										result.modelStateImageUrl,
									modelStateGltfUrl: result.modelStateGltfUrl,
									modelStateUsdzUrl: result.modelStateUsdzUrl,
									modelViewUrl: result.modelViewUrl ?? "",
								};
							} catch (e) {
								return {
									success: false as const,
									error:
										e instanceof Error
											? e.message
											: String(e),
								};
							}
						},
					},
					{signal: controller.signal},
				);

				await modelContext.registerTool(
					{
						name: IMPORT_MODEL_STATE_TOOL_NAME,
						description: IMPORT_MODEL_STATE_TOOL_DESCRIPTION,
						inputSchema: zodToJsonSchema(
							importModelStateInputSchema,
						),
						annotations: {
							readOnlyHint: false,
							untrustedContentHint: true,
						},
						execute: async (input) => {
							try {
								const parsed =
									importModelStateInputSchema.parse(input);
								const targetNamespace = namespaceRef.current;
								const beforeValues = new Map(
									getParameterStates(targetNamespace).map(
										(p) => [
											p.definition.id,
											p.state.uiValue,
										],
									),
								);
								const result =
									await importModelStateRef.current(parsed);

								if (!result.success) {
									return {
										success: false as const,
										message: result.message,
										invalidParameters:
											result.invalidParameters ?? [],
									};
								}

								const afterParams =
									getParameterStates(targetNamespace);
								const appliedParameterIds =
									computeAppliedParameterIds(
										beforeValues,
										afterParams,
									);

								return {
									success: true as const,
									appliedParameterIds,
									...(result.invalidParameters
										? {
												invalidParameters:
													result.invalidParameters,
											}
										: {}),
								};
							} catch (e) {
								return {
									success: false as const,
									message:
										e instanceof Error
											? e.message
											: String(e),
									invalidParameters: [],
								};
							}
						},
					},
					{signal: controller.signal},
				);

				if (!cancelled) {
					setRegistered(true);
				}
			} catch {
				if (!cancelled) {
					setRegistered(false);
				}
			}
		};

		void registerTools();

		return () => {
			cancelled = true;
			controller.abort();
			setRegistered(false);
		};
	}, [enabled, namespace, sessionReady, paramsPopulated]);

	const environmentSnapshot = {
		modelContextAvailable: environment.modelContextAvailable,
		crossOriginIsolated: environment.crossOriginIsolated,
	};

	if (enabled === false || !isWebMcpAvailable()) {
		return {
			registered: false,
			ready: false,
			environment: environmentSnapshot,
		};
	}

	return {
		registered,
		ready,
		environment: environmentSnapshot,
	};
}
