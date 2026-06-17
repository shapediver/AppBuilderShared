import type {MantinePaperProps} from "@AppBuilderLib/shared/mantine-props/paper";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";

/** Theme `defaultProps` mirror `MantinePaperProps` (widget wraps content in `Paper`). */
export const AppBuilderTextWidgetComponentThemeDefaultPropsSchema =
	mantinePaperPropsSchema;

export type AppBuilderTextWidgetComponentThemeDefaultProps = MantinePaperProps;
