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

// Pre-register all icon files so Vite can code-split them.
const iconLoaders = import.meta.glob(
	"/node_modules/@tabler/icons-react/dist/esm/icons/*.{js,mjs}",
	{import: "default"},
);
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

// Dynamic import of individual icons
const loadIcon = async (iconImportName: string) => {
	try {
		const keyJs = `/node_modules/@tabler/icons-react/dist/esm/icons/${iconImportName}.js`;
		const keyMjs = `/node_modules/@tabler/icons-react/dist/esm/icons/${iconImportName}.mjs`;
		const loader = iconLoaders[keyJs] || iconLoaders[keyMjs];
		if (!loader) {
			console.warn(
				`Icon "${iconImportName}" not found (no matching file)`,
			);
			return null;
		}

		const IconComponent = await loader();
		return IconComponent as React.ComponentType<TablerIconProps>;
	} catch (e) {
		console.warn(`Icon "${iconImportName}" failed to load`, e);
		return null;
	}
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
			loadIcon(iconImportName).then((Component) => {
				if (Component) {
					setIconComponent(() => Component);
				} else {
					setIconComponent(null);
				}
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
