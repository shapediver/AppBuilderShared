import {useParameterImportExport} from "@AppBuilderLib/entities/parameter/model/useParameterImportExport";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useViewportHistory} from "@AppBuilderLib/entities/viewport/model/useViewportHistory";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {GenericToolSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {useShapeDiverStoreToolbars} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreToolbars";
import {useCreateModelState} from "@AppBuilderLib/features/model-state/model/useCreateModelState";
import {useImportModelState} from "@AppBuilderLib/features/model-state/model/useImportModelState";
import {useContext, useMemo, useRef} from "react";
import {useShallow} from "zustand/react/shallow";
import {
	defaultSettingsFor,
	InScopeGenericToolName,
} from "../config/inScopeGenericTools";
import type {ResolvedGenericTool} from "../config/resolveToolset";
import type {AgentToolsDeps} from "./agentToolsDeps";
import {buildAgentToolsDeps} from "./buildAgentToolsDeps";
import {handleGetMetric} from "./handlers/getMetric";
import {handleGetParameterValues} from "./handlers/getParameterValues";
import {handleGetScreenshot} from "./handlers/getScreenshot";
import {handleListActionControls} from "./handlers/listActionControls";
import {handleListParameterDefinitions} from "./handlers/listParameterDefinitions";
import {handleSetCameraPosition} from "./handlers/setCameraPosition";
import {handleSetParameterValues} from "./handlers/setParameterValues";
import {handleTriggerActionControl} from "./handlers/triggerActionControl";

export type AgentToolHandlerMap = Record<
	InScopeGenericToolName,
	(input: unknown) => Promise<unknown>
>;

function settingsNamed<N extends InScopeGenericToolName>(
	resolved: ResolvedGenericTool[],
	name: N,
): Extract<GenericToolSettings, {name: N}> {
	const found = resolved.find((tool) => tool.name === name);
	if (found) {
		return found.settings as Extract<GenericToolSettings, {name: N}>;
	}
	return defaultSettingsFor(name) as Extract<GenericToolSettings, {name: N}>;
}

export function useAgentToolHandlers(args: {
	namespace: string;
	appBuilderData: IAppBuilder | undefined;
	resolved: ResolvedGenericTool[];
}): AgentToolHandlerMap {
	const {namespace, appBuilderData, resolved} = args;
	const componentContext = useContext(ComponentContext);
	const {viewportId} = useViewportId();
	const {goBack, goForward} = useViewportHistory();
	const {createModelState} = useCreateModelState({namespace});
	const {importModelState} = useImportModelState({namespace});
	const {resetParameters} = useParameterImportExport(namespace);

	const {sessions} = useShapeDiverStoreSession(
		useShallow((state) => ({
			sessions: state.sessions,
		})),
	);

	const {getParameters, batchParameterValueUpdate, getOutput} =
		useShapeDiverStoreParameters(
			useShallow((state) => ({
				getParameters: state.getParameters,
				batchParameterValueUpdate: state.batchParameterValueUpdate,
				getOutput: state.getOutput,
			})),
		);

	const defaultToolbars = useShapeDiverStoreToolbars(
		(state) => state.defaultToolbars,
	);

	const resolvedRef = useRef(resolved);
	resolvedRef.current = resolved;

	const depsRef = useRef<AgentToolsDeps>(null!);
	depsRef.current = buildAgentToolsDeps({
		namespace,
		appBuilderData,
		viewportId,
		goBack,
		goForward,
		createModelState,
		importModelState,
		resetParameters,
		sessions,
		getParameters,
		batchParameterValueUpdate,
		getOutput,
		defaultToolbars,
		componentContext,
	});

	return useMemo(
		() => ({
			[InScopeGenericToolName.ListParameterDefinitions]: (input) =>
				handleListParameterDefinitions(
					input,
					settingsNamed(
						resolvedRef.current,
						InScopeGenericToolName.ListParameterDefinitions,
					),
					depsRef.current,
				),
			[InScopeGenericToolName.GetParameterValues]: (input) =>
				handleGetParameterValues(
					input,
					// Sharing ListParameterDefinitions settings is intentional.
					settingsNamed(
						resolvedRef.current,
						InScopeGenericToolName.ListParameterDefinitions,
					),
					depsRef.current,
				),
			[InScopeGenericToolName.SetParameterValues]: (input) =>
				handleSetParameterValues(input, depsRef.current),
			[InScopeGenericToolName.ListActionControls]: (input) =>
				handleListActionControls(
					input,
					settingsNamed(
						resolvedRef.current,
						InScopeGenericToolName.ListActionControls,
					),
					depsRef.current,
				),
			[InScopeGenericToolName.TriggerActionControl]: (input) =>
				handleTriggerActionControl(
					input,
					// Sharing ListActionControls settings is intentional.
					settingsNamed(
						resolvedRef.current,
						InScopeGenericToolName.ListActionControls,
					),
					depsRef.current,
				),
			[InScopeGenericToolName.SetCameraPosition]: (input) =>
				handleSetCameraPosition(input, depsRef.current),
			[InScopeGenericToolName.GetScreenshot]: (input) =>
				handleGetScreenshot(input, depsRef.current),
			[InScopeGenericToolName.GetMetric]: (input) =>
				handleGetMetric(input, depsRef.current),
		}),
		[],
	);
}
