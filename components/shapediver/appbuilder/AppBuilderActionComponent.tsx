import { Button, ButtonProps, Tooltip } from "@mantine/core";
import React from "react";
import Icon from "../../ui/Icon";
import { IAppBuilderActionPropsCommon } from "../../../types/shapediver/appbuilder";

type Props = IAppBuilderActionPropsCommon & ButtonProps;

/**
 * Functional component common to all action components.
 *
 * @returns
 */
export default function AppBuilderActionComponent(props: Props) {
	const { label, icon, tooltip, ...rest } = props;

	const button = <Button 
		leftSection={icon ? <Icon type={icon} /> : undefined} 
		{...rest} 
	>
		{label}
	</Button>;
	
	if (tooltip) {
		return <Tooltip label={tooltip}>{button}</Tooltip>;
	}
	
	return button;
}
