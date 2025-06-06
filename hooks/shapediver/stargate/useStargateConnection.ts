import {useShapeDiverStorePlatform} from "@AppBuilderShared/store/useShapeDiverStorePlatform";
import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate";
import {
	IStargateClientChoice,
	NetworkStatus,
} from "@AppBuilderShared/types/shapediver/stargate";
import {isRunningInPlatform} from "@AppBuilderShared/utils/platform/environment";
import {
	createSdk,
	type ISdStargateClientModel,
	SdStargateGetSupportedDataCommand,
	SdStargatePrepareModelCommand,
	SdStargateStatusCommand,
} from "@shapediver/sdk.stargate-sdk-v1";
import {type ISdStargateGetSupportedDataReplyDto} from "@shapediver/sdk.stargate-sdk-v1/dist/dto/commands/getSupportedDataCommand";
import {useCallback, useRef, useState} from "react";

// Fix for "global is not defined" error in browser environments
if (typeof global === "undefined") {
	(window as any).global = window;
}

const DEFAULT_CHOICE: IStargateClientChoice = {
	text: "None",
	value: "none",
	data: null,
};

export const useStargateConnection = () => {
	const {
		networkStatus,
		setNetworkStatus,
		setLoading,
		setSelectedClient,
		setSdk,
		supportedData,
		setSupportedData,
	} = useShapeDiverStoreStargate();

	// Doesn't require in other components, so keep it in the local state
	const [localState, setLocalState] = useState<{
		availableClients: IStargateClientChoice[];
	}>({
		availableClients: [DEFAULT_CHOICE],
	});

	const connectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const connectionIntervalMs = 1000 * 30; // 30 seconds
	const selectedClientRef = useRef<IStargateClientChoice>(DEFAULT_CHOICE);
	const isStargateEnabled = isRunningInPlatform();

	const getStargateInstance = async (dcnHandler = () => {}) => {
		const {sdk} = useShapeDiverStoreStargate.getState();
		if (!sdk) {
			const {currentModel: model, clientRef} =
				useShapeDiverStorePlatform.getState();

			if (!model || !clientRef?.jwtToken) {
				throw new Error("No model or JWT token available");
			}

			const {
				data: {endpoint},
			} = await clientRef.client.stargate.getConfig();

			const url =
				typeof endpoint === "string"
					? endpoint
					: Object.values(endpoint)[0];

			const newSdk = await createSdk()
				.setBaseUrl(url)
				.setServerCommandHandler((payload: unknown) => {
					console.log("Stargate msgHandler", payload);
				})
				.setConnectionErrorHandler((msg: string) => {
					console.error("Stargate errHandler", msg);
				})
				.setDisconnectHandler(dcnHandler)
				.build();

			await newSdk.register(
				clientRef.jwtToken,
				"React App Builder",
				"1.0.0",
				navigator.platform || "",
				window.location.hostname,
				"",
			);

			setSdk(newSdk);
			return newSdk;
		}

		return sdk;
	};

	const handleSetSelectedClient = async (choice: IStargateClientChoice) => {
		setSelectedClient(choice);
		selectedClientRef.current = choice;
		setSupportedData([]);
		if (choice.data && isInitialized()) {
			try {
				const data = await getSupportedData(choice.data);
				setSupportedData(data);
			} catch (error) {
				console.error("Error getting supported parameters:", error);
			}
		}
	};

	const connectionReset = useCallback(() => {
		handleSetSelectedClient(DEFAULT_CHOICE);
		setNetworkStatus(NetworkStatus.none);
		pingConnectionClose();
	}, []);

	const stargateRegister = async () => {
		if (!isStargateEnabled) return;

		try {
			const dcnHandler = () => {
				connectionReset();
			};

			await getStargateInstance(dcnHandler);
		} catch (error) {
			console.error("Stargate registration failed:", error);
			throw error;
		}
	};

	const stargateGetClients = async () => {
		if (!isStargateEnabled || !isInitialized()) {
			connectionReset();
			return;
		}

		try {
			const clients = await getClients();
			const clientChoices: IStargateClientChoice[] = [
				DEFAULT_CHOICE,
				...clients.map((client: ISdStargateClientModel) => ({
					text: client.clientName || client.id,
					value: client.id,
					data: client,
				})),
			];

			setLocalState((prev) => ({
				...prev,
				availableClients: clientChoices,
			}));

			if (clientChoices.length === 1) {
				connectionReset();
				return;
			}

			const currentSelection =
				useShapeDiverStoreStargate.getState().selectedClient;
			if (
				currentSelection &&
				currentSelection.value !== "none" &&
				!clientChoices.find((c) => c.value === currentSelection.value)
			) {
				handleSetSelectedClient(DEFAULT_CHOICE);
			}
		} catch (error) {
			console.error("Error getting Stargate clients:", error);
			connectionReset();
		}
	};

	const refreshClients = async () => {
		try {
			setLoading(true);

			if (!isInitialized()) {
				await stargateRegister();
			}
			await stargateGetClients();
		} catch (error) {
			console.error("Error refreshing clients:", error);
		} finally {
			setLoading(false);
		}
	};

	const pingConnectionStart = () => {
		connectionIntervalRef.current = setInterval(async () => {
			try {
				const selectedClient = selectedClientRef.current;
				if (!selectedClient || selectedClient.value === "none") {
					connectionReset();
					return;
				}

				if (!isInitialized()) {
					pingConnectionClose();
					setNetworkStatus(NetworkStatus.disconnected);
					return;
				}

				if (selectedClient.data) {
					try {
						// Implement periodic status check
						await checkStatus(selectedClient.data);
						setNetworkStatus(NetworkStatus.connected);
					} catch (error) {
						console.log("Status check failed:", error);
						setNetworkStatus(NetworkStatus.disconnected);
					}
				}
			} catch (error) {
				console.error("Connection monitoring error:", error);
				setNetworkStatus(NetworkStatus.disconnected);
			}
		}, connectionIntervalMs);
	};

	const pingConnectionClose = () => {
		if (connectionIntervalRef.current) {
			clearInterval(connectionIntervalRef.current);
			connectionIntervalRef.current = null;
		}
	};

	const selectClient = async (choice: IStargateClientChoice) => {
		try {
			setLoading(true);
			await handleSetSelectedClient(choice);

			if (choice.value === "none") {
				setNetworkStatus(NetworkStatus.none);
				pingConnectionClose();
				return;
			}

			if (!choice.data || !isInitialized()) {
				setNetworkStatus(NetworkStatus.disconnected);
				return;
			}

			await checkStatus(choice.data);
			const {currentModel} = useShapeDiverStorePlatform.getState();

			if (currentModel?.id) {
				await prepareModel(choice.data, currentModel.id);
			}

			setNetworkStatus(NetworkStatus.connected);
			pingConnectionStart();
		} catch (error) {
			console.error("Error selecting client:", error);
			setNetworkStatus(NetworkStatus.disconnected);
		} finally {
			setLoading(false);
		}
	};

	// Helper functions for Stargate operations
	const getClients = async (): Promise<ISdStargateClientModel[]> => {
		const {sdk} = useShapeDiverStoreStargate.getState();
		if (!sdk) {
			throw new Error("Stargate instance not initialized");
		}
		return sdk.listFrontendClients();
	};

	const getSupportedData = async (
		client: ISdStargateClientModel,
	): Promise<ISdStargateGetSupportedDataReplyDto[]> => {
		const {sdk} = useShapeDiverStoreStargate.getState();
		if (!sdk) {
			throw new Error("Stargate instance not initialized");
		}
		const command = new SdStargateGetSupportedDataCommand(sdk);
		return command.send({}, [client]);
	};

	const checkStatus = async (
		client: ISdStargateClientModel,
	): Promise<void> => {
		const {sdk} = useShapeDiverStoreStargate.getState();
		if (!sdk) {
			throw new Error("Stargate instance not initialized");
		}
		const command = new SdStargateStatusCommand(sdk);
		await command.send({}, [client]);
	};

	const prepareModel = async (
		client: ISdStargateClientModel,
		modelId: string,
	): Promise<void> => {
		const {sdk} = useShapeDiverStoreStargate.getState();
		if (!sdk) {
			throw new Error("Stargate instance not initialized");
		}

		try {
			const command = new SdStargatePrepareModelCommand(sdk);
			await command.send({model: {id: modelId}}, [client]);
		} catch (error: unknown) {
			console.error("prepareModel error details:", error);
			throw error;
		}
	};

	const isInitialized = (): boolean => {
		const {sdk} = useShapeDiverStoreStargate.getState();
		return sdk !== null;
	};

	const initialize = async () => {
		setLoading(true);
		setNetworkStatus(NetworkStatus.none);
		try {
			await stargateRegister();
			await stargateGetClients();
		} catch (error) {
			console.error("Stargate initialization error:", error);
		} finally {
			setLoading(false);
		}
	};

	return {
		...localState,
		supportedData,
		networkStatus,
		getStargateInstance,
		isStargateEnabled,
		refreshClients,
		selectClient,
		connectionReset,
		initialize,
	};
};
