import {StargateStatusColorProps} from "@AppBuilderLib/entities/stargate";
import {MantineThemeComponent} from "@mantine/core";
import {z} from "zod";

const mantineColorJsonSchema = z.string();

/** Theme `defaultProps` for `useProps("StargateShared", …)`. */
export const StargateSharedThemeDefaultPropsSchema = z.strictObject({
	stargateColorProps: z
		.strictObject({
			primary: mantineColorJsonSchema.optional(),
			focused: mantineColorJsonSchema.optional(),
			dimmed: mantineColorJsonSchema.optional(),
		})
		.optional(),
});

/** TypeDoc surface for `useProps("StargateShared", …)` theme defaults. */
export interface StargateSharedThemeDefaultProps
	extends z.infer<typeof StargateSharedThemeDefaultPropsSchema> {}

/**
 * Runtime props for Stargate color merge (`useProps` + `mapStargateComponentStatusDefinition`).
 * Stricter than JSON schema: nested colors are required on the default object.
 */
export interface StargateStyleProps {
	stargateColorProps: StargateStatusColorProps;
}

export const DefaultStargateStyleProps: StargateStyleProps = {
	stargateColorProps: {
		primary: "var(--mantine-primary-color-filled)",
		focused: "var(--mantine-color-orange-7)",
		dimmed: "var(--mantine-color-gray-2)",
	} as const satisfies NonNullable<
		StargateSharedThemeDefaultProps["stargateColorProps"]
	>,
};

type StargateSharedThemePropsType = Partial<StargateStyleProps>;

export function StargateSharedThemeProps(
	props: StargateSharedThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
