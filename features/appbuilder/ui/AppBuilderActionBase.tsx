import {
	AppBuilderToolbarAlign,
	AppBuilderToolbarSide,
	IAppBuilderActionPropsCommon,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {AppBuilderToolbarIconButtonThemeStyleProps} from "@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton";
import AppBuilderToolbarIconButton from "@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton";
import AppBuilderActionComponent from "./AppBuilderActionComponent";
import AppBuilderToolbarMenuItemButton from "./AppBuilderToolbarMenuItemButton";

export type AppBuilderActionPresentation = "button" | "item" | "toolbarIcon";

export interface AppBuilderActionRenderProps {
	presentation?: AppBuilderActionPresentation;
	toolbarButtonProps?: Partial<AppBuilderToolbarIconButtonThemeStyleProps>;
	disabled?: boolean;
	labelSide?: AppBuilderToolbarSide;
	labelAlign?: AppBuilderToolbarAlign;
}

export interface AppBuilderActionBaseProps
	extends IAppBuilderActionPropsCommon, AppBuilderActionRenderProps {
	onClick?: React.MouseEventHandler<HTMLButtonElement>;
	loading?: boolean;
	canBeDisabledByParameter?: boolean;
	buttonRef?: React.Ref<HTMLButtonElement>;
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
		labelSide,
		labelAlign,
		buttonRef,
	} = props;

	if (presentation === "item") {
		return (
			<AppBuilderToolbarMenuItemButton
				buttonRef={buttonRef}
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
				ref={buttonRef}
				label={label ?? "Action"}
				tooltipLabel={tooltip ?? label}
				iconType={getToolbarIconType(icon, label)}
				loading={loading}
				disabled={disabled}
				onClick={onClick}
				{...toolbarButtonProps}
				{...(labelSide !== undefined ? {labelSide} : {})}
				{...(labelAlign !== undefined ? {labelAlign} : {})}
			/>
		);
	}

	return (
		<AppBuilderActionComponent
			buttonRef={buttonRef}
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
