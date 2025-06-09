import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useStargateConnection} from "@AppBuilderShared/hooks/shapediver/stargate/useStargateConnection";
import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {NetworkStatusIcons} from "@AppBuilderShared/types/shapediver/stargate";
import {
	ActionIcon,
	ActionIconProps,
	Alert,
	Group,
	Loader,
	MantineThemeComponent,
	Paper,
	Select,
	Stack,
	Text,
	useProps,
} from "@mantine/core";
import React, {useEffect} from "react";

interface Props {
	isDisabled?: boolean;
	areNoInputsAndOutputs?: boolean;
}

interface StyleProps {
	iconStatusProps?: ActionIconProps;
}

const defaultStyleProps: Partial<StyleProps> = {
	iconStatusProps: {
		mb: 4,
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

	const {iconStatusProps} = useProps(
		"DesktopClientPanel",
		defaultStyleProps,
		rest,
	);
	const {selectedClient, isLoading} = useShapeDiverStoreStargate();
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
			<Alert color="blue" title="Desktop Clients">
				<Text size="sm">
					Interact and exchange data directly between your models and
					local software clients. This feature is only available when
					running on the ShapeDiver Platform.
				</Text>
			</Alert>
		);
	}

	if (areNoInputsAndOutputs) {
		return (
			<Alert color="blue" title="Desktop Clients">
				<Text size="sm">
					Define structured geometry inputs and outputs and start
					exchanging data with desktop clients.
				</Text>
			</Alert>
		);
	}

	const handleClientChange = (value: string | null) => {
		if (!value) return;

		const client = availableClients.find((c) => c.value === value);
		if (client) {
			selectClient(client);
		}
	};

	return (
		<Paper p="md" withBorder>
			<Stack gap="md">
				<Group justify="space-between" align="center">
					<Text fw={500} size="sm">
						Active Clients
					</Text>
					<ActionIcon
						variant="subtle"
						disabled={isLoading || isDisabled}
						onClick={refreshClients}
						loading={isLoading}
						loaderProps={{type: "dots"}}
					>
						<Icon type={IconTypeEnum.Refresh} size="1rem" />
					</ActionIcon>
				</Group>

				<Group justify="space-between" align="end">
					<Select
						label="Clients"
						placeholder="Select a client"
						data={availableClients.map((client) => ({
							value: client.value,
							label: client.text,
						}))}
						value={selectedClient?.value || null}
						onChange={handleClientChange}
						disabled={isLoading || isDisabled}
						style={{flex: 1}}
						rightSection={
							isLoading ? (
								<Loader size="xs" type="dots" />
							) : undefined
						}
					/>

					{networkStatusIcon && (
						<TooltipWrapper label={networkStatusIcon.tooltip}>
							<ActionIcon
								variant="subtle"
								disabled
								{...iconStatusProps}
							>
								<Icon
									type={networkStatusIcon.icon}
									size="1.2rem"
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
