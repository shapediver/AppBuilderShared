import Icon, {IconProps} from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useStargateConnection} from "@AppBuilderShared/hooks/shapediver/stargate/useStargateConnection";
import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {NetworkStatus} from "@AppBuilderShared/types/shapediver/stargate";
import {
	ActionIcon,
	ActionIconProps,
	Alert,
	AlertProps,
	Group,
	GroupProps,
	Loader,
	LoaderProps,
	MantineThemeComponent,
	Paper,
	PaperProps,
	Select,
	SelectProps,
	Stack,
	StackProps,
	Text,
	TextProps,
	useProps,
} from "@mantine/core";
import React, {useEffect} from "react";
import {useShallow} from "zustand/react/shallow";

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

interface Props {
	/** TODO: Clarify the purpose of this property. */
	isDisabled?: boolean;

	/**
	 * TODO: It should not be necessary to pass this information.
	 */
	areNoInputsAndOutputs?: boolean;
}

interface StyleProps {
	iconStatusProps?: ActionIconProps;
	alertProps?: AlertProps;
	alertTextProps?: TextProps;
	paperProps?: PaperProps;
	stackProps?: StackProps;
	groupTopProps?: GroupProps;
	textProps?: TextProps;
	selectProps?: SelectProps;
	actionIconRefreshProps?: ActionIconProps;
	iconRefreshProps?: IconProps;
	groupBottomProps?: GroupProps;
	loaderProps?: LoaderProps;
	statusIconProps?: Partial<IconProps>;
}

const defaultStyleProps: Partial<StyleProps> = {
	iconStatusProps: {
		variant: "subtle",
		mb: 4,
	},
	alertProps: {
		title: "Desktop Clients",
	},
	alertTextProps: {
		size: "sm",
	},
	paperProps: {
		p: "md",
		withBorder: true,
	},
	stackProps: {
		gap: "md",
	},
	groupTopProps: {
		justify: "space-between",
		align: "center",
	},
	textProps: {
		fw: 500,
		size: "sm",
	},
	actionIconRefreshProps: {
		variant: "subtle",
		loaderProps: {type: "dots"},
	},
	iconRefreshProps: {
		type: IconTypeEnum.Refresh,
		size: "1rem",
	},
	groupBottomProps: {
		justify: "space-between",
		align: "end",
	},
	selectProps: {
		style: {flex: 1},
		label: "Clients",
		placeholder: "Select a client",
	},
	loaderProps: {
		type: "dots",
		size: "xs",
	},
	statusIconProps: {
		size: "1.2rem",
	},
};

export function DesktopClientPanelThemeProps(
	props: Partial<Props> & Partial<StyleProps>,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function DesktopClientPanel(props: Props & StyleProps) {
	const {isDisabled = false, areNoInputsAndOutputs = false, ...rest} = props;

	const {
		iconStatusProps,
		alertProps,
		alertTextProps,
		paperProps,
		groupTopProps,
		selectProps,
		stackProps,
		textProps,
		actionIconRefreshProps,
		iconRefreshProps,
		groupBottomProps,
		loaderProps,
		statusIconProps,
	} = useProps("DesktopClientPanel", defaultStyleProps, rest);
	const {selectedClient, isLoading} = useShapeDiverStoreStargate(
		useShallow((state) => ({
			selectedClient: state.selectedClient,
			isLoading: state.isLoading,
		})),
	);
	const {
		availableClients,
		isStargateEnabled,
		refreshClients,
		selectClient,
		initialize,
		networkStatus,
	} = useStargateConnection();

	useEffect(() => {
		initialize();
	}, []);

	const networkStatusIcon = NetworkStatusIcons[networkStatus];

	if (!isStargateEnabled) {
		return (
			<Alert {...alertProps}>
				<Text {...alertTextProps}>
					Interact and exchange data directly between your models and
					local software clients. This feature is only available when
					running on the ShapeDiver Platform.
				</Text>
			</Alert>
		);
	}

	if (areNoInputsAndOutputs) {
		return (
			<Alert {...alertProps}>
				<Text {...alertTextProps}>
					Define structured geometry inputs and outputs and start
					exchanging data with desktop clients.
				</Text>
			</Alert>
		);
	}

	const handleClientChange = async (value: string | null) => {
		if (!value) return;

		const client = availableClients.find((c) => c.value === value);
		if (client) {
			await selectClient(client);
		}
	};

	return (
		<Paper {...paperProps}>
			<Stack {...stackProps}>
				<Group {...groupTopProps}>
					<Text {...textProps}>Active Clients</Text>
					<ActionIcon
						disabled={isLoading || isDisabled}
						onClick={refreshClients}
						loading={isLoading}
						{...actionIconRefreshProps}
					>
						<Icon
							{...iconRefreshProps}
							type={
								iconRefreshProps?.type || IconTypeEnum.Refresh
							}
						/>
					</ActionIcon>
				</Group>

				<Group {...groupBottomProps}>
					<Select
						data={availableClients.map((client) => ({
							value: client.value,
							label: client.text,
						}))}
						value={selectedClient?.value || null}
						onChange={handleClientChange}
						disabled={isLoading || isDisabled}
						{...selectProps}
						rightSection={
							isLoading ? <Loader {...loaderProps} /> : undefined
						}
					/>

					{networkStatusIcon && (
						<TooltipWrapper label={networkStatusIcon.tooltip}>
							<ActionIcon disabled {...iconStatusProps}>
								<Icon
									{...statusIconProps}
									type={networkStatusIcon.icon}
									color={networkStatusIcon.color}
								/>
							</ActionIcon>
						</TooltipWrapper>
					)}
				</Group>
			</Stack>
		</Paper>
	);
}
