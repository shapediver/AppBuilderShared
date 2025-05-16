import {Grid, Group} from "@mantine/core";
import React from "react";

interface BaseAttributeProps {
	name: string;
	type: string;
	children?: React.ReactNode;
	options?: React.ReactNode;
}

export default function BaseAttribute(props: BaseAttributeProps) {
	const {children, options} = props;

	return (
		<Grid align="center">
			<Grid.Col span="auto">
				<Group grow wrap="nowrap">
					{children}
				</Group>
				{options}
			</Grid.Col>
		</Grid>
	);
}
