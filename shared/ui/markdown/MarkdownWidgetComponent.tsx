import {getNotificationActions} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import ThemeProvider from "@AppBuilderLib/shared/ui/theme/ThemeProvider";
import {
	MantineThemeComponent,
	MantineThemeOverride,
	useProps,
} from "@mantine/core";
import React from "react";
import Markdown from "./Markdown";

interface Props {
	children: string;
}

/**
 * @docAttached
 * @category shared
 * @configPath themeOverrides.components.MarkdownWidgetComponent.defaultProps
 * @displayName MarkdownWidgetComponent
 */
export interface MarkdownWidgetComponentStyleProps {
	/**
	 * Target for markdown links.
	 * @default "_blank"
	 */
	anchorTarget: React.HTMLAttributeAnchorTarget;
	boldFontWeight: string;
	strongFontWeight: string;
	setHeadingFontSize: boolean;
	themeOverride?: MantineThemeOverride;
}

const defaultStyleProps: Partial<MarkdownWidgetComponentStyleProps> = {
	anchorTarget: "_blank",
};

type MarkdownWidgetComponentPropsType =
	Partial<MarkdownWidgetComponentStyleProps>;

export function MarkdownWidgetComponentProps(
	props: MarkdownWidgetComponentPropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

function warnAboutSpanDirective(message: string) {
	// Defer notification to avoid setState during render
	setTimeout(() => {
		getNotificationActions().warning({
			title: "MarkdownWidgetComponent",
			message,
		});
	}, 0);
}

/**
 * Markdown widget component.
 *
 * @returns
 */
export default function MarkdownWidgetComponent(
	props: Props & Partial<MarkdownWidgetComponentStyleProps>,
) {
	const {children, ...rest} = props;
	const {
		anchorTarget,
		boldFontWeight,
		strongFontWeight,
		setHeadingFontSize,
		themeOverride,
	} = useProps("MarkdownWidgetComponent", defaultStyleProps, rest);

	const markdown = (
		<Markdown
			anchorTarget={anchorTarget}
			boldFontWeight={boldFontWeight}
			strongFontWeight={strongFontWeight}
			setHeadingFontSize={setHeadingFontSize}
			onDirectiveWarning={warnAboutSpanDirective}
		>
			{children}
		</Markdown>
	);

	return themeOverride ? (
		<ThemeProvider theme={themeOverride}>{markdown}</ThemeProvider>
	) : (
		markdown
	);
}
