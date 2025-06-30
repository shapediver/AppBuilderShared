import {ISdStargateClientModel} from "@shapediver/sdk.stargate-sdk-v1";

/**
 * Network status for Stargate connection
 */
export enum NetworkStatus {
	/** The connection to the Stargate service has NOT been established. */
	none = "none",
	/** The connection to the Stargate service AND a client has been established. */
	connected = "connected",
	/**
	 * The connection to the Stargate service has been established, but
	 * we are not connected to a client.
	 */
	disconnected = "disconnected",
}

/**
 * Client choice interface for desktop client selection
 */
export interface IStargateClientChoice {
	/** The name of the client */
	text: string;
	/** The id of the client */
	value: string;
	/** The information about the client as received from Stargate */
	data: ISdStargateClientModel | null;
}

/**
 * Prefix used to decide whether file parameters and exports
 * shall make use of Stargate.
 */
export const StargateFileParamPrefix = "SG_";
