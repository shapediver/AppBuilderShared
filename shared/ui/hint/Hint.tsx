import type {MantineButtonProps} from "@AppBuilderLib/shared/mantine-props/button";
import type {MantineGroupProps} from "@AppBuilderLib/shared/mantine-props/group";
import type {MantineTextProps} from "@AppBuilderLib/shared/mantine-props/text";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import {IconProps} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {
	Button,
	Group,
	MantineThemeComponent,
	PolymorphicComponentProps,
	Text,
	useProps,
} from "@mantine/core";

interface Props {
	/** Title text to display */
	title?: string;
	/** Documentation link URL */
	docLink?: string;
}

/**
 * @docAttached
 * @category shared
 * @configPath themeOverrides.components.Hint.defaultProps
 * @displayName Hint
 */
export interface HintStyleProps {
	/** Container group props */
	containerGroupProps?: MantineGroupProps;
	/** Group props */
	groupProps?: MantineGroupProps;
	/** Icon props */
	iconProps: IconProps;
	/** Text props */
	textProps?: MantineTextProps;
	/** Button props (anchor link); `component`/`target`/`rel` are runtime-only, not JSON theme */
	buttonProps?: MantineButtonProps &
		Pick<PolymorphicComponentProps<"a">, "component" | "target" | "rel">;
}

const defaultIconProps: IconProps = {
	iconType: "tabler:info-circle-filled",
	color: "var(--mantine-primary-color-filled)",
};

const defaultStyleProps: Partial<HintStyleProps> = {
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
	iconProps: defaultIconProps,
	textProps: {
		size: "sm",
		fw: 500,
		c: "var(--mantine-primary-color-filled)",
	},
};

type HintPropsType = Partial<HintStyleProps>;

export function HintProps(props: HintPropsType): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Hint component that displays information
 * with a link to documentation.
 */
export default function Hint(props: Props & Partial<HintStyleProps> = {}) {
	const {title, docLink} = props;

	const {containerGroupProps, iconProps, textProps, buttonProps, groupProps} =
		useProps("Hint", defaultStyleProps, props);

	return (
		<Group {...containerGroupProps}>
			<Group {...groupProps}>
				<Icon {...(iconProps ?? defaultIconProps)} />
				<Text {...textProps}>{title}</Text>
			</Group>
			<Button {...buttonProps} href={docLink}>
				Read more
			</Button>
		</Group>
	);
}
