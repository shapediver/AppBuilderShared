import Icon, {IconProps} from "@AppBuilderShared/components/ui/Icon";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {
	Button,
	ButtonProps,
	Group,
	GroupProps,
	MantineThemeComponent,
	PolymorphicComponentProps,
	Text,
	TextProps,
	useProps,
} from "@mantine/core";
import React from "react";

interface Props {
	/** Title text to display */
	title?: string;
	/** Documentation link URL */
	docLink?: string;
}

interface StyleProps {
	/** Container group props */
	containerGroupProps: GroupProps;
	/** Group props */
	groupProps: GroupProps;
	/** Icon color */
	iconProps: IconProps;
	/** Text props */
	textProps: TextProps;
	/** Button props */
	buttonProps: ButtonProps & PolymorphicComponentProps<"a">;
}

const defaultStyleProps: StyleProps = {
	buttonProps: {
		variant: "light",
		size: "xs",
		component: "a",
		target: "_blank",
		rel: "noopener noreferrer",
	},
	containerGroupProps: {
		justify: "space-between",
		gap: "sm",
		p: "md",
		style: {
			backgroundColor: "var(--mantine-primary-color-light)",
			borderRadius: "var(--mantine-radius-md)",
			borderLeft: "10px solid var(--mantine-primary-color-filled)",
		},
	},
	groupProps: {
		gap: "sm",
	},
	iconProps: {
		type: IconTypeEnum.IconInfoCircleFilled,
		color: "var(--mantine-primary-color-filled)",
	},
	textProps: {
		size: "sm",
		fw: 500,
		c: "var(--mantine-primary-color-filled)",
	},
};

type HintPropsType = Partial<StyleProps>;

export function HintProps(props: HintPropsType): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Hint component that displays information
 * with a link to documentation.
 */
export default function Hint(props: Props & Partial<StyleProps> = {}) {
	const {title, docLink} = props;

	const {containerGroupProps, iconProps, textProps, buttonProps, groupProps} =
		useProps("Hint", defaultStyleProps, props);

	return (
		<Group {...containerGroupProps}>
			<Group {...groupProps}>
				<Icon {...iconProps} />
				<Text {...textProps}>{title}</Text>
			</Group>
			<Button {...buttonProps} href={docLink}>
				READ MORE
			</Button>
		</Group>
	);
}
