import {Grid, Group, Paper} from "@mantine/core";
import React from "react";

interface BaseAttributeProps {
	name: string;
	type: string;
	style?: React.CSSProperties;
	children?: React.ReactNode;
	options?: React.ReactNode;
}

export default function BaseAttribute(props: BaseAttributeProps) {
	const {style, children, options} = props;

	return (
		<Paper style={style}>
			<Grid align="center">
				<Grid.Col span="auto">
					<Group grow wrap="nowrap">
						{children}
					</Group>
					{options}
				</Grid.Col>
			</Grid>
		</Paper>
	);
}
