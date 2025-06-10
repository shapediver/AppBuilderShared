import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {IStargateInputProps} from "@AppBuilderShared/types/shapediver/stargate";
import {Box, Button, Loader, Text} from "@mantine/core";
import React from "react";
import Icon from "../Icon";

const StargateInput: React.FC<IStargateInputProps> = ({
	isLoading = false,
	isDisabled = false,
	isBtnDisabled = false,
	message = "",
	color,
	icon = IconTypeEnum.DeviceDesktopUp,
	onConnect,
}) => {
	if (isLoading) {
		return (
			<Box>
				<Button
					disabled
					fullWidth
					justify="space-between"
					rightSection={<Loader type="dots" size="sm" />}
					style={{
						backgroundColor: "transparent",
					}}
				>
					<Text size="sm" c="dimmed" fs="italic">
						Waiting for selection in the client
					</Text>
				</Button>
			</Box>
		);
	}

	return (
		<Box>
			<Button
				color={color}
				variant="filled"
				fullWidth
				justify="space-between"
				disabled={isBtnDisabled || isLoading || isDisabled}
				rightSection={<Icon type={icon} />}
				onClick={onConnect}
			>
				{message}
			</Button>
		</Box>
	);
};

export default StargateInput;
