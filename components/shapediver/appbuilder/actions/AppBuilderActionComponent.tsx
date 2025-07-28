import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {IAppBuilderLegacyActionPropsCommon} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {
	Button,
	ButtonProps,
	CloseButton,
	MantineThemeComponent,
	PolymorphicComponentProps,
	useProps,
} from "@mantine/core";
import React from "react";

type ButtonComponentProps<C = "button"> = PolymorphicComponentProps<
	C,
	ButtonProps
>;

type Props = IAppBuilderLegacyActionPropsCommon &
	ButtonComponentProps & {
		loading?: boolean;
	};

const defaultStyleProps: Partial<Props> = {
	variant: "filled",
};

type AppBuilderActionComponentThemePropsType = Partial<Props>;

export function AppBuilderActionComponentThemeProps(
	props: AppBuilderActionComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
/**
 * Functional component common to all action components.
 *
 * @returns
 */
export default function AppBuilderActionComponent(
	props: Props & AppBuilderActionComponentThemePropsType,
) {
	const {label, icon, tooltip, onClick, loading, ...rest} = props;

	const buttonProps = useProps(
		"AppBuilderActionComponent",
		defaultStyleProps,
		props,
	);

	const iconOnly = !label && icon;
	const useCloseButton = iconOnly && icon === IconTypeEnum.X;
	const _onclick = onClick === null ? undefined : onClick;

	const button = useCloseButton ? (
		<CloseButton onClick={_onclick} />
	) : (
		<Button
			{...buttonProps}
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
