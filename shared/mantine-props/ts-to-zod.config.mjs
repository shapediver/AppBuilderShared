/** @type {import("ts-to-zod").TsToZodConfig} */
export default [
	{
		name: "mantine-props-spacing",
		input: "src/shared/shared/mantine-props/spacing.schema-input.ts",
		output: "src/shared/shared/mantine-props/spacing.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineSpacing") return "mantineSpacingSchema";
			if (id === "MantineSizeToken") return "mantineSizeTokenSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-primitives",
		input: "src/shared/shared/mantine-props/primitives.schema-input.ts",
		output: "src/shared/shared/mantine-props/primitives.zod.ts",
		getSchemaName: (id) => {
			const names = {
				MantineCssLength: "mantineCssLengthSchema",
				MantineFlexWrap: "mantineFlexWrapSchema",
				MantineFloatingPosition: "mantineFloatingPositionSchema",
				MantineStylesApiValue: "mantineStylesApiValueSchema",
				MantineStylesApi: "mantineStylesApiSchema",
				MantineResponsiveCssSize: "mantineResponsiveCssSizeSchema",
				MantineBreakpoint: "mantineBreakpointSchema",
				MantineResponsiveNumber: "mantineResponsiveNumberSchema",
				MantineResponsiveBoolean: "mantineResponsiveBooleanSchema",
			};
			return names[id] ?? `${id}Schema`;
		},
	},
	{
		name: "mantine-props-group",
		input: "src/shared/shared/mantine-props/group.schema-input.ts",
		output: "src/shared/shared/mantine-props/group.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineGroupProps") return "mantineGroupPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-button",
		input: "src/shared/shared/mantine-props/button.schema-input.ts",
		output: "src/shared/shared/mantine-props/button.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineButtonProps") return "mantineButtonPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-text",
		input: "src/shared/shared/mantine-props/text.schema-input.ts",
		output: "src/shared/shared/mantine-props/text.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineTextProps") return "mantineTextPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-paper",
		input: "src/shared/shared/mantine-props/paper.schema-input.ts",
		output: "src/shared/shared/mantine-props/paper.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantinePaperProps") return "mantinePaperPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-accordion",
		input: "src/shared/shared/mantine-props/accordion.schema-input.ts",
		output: "src/shared/shared/mantine-props/accordion.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineAccordionProps")
				return "mantineAccordionPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-accordionControl",
		input: "src/shared/shared/mantine-props/accordionControl.schema-input.ts",
		output: "src/shared/shared/mantine-props/accordionControl.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineAccordionControlProps")
				return "mantineAccordionControlPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-accordionItem",
		input: "src/shared/shared/mantine-props/accordionItem.schema-input.ts",
		output: "src/shared/shared/mantine-props/accordionItem.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineAccordionItemProps")
				return "mantineAccordionItemPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-accordionPanel",
		input: "src/shared/shared/mantine-props/accordionPanel.schema-input.ts",
		output: "src/shared/shared/mantine-props/accordionPanel.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineAccordionPanelProps")
				return "mantineAccordionPanelPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-menu",
		input: "src/shared/shared/mantine-props/menu.schema-input.ts",
		output: "src/shared/shared/mantine-props/menu.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineMenuProps") return "mantineMenuPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-menuDropdown",
		input: "src/shared/shared/mantine-props/menuDropdown.schema-input.ts",
		output: "src/shared/shared/mantine-props/menuDropdown.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineMenuDropdownProps")
				return "mantineMenuDropdownPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-stack",
		input: "src/shared/shared/mantine-props/stack.schema-input.ts",
		output: "src/shared/shared/mantine-props/stack.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineStackProps") return "mantineStackPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-box",
		input: "src/shared/shared/mantine-props/box.schema-input.ts",
		output: "src/shared/shared/mantine-props/box.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineBoxProps") return "mantineBoxPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-tooltip",
		input: "src/shared/shared/mantine-props/tooltip.schema-input.ts",
		output: "src/shared/shared/mantine-props/tooltip.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineTooltipProps")
				return "mantineTooltipPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-loader",
		input: "src/shared/shared/mantine-props/loader.schema-input.ts",
		output: "src/shared/shared/mantine-props/loader.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineLoaderProps") return "mantineLoaderPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-alert",
		input: "src/shared/shared/mantine-props/alert.schema-input.ts",
		output: "src/shared/shared/mantine-props/alert.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineAlertProps") return "mantineAlertPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-actionIcon",
		input: "src/shared/shared/mantine-props/actionIcon.schema-input.ts",
		output: "src/shared/shared/mantine-props/actionIcon.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineActionIconProps")
				return "mantineActionIconPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-select",
		input: "src/shared/shared/mantine-props/select.schema-input.ts",
		output: "src/shared/shared/mantine-props/select.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineSelectProps") return "mantineSelectPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-appBuilderThemeOther",
		input: "src/shared/shared/mantine-props/appBuilderThemeOther.schema-input.ts",
		output: "src/shared/shared/mantine-props/appBuilderThemeOther.zod.ts",
		getSchemaName: (id) => {
			if (id === "AppBuilderThemeOtherProps")
				return "appBuilderThemeOtherSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-themeOverride",
		input: "src/shared/shared/mantine-props/themeOverride.schema-input.ts",
		output: "src/shared/shared/mantine-props/themeOverride.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineThemeOverrideProps")
				return "mantineThemeOverridePropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-card",
		input: "src/shared/shared/mantine-props/card.schema-input.ts",
		output: "src/shared/shared/mantine-props/card.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineCardProps") return "mantineCardPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-image",
		input: "src/shared/shared/mantine-props/image.schema-input.ts",
		output: "src/shared/shared/mantine-props/image.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineImageProps") return "mantineImagePropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-flex",
		input: "src/shared/shared/mantine-props/flex.schema-input.ts",
		output: "src/shared/shared/mantine-props/flex.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineFlexProps") return "mantineFlexPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-checkbox",
		input: "src/shared/shared/mantine-props/checkbox.schema-input.ts",
		output: "src/shared/shared/mantine-props/checkbox.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineCheckboxProps")
				return "mantineCheckboxPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-title",
		input: "src/shared/shared/mantine-props/title.schema-input.ts",
		output: "src/shared/shared/mantine-props/title.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineTitleProps") return "mantineTitlePropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-badge",
		input: "src/shared/shared/mantine-props/badge.schema-input.ts",
		output: "src/shared/shared/mantine-props/badge.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineBadgeProps") return "mantineBadgePropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-divider",
		input: "src/shared/shared/mantine-props/divider.schema-input.ts",
		output: "src/shared/shared/mantine-props/divider.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineDividerProps")
				return "mantineDividerPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-transition",
		input: "src/shared/shared/mantine-props/transition.schema-input.ts",
		output: "src/shared/shared/mantine-props/transition.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineTransitionProps")
				return "mantineTransitionPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-areaChart",
		input: "src/shared/shared/mantine-props/areaChart.schema-input.ts",
		output: "src/shared/shared/mantine-props/areaChart.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineAreaChartProps")
				return "mantineAreaChartPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-barChart",
		input: "src/shared/shared/mantine-props/barChart.schema-input.ts",
		output: "src/shared/shared/mantine-props/barChart.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineBarChartProps")
				return "mantineBarChartPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-lineChart",
		input: "src/shared/shared/mantine-props/lineChart.schema-input.ts",
		output: "src/shared/shared/mantine-props/lineChart.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineLineChartProps")
				return "mantineLineChartPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-pieChart",
		input: "src/shared/shared/mantine-props/pieChart.schema-input.ts",
		output: "src/shared/shared/mantine-props/pieChart.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantinePieChartProps")
				return "mantinePieChartPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-donutChart",
		input: "src/shared/shared/mantine-props/donutChart.schema-input.ts",
		output: "src/shared/shared/mantine-props/donutChart.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineDonutChartProps")
				return "mantineDonutChartPropsSchema";
			return `${id}Schema`;
		},
	},
];
