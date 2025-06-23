import {ISdStargateClientModel} from "@shapediver/sdk.stargate-sdk-v1";

/**
 * Network status for Stargate connection
 */
export enum NetworkStatus {
	none = "none",
	connected = "connected",
	disconnected = "disconnected",
}

/**
 * Client choice interface for desktop client selection
 */
export interface IStargateClientChoice {
	text: string;
	value: string;
	data: ISdStargateClientModel | null;
}
