import {
	acceptGlobalParameterChanges,
	getInlineAcceptRejectEpoch,
	globalPendingParameterIds,
	rejectGlobalParameterChanges,
	subscribeInlineAcceptReject,
} from "@AppBuilderLib/entities/parameter/lib/globalAcceptReject";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {ViewportTransparentBackgroundStyle} from "@AppBuilderLib/entities/viewport/config/viewport";
import AppBuilderToolbarIconButton from "@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton";
import type {MantineButtonProps} from "@AppBuilderLib/shared/mantine-props/button";
import type {MantineGroupProps} from "@AppBuilderLib/shared/mantine-props/group";
import type {MantineTextProps} from "@AppBuilderLib/shared/mantine-props/text";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import {
	alpha,
	Button,
	Group,
	MantineThemeComponent,
	Text,
	useProps,
} from "@mantine/core";
import React, {useCallback, useMemo, useSyncExternalStore} from "react";

interface ViewportAcceptRejectButtonsIconStyleProps {
	size?: string | number;
	color?: string;
}

/**
 * @docAttached
 * @category widget
 * @configPath themeOverrides.components.ViewportAcceptRejectButtons.defaultProps
 * @displayName ViewportAcceptRejectButtons
 */
export interface ViewportAcceptRejectButtonsStyleProps {
	groupProps?: MantineGroupProps;
	buttonProps?: MantineButtonProps;
	acceptButtonProps?: MantineButtonProps;
	rejectButtonProps?: MantineButtonProps;
	iconProps?: ViewportAcceptRejectButtonsIconStyleProps;
	textProps?: MantineTextProps;
	/**
	 * Whether to show the buttons or not.
	 * If false, the buttons will never be rendered.
	 * If true, the buttons will always be rendered.
	 * If undefined, the buttons will be rendered if there are changes to accept or reject.
	 */
	showButtons?: boolean;
}

const defaultStyleProps: Partial<ViewportAcceptRejectButtonsStyleProps> = {
	groupProps: {
		justify: "center",
		w: "auto",
		wrap: "nowrap",
		p: "xs",
	},
	buttonProps: {
		variant: "default",
	},
	acceptButtonProps: {
		style: {
			...ViewportTransparentBackgroundStyle,
			boxShadow: "var(--mantine-shadow-md)",
			border: "none",
			backgroundColor: alpha("var(--mantine-primary-color-filled)", 0.5),
		},
	},
	rejectButtonProps: {
		style: {
			...ViewportTransparentBackgroundStyle,
			boxShadow: "var(--mantine-shadow-md)",
			border: "none",
			backgroundColor: alpha("var(--mantine-color-red-filled)", 0.5),
		},
	},
	iconProps: {},
	textProps: {
		size: "md",
	},
};

type ViewportAcceptRejectButtonsComponentThemePropsType =
	Partial<ViewportAcceptRejectButtonsStyleProps>;

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
	/** Render a compact variant suitable for embedding in an App Builder toolbar. */
	inToolbar?: boolean;
}

function ViewportAcceptRejectButtons(
	props: Props & ViewportAcceptRejectButtonsComponentThemePropsType,
) {
	const {sessionIds, inToolbar = false, ...styleProps} = props;
	// style properties
	const {
		groupProps,
		buttonProps,
		acceptButtonProps,
		rejectButtonProps,
		iconProps,
		textProps,
		showButtons,
	} = useProps("ViewportAcceptRejectButtons", defaultStyleProps, styleProps);

	const inlineEpoch = useSyncExternalStore(
		subscribeInlineAcceptReject,
		getInlineAcceptRejectEpoch,
		getInlineAcceptRejectEpoch,
	);

	// Use a more selective selector that only re-renders when relevant changes occur
	const parameterChanges = useShapeDiverStoreParameters(
		useCallback(
			(state) =>
				Object.keys(state.parameterChanges)
					.filter((id) =>
						sessionIds ? sessionIds.includes(id) : true,
					)
					.map((id) => ({
						namespace: id,
						changes: state.parameterChanges[id],
					}))
					.sort((a, b) => a.changes.priority - b.changes.priority),
			[sessionIds],
		),
	);

	const hasChanges = useMemo(
		() =>
			parameterChanges.some(
				(entry) =>
					globalPendingParameterIds(
						entry.namespace,
						entry.changes.values,
					).length > 0,
			),
		[inlineEpoch, parameterChanges],
	);

	const disableChangeControls = useMemo(
		() =>
			!hasChanges ||
			parameterChanges.some((entry) => entry.changes.executing),
		[hasChanges, parameterChanges],
	);

	const acceptChanges = useCallback(async () => {
		await acceptGlobalParameterChanges(parameterChanges);
	}, [parameterChanges]);

	const rejectChanges = useCallback(() => {
		rejectGlobalParameterChanges(parameterChanges);
	}, [parameterChanges]);

	// If there are no parameter changes to be confirmed, don't render anything
	if (showButtons == false || (!hasChanges && !showButtons)) {
		return null;
	}

	const resolvedGroupProps = inToolbar
		? {...groupProps, p: 0, gap: 0}
		: groupProps;

	return (
		<Group {...resolvedGroupProps}>
			{inToolbar ? (
				<>
					<AppBuilderToolbarIconButton
						label="Accept"
						iconType="tabler:check"
						labelSide="bottom"
						labelAlign="center"
						onClick={acceptChanges}
						disabled={disableChangeControls}
						iconProps={{
							color: "var(--mantine-primary-color-filled)",
						}}
					/>
					<AppBuilderToolbarIconButton
						label="Reject"
						iconType="tabler:x"
						labelSide="bottom"
						labelAlign="center"
						onClick={rejectChanges}
						disabled={disableChangeControls}
						iconProps={{color: "var(--mantine-color-red-filled)"}}
					/>
				</>
			) : (
				<>
					<Button
						rightSection={
							<Icon iconType={"tabler:check"} {...iconProps} />
						}
						onClick={acceptChanges}
						disabled={disableChangeControls}
						{...buttonProps}
						{...acceptButtonProps}
					>
						<Text {...textProps}>Accept</Text>
					</Button>
					<Button
						rightSection={
							<Icon iconType={"tabler:x"} {...iconProps} />
						}
						onClick={rejectChanges}
						disabled={disableChangeControls}
						{...buttonProps}
						{...rejectButtonProps}
					>
						<Text {...textProps}>Reject</Text>
					</Button>
				</>
			)}
		</Group>
	);
}

export default React.memo(ViewportAcceptRejectButtons);
