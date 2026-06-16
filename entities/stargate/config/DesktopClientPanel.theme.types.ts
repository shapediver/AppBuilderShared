import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {mantineActionIconPropsSchema} from "@AppBuilderLib/shared/mantine-props/actionIcon.zod";
import {mantineAlertPropsSchema} from "@AppBuilderLib/shared/mantine-props/alert.zod";
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";
import {mantineLoaderPropsSchema} from "@AppBuilderLib/shared/mantine-props/loader.zod";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineSelectPropsSchema} from "@AppBuilderLib/shared/mantine-props/select.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";
import {mantineTextPropsSchema} from "@AppBuilderLib/shared/mantine-props/text.zod";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("DesktopClientPanel", …)`. */
export const DesktopClientPanelThemeDefaultPropsSchema = z.strictObject({
	iconStatusProps: mantineActionIconPropsSchema.optional(),
	alertProps: mantineAlertPropsSchema.optional(),
	alertTextProps: mantineTextPropsSchema.optional(),
	paperProps: mantinePaperPropsSchema.optional(),
	stackProps: mantineStackPropsSchema.optional(),
	groupTopProps: mantineGroupPropsSchema.optional(),
	textProps: mantineTextPropsSchema.optional(),
	selectProps: mantineSelectPropsSchema.optional(),
	actionIconRefreshProps: mantineActionIconPropsSchema.optional(),
	iconRefreshProps: IconThemeDefaultPropsSchema.optional(),
	groupBottomProps: mantineGroupPropsSchema.optional(),
	loaderProps: mantineLoaderPropsSchema.optional(),
	statusIconProps: IconThemeDefaultPropsSchema.optional(),
});

export type DesktopClientPanelThemeDefaultProps = z.infer<
	typeof DesktopClientPanelThemeDefaultPropsSchema
>;
