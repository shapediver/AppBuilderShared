import {useAppBuilderCustomParameters} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderCustomParameters";
import {
	IUseSessionDto,
	useSession,
} from "@AppBuilderLib/entities/session/model/useSession";
import {
	IAppBuilder,
	IAppBuilderSettingsSession,
} from "../config/appbuilder";
import {validateAppBuilder} from "../config/appbuildertypecheck";

import {useShapeDiverStoreProcessManager} from "@AppBuilderLib/shared/model/useShapeDiverStoreProcessManager";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {IOutputApi, ITreeNode, OutputApiData} from "@shapediver/viewer.session";
import {useCallback, useEffect, useRef, useState} from "react";
import {useAppBuilderInstances} from "./useAppBuilderInstances";

/**
 * Hook for creating a session with a ShapeDiver model using the ShapeDiver 3D Viewer.
 *
 * Registers all parameters and exports defined by the model as abstracted
 * parameters and exports for use by the UI components.
 *
 * TODO SS-7484 This hook also registers custom parameters and UI elements defined by a data output component
 * of the model named "AppBuilder". Updates of the custom parameter values are fed back to the model as JSON into
 * a text input named "AppBuilder".
 *
 * @param props session to start
 * @param appBuilderOverride optional AppBuilder data to override the data from the model
 * @returns
 */
