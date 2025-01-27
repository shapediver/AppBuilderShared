import {Loader, MantineThemeComponent, useProps} from "@mantine/core";
import React, {useCallback, useMemo, useState} from "react";
import Icon, {useIconProps} from "@AppBuilderShared/components/ui/Icon";
import classes from "./ToggleIcon.module.css";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {IconType} from "@AppBuilderShared/types/shapediver/icons";
import {preventDefault} from "@AppBuilderShared/utils/misc/events";

interface Props {
	/** Value of the toggle */
	value: boolean;
	/** Icon to show if the value is true */
	iconActive: IconType;
	/** Icon to show if the value is false */
	iconInactive: IconType;
	/** Callback to be awaited to set the value to true */
	onActivate?: () => Promise<unknown>;
	/** Callback to be awaited to set the value to false */
	onDeactivate?: () => Promise<unknown>;
	/** Tooltip to show if the value is true and onDeactivate is defined */
	tooltipActive?: string;
	/** Tooltip to show if the value is false and onActivate is defined */
	tooltipInactive?: string;
	/** Hide the icon of the value is false, defaults to false */
	hideInactive?: boolean;
	/** Show a loader while the value is being toggled, defaults to true */
	showLoader?: boolean;
}

interface StyleProps {
	/** Size of the icon */
	size: string | number;
}

const defaultStyleProps: Partial<StyleProps> = {};

type ToggleIconThemePropsType = Partial<StyleProps>;

export function IconThemeProps(
	props: ToggleIconThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Presents a toggle icon that can be clicked to change its value
 * @param _props
 * @returns
 */
export default function ToggleIcon(_props: Props & Partial<StyleProps>) {
	const {
		value,
		iconActive,
		iconInactive,
		onActivate,
		onDeactivate,
		tooltipActive,
		tooltipInactive,
		hideInactive,
		showLoader = true,
		...rest
	} = _props;

	// get default size defined by the theme
	const {size} = useProps("ToggleIcon", defaultStyleProps, rest);
	// get default size of icons in general, defined by the theme
	const {size: _size} = useIconProps({size});

	const [hovered, setHovered] = useState(false);
	const [loading, setLoading] = useState(false);

	const update = useCallback(
		async (callback: () => Promise<unknown>) => {
			if (showLoader) setLoading(true);
			await callback();
			if (showLoader) {
				setLoading(false);
				setHovered(false);
			}
		},
		[showLoader],
	);

	const classActive = useMemo(
		() =>
			onDeactivate &&
			`${classes.highlight} ${hideInactive ? classes.hideActive : undefined}`,
		[onDeactivate, hideInactive],
	);

	const classInactive = useMemo(() => {
		if (onActivate)
			return `${classes.highlight} ${hideInactive ? classes.hideInactive : undefined}`;

		return hideInactive ? classes.hidden : undefined;
	}, [onActivate, hideInactive]);

	const icon = value ? (
		<Icon
			type={hovered ? iconInactive : iconActive}
			onClick={onDeactivate && preventDefault(() => update(onDeactivate))}
			onMouseEnter={onDeactivate && (() => setHovered(true))}
			onMouseLeave={onDeactivate && (() => setHovered(false))}
			className={classActive}
			size={_size}
		/>
	) : (
		<Icon
			type={hovered ? iconActive : iconInactive}
			onClick={onActivate && preventDefault(() => update(onActivate))}
			onMouseEnter={onActivate && (() => setHovered(true))}
			onMouseLeave={onActivate && (() => setHovered(false))}
			className={classInactive}
			size={_size}
		/>
	);

	return (
		<>
			{" "}
			{loading ? (
				<Loader size={_size} />
			) : value ? (
				tooltipActive ? (
					<TooltipWrapper label={tooltipActive}>
						{icon}
					</TooltipWrapper>
				) : (
					icon
				)
			) : tooltipInactive ? (
				<TooltipWrapper label={tooltipInactive}>{icon}</TooltipWrapper>
			) : (
				icon
			)}{" "}
		</>
	);
}
