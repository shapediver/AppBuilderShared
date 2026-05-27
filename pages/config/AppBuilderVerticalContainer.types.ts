import type {MantineGroupProps} from "@AppBuilderLib/shared/mantine-props/group";
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";

/** Theme `defaultProps` for `useProps("AppBuilderVerticalContainer", …)` — Stack spacing only. */
export const AppBuilderVerticalContainerThemeDefaultPropsSchema =
	mantineGroupPropsSchema.pick({p: true});

/** TypeDoc surface for `useProps("AppBuilderVerticalContainer", …)` theme defaults. */
export interface AppBuilderVerticalContainerThemeDefaultProps
	extends Pick<MantineGroupProps, "p"> {}
