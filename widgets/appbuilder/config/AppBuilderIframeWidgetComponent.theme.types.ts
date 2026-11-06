import type {MantinePaperProps} from "@AppBuilderLib/shared/mantine-props/paper";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";

/** Theme `defaultProps` mirror `MantinePaperProps` (widget wraps the frame in `Paper`). */
export const AppBuilderIframeWidgetComponentThemeDefaultPropsSchema =
	mantinePaperPropsSchema;

export type AppBuilderIframeWidgetComponentThemeDefaultProps =
	MantinePaperProps;