export function useSessionWithAppBuilder(
	props: (IUseSessionDto & IAppBuilderSettingsSession) | undefined,
	appBuilderOverride?: IAppBuilder,
) {
	const namespace = props?.id ?? "";

	// start session and register parameters and exports
	const {sessionApi, error: sessionError} = useSession(props);
	const sessionInitialized = !!sessionApi;

	const {addOutputUpdateCallback} = useShapeDiverStoreSession();
	const {createProcessManager, removeProcessManager, processManagers} =
		useShapeDiverStoreProcessManager();
	const [parsedData, setParsedData] = useState<
		IAppBuilder | Error | undefined
	>(undefined);
	const [outputApi, setOutputApi] = useState<IOutputApi | undefined>(
		undefined,
	);
	const [appBuilderOutputId, setAppBuilderOutputId] = useState<
		string | undefined
	>(undefined);
	const [sessionSettings, setSessionSettings] = useState<
		(IUseSessionDto & IAppBuilderSettingsSession) | undefined
	>(props);

	const initialProcessManagerIdRef = useRef<string | undefined>(undefined);
	// create an initial process manager to handle the session creation process
	// and bridge the gap until the callback for the app builder output is called
	useEffect(() => {
		if (!initialProcessManagerIdRef.current) {
			initialProcessManagerIdRef.current =
				createProcessManager(namespace);
		}
	}, [namespace]);

	const processManagerIdRef = useRef<string | undefined>(undefined);

	/**
	 * Validate the AppBuilder data.
	 * @param data
	 * @returns
	 */
	const validate = (data: any): IAppBuilder | undefined | Error => {
		const result = validateAppBuilder(data);
		if (result.success) {
			return result.data;
		} else {
			Logger.debug("Invalid AppBuilder data", data);

			return new Error(
				`Parsing AppBuilder data failed: ${result.error.message}`,
			);
		}
	};

	/**
	 * Validate the AppBuilder data from the model or the override.
	 * If the override is set, the data from the model is ignored.
	 */
	const validationResult = useCallback(
		(data: IAppBuilder | string | undefined) => {
			if (appBuilderOverride && sessionInitialized) {
				if (data)
					Logger.debug("Overriding AppBuilder data from settings!");

				return validate(appBuilderOverride);
			}
			if (!data) return undefined;
			if (typeof data === "string") {
				let parsedJson: string;
				try {
					parsedJson = JSON.parse(data);
				} catch (e: any) {
					return new Error(
						`Parsing AppBuilder JSON data failed: ${e?.message ?? "unknown error"}`,
					);
				}

				return validate(parsedJson);
			}

			return validate(data);
		},
		[appBuilderOverride, sessionInitialized],
	);

	useEffect(() => {
		if (!sessionApi) {
			setAppBuilderOutputId(undefined);
			return;
		}

		if (props?.loadPlatformSettingsFromViewer !== undefined) {
			if (props.loadPlatformSettingsFromViewer === "platform") {
				// Load platform settings from viewer
				setSessionSettings({
					...(props as IAppBuilderSettingsSession),
					acceptRejectMode: sessionApi.parametersCommit,
					hideAttributeVisualization:
						sessionApi.hideAttributeVisualization,
					hideJsonMenu: sessionApi.hideJsonMenu,
					hideSavedStates: sessionApi.hideSavedStates,
					hideDesktopClients: sessionApi.hideDesktopClients,
					hideExports: sessionApi.hideExports,
				});
			} else if (props.loadPlatformSettingsFromViewer === "iframe") {
				// Load iframe settings from viewer
				setSessionSettings({
					...(props as IAppBuilderSettingsSession),
					acceptRejectMode: sessionApi.parametersCommit,
					hideAttributeVisualization:
						sessionApi.hideAttributeVisualizationIframe,
					hideJsonMenu: sessionApi.hideJsonMenuIframe,
					hideSavedStates: sessionApi.hideSavedStatesIframe,
					hideExports: sessionApi.hideExportsIframe,
				});
			}
		} else {
			setSessionSettings(props);
		}

		const outputs = sessionApi.getOutputByName(CUSTOM_DATA_OUTPUT_NAME);
		const outputId = outputs.length > 0 ? outputs[0].id : "";

		if (outputId === "") {
			// as there is not app builder output, we can set the parsed data to undefined
			// unless the app builder override is set, in which case we set it to the override
			setParsedData(validationResult(undefined));
		}

		setAppBuilderOutputId(outputId);
	}, [sessionApi, props]);

	/**
	 * Callback for updating the AppBuilder data.
	 * This callback already validates the data and creates a process manager if necessary.
	 * This has to be done synchronously to ensure that the process manager is created before the scene update is triggered.
	 *
	 * @param newNode
	 */
	const cb = useCallback(
		(newNode?: ITreeNode) => {
			const api = (
				newNode?.data.find((d) => d instanceof OutputApiData) as
					| OutputApiData
					| undefined
			)?.api;
			setOutputApi(api);

			const outputData = api?.content?.[0]?.data as
				| IAppBuilder
				| string
				| undefined;
			const parsedData = validationResult(outputData);
			const appBuilderData =
				parsedData instanceof Error ? undefined : parsedData;

			// For instances, this check and the creation of the process manager
			// has to be done here, as otherwise the viewer would already
			// update the scene before the instances are processed
			const instancedSessions = !!appBuilderData?.instances;

			// if there are instances defined in the app builder data, we need a process manager
			let newProcessManagerId: string | undefined = undefined;
			if (instancedSessions)
				newProcessManagerId = createProcessManager(sessionApi!.id);

			// if there is still a processManager active, we remove it
			// and assign the id of the new one
			// we have to do this after creating the new one, as otherwise
			// the viewer would already update the scene before the instances are processed
			if (processManagerIdRef.current)
				removeProcessManager(processManagerIdRef.current);

			// assign the new process manager id (or undefined) to the ref
			processManagerIdRef.current = newProcessManagerId;

			setParsedData(parsedData);
		},
		[namespace, validationResult],
	);

	// if the process manager id is not valid anymore, reset it
	useEffect(() => {
		if (!processManagerIdRef.current) return;

		if (!processManagers[processManagerIdRef.current])
			processManagerIdRef.current = undefined;
	}, [processManagers]);

	useEffect(() => {
		if (appBuilderOutputId === undefined) return;
		const removeOutputUpdateCallback = addOutputUpdateCallback(
			namespace,
			appBuilderOutputId,
			cb,
		);

		// whether we have an app builder output or not is not relevant here
		// the initial process creation is done as soon as the session data has been parsed
		if (initialProcessManagerIdRef.current) {
			removeProcessManager(initialProcessManagerIdRef.current);
			initialProcessManagerIdRef.current = undefined;
		}

		return removeOutputUpdateCallback;
	}, [namespace, appBuilderOutputId, cb]);

	useEffect(() => {
		Logger.debug(CUSTOM_DATA_OUTPUT_NAME, parsedData);
	}, [parsedData]);

	const error =
		sessionError ?? (parsedData instanceof Error ? parsedData : undefined);
	const appBuilderData = parsedData instanceof Error ? undefined : parsedData;
	const hasAppBuilderOutput = !!outputApi;

	// register custom parameters
	const {loaded: customParametersLoaded} = useAppBuilderCustomParameters({
		sessionApi,
		appBuilderData,
		acceptRejectMode: props?.acceptRejectMode,
	});

	// create the instances defined in the AppBuilder data
	useAppBuilderInstances({
		namespace,
		sessionApi,
		appBuilderData,
		processManagerId: processManagerIdRef.current,
	});

	return {
		sessionApi,
		namespace,
		error,
		appBuilderData,
		hasAppBuilderOutput,
		customParametersLoaded,
		sessionSettings,
	};
}

/**
 * Name of data output used to define the AppBuilder UI
 */
const CUSTOM_DATA_OUTPUT_NAME = "AppBuilder";
