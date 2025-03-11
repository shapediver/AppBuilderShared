import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {IAppBuilderActionPropsCommon} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {
	Button,
	ButtonProps,
	CloseButton,
	PolymorphicComponentProps,
} from "@mantine/core";
import React from "react";

type ButtonComponentProps<C = "button"> = PolymorphicComponentProps<
	C,
	ButtonProps
>;

type Props = IAppBuilderActionPropsCommon &
	ButtonComponentProps & {
		loading?: boolean;
	};

/**
 * Functional component common to all action components.
 *
 * @returns
 */
export default function AppBuilderActionComponent(props: Props) {
	const {label, icon, tooltip, onClick, loading, ...rest} = props;
	const iconOnly = !label && icon;
	const useCloseButton = iconOnly && icon === IconTypeEnum.X;
	const _onclick = onClick === null ? undefined : onClick;

	const button = useCloseButton ? (
		<CloseButton onClick={_onclick} />
	) : (
		<Button
			leftSection={!iconOnly && icon ? <Icon type={icon} /> : undefined}
			{...rest}
			onClick={_onclick}
			loading={loading}
		>
			{iconOnly ? <Icon type={icon} /> : label}
		</Button>
	);

	if (tooltip) {
		return <TooltipWrapper label={tooltip}>{button}</TooltipWrapper>;
	}

	return button;
}
