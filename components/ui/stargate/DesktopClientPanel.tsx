import Icon, {SdIconProps} from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useStargateConnection} from "@AppBuilderShared/hooks/shapediver/stargate/useStargateConnection";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {NetworkStatusIcons} from "@AppBuilderShared/types/shapediver/stargate";
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
import {addListener, EVENTTYPE_SESSION} from "@shapediver/viewer.viewport";
import React, {useEffect} from "react";

interface Props {
	isDisabled?: boolean;
	areNoInputsAndOutputs?: boolean;
	namespace?: string;
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
	iconRefreshProps?: SdIconProps;
	groupBottomProps?: GroupProps;
	loaderProps?: LoaderProps;
	statusIconProps?: Partial<SdIconProps>;
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
	const {
		isDisabled = false,
		areNoInputsAndOutputs = false,
		namespace,
		...rest
	} = props;

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
	const {selectedClient, isLoading} = useShapeDiverStoreStargate();
	const {
		availableClients,
		isStargateEnabled,
		refreshClients,
		selectClient,
		initialize,
		networkStatus,
	} = useStargateConnection();
	const sessions = useShapeDiverStoreSession((state) => state.sessions);

	useEffect(() => {
		initialize();

		const session = namespace ? sessions[namespace] : null;
		if (session && session.loadSdtf === false) {
			addListener(
				EVENTTYPE_SESSION.SESSION_SDTF_DELAYED_LOADED,
				() => {},
			);
			session.loadSdtf = true;
		}
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
