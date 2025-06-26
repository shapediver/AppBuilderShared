import {
	IStargateClientChoice,
	NetworkStatus,
} from "@AppBuilderShared/types/shapediver/stargate";
import {type ISdStargateSdk} from "@shapediver/sdk.stargate-sdk-v1";
import {type ISdStargateGetSupportedDataReplyDto} from "@shapediver/sdk.stargate-sdk-v1/dist/dto/commands/getSupportedDataCommand";

/**
 * Simple interface for Stargate connection status store.
 */
export interface IShapeDiverStoreStargate {
	/**
	 * Current network status of the Stargate connection.
	 */
	networkStatus: NetworkStatus;

	/**
	 * Whether a connection operation is in progress.
	 */
	isLoading: boolean;

	/**
	 * The currently selected client.
	 */
	selectedClient: IStargateClientChoice | null | undefined;

	/**
	 * The Stargate SDK instance.
	 */
	sdk: ISdStargateSdk | null;

	/**
	 * Supported data from the selected client.
	 */
	supportedData: ISdStargateGetSupportedDataReplyDto[];

	/**
	 * Set the network status.
	 * @param status The network status to set.
	 */
	setNetworkStatus: (status: NetworkStatus) => void;

	/**
	 * Set the loading state.
	 * @param loading Whether loading is in progress.
	 */
	setLoading: (loading: boolean) => void;

	/**
	 * Set the selected client.
	 * @param client The client to set as selected.
	 */
	setSelectedClient: (client: IStargateClientChoice | null) => void;

	/**
	 * Set the Stargate SDK instance.
	 * @param instance The instance to set.
	 */
	setSdk: (sdk: ISdStargateSdk | null) => void;

	/**
	 * Set the supported data.
	 * @param data The supported data to set.
	 */
	setSupportedData: (data: ISdStargateGetSupportedDataReplyDto[]) => void;

	/**
	 * Reset the connection state to initial values.
	 */
	reset: () => void;
}
