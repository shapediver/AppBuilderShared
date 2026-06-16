import {mantineButtonPropsSchema} from "@AppBuilderLib/shared/mantine-props/button.zod";
import type {MantineButtonProps} from "@AppBuilderLib/shared/mantine-props/button";

/** Theme `defaultProps` mirror `MantineButtonProps` for action buttons. */
export const AppBuilderActionComponentThemeDefaultPropsSchema =
	mantineButtonPropsSchema;

export type AppBuilderActionComponentThemeDefaultProps = MantineButtonProps;
