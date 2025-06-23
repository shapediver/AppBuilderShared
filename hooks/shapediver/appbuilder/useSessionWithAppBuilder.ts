import {useAppBuilderCustomParameters} from "@AppBuilderShared/hooks/shapediver/appbuilder/useAppBuilderCustomParameters";
import {
	IUseSessionDto,
	useSession,
} from "@AppBuilderShared/hooks/shapediver/useSession";
import {IAppBuilder} from "@AppBuilderShared/types/shapediver/appbuilder";
import {validateAppBuilder} from "@AppBuilderShared/types/shapediver/appbuildertypecheck";

import {useShapeDiverStoreProcessManager} from "@AppBuilderShared/store/useShapeDiverStoreProcessManager";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {
	addListener,
	EVENTTYPE_SESSION,
	IEvent,
	IOutputApi,
	ISessionEvent,
	ITreeNode,
	OutputApiData,
} from "@shapediver/viewer.session";
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
	props: IUseSessionDto | undefined,
	appBuilderOverride?: IAppBuilder,
) {
	const namespace = props?.id ?? "";

	// start session and register parameters and exports
	const {
		sessionApi,
		error: sessionError,
		initialProcessManagerId,
	} = useSession(
		props
			? {
					...props,
					createProcessManager: true,
				}
			: undefined,
	);
	const sessionInitialized = !!sessionApi;

	const {addOutputUpdateCallback} = useShapeDiverStoreSession();
	const {addProcess, createProcessManager} =
		useShapeDiverStoreProcessManager();
	const initialProcessManagerIdRef = useRef(initialProcessManagerId);
	const [parsedData, setParsedData] = useState<
		IAppBuilder | Error | undefined
	>(undefined);
	const [processManagerId, setProcessManagerId] = useState<
		string | undefined
	>(initialProcessManagerId);
	const [outputApi, setOutputApi] = useState<IOutputApi | undefined>(
		undefined,
	);
	const [loadSdTF, setLoadSdTF] = useState<boolean>(false);

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
			console.debug("Invalid AppBuilder data", data);

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
					console.debug("Overriding AppBuilder data from settings!");

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

	const [appBuilderOutputId, setAppBuilderOutputId] = useState<string>("");

	useEffect(() => {
		if (!sessionApi) {
			setAppBuilderOutputId("");
			return;
		}
		const outputs = sessionApi.getOutputByName(CUSTOM_DATA_OUTPUT_NAME);
		const outputId = outputs.length > 0 ? outputs[0].id : "";

		/**
		 * Early exit of the process manager creation if the output id is not set.
		 * In the case of an app builder output, we have to check for subprocesses
		 * that are created in the AppBuilder data.
		 */
		if (outputId === "") {
			// as there is not app builder output, we can set the parsed data to undefined
			// unless the app builder override is set, in which case we set it to the override
			setParsedData(validationResult(undefined));

			if (initialProcessManagerIdRef.current) {
				// if there are s-type parameters, we need to load the SDTF data
				const hasSTypeParameters = Object.values(
					sessionApi.parameters,
				).some((p) => p.type.startsWith("s"));

				if (hasSTypeParameters) {
					// if there are s-type parameters, we set the loadSdTF flag to true
					setLoadSdTF(true);
				} else {
					// the initial process manager id is created when the session is initialized
					// we resolve it here as there are no further processes to be executed
					addProcess(initialProcessManagerIdRef.current, {
						name: "Instance Process",
						promise: Promise.resolve(),
					});
				}
			}
		}

		setAppBuilderOutputId(outputId);
	}, [sessionApi]);

	useEffect(() => {
		initialProcessManagerIdRef.current = initialProcessManagerId;
	}, [initialProcessManagerId]);

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

			let hasInstances = false;
			let hasAttributeVisualizationWidget = false;
			let hasSTypeParameters = false;
			if (appBuilderData) {
				if (appBuilderData.instances) hasInstances = true;

				// try to find an attribute visualization widget
				appBuilderData?.containers?.forEach((container) => {
					if (container.widgets) {
						const attributeVisualizationWidget =
							container.widgets.find(
								(widget) =>
									widget.type === "attributeVisualization",
							);
						if (attributeVisualizationWidget) {
							hasAttributeVisualizationWidget = true;
						}
					}

					if (container.tabs) {
						for (const tab of container.tabs) {
							const attributeVisualizationWidget =
								tab.widgets.find(
									(widget) =>
										widget.type ===
										"attributeVisualization",
								);
							if (attributeVisualizationWidget) {
								hasAttributeVisualizationWidget = true;
							}
						}
					}
				});

				// check if there are any s-type parameters
				hasSTypeParameters = (appBuilderData.parameters || []).some(
					(p) => p.type.startsWith("s"),
				);
			}

			// depending on if there is an attribute visualization widget
			// we set the loadSdTF flag to true or false
			setLoadSdTF(hasAttributeVisualizationWidget || hasSTypeParameters);

			if (
				!hasInstances &&
				!(hasAttributeVisualizationWidget || hasSTypeParameters)
			) {
				if (initialProcessManagerIdRef.current) {
					// the initial process manager id is created when the session is initialized
					// we resolve it here as there are no further processes to be executed
					addProcess(initialProcessManagerIdRef.current, {
						name: "Instance Process",
						promise: Promise.resolve(),
					});
				}
			} else {
				if (initialProcessManagerIdRef.current) {
					// the initial process manager id is created when the session is initialized
					// we use it here so that we continue to use the same process manager
					// for the AppBuilder data and the instances
					setProcessManagerId(initialProcessManagerIdRef.current);
				} else {
					// create a process only if there are further processes to be executed
					// for now this is only the case if there are instances defined in the AppBuilder data
					// in the future, this could be extended to other cases
					const id = createProcessManager(namespace);
					setProcessManagerId(id);
				}
			}

			setParsedData(parsedData);
		},
		[namespace, validationResult],
	);

	/**
	 * Load the SDTF data if the loadSdTF flag is set to true.
	 * This is done by adding a process to the process manager.
	 */
	useEffect(() => {
		if (!sessionApi) return;
		if (processManagerId === undefined) return;

		sessionApi.loadSdtf = loadSdTF;

		if (loadSdTF) {
			addProcess(processManagerId, {
				name: "Loading of SDTF",
				promise: new Promise<void>((resolve) =>
					addListener(
						EVENTTYPE_SESSION.SESSION_SDTF_DELAYED_LOADED,
						(e: IEvent) => {
							const sessionEvent = e as ISessionEvent;
							if (sessionEvent.sessionId === sessionApi.id)
								resolve();
						},
					),
				),
			});
		} else {
			addProcess(processManagerId, {
				name: "Disable loading of SDTF",
				promise: Promise.resolve(),
			});
		}
	}, [sessionApi, loadSdTF, processManagerId]);

	useEffect(() => {
		const removeOutputUpdateCallback = addOutputUpdateCallback(
			namespace,
			appBuilderOutputId,
			cb,
		);

		return removeOutputUpdateCallback;
	}, [namespace, appBuilderOutputId, cb]);

	useEffect(() => {
		console.debug(CUSTOM_DATA_OUTPUT_NAME, parsedData);
	}, [parsedData]);

	const error =
		sessionError ?? (parsedData instanceof Error ? parsedData : undefined);
	const appBuilderData = parsedData instanceof Error ? undefined : parsedData;
	const hasAppBuilderOutput = !!outputApi;

	// register custom parameters
	useAppBuilderCustomParameters({
		sessionApi,
		appBuilderData,
		acceptRejectMode: props?.acceptRejectMode,
	});

	// create the instances defined in the AppBuilder data
	useAppBuilderInstances({
		sessionApi,
		appBuilderData,
		processManagerId,
	});

	return {
		sessionApi,
		namespace,
		error,
		appBuilderData,
		hasAppBuilderOutput,
	};
}

/**
 * Name of data output used to define the AppBuilder UI
 */
const CUSTOM_DATA_OUTPUT_NAME = "AppBuilder";
