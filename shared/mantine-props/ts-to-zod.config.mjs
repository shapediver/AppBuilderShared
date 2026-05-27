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
];
