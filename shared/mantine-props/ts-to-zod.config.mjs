/** @type {import("ts-to-zod").TsToZodConfig} */
export default [
	{
		name: "mantine-props-spacing",
		input: "src/shared/shared/mantine-props/spacing.schema-input.ts",
		output: "src/shared/shared/mantine-props/spacing.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineSpacing") return "mantineSpacingSchema";
			return `${id}Schema`;
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
			if (id === "MantineAccordionProps") return "mantineAccordionPropsSchema";
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
			if (id === "MantineTooltipProps") return "mantineTooltipPropsSchema";
			return `${id}Schema`;
		},
	},
];
