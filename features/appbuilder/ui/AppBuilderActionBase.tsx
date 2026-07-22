import {IAppBuilderActionPropsCommon} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {AppBuilderToolbarIconButtonThemeStyleProps} from "@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton";
import AppBuilderToolbarIconButton from "@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton";
import AppBuilderActionComponent from "./AppBuilderActionComponent";
import AppBuilderToolbarMenuItemButton from "./AppBuilderToolbarMenuItemButton";

export type AppBuilderActionPresentation = "button" | "item" | "toolbarIcon";

export interface AppBuilderActionRenderProps {
	presentation?: AppBuilderActionPresentation;
	toolbarButtonProps?: Partial<AppBuilderToolbarIconButtonThemeStyleProps>;
	disabled?: boolean;
}

export interface AppBuilderActionBaseProps
	extends IAppBuilderActionPropsCommon, AppBuilderActionRenderProps {
	onClick?: React.MouseEventHandler<HTMLButtonElement>;
	loading?: boolean;
	canBeDisabledByParameter?: boolean;
}

const getToolbarIconType = (
	icon: IAppBuilderActionPropsCommon["icon"],
	label: string | undefined,
) => icon ?? label?.slice(0, 1).toUpperCase() ?? "?";

export default function AppBuilderActionBase(props: AppBuilderActionBaseProps) {
	const {
		presentation = "button",
		label,
		icon,
		tooltip,
		onClick,
		loading,
		disabled,
		canBeDisabledByParameter,
		toolbarButtonProps,
	} = props;

	if (presentation === "item") {
		return (
			<AppBuilderToolbarMenuItemButton
				label={label}
				icon={icon}
				tooltip={tooltip}
				onClick={onClick}
				loading={loading}
				disabled={disabled}
			/>
		);
	}

	if (presentation === "toolbarIcon") {
		return (
			<AppBuilderToolbarIconButton
				label={label ?? "Action"}
				tooltipLabel={tooltip ?? label}
				iconType={getToolbarIconType(icon, label)}
				loading={loading}
				disabled={disabled}
				onClick={onClick}
				{...toolbarButtonProps}
			/>
		);
	}

	return (
		<AppBuilderActionComponent
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={onClick}
			loading={loading}
			disabled={disabled}
			canBeDisabledByParameter={canBeDisabledByParameter}
		/>
	);
}
