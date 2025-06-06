import {devtoolsSettings} from "@AppBuilderShared/store/storeSettings";
import {
	IStargateClientChoice,
	NetworkStatus,
} from "@AppBuilderShared/types/shapediver/stargate";
import {IShapeDiverStoreStargate} from "@AppBuilderShared/types/store/shapediverStoreStargate";
import {ISdStargateSdk} from "@shapediver/sdk.stargate-sdk-v1";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

/**
 * Simple store for Stargate connection status.
 * @see {@link IShapeDiverStoreStargate}
 */
export const useShapeDiverStoreStargate = create<IShapeDiverStoreStargate>()(
	devtools(
		(set) => ({
			// Initial state
			networkStatus: NetworkStatus.none,
			isLoading: false,
			selectedClient: null,
			sdk: null,
			supportedData: [],

			setNetworkStatus: (status: NetworkStatus) => {
				set({networkStatus: status}, false, "setNetworkStatus");
			},

			setLoading: (loading: boolean) => {
				set({isLoading: loading}, false, "setLoading");
			},

			setSelectedClient: (client: IStargateClientChoice | null) => {
				set({selectedClient: client}, false, "setSelectedClient");
			},

			setSdk: (sdk: ISdStargateSdk | null) => {
				set({sdk}, false, "setSdk");
			},

			setSupportedData: (supportedData) => {
				set({supportedData}, false, "setSupportedData");
			},

			reset: () => {
				set(
					{
						networkStatus: NetworkStatus.none,
						isLoading: false,
						selectedClient: null,
						sdk: null,
						supportedData: [],
					},
					false,
					"reset",
				);
			},
		}),
		{...devtoolsSettings, name: "ShapeDiver | Stargate"},
	),
);
