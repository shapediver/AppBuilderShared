import {ActionIcon, Grid, Group, Paper, Stack, Text} from "@mantine/core";
import React from "react";
import Icon from "@AppBuilderShared/components/ui/Icon";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";

interface BaseAttributeProps {
	name: string;
	type: string;
	removeAttribute: (name: string, type: string) => void;
	changeOrder: (name: string, type: string, direction: "up" | "down") => void;
	children?: React.ReactNode;
	options?: React.ReactNode;
}

export default function BaseAttribute(props: BaseAttributeProps) {
	const {name, type, children, options, removeAttribute, changeOrder} = props;

	return (
		<Paper>
			<Grid align="center">
				<Grid.Col span="content">
					<Stack>
						<ActionIcon
							variant="default"
							size="xs"
							onClick={() => changeOrder(name, type, "up")}
						>
							<Icon type={IconTypeEnum.ArrowUp} />
						</ActionIcon>
						<ActionIcon
							variant="default"
							size="xs"
							onClick={() => changeOrder(name, type, "down")}
						>
							<Icon type={IconTypeEnum.ArrowDown} />
						</ActionIcon>
					</Stack>
				</Grid.Col>
				<Grid.Col span="auto">
					<Group justify="space-between">
						<Text>{name}</Text>
						<Icon
							type={IconTypeEnum.X}
							onClick={() => removeAttribute(name, type)}
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
