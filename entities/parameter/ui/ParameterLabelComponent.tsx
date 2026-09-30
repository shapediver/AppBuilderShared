import type {MantineTooltipProps} from "@AppBuilderLib/shared/mantine-props/tooltip";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import TextWeighted from "@AppBuilderLib/shared/ui/text/TextWeighted";
import TooltipWrapper from "@AppBuilderLib/shared/ui/tooltip/TooltipWrapper";
import {Box, Group, MantineThemeComponent, useProps} from "@mantine/core";
import React, {useContext, useEffect} from "react";
import {createPortal} from "react-dom";
import {PropsParameter} from "../config/propsParameter";
import {registerInlineAcceptRejectParameter} from "../lib/globalAcceptReject";
import {useParameter} from "../model/useParameter";
import AcceptRejectButtons from "./AcceptRejectButtons";
import {ParameterAcceptRejectSlotContext} from "./ParameterWrapperComponent";

interface Props extends PropsParameter {
	cancel?: () => void;
	rightSection?: React.ReactNode;
	/** Optional label overriding the default label */
	label?: string;
}

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ParameterLabelComponent.defaultProps
 * @displayName ParameterLabelComponent
 */
export interface ParameterLabelComponentStyleProps {
	tooltipProps: MantineTooltipProps;
	fontWeight: string;
}

const defaultStyleProps: Partial<ParameterLabelComponentStyleProps> = {
	tooltipProps: {
		position: "top",
		label: "Cancel change",
	},
};

type ParameterLabelComponentPropsType =
	Partial<ParameterLabelComponentStyleProps>;

export function ParameterLabelComponentThemeProps(
	props: ParameterLabelComponentPropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component that creates a label for a parameter or .
 *
 * @returns
 */
export default function ParameterLabelComponent(
	props: Props & Partial<ParameterLabelComponentStyleProps>,
) {
	const {
		cancel,
		rightSection,
		label,
		acceptRejectMode,
		acceptRejectModePresentation,
		namespace,
		...rest
	} = props;
	const {fontWeight, tooltipProps} = useProps(
		"ParameterLabelComponent",
		defaultStyleProps,
		rest,
	);
	const {
		definition,
		acceptRejectMode: storeAcceptRejectMode,
		state,
	} = useParameter<any>(props);
	const acceptRejectSlot = useContext(ParameterAcceptRejectSlotContext);
	const {displayname, name, tooltip} = definition;
	const label_ = label || displayname || name;
	const effectiveAcceptRejectMode = acceptRejectMode ?? storeAcceptRejectMode;
	const inlinePresentation =
		(acceptRejectModePresentation ?? "global") === "inline" &&
		Boolean(effectiveAcceptRejectMode);
	const showInlineButtons = inlinePresentation && Boolean(state.dirty);

	useEffect(() => {
		if (!inlinePresentation || !definition?.id) return;

		return registerInlineAcceptRejectParameter(namespace, definition.id);
	}, [definition?.id, inlinePresentation, namespace]);

	const labelcomp = (
		<TextWeighted pb={4} size="sm" fontWeight="medium" fw={fontWeight}>
			{label_}
			{cancel && !inlinePresentation ? " *" : ""}
		</TextWeighted>
	);

	return (
		<>
			<Group justify="space-between" w="100%" wrap="nowrap">
				{tooltip ? (
					<TooltipWrapper label={tooltip} position="top">
						{labelcomp}
					</TooltipWrapper>
				) : (
					labelcomp
				)}
				{cancel && (
					<TooltipWrapper
						{...tooltipProps}
						label={tooltipProps?.label || "Cancel change"}
					>
						<Icon
							iconType={"tabler:x"}
							color="var(--mantine-primary-color-filled)"
							onClick={cancel}
						/>
					</TooltipWrapper>
				)}
				{rightSection}
			</Group>
			{showInlineButtons && acceptRejectSlot
				? createPortal(
						<Box mt="xs">
							<AcceptRejectButtons
								parameters={[props]}
								scope="inline"
							/>
						</Box>,
						acceptRejectSlot,
					)
				: null}
		</>
	);
}
