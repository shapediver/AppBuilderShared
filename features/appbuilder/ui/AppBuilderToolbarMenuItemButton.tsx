import {AppBuilderToolbarMenuItemButtonThemeDefaultProps} from "@AppBuilderLib/features/appbuilder/config/AppBuilderToolbarMenuItemButton.theme.types";
import {IAppBuilderActionPropsCommon} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import type {IconProps} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import type {MantineTextProps} from "@AppBuilderLib/shared/mantine-props/text";
import {useProps} from "@mantine/core";
import classes from "./AppBuilderToolbarMenuItemButton.module.css";

type Props = IAppBuilderActionPropsCommon & {
	onClick?: React.MouseEventHandler<HTMLButtonElement>;
	loading?: boolean;
	disabled?: boolean;
};

type ThemeProps = AppBuilderToolbarMenuItemButtonThemeDefaultProps & {
	itemProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
	labelProps?: MantineTextProps & React.HTMLAttributes<HTMLSpanElement>;
	iconProps?: Partial<IconProps>;
};

const defaultStyleProps: ThemeProps = {
	itemProps: {},
	labelProps: {},
	iconProps: {
		size: "1rem" as const,
	},
};

export default function AppBuilderToolbarMenuItemButton({
	label,
	icon,
	tooltip,
	onClick,
	loading = false,
	disabled = false,
}: Props) {
	const themedProps = useProps(
		"AppBuilderToolbarMenuItemButton",
		defaultStyleProps,
		{},
	) as ThemeProps;
	const itemProps = themedProps.itemProps ?? defaultStyleProps.itemProps ?? {};
	const labelProps =
		themedProps.labelProps ?? defaultStyleProps.labelProps ?? {};
	const iconProps = themedProps.iconProps ?? defaultStyleProps.iconProps;
	const resolvedLabel = label ?? tooltip ?? "Action";
	const isDisabled = disabled || loading;

	return (
		<button
			type="button"
			{...itemProps}
			className={[classes.item, itemProps.className]
				.filter(Boolean)
				.join(" ")}
			disabled={isDisabled}
			role="menuitem"
			data-menu-item
			data-disabled={isDisabled || undefined}
			data-mantine-stop-propagation
			onMouseDown={(event) => event.preventDefault()}
			onClick={onClick}
			title={tooltip}
		>
			{icon && (
				<span className={classes.itemSection} data-position="left">
					<Icon iconType={icon} {...iconProps} />
				</span>
			)}
			<span
				{...labelProps}
				className={[classes.itemLabel, labelProps.className]
					.filter(Boolean)
					.join(" ")}
				data-menu-item-label
			>
				{resolvedLabel}
			</span>
		</button>
	);
}
