import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreProcessManager} from "@AppBuilderLib/shared/model/useShapeDiverStoreProcessManager";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import TooltipWrapper from "@AppBuilderLib/shared/ui/tooltip/TooltipWrapper";
import {
	Button,
	ButtonProps,
	CloseButton,
	MantineThemeComponent,
	PolymorphicComponentProps,
	useProps,
} from "@mantine/core";
import React from "react";
import {IAppBuilderActionPropsCommon} from "../config/appbuilder";

type ButtonComponentProps<C = "button"> = PolymorphicComponentProps<
	C,
	ButtonProps
>;

type Props = IAppBuilderActionPropsCommon &
	ButtonComponentProps & {
		loading?: boolean;
		canBeDisabledByParameter?: boolean;
	};

/**
 * Theme-driven Mantine `Button` defaults for action buttons.
 *
 * @docAttached
 * @configPath themeOverrides.components.AppBuilderActionComponent.defaultProps
 * @displayName AppBuilderActionComponent
 */
export interface AppBuilderActionComponentStyleProps {
	/** @default filled */
	variant?: ButtonProps["variant"];
	size?: ButtonProps["size"];
	color?: ButtonProps["color"];
	radius?: ButtonProps["radius"];
	fullWidth?: ButtonProps["fullWidth"];
	justify?: ButtonProps["justify"];
}

const defaultStyleProps: AppBuilderActionComponentStyleProps = {
	variant: "filled",
};

type AppBuilderActionComponentThemePropsType =
	AppBuilderActionComponentStyleProps;

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
	const {
		label,
		icon,
		tooltip,
		onClick,
		loading,
		disabled,
		canBeDisabledByParameter,
		...rest
	} = props;

	const buttonProps = useProps(
		"AppBuilderActionComponent",
		defaultStyleProps,
		rest,
	);

	const activeProcess = useShapeDiverStoreProcessManager(
		(state) => Object.keys(state.processManagers).length > 0,
	);

	const iconOnly = !label && icon;
	const useCloseButton = iconOnly && icon === "tabler:x";
	const _onclick = onClick === null ? undefined : onClick;

	const disabledByParameter = useShapeDiverStoreParameters(
		(state) => state.hasParameterDisablingOthers,
	);

	const button = useCloseButton ? (
		<CloseButton onClick={_onclick} />
	) : (
		<Button
			{...buttonProps}
			leftSection={
				!iconOnly && icon ? <Icon iconType={icon} /> : undefined
			}
			onClick={_onclick}
			loading={loading}
			disabled={
				(activeProcess && !loading) ||
				disabled ||
				(disabledByParameter && canBeDisabledByParameter !== false)
			}
		>
			{iconOnly ? <Icon iconType={icon} /> : label}
		</Button>
	);

	if (tooltip) {
		return <TooltipWrapper label={tooltip}>{button}</TooltipWrapper>;
	}

	return button;
}
