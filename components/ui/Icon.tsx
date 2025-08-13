import {
	MantineThemeComponent,
	parseThemeColor,
	useMantineTheme,
	useProps,
} from "@mantine/core";
import {
	Icon as TablerIcon,
	IconProps as TablerIconProps,
} from "@tabler/icons-react";
import React, {forwardRef, useEffect, useState} from "react";

export type IconType = React.ComponentType<TablerIconProps> | string;

export interface IconProps extends TablerIconProps {
	iconType: IconType;
}

const defaultStyleProps: Partial<TablerIconProps> = {
	size: "1.5rem",
	stroke: 1,
};

type IconThemePropsType = Partial<TablerIconProps>;

export function IconThemeProps(
	props: IconThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export function useIconProps(props: Partial<TablerIconProps>): TablerIconProps {
	return useProps("Icon", defaultStyleProps, props);
}

// Helper function to convert icon name to proper import name
const getIconImportName = (iconName: string): string => {
	// Handle special cases first
	// These are needed to have full backwards compatibility
	const specialCases: Record<string, string> = {
		"icon-hand-finger": "IconHandFinger",
		"icon-info-circle-filled": "IconInfoCircleFilled",
		"paper-clip": "IconPaperclip", // lowercase 'c'
	};

	if (specialCases[iconName]) {
		return specialCases[iconName];
	}
	// Convert kebab-case or other formats to PascalCase with Icon prefix
	const pascalCase = iconName
		.split(/[-_\s]/)
		.map(
			(word) =>
				word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
		)
		.join("");

	return `Icon${pascalCase}`;
};

const Icon = forwardRef<TablerIcon, IconProps>(function Icon(
	{iconType, size, stroke, color, ...rest}: IconProps,
	ref,
) {
	const theme = useMantineTheme();
	const [IconComponent, setIconComponent] =
		useState<React.ComponentType<TablerIconProps> | null>(null);

	useEffect(() => {
		if (typeof iconType === "string") {
			const iconImportName = getIconImportName(iconType);

			// Dynamic import of the icon
			import("@tabler/icons-react")
				.then((module) => {
					const Component =
						module[iconImportName as keyof typeof module];
					if (Component) {
						setIconComponent(
							() =>
								Component as React.ComponentType<TablerIconProps>,
						);
					} else {
						console.warn(
							`Icon "${iconImportName}" not found in @tabler/icons-react`,
						);
						setIconComponent(null);
					}
				})
				.catch((error) => {
					console.error(
						`Failed to load icon "${iconImportName}":`,
						error,
					);
					setIconComponent(null);
				});
		} else {
			setIconComponent(() => iconType);
		}
	}, [iconType]);

	const iconPropsStyle = useIconProps({size, stroke, color});
	const parsedColor = iconPropsStyle.color
		? parseThemeColor({color: iconPropsStyle.color, theme}).value
		: iconPropsStyle.color;
	const iconProps = {...iconPropsStyle, ref, color: parsedColor, ...rest};

	if (!IconComponent) {
		return null; // or a fallback icon
	}

	return <IconComponent {...iconProps} />;
});

export default Icon;
