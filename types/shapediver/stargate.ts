import {MantineColor} from "@mantine/core";
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

/** Stargate status color types. */
export enum StargateStatusColorTypeEnum {
	primary = "primary",
	focused = "focused",
	dimmed = "dimmed",
}

/** Stargate status color definitions. */
export interface StargateStatusColorProps {
	[StargateStatusColorTypeEnum.primary]: MantineColor;
	[StargateStatusColorTypeEnum.focused]: MantineColor;
	[StargateStatusColorTypeEnum.dimmed]: MantineColor;
}

/** Type for data related to the status of Stargate components. */
export interface IStargateComponentStatusData {
	color: string;
	message: string;
	disabled: boolean;
}

/** Type definition for defining Stargate component statuses. */
export interface IStargateComponentStatusDefinition {
	colorType: StargateStatusColorTypeEnum;
	message: string;
	disabled: boolean;
}

/**
 * Map a Stargate component status definition to a status data object.
 * @param def
 * @param colorProps
 * @returns
 */
export function mapStargateComponentStatusDefinition(
	def: IStargateComponentStatusDefinition,
	colorProps: StargateStatusColorProps,
): IStargateComponentStatusData {
	return {
		color: colorProps[def.colorType],
		message: def.message,
		disabled: def.disabled,
	};
}
