import {
	ISdStargateBakeDataResultEnum,
	ISdStargateClientModel,
	ISdStargateGetDataResultEnum,
} from "@shapediver/sdk.stargate-sdk-v1";
import {IconTypeEnum} from "./icons";

/**
 * Network status for Stargate connection
 */
export enum NetworkStatus {
	none = "none",
	connected = "connected",
	disconnected = "disconnected",
}

/**
 * Icon configuration for network status
 */
export interface INetworkStatusIcon {
	icon: IconTypeEnum;
	color: string;
	tooltip: string;
}

/**
 * Map of network status to icon configurations
 */
export const NetworkStatusIcons: Record<NetworkStatus, INetworkStatusIcon> = {
	[NetworkStatus.none]: {
		icon: IconTypeEnum.Network,
		color: "grey",
		tooltip: "No active client",
	},
	[NetworkStatus.connected]: {
		icon: IconTypeEnum.Network,
		color: "green",
		tooltip: "Client active",
	},
	[NetworkStatus.disconnected]: {
		icon: IconTypeEnum.NetworkOff,
		color: "red",
		tooltip: "Client connection failed",
	},
};

/**
 * Client choice interface for desktop client selection
 */
export interface IStargateClientChoice {
	text: string;
	value: string;
	data: ISdStargateClientModel | null;
}

/**
 * Props for the ConnectionBadge component
 */
export interface IConnectionBadgeProps {
	disabled?: boolean;
	count?: number;
	icon?: IconTypeEnum;
	color?: string;
	loading?: boolean;
	onClick?: (event: React.MouseEvent) => void;
}

/**
 * Props for the StargateInput component
 */
export interface IStargateInputProps {
	hint?: string;
	isClearSelection?: boolean;
	isLoading?: boolean;
	isDisabled?: boolean;
	isBtnDisabled?: boolean;
	message?: string;
	count?: number;
	color?: string;
	icon?: IconTypeEnum;
	onConnect?: (event: React.MouseEvent) => void;
	onCancel?: (event: React.MouseEvent) => void;
}

/**
 * Props for the DesktopClientPanel component
 */
export interface IDesktopClientPanelProps {
	isDisplayCta?: boolean;
	isDisabled?: boolean;
	areNoInputsAndOutputs?: boolean;
	sessionId: string;
	modelId?: string;
}

/**
 * State for the Stargate connection
 */
export interface IStargateState {
	networkStatus: NetworkStatus;
	selectedClient: IStargateClientChoice | null;
	availableClients: IStargateClientChoice[];
	isLoading: boolean;
	supportedData: any[]; // This would be ISdStargateGetSupportedDataReplyDto[] in the actual implementation
}

export const ParametersGetDataResultErrorMessages = {
	[ISdStargateGetDataResultEnum.NOTHING]:
		"No objects were selected in the client.",
	[ISdStargateGetDataResultEnum.FAILURE]:
		"The selection operation failed in the client.",
	[ISdStargateGetDataResultEnum.CANCEL]:
		"The selection operation was canceled in the client.",
};

export const GetDataResultErrorMessages = {
	[ISdStargateBakeDataResultEnum.SUCCESS]:
		"The geometry was successfully baked in the active client.",
	[ISdStargateBakeDataResultEnum.NOTHING]: "No geometry could be baked.",
	[ISdStargateBakeDataResultEnum.FAILURE]: "The baking operation failed.",
	[ISdStargateBakeDataResultEnum.CANCEL]:
		"The baking operation was canceled.",
};
