import {useAppBuilderCustomParameters} from "@AppBuilderShared/hooks/shapediver/appbuilder/useAppBuilderCustomParameters";
import {
	IUseSessionDto,
	useSession,
} from "@AppBuilderShared/hooks/shapediver/useSession";
import {IAppBuilder} from "@AppBuilderShared/types/shapediver/appbuilder";
import {validateAppBuilder} from "@AppBuilderShared/types/shapediver/appbuildertypecheck";

import {useShapeDiverStoreProcessManager} from "@AppBuilderShared/store/useShapeDiverStoreProcessManager";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {IOutputApi, ITreeNode, OutputApiData} from "@shapediver/viewer.session";
import {useCallback, useEffect, useMemo, useState} from "react";
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
	const {sessionApi, error: sessionError} = useSession(
		props
			? {
					...props,
				}
			: undefined,
	);
	const sessionInitialized = !!sessionApi;

	const appBuilderOutputId = useMemo(() => {
		if (!sessionApi) return "";
		const outputs = sessionApi.getOutputByName(CUSTOM_DATA_OUTPUT_NAME);
		return outputs.length > 0 ? outputs[0].id : "";
	}, [sessionApi]);

	const {createProcessManager} = useShapeDiverStoreProcessManager();
	const {addOutputUpdateCallback} = useShapeDiverStoreSession();

	const [parsedData, setParsedData] = useState<
		IAppBuilder | Error | undefined
	>(undefined);
	const [processManagerId, setProcessManagerId] = useState<
		string | undefined
	>(undefined);
	const [outputApi, setOutputApi] = useState<IOutputApi | undefined>(
		undefined,
	);

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

			let hasSubProcesses = false;
			if (appBuilderData) {
				if (appBuilderData.instances) {
					hasSubProcesses = true;
				}
			}

			// create a process id only if there are further processes to be executed
			// for now this is only the case if there are instances defined in the AppBuilder data
			// in the future, this could be extended to other cases
			const processManagerId = hasSubProcesses
				? Math.random().toString(36).substring(7)
				: undefined;

			if (processManagerId)
				createProcessManager(namespace, processManagerId);
			setProcessManagerId(processManagerId);
			setParsedData(parsedData);
		},
		[namespace],
	);

	useEffect(() => {
		const removeOutputUpdateCallback = addOutputUpdateCallback(
			namespace,
			appBuilderOutputId,
			cb,
		);

		return removeOutputUpdateCallback;
	}, [namespace, appBuilderOutputId, cb]);

	useEffect(
		() => console.debug(CUSTOM_DATA_OUTPUT_NAME, parsedData),
		[parsedData],
	);

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
