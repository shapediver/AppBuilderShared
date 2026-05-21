import {StargateStatusColorProps} from "@AppBuilderLib/entities/stargate/config/stargate";
import {MantineThemeComponent} from "@mantine/core";

/**
 * Shared Stargate color defaults merged into Stargate-related components via `useProps("StargateShared", …)`.
 *
 * @docAttached
 * @configPath themeOverrides.components.StargateShared.defaultProps
 * @displayName StargateShared
 */
export interface StargateStyleProps {
	stargateColorProps: StargateStatusColorProps;
}

export const DefaultStargateStyleProps: StargateStyleProps = {
	stargateColorProps: {
		primary: "var(--mantine-primary-color-filled)",
		focused: "var(--mantine-color-orange-7)",
		dimmed: "var(--mantine-color-gray-2)",
	},
};

type StargateSharedThemePropsType = Partial<StargateStyleProps>;

export function StargateSharedThemeProps(
	props: StargateSharedThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
