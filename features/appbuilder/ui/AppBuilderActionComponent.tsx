import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import type {MantineButtonProps} from "@AppBuilderLib/shared/mantine-props/button";
import {useShapeDiverStoreProcessManager} from "@AppBuilderLib/shared/model/useShapeDiverStoreProcessManager";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import TooltipWrapper from "@AppBuilderLib/shared/ui/tooltip/TooltipWrapper";
import {
	ActionIcon,
	Button,
	CloseButton,
	MantineThemeComponent,
	PolymorphicComponentProps,
	useProps,
} from "@mantine/core";
import {MantineActionIconProps} from "~/shared/shared/mantine-props";
import {IAppBuilderActionPropsCommon} from "../config/appbuilder";

type ButtonComponentProps<C = "button"> = PolymorphicComponentProps<
	C,
	MantineButtonProps
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
 * @category feature
 * @configPath themeOverrides.components.AppBuilderActionComponent.defaultProps
 * @displayName AppBuilderActionComponent
 */
export interface AppBuilderActionComponentStyleProps extends MantineButtonProps {
	actionIconProps?: MantineActionIconProps;
}

const defaultStyleProps: AppBuilderActionComponentStyleProps = {
	variant: "filled",
	actionIconProps: {
		size: "lg",
		variant: "filled",
	},
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

	const mergedProps = useProps(
		"AppBuilderActionComponent",
		defaultStyleProps,
		rest,
	);

	const {actionIconProps, ...buttonProps} = mergedProps;

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
	) : iconOnly ? (
		<ActionIcon
			{...actionIconProps}
			onClick={_onclick}
			loading={loading}
			disabled={
				(activeProcess && !loading) ||
				disabled ||
				(disabledByParameter && canBeDisabledByParameter !== false)
			}
		>
			<Icon iconType={icon} />
		</ActionIcon>
	) : (
		<Button
			{...buttonProps}
			leftSection={icon ? <Icon iconType={icon} /> : undefined}
			onClick={_onclick}
			loading={loading}
			disabled={
				(activeProcess && !loading) ||
				disabled ||
				(disabledByParameter && canBeDisabledByParameter !== false)
			}
		>
			{label}
		</Button>
	);

	if (tooltip) {
		return <TooltipWrapper label={tooltip}>{button}</TooltipWrapper>;
	}

	return button;
}
