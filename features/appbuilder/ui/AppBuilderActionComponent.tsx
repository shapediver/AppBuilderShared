import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter";
import {useShapeDiverStoreProcessManager} from "@AppBuilderLib/shared/model";
import {Icon} from "@AppBuilderLib/shared/ui/icon";
import {TooltipWrapper} from "@AppBuilderLib/shared/ui/tooltip";
import {
	Button,
	ButtonProps,
	CloseButton,
	MantineThemeComponent,
	PolymorphicComponentProps,
	useProps,
} from "@mantine/core";
import React from "react";
import {IAppBuilderActionPropsCommon} from "../config";

type ButtonComponentProps<C = "button"> = PolymorphicComponentProps<
	C,
	ButtonProps
>;

type Props = IAppBuilderActionPropsCommon &
	ButtonComponentProps & {
		loading?: boolean;
		canBeDisabledByParameter?: boolean;
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
