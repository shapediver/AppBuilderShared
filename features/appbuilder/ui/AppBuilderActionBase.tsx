import {
	AppBuilderToolbarAlign,
	AppBuilderToolbarSide,
	IAppBuilderActionPropsCommon,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {ToolbarContainerExclusivityContext} from "@AppBuilderLib/features/appbuilder/lib/ToolbarContainerExclusivityContext";
import {
	clearActionHost,
	noteActionHost,
} from "@AppBuilderLib/features/appbuilder/model/appBuilderActionHost";
import type {AppBuilderToolbarIconButtonThemeStyleProps} from "@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton";
import AppBuilderToolbarIconButton from "@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton";
import {useContext} from "react";
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
	const {exclusiveContainers, siblingAnchorIds} = useContext(
		ToolbarContainerExclusivityContext,
	);
	const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
		noteActionHost({
			element: event.currentTarget,
			exclusiveContainers,
			siblingAnchorIds,
		});
		try {
			onClick?.(event);
		} finally {
			clearActionHost();
		}
	};

	if (presentation === "item") {
		return (
			<AppBuilderToolbarMenuItemButton
				buttonRef={buttonRef}
				label={label}
				icon={icon}
				tooltip={tooltip}
				onClick={handleClick}
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
				onClick={handleClick}
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
			onClick={handleClick}
			loading={loading}
			disabled={disabled}
			canBeDisabledByParameter={canBeDisabledByParameter}
		/>
	);
}
