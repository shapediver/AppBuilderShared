import {StargateStatusColorProps} from "@AppBuilderLib/entities/stargate/config/stargate";
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

/**
 * Shared Stargate color defaults merged into Stargate-related components via `useProps("StargateShared", …)`.
 *
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.StargateShared.defaultProps
 * @displayName StargateShared
 */
export interface StargateSharedThemeDefaultProps
	extends z.infer<typeof StargateSharedThemeDefaultPropsSchema> {
	/**
	 * Mantine color tokens for Stargate status UI (`mapStargateComponentStatusDefinition`).
	 * Merged into Stargate-related components via `useProps("StargateShared", …)`.
	 */
	stargateColorProps?: {
		/**
		 * Color for active/selected Stargate states (e.g. object selected).
		 * @default "var(--mantine-primary-color-filled)"
		 */
		primary?: string;
		/**
		 * Color for interactive states awaiting user action (e.g. no selection yet).
		 * @default "var(--mantine-color-orange-7)"
		 */
		focused?: string;
		/**
		 * Color for disabled, inactive, or incompatible Stargate states.
		 * @default "var(--mantine-color-gray-2)"
		 */
		dimmed?: string;
	};
}

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
