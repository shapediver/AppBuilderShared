/** @type {import("ts-to-zod").TsToZodConfig} */
export default [
	{
		name: "mantine-props-group",
		input: "src/shared/shared/mantine-props/group.ts",
		output: "src/shared/shared/mantine-props/group.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineGroupProps") return "mantineGroupPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-button",
		input: "src/shared/shared/mantine-props/button.ts",
		output: "src/shared/shared/mantine-props/button.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineButtonProps") return "mantineButtonPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-text",
		input: "src/shared/shared/mantine-props/text.ts",
		output: "src/shared/shared/mantine-props/text.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineTextProps") return "mantineTextPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-paper",
		input: "src/shared/shared/mantine-props/paper.ts",
		output: "src/shared/shared/mantine-props/paper.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantinePaperProps") return "mantinePaperPropsSchema";
			return `${id}Schema`;
		},
	},
	{
		name: "mantine-props-accordion",
		input: "src/shared/shared/mantine-props/accordion.ts",
		output: "src/shared/shared/mantine-props/accordion.zod.ts",
		getSchemaName: (id) => {
			if (id === "MantineAccordionProps") return "mantineAccordionPropsSchema";
			return `${id}Schema`;
		},
	},
];
