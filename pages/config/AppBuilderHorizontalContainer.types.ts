import type {MantineGroupProps} from "@AppBuilderLib/shared/mantine-props/group";
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";

export const AppBuilderHorizontalContainerThemeDefaultPropsSchema =
	mantineGroupPropsSchema;

export interface AppBuilderHorizontalContainerThemeDefaultProps
	extends MantineGroupProps {}
