import type {MantineButtonProps} from "@AppBuilderLib/shared/mantine-props/button";
import {mantineButtonPropsSchema} from "@AppBuilderLib/shared/mantine-props/button.zod";

/** Theme `defaultProps` mirror `MantineButtonProps` for action buttons. */
export const AppBuilderActionComponentThemeDefaultPropsSchema =
	mantineButtonPropsSchema;

export type AppBuilderActionComponentThemeDefaultProps = MantineButtonProps;
