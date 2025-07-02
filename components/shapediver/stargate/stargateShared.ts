import {StargateStatusColorProps} from "@AppBuilderShared/types/shapediver/stargate";
import {MantineThemeComponent} from "@mantine/core";

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
