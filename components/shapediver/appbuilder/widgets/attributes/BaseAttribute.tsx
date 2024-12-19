import { ActionIcon, Grid, Group, Paper, Stack, Text } from "@mantine/core";
import React from "react";
import Icon from "shared/components/ui/Icon";
import { IconTypeEnum } from "shared/types/shapediver/icons";


interface BaseAttributeProps {
	name: string;
	removeAttribute: (name: string) => void;
	changeOrder: (name: string, direction: "up" | "down") => void;
	children?: React.ReactNode;
    options?: React.ReactNode;
}

export default function BaseAttribute(props: BaseAttributeProps) {
	const { name, children, options, removeAttribute, changeOrder } = props;

	return (
		<Paper>
			<Grid align="center">
				<Grid.Col span="content">
					<Stack>
						<ActionIcon
							variant="default"
							size="xs"
							onClick={() => changeOrder(name, "up")}
						>
							<Icon type={IconTypeEnum.ArrowUp}/>
						</ActionIcon>
						<ActionIcon
							variant="default"
							size="xs"
							onClick={() => changeOrder(name, "down")}
						>
							<Icon type={IconTypeEnum.ArrowDown}/>
						</ActionIcon>
					</Stack>
				</Grid.Col>
				<Grid.Col span="auto">
					<Group justify="space-between">
						<Text>{name}</Text>
						<Icon
							type={IconTypeEnum.X}
							onClick={() => removeAttribute(name)}
						/>
					</Group>
					
					<Group grow wrap="nowrap">
						{children}
					</Group>
					{options}
				</Grid.Col>
			</Grid>
		</Paper>

	);
}
