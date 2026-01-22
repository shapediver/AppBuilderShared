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
import {useNotificationStore} from "@AppBuilderShared/store/useNotificationStore";
import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate";
import {IAppBuilderWidgetPropsDesktopClientSelection} from "@AppBuilderShared/types/shapediver/appbuilder";
import {NetworkStatus} from "@AppBuilderShared/types/shapediver/stargate";
import {ISdStargateClientModel} from "@shapediver/sdk.stargate-sdk-v1";
import React, {useCallback, useEffect, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {Icon, IconProps, IconType} from "~/shared/shared/ui/Icon";
import {TooltipWrapper} from "~/shared/shared/ui/TooltipWrapper";

/**
 * Interface representing a client choice in the desktop client panel.
 */
interface IClientChoice {
	/** The value of the choice (invisible to the user). Typically the ID of the client. */
	value: string;
	/** The label of the choice. Typically the name of the client. */
	label: string;
	/** The client model as received from Stargate. Optional to allow for the choice "None". */
	client?: ISdStargateClientModel;
}

/**
 * Constant representing the "None" client choice.
 */
const NO_CLIENT: IClientChoice = {
	value: "none",
	label: "None",
};

/**
 * Icon configuration for network status
 */
export interface INetworkStatusIcon {
	icon: IconType;
	color: string;
	tooltip: string;
}

/**
 * Map of network status to icon configurations
 */
export const NetworkStatusIcons: Record<NetworkStatus, INetworkStatusIcon> = {
	[NetworkStatus.none]: {
		icon: "tabler:network",
		color: "grey",
		tooltip: "Not connected to Stargate",
	},
	[NetworkStatus.connected]: {
		icon: "tabler:network",
		color: "green",
		tooltip: "Client active",
	},
	[NetworkStatus.disconnected]: {
		icon: "tabler:network-off",
		color: "red",
		tooltip: "No active client",
	},
};

type Props = IAppBuilderWidgetPropsDesktopClientSelection;

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
		size: "2.25rem",
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
		iconType: "tabler:refresh",
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
	const notifications = useNotificationStore();

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
		clientsFilter,
		autoConnect = false,
	} = useProps("DesktopClientPanel", defaultStyleProps, props);

	const {
		getAvailableClients,
		isStargateEnabled,
		networkStatus,
		selectClient,
		selectedClient,
	} = useShapeDiverStoreStargate(
		useShallow((state) => ({
			getAvailableClients: state.getAvailableClients,
			isStargateEnabled: state.isStargateEnabled,
			networkStatus: state.networkStatus,
			selectClient: state.selectClient,
			selectedClient: state.selectedClient,
		})),
	);

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

	const [loading, setLoading] = useState(false);
	const [availableClients, setAvailableClients] = useState<IClientChoice[]>([
		NO_CLIENT,
	]);
	const [selectedClientValue, setSelectedClientValue] = useState<string>(
		NO_CLIENT.value,
	);

	const connectAttempt = useCallback(
		async (
			client: ISdStargateClientModel | undefined,
		): Promise<boolean> => {
			await selectClient(client);
			// Check if connection was successful
			const currentNetworkStatus =
				useShapeDiverStoreStargate.getState().networkStatus;
			if (currentNetworkStatus === NetworkStatus.connected) {
				notifications.show({
					message: `Successfully connected to client "${client?.clientName}".`,
				});
				return true;
			} else {
				notifications.error({
					message: `Failed to connect to client "${client?.clientName}", please check the status of the client and try again.`,
				});
				return false;
			}
		},
		[],
	);

	const refreshClients = useCallback(
		async (currentClientValue: string) => {
			setLoading(true);
			const clients = await getAvailableClients(true);

			// Filter clients based on clientsFilter prop
			const filteredClients = clientsFilter
				? clients.filter((client) =>
						clientsFilter.includes(client.clientName),
					)
				: clients;

			const clientChoices: IClientChoice[] = [
				NO_CLIENT,
				...filteredClients.map((client) => ({
					value: client.id,
					label: client.clientName,
					client: client,
				})),
			];
			setAvailableClients(clientChoices);
			if (!clientChoices.find((c) => c.value === currentClientValue)) {
				await selectClient(undefined);
				setLoading(false);
				return;
			}

			// Auto-connect logic: try clients in order if clientsFilter is provided, or connect to single client
			if (autoConnect && filteredClients.length > 0 && !selectedClient) {
				if (clientsFilter && clientsFilter.length > 0) {
					// Try connecting to clients in the order specified by clientsFilter
					for (const clientName of clientsFilter) {
						const clientToTry = filteredClients.find(
							(client) => client.clientName === clientName,
						);
						if (clientToTry) {
							const success = await connectAttempt(clientToTry);
							if (success) {
								break; // Stop trying other clients
							}
						}
					}
				} else if (filteredClients.length === 1) {
					// Original logic: auto-connect if exactly one client available
					await connectAttempt(filteredClients[0]);
				}
			}

			setLoading(false);
		},
		[clientsFilter, autoConnect, selectedClient],
	);

	// Keep the local state in sync with the global one
	useEffect(() => {
		const value = selectedClient?.id || NO_CLIENT.value;
		if (
			value !== NO_CLIENT.value &&
			!availableClients.find((c) => c.value === value)
		)
			refreshClients(value);
		else setSelectedClientValue(value);
	}, [selectedClient, availableClients]);

	// Initial loading of available clients
	useEffect(() => {
		refreshClients(NO_CLIENT.value);
	}, []);

	const handleClientChange = useCallback(
		async (
			currentlyAvailableClients: IClientChoice[],
			value: string | null,
		) => {
			if (!value) return;
			setLoading(true);
			const client = currentlyAvailableClients.find(
				(c) => c.value === value,
			);
			await selectClient(client?.client);
			setLoading(false);
		},
		[],
	);

	return (
		<Paper {...paperProps}>
			<Stack {...stackProps}>
				<Group {...groupTopProps}>
					<Text {...textProps}>Active Clients</Text>
					<ActionIcon
						disabled={loading}
						onClick={() => refreshClients(selectedClientValue)}
						loading={loading}
						{...actionIconRefreshProps}
					>
						<Icon
							{...iconRefreshProps}
							iconType={
								iconRefreshProps?.iconType || "tabler:refresh"
							}
						/>
					</ActionIcon>
				</Group>

				<Group {...groupBottomProps}>
					<Select
						data={availableClients}
						value={selectedClientValue}
						onChange={(value) =>
							handleClientChange(availableClients, value)
						}
						disabled={loading}
						{...selectProps}
						rightSection={
							loading ? <Loader {...loaderProps} /> : undefined
						}
					/>

					{networkStatusIcon && (
						<TooltipWrapper label={networkStatusIcon.tooltip}>
							<ActionIcon disabled {...iconStatusProps}>
								<Icon
									{...statusIconProps}
									iconType={networkStatusIcon.icon}
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
