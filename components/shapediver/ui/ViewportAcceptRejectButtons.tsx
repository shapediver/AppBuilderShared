import Icon from "@AppBuilderShared/components/ui/Icon";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {IParameterChanges} from "@AppBuilderShared/types/store/shapediverStoreParameters";
import {
	alpha,
	Button,
	ButtonProps,
	Group,
	GroupProps,
	MantineThemeComponent,
	Text,
	TextProps,
	useProps,
} from "@mantine/core";
import React, {useCallback, useMemo} from "react";

interface IconProps {
	size?: string | number;
	color?: string;
}

interface StyleProps {
	groupProps?: Partial<GroupProps>;
	buttonProps?: Partial<ButtonProps>;
	iconProps?: IconProps;
	textProps?: Partial<TextProps>;
	/**
	 * Whether to show the buttons or not.
	 * If false, the buttons will never be rendered.
	 * If true, the buttons will always be rendered.
	 * If undefined, the buttons will be rendered if there are changes to accept or reject.
	 */
	showButtons?: boolean;
}

const defaultStyleProps: Partial<StyleProps> = {
	groupProps: {
		justify: "center",
		w: "auto",
		wrap: "nowrap",
		p: "xs",
	},
	buttonProps: {
		variant: "default",
		style: {
			boxShadow: "var(--mantine-shadow-md)",
			backgroundColor: alpha("var(--mantine-color-body)", 0.5),
			backdropFilter: "blur(10px)",
			border: "none",
		},
	},
	iconProps: {},
	textProps: {
		size: "md",
	},
};

type ViewportAcceptRejectButtonsComponentThemePropsType = Partial<StyleProps>;

export function ViewportAcceptRejectButtonsComponentThemeProps(
	props: ViewportAcceptRejectButtonsComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

interface Props {
	/** Optional list of session IDs to which the buttons should be limited. */
	sessionIds?: string[];
}

function ViewportAcceptRejectButtons(
	props: Props & ViewportAcceptRejectButtonsComponentThemePropsType,
) {
	const {sessionIds, ...styleProps} = props;
	// style properties
	const {groupProps, buttonProps, iconProps, textProps, showButtons} =
		useProps(
			"ViewportAcceptRejectButtonsComponent",
			defaultStyleProps,
			styleProps,
		);

	// Use a more selective selector that only re-renders when relevant changes occur
	const parameterChanges = useShapeDiverStoreParameters(
		useCallback(
			(state) =>
				Object.keys(state.parameterChanges)
					.filter((id) =>
						sessionIds ? sessionIds.includes(id) : true,
					)
					.reduce((acc, id) => {
						acc.push(state.parameterChanges[id]);
						return acc;
					}, [] as IParameterChanges[])
					.sort((a, b) => a.priority - b.priority),
			[sessionIds],
		),
	);

	const hasChanges = useMemo(
		() =>
			parameterChanges.length > 0 &&
			parameterChanges.some((c) => Object.keys(c.values).length > 0),
		[parameterChanges],
	);

	const disableChangeControls = useMemo(
		() =>
			parameterChanges.length === 0 ||
			parameterChanges.some((c) => c.executing),
		[parameterChanges],
	);

	const acceptChanges = useCallback(async () => {
		for (let index = 0; index < parameterChanges.length; index++) {
			await parameterChanges[index].accept();
		}
	}, [parameterChanges]);

	const rejectChanges = useCallback(() => {
		parameterChanges.forEach((c) => c.reject());
	}, [parameterChanges]);

	// If there are no parameter changes to be confirmed, don't render anything
	if (showButtons == false || (!hasChanges && !showButtons)) {
		return null;
	}

	return (
		<Group {...groupProps}>
			<Button
				rightSection={<Icon type={IconTypeEnum.Check} {...iconProps} />}
				onClick={acceptChanges}
				disabled={disableChangeControls}
				{...buttonProps}
			>
				<Text {...textProps}>Accept</Text>
			</Button>
			<Button
				rightSection={<Icon type={IconTypeEnum.X} {...iconProps} />}
				onClick={rejectChanges}
				disabled={disableChangeControls}
				{...buttonProps}
			>
				<Text {...textProps}>Reject</Text>
			</Button>
		</Group>
	);
}

export default React.memo(ViewportAcceptRejectButtons);
